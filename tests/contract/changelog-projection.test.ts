import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
	syncDocsChangelog,
	validateVersionedChangelog,
} from "../../scripts/sync-docs-changelog.mjs";

const root = resolve(import.meta.dirname, "../..");
const packageJson = JSON.parse(
	await readFile(resolve(root, "packages/ui/package.json"), "utf8"),
) as { version: string };
const changelog = await readFile(
	resolve(root, "packages/ui/CHANGELOG.md"),
	"utf8",
);
const changesetsCli = createRequire(import.meta.url).resolve(
	"@changesets/cli/bin.js",
);

const nextReleaseChangeset = `---
"@lemn-ltd/ui": patch
---

Exercise the next-patch changelog projection contract.
`;

function nextPatchVersion(version: string): string {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/u);
	assert.ok(match, `Expected an exact stable package version, received ${version}`);
	return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

async function createProjectionFixture(): Promise<string> {
	const fixtureRoot = await mkdtemp(resolve(tmpdir(), "lemn-ui-changelog-"));
	for (const directory of [
		".changeset",
		"apps/docs/src/content/docs/changelog",
		"apps/docs/src/content/docs/es/changelog",
		"apps/docs",
		"apps/ui-portal",
		"packages/ui",
	]) {
		await mkdir(resolve(fixtureRoot, directory), { recursive: true });
	}
	for (const relativePath of [
		"package.json",
		"pnpm-workspace.yaml",
		".changeset/config.json",
		"apps/docs/package.json",
		"apps/ui-portal/package.json",
		"packages/ui/package.json",
		"packages/ui/CHANGELOG.md",
	]) {
		await copyFile(
			resolve(root, relativePath),
			resolve(fixtureRoot, relativePath),
		);
	}
	await writeFile(
		resolve(fixtureRoot, ".changeset/next-release.md"),
		nextReleaseChangeset,
	);
	return fixtureRoot;
}

function projectChangesets(fixtureRoot: string): void {
	execFileSync(process.execPath, [changesetsCli, "version"], {
		cwd: fixtureRoot,
		stdio: "pipe",
	});
}

test("the source changelog is version-true and has one section per release", () => {
	const firstPass = validateVersionedChangelog(changelog, packageJson.version);
	const secondPass = validateVersionedChangelog(changelog, packageJson.version);
	assert.deepEqual(firstPass, secondPass);
	assert.equal(firstPass[0], packageJson.version);
	assert.equal(new Set(firstPass).size, firstPass.length);
	assert.doesNotMatch(changelog, /^##\s+Unreleased\s*$/mu);
});

test("release projection rejects notes stranded below the projected version", () => {
	assert.throws(
		() =>
			validateVersionedChangelog(
				"# @lemn-ltd/ui\n\n## 0.2.5\n\n## Unreleased\n",
				"0.2.5",
			),
		/pending notes belong in a changeset/u,
	);
});

test("release projection rejects duplicate release sections", () => {
	assert.throws(
		() =>
			validateVersionedChangelog(
				"# @lemn-ltd/ui\n\n## 0.2.5\n\n## 0.2.4\n\n## 0.2.4\n",
				"0.2.5",
			),
		/repeats release version 0\.2\.4/u,
	);
});

test("real next-patch projection and docs sync are idempotent", async () => {
	const fixtureRoot = await createProjectionFixture();
	try {
		const nextVersion = nextPatchVersion(packageJson.version);
		projectChangesets(fixtureRoot);
		const projectedManifest = JSON.parse(
			await readFile(resolve(fixtureRoot, "packages/ui/package.json"), "utf8"),
		) as { version: string };
		const projectedChangelog = await readFile(
			resolve(fixtureRoot, "packages/ui/CHANGELOG.md"),
			"utf8",
		);
		const projectedHeadings = validateVersionedChangelog(
			projectedChangelog,
			projectedManifest.version,
		);
		assert.equal(projectedManifest.version, nextVersion);
		assert.deepEqual(projectedHeadings.slice(0, 2), [
			nextVersion,
			packageJson.version,
		]);
		assert.equal(
			projectedHeadings.filter((heading) => heading === "0.2.0").length,
			1,
		);
		assert.doesNotMatch(projectedChangelog, /^##\s+Unreleased\s*$/mu);

		assert.equal(syncDocsChangelog({ repositoryRoot: fixtureRoot }), true);
		const docsPaths = [
			"apps/docs/src/content/docs/changelog/index.mdx",
			"apps/docs/src/content/docs/es/changelog/index.mdx",
		] as const;
		const firstDocs = await Promise.all(
			docsPaths.map((relativePath) =>
				readFile(resolve(fixtureRoot, relativePath), "utf8"),
			),
		);
		for (const docs of firstDocs) {
			assert.equal(docs.match(/^## 0\.3\.1$/gmu)?.length, 1);
			assert.equal(docs.match(/^## 0\.3\.0$/gmu)?.length, 1);
			assert.equal(docs.match(/^## 0\.2\.5$/gmu)?.length, 1);
			assert.equal(docs.match(/^## 0\.2\.0$/gmu)?.length, 1);
			assert.doesNotMatch(docs, /^##\s+Unreleased\s*$/mu);
		}

		assert.equal(syncDocsChangelog({ repositoryRoot: fixtureRoot }), false);
		projectChangesets(fixtureRoot);
		assert.equal(
			await readFile(resolve(fixtureRoot, "packages/ui/CHANGELOG.md"), "utf8"),
			projectedChangelog,
		);
		assert.equal(syncDocsChangelog({ repositoryRoot: fixtureRoot }), false);
		assert.deepEqual(
			await Promise.all(
				docsPaths.map((relativePath) =>
					readFile(resolve(fixtureRoot, relativePath), "utf8"),
				),
			),
			firstDocs,
		);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
});

test("the 0.2.5 release consumed its changeset and retained the exact note", async () => {
	await assert.rejects(
		readFile(resolve(root, ".changeset/published-identity-followup.md")),
		{ code: "ENOENT" },
	);
	assert.match(changelog, /current `0\.2\.4` package/u);
	assert.match(changelog, /projected release `0\.2\.5`/u);
	assert.doesNotMatch(changelog, /after `0\.1\.2`/u);
});
