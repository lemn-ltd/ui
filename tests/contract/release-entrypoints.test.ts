import assert from "node:assert/strict";
import {
	access,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { runChangesetCommand } from "../../scripts/release/changeset-command.ts";
import {
	releaseMetadataPaths,
	releaseVersionChildEnvironment,
} from "../../scripts/release/prepare-package-release.ts";
import { runReleaseMutationGuard } from "../../scripts/release/release-mutation-guard.ts";
import { guardReleaseRefFromEnvironment } from "../../scripts/release/release-ref-guard.ts";
import { verifyPackageDists } from "../../scripts/release/verify-package-dists.ts";

type UnknownRecord = Record<string, unknown>;

const root = resolve(import.meta.dirname, "../..");
const rootPackage = JSON.parse(
	await readFile(resolve(root, "package.json"), "utf8"),
) as UnknownRecord;
const uiPackage = JSON.parse(
	await readFile(resolve(root, "packages/ui/package.json"), "utf8"),
) as UnknownRecord;
const brandContractPackage = JSON.parse(
	await readFile(resolve(root, "packages/brand-contract/package.json"), "utf8"),
) as UnknownRecord;
const brandRuntimePackage = JSON.parse(
	await readFile(resolve(root, "packages/brand-runtime/package.json"), "utf8"),
) as UnknownRecord;
const brandStudioPackage = JSON.parse(
	await readFile(resolve(root, "packages/brand-studio/package.json"), "utf8"),
) as UnknownRecord;
const docsPackage = JSON.parse(
	await readFile(resolve(root, "apps/docs/package.json"), "utf8"),
) as UnknownRecord;
const portalPackage = JSON.parse(
	await readFile(resolve(root, "apps/ui-portal/package.json"), "utf8"),
) as UnknownRecord;
const contributing = await readFile(resolve(root, "CONTRIBUTING.md"), "utf8");
const governedReleaseMetadataPaths = new Set<string>(releaseMetadataPaths);
const workspaceManifestPaths = (
	await Promise.all(
		["apps", "packages"].map(async (workspaceRoot) =>
			(
				await readdir(resolve(root, workspaceRoot), { withFileTypes: true })
			)
				.filter((entry) => entry.isDirectory())
				.map((entry) => `${workspaceRoot}/${entry.name}/package.json`),
		),
	)
)
	.flat()
	.sort();
const workspaceManifests = await Promise.all(
	workspaceManifestPaths.map(async (path) => ({
		path,
		manifest: JSON.parse(
			await readFile(resolve(root, path), "utf8"),
		) as UnknownRecord,
	})),
);

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

test("release entrypoints use the least-privilege ref or Cloudflare guard", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(
		scripts["guard:release:ref"],
		"node scripts/release/release-ref-guard.ts",
	);
	assert.equal(
		scripts["guard:release:mutation"],
		"node scripts/release/release-mutation-guard.ts",
	);
	for (const name of [
		"deploy:portal:prod",
		"deploy:docs:prod",
		"rollout:portal:prod",
	]) {
		assert.match(String(scripts[name]), /^pnpm guard:release:mutation && /u);
	}
	for (const name of [
		"release:preflight",
		"prepare:packages:release",
		"publish:packages:release",
		"publish:packages:verify",
	]) {
		assert.match(String(scripts[name]), /^pnpm guard:release:ref && /u);
		assert.doesNotMatch(String(scripts[name]), /guard:release:mutation/u);
	}
	assert.match(
		String(scripts["version:packages"]),
		/^pnpm changeset version && /u,
	);
	assert.equal(scripts["deploy:portal"], "pnpm deploy:portal:prod");
	assert.equal(scripts["deploy:portal-admin:prod"], undefined);
	assert.equal(scripts["deploy:docs"], "pnpm deploy:docs:prod");
	assert.equal(
		record(portalPackage.scripts, "portal scripts")["deploy:production"],
		"pnpm --dir ../.. deploy:portal:prod",
	);
	assert.equal(
		record(docsPackage.scripts, "docs scripts")["deploy:production"],
		"pnpm --dir ../.. deploy:docs:prod",
	);
	assert.doesNotMatch(
		String(record(portalPackage.scripts, "portal scripts")["cf:dry-run"]),
		/guard:release:mutation/u,
	);
	assert.doesNotMatch(
		String(record(docsPackage.scripts, "docs scripts")["cf:dry-run"]),
		/guard:release:mutation/u,
	);
	assert.equal(
		scripts.release,
		"pnpm release:preflight && pnpm check && pnpm test && pnpm build:packages:release && pnpm publish:packages:release",
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

test("changeset version rejects CI feature refs before an isolated CLI can run", async () => {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-changeset-guard-"),
	);
	try {
		const marker = resolve(temporaryRoot, "cli-ran.json");
		const cli = resolve(temporaryRoot, "changesets-stub.mjs");
		await writeFile(
			cli,
			`import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(marker)}, JSON.stringify({ argv: process.argv.slice(2), ci: process.env.CI, tty: Boolean(process.stdin.isTTY) }));\n`,
		);
		let preflightCalls = 0;
		await assert.rejects(
			runChangesetCommand(["version"], {
				root: temporaryRoot,
				cli,
				environment: { ...process.env, CI: "true" },
				guardVersion: () =>
					runReleaseMutationGuard({
						ref: {
							githubActions: true,
							githubRef: "refs/heads/review/guard-contract",
						},
						preflight: async () => {
							preflightCalls += 1;
						},
					}),
			}),
			/GITHUB_REF=refs\/heads\/main/u,
		);
		assert.equal(preflightCalls, 0);
		await assert.rejects(access(marker));
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});

test("nested release versioning preserves only the CI ref required by its main guard", async () => {
	const childEnvironment = releaseVersionChildEnvironment({
		CI: "true",
		GITHUB_ACTIONS: "true",
		GITHUB_REF: "refs/heads/main",
		GITHUB_SHA: "1".repeat(40),
		NODE_AUTH_TOKEN: "must-not-reach-versioning",
		PATH: process.env.PATH,
	});

	assert.equal(childEnvironment.GITHUB_ACTIONS, "true");
	assert.equal(childEnvironment.GITHUB_REF, "refs/heads/main");
	assert.equal(childEnvironment.GITHUB_SHA, undefined);
	assert.equal(childEnvironment.NODE_AUTH_TOKEN, undefined);
	await guardReleaseRefFromEnvironment(childEnvironment);
});

test("release governs every public package and private internal consumer manifest", () => {
	const publicVersions = new Map(
		workspaceManifests
			.filter(({ manifest }) => manifest.private !== true)
			.map(({ manifest, path }) => {
				assert.ok(
					governedReleaseMetadataPaths.has(path),
					`${path} must be governed release metadata`,
				);
				return [String(manifest.name), String(manifest.version)] as const;
			}),
	);
	const privateConsumers: string[] = [];
	for (const { manifest, path } of workspaceManifests.filter(
		({ manifest }) => manifest.private === true,
	)) {
		let consumesPublishedWorkspacePackage = false;
		for (const field of [
			"dependencies",
			"devDependencies",
			"peerDependencies",
			"optionalDependencies",
		]) {
			const dependencies = manifest[field];
			if (dependencies === undefined) continue;
			for (const [name, specification] of Object.entries(
				record(dependencies, `${path} ${field}`),
			)) {
				const version = publicVersions.get(name);
				if (!version) continue;
				consumesPublishedWorkspacePackage = true;
				assert.equal(
					specification,
					`workspace:${version}`,
					`${path} must pin ${name} to its prepared exact version`,
				);
			}
		}
		if (consumesPublishedWorkspacePackage) {
			privateConsumers.push(path);
			assert.ok(
				governedReleaseMetadataPaths.has(path),
				`${path} must be staged with generated release metadata`,
			);
		}
	}
	assert.deepEqual(privateConsumers.sort(), [
		"apps/docs/package.json",
		"apps/ui-portal/package.json",
	]);
});

test("package-set lifecycle builds in order then requires dist and a strict consumer smoke", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(
		scripts["build:packages:release"],
		"pnpm --filter @lemn-ltd/brand-contract run build && pnpm --filter @lemn-ltd/ui run build && pnpm --filter @lemn-ltd/brand-runtime run build && pnpm --filter @lemn-ltd/brand-studio run build",
	);
	for (const [label, manifest] of [
		["brand contract", brandContractPackage],
		["UI", uiPackage],
		["brand runtime", brandRuntimePackage],
		["brand studio", brandStudioPackage],
	] as const) {
		assert.equal(
			record(manifest.scripts, `${label} scripts`).prepublishOnly,
			"pnpm --dir ../.. publish:packages:verify",
		);
	}
	assert.equal(scripts["publish:ui"], undefined);
	assert.match(
		String(scripts["pack:packages"]),
		/smoke-package-set-tarballs\.mjs/u,
	);
});

test("publish-ready verification follows Changesets versions and fails closed without complete dist exports", async () => {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-dist-contract-"),
	);
	try {
		for (const directory of [
			"brand-contract",
			"ui",
			"brand-runtime",
			"brand-studio",
		]) {
			await mkdir(resolve(temporaryRoot, "packages", directory), {
				recursive: true,
			});
		}
		await writeFile(
			resolve(temporaryRoot, "packages/ui/package.json"),
			JSON.stringify({
				name: "@lemn-ltd/ui",
				version: "0.4.9",
				publishConfig: {
					registry: "https://npm.pkg.github.com",
					access: "restricted",
				},
				scripts: { prepublishOnly: "pnpm --dir ../.. publish:packages:verify" },
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
					"./blocks": {
						types: "./dist/blocks/index.d.ts",
						default: "./dist/blocks/index.js",
					},
					"./styles.css": "./dist/styles.css",
				},
			}),
		);
		for (const [directory, name, version, exports] of [
			[
				"brand-contract",
				"@lemn-ltd/brand-contract",
				"0.2.3",
				{
					".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
					"./system-brandings": {
						types: "./dist/system-brandings.d.ts",
						default: "./dist/system-brandings.js",
					},
				},
			],
			[
				"brand-runtime",
				"@lemn-ltd/brand-runtime",
				"0.1.4",
				{
					".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
					"./server": {
						types: "./dist/server.d.ts",
						default: "./dist/server.js",
					},
				},
			],
			[
				"brand-studio",
				"@lemn-ltd/brand-studio",
				"0.2.1",
				{
					".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
					"./styles.css": "./dist/styles.css",
				},
			],
		] as const) {
			await writeFile(
				resolve(temporaryRoot, `packages/${directory}/package.json`),
				JSON.stringify({
					name,
					version,
					exports,
					publishConfig: {
						registry: "https://npm.pkg.github.com",
						access: "restricted",
					},
					scripts: {
						prepublishOnly: "pnpm --dir ../.. publish:packages:verify",
					},
					...(directory === "brand-studio"
						? {
								dependencies: {
									"@lemn-ltd/brand-contract": "workspace:0.2.3",
								},
								peerDependencies: { "@lemn-ltd/ui": "0.4.9" },
								devDependencies: { "@lemn-ltd/ui": "workspace:0.4.9" },
							}
						: directory === "brand-runtime"
							? {
									dependencies: {
										"@lemn-ltd/brand-contract": "workspace:0.2.3",
									},
								}
							: {}),
				}),
			);
		}
		for (const relativePath of [
			"packages/brand-contract/dist/index.d.ts",
			"packages/brand-contract/dist/index.js",
			"packages/brand-contract/dist/system-brandings.d.ts",
			"packages/brand-contract/dist/system-brandings.js",
			"packages/ui/dist/index.d.ts",
			"packages/ui/dist/index.js",
			"packages/ui/dist/tokens.d.ts",
			"packages/ui/dist/tokens.js",
			"packages/ui/dist/catalog.d.ts",
			"packages/ui/dist/catalog.js",
			"packages/ui/dist/blocks/index.d.ts",
			"packages/ui/dist/blocks/index.js",
			"packages/ui/dist/styles.css",
			"packages/brand-runtime/dist/index.d.ts",
			"packages/brand-runtime/dist/index.js",
			"packages/brand-runtime/dist/server.d.ts",
			"packages/brand-runtime/dist/server.js",
			"packages/brand-studio/dist/index.d.ts",
			"packages/brand-studio/dist/index.js",
			"packages/brand-studio/dist/styles.css",
		]) {
			await mkdir(resolve(temporaryRoot, relativePath, ".."), {
				recursive: true,
			});
			await writeFile(resolve(temporaryRoot, relativePath), "");
		}
		assert.deepEqual(await verifyPackageDists(temporaryRoot), {
			packages: [
				"@lemn-ltd/brand-contract@0.2.3",
				"@lemn-ltd/ui@0.4.9",
				"@lemn-ltd/brand-runtime@0.1.4",
				"@lemn-ltd/brand-studio@0.2.1",
			],
		});
		await rm(resolve(temporaryRoot, "packages/brand-runtime/dist/server.js"));
		await assert.rejects(
			verifyPackageDists(temporaryRoot),
			/built dist is missing/u,
		);
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});
