import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { runReleaseMutationGuard } from "../../scripts/release/release-mutation-guard.ts";
import { verifyUiDist } from "../../scripts/release/verify-ui-dist.mjs";

type UnknownRecord = Record<string, unknown>;

const root = resolve(import.meta.dirname, "../..");
const rootPackage = JSON.parse(
	await readFile(resolve(root, "package.json"), "utf8"),
) as UnknownRecord;
const uiPackage = JSON.parse(
	await readFile(resolve(root, "packages/ui/package.json"), "utf8"),
) as UnknownRecord;
const docsPackage = JSON.parse(
	await readFile(resolve(root, "apps/docs/package.json"), "utf8"),
) as UnknownRecord;
const showcasePackage = JSON.parse(
	await readFile(resolve(root, "apps/showcase/package.json"), "utf8"),
) as UnknownRecord;
const contributing = await readFile(resolve(root, "CONTRIBUTING.md"), "utf8");

function record(value: unknown, description: string): UnknownRecord {
	assert.ok(
		value && typeof value === "object" && !Array.isArray(value),
		`${description} must be an object`,
	);
	return value as UnknownRecord;
}

test("release mutation guard rejects feature refs before Cloudflare preflight", async () => {
	let preflightCalls = 0;
	await assert.rejects(
		runReleaseMutationGuard({
			ref: { githubActions: false, localBranch: "feature/review" },
			preflight: async () => {
				preflightCalls += 1;
			},
		}),
		/release mutations require local branch main/iu,
	);
	await assert.rejects(
		runReleaseMutationGuard({
			ref: {
				githubActions: true,
				githubRef: "refs/heads/feature/review",
			},
			preflight: async () => {
				preflightCalls += 1;
			},
		}),
		/GITHUB_REF=refs\/heads\/main/u,
	);
	assert.equal(preflightCalls, 0);

	await runReleaseMutationGuard({
		ref: { githubActions: true, githubRef: "refs/heads/main" },
		preflight: async () => {
			preflightCalls += 1;
		},
	});
	assert.equal(preflightCalls, 1);
});

test("all production mutation entrypoints share the guarded release path", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(
		scripts["guard:release:mutation"],
		"node scripts/release/release-mutation-guard.ts",
	);
	for (const name of [
		"deploy:showcase:prod",
		"deploy:docs:prod",
		"publish:ui",
		"rollout:showcase:prod",
	]) {
		assert.match(String(scripts[name]), /^pnpm guard:release:mutation && /u);
	}
	assert.match(
		String(scripts["version:packages"]),
		/^pnpm changeset version && /u,
	);
	assert.equal(scripts["deploy:showcase"], "pnpm deploy:showcase:prod");
	assert.equal(scripts["deploy:docs"], "pnpm deploy:docs:prod");
	assert.equal(
		record(showcasePackage.scripts, "showcase scripts")["deploy:production"],
		"pnpm --dir ../.. deploy:showcase:prod",
	);
	assert.equal(
		record(docsPackage.scripts, "docs scripts")["deploy:production"],
		"pnpm --dir ../.. deploy:docs:prod",
	);
	assert.doesNotMatch(
		String(record(showcasePackage.scripts, "showcase scripts")["cf:dry-run"]),
		/guard:release:mutation/u,
	);
	assert.doesNotMatch(
		String(record(docsPackage.scripts, "docs scripts")["cf:dry-run"]),
		/guard:release:mutation/u,
	);
	assert.equal(
		scripts.release,
		"pnpm release:preflight && pnpm check && pnpm test && pnpm publish:ui",
	);
});

test("Changesets routes add, status, and version through the governed wrapper", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(scripts.changeset, "node scripts/release/changeset-command.ts");
	assert.equal(scripts["changeset:add"], "pnpm changeset add");
	assert.equal(scripts["changeset:status"], "pnpm changeset status");
	assert.equal(
		scripts["version:packages"],
		"pnpm changeset version && pnpm sync:docs-changelog",
	);
	assert.match(
		contributing,
		/`pnpm exec changeset version`[\s\S]*unsupported[\s\S]*prohibited/u,
	);
});

