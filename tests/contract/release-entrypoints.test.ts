import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
		"version:packages",
		"publish:ui",
	]) {
		assert.match(String(scripts[name]), /^pnpm guard:release:mutation && /u);
	}
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

test("Changesets exposes explicit add and status commands but no versioning bypass", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(scripts.changeset, undefined);
	assert.equal(scripts["changeset:add"], "changeset add");
	assert.equal(scripts["changeset:status"], "changeset status");
	assert.match(
		String(scripts["version:packages"]),
		/^pnpm guard:release:mutation && changeset version && /u,
	);
	for (const [name, command] of Object.entries(scripts)) {
		if (/changeset version/u.test(String(command))) {
			assert.equal(name, "version:packages");
		}
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