test("pnpm changeset version cannot mutate a package in a feature checkout", async () => {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-changeset-guard-"),
	);
	try {
		await Promise.all([
			mkdir(resolve(temporaryRoot, "scripts/release"), { recursive: true }),
			mkdir(resolve(temporaryRoot, "packages/ui"), { recursive: true }),
			mkdir(resolve(temporaryRoot, ".changeset"), { recursive: true }),
		]);
		for (const file of [
			"changeset-command.ts",
			"release-mutation-guard.ts",
			"cloudflare-preflight.ts",
		]) {
			await copyFile(
				resolve(root, "scripts/release", file),
				resolve(temporaryRoot, "scripts/release", file),
			);
		}
		await symlink(
			resolve(root, "node_modules"),
			resolve(temporaryRoot, "node_modules"),
		);
		await writeFile(
			resolve(temporaryRoot, "package.json"),
			JSON.stringify({
				name: "changeset-guard-contract",
				private: true,
				type: "module",
				packageManager: "pnpm@11.8.0",
				scripts: {
					changeset: "node scripts/release/changeset-command.ts",
				},
			}),
		);
		await writeFile(
			resolve(temporaryRoot, "pnpm-workspace.yaml"),
			"packages:\n  - packages/*\n",
		);
		await writeFile(
			resolve(temporaryRoot, "packages/ui/package.json"),
			JSON.stringify({
				name: "@lemn-ltd/ui",
				version: "0.1.2",
			}),
		);
		await writeFile(
			resolve(temporaryRoot, ".changeset/config.json"),
			JSON.stringify({
				$schema: "https://unpkg.com/@changesets/config@3.1.2/schema.json",
				changelog: false,
				commit: false,
				fixed: [],
				linked: [],
				access: "restricted",
				baseBranch: "main",
				updateInternalDependencies: "patch",
				ignore: [],
			}),
		);
		await writeFile(
			resolve(temporaryRoot, ".changeset/guard-contract.md"),
			'---\n"@lemn-ltd/ui": patch\n---\n\nGuard contract.\n',
		);

		execFileSync("git", ["init", "--initial-branch=review/guard-contract"], {
			cwd: temporaryRoot,
			stdio: "ignore",
		});
		execFileSync("git", ["config", "user.name", "Contract Test"], {
			cwd: temporaryRoot,
		});
		execFileSync("git", ["config", "user.email", "contract@example.test"], {
			cwd: temporaryRoot,
		});
		execFileSync("git", ["add", "."], { cwd: temporaryRoot });
		execFileSync("git", ["commit", "-m", "fixture"], {
			cwd: temporaryRoot,
			stdio: "ignore",
		});

		const environment = { ...process.env };
		delete environment.GITHUB_ACTIONS;
		delete environment.GITHUB_REF;
		delete environment.CLOUDFLARE_API_KEY;
		delete environment.CLOUDFLARE_EMAIL;
		const result = spawnSync("pnpm", ["changeset", "version"], {
			cwd: temporaryRoot,
			encoding: "utf8",
			env: environment,
		});
		assert.notEqual(result.status, 0);
		assert.match(
			`${result.stdout}${result.stderr}`,
			/release mutations require local branch main/iu,
		);
		const packageManifest = JSON.parse(
			await readFile(
				resolve(temporaryRoot, "packages/ui/package.json"),
				"utf8",
			),
		) as { version: string };
		assert.equal(packageManifest.version, "0.1.2");
		assert.match(
			await readFile(
				resolve(temporaryRoot, ".changeset/guard-contract.md"),
				"utf8",
			),
			/@lemn-ltd\/ui/u,
		);
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});

test("publish lifecycle builds then requires dist and a strict consumer smoke", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	const publish = String(scripts["publish:ui"]);
	assert.ok(
		publish.indexOf("guard:release:mutation") < publish.indexOf("run build"),
	);
	assert.ok(publish.indexOf("run build") < publish.indexOf(" publish "));
	assert.equal(
		scripts["publish:ui:verify"],
		"pnpm guard:release:mutation && node scripts/release/verify-ui-dist.mjs && pnpm pack:ui",
	);
	assert.equal(
		record(uiPackage.scripts, "UI package scripts").prepublishOnly,
		"pnpm --dir ../.. publish:ui:verify",
	);
	assert.equal(scripts["publish:ui:internal"], undefined);
	assert.match(String(scripts["pack:ui"]), /smoke-package-tarball\.mjs/u);
});

test("publish-ready verification fails closed without complete dist exports", async () => {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-dist-contract-"),
	);
	try {
		const packageRoot = resolve(temporaryRoot, "packages/ui");
		await mkdir(packageRoot, { recursive: true });
		await writeFile(
			resolve(packageRoot, "package.json"),
			JSON.stringify({
				name: "@lemn-ltd/ui",
				version: "1.2.3",
				exports: {
					".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
					"./tokens": {
						types: "./dist/tokens.d.ts",
						default: "./dist/tokens.js",
					},
					"./catalog": {
						types: "./dist/catalog.d.ts",
						default: "./dist/catalog.js",
					},
					"./styles.css": "./dist/styles.css",
				},
			}),
		);
		await assert.rejects(
			verifyUiDist(temporaryRoot),
			/Built package is missing export/u,
		);
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});
