import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
	expectedManagedFilePaths,
	validateAgentOpsManagedFiles,
} from "../../scripts/check-agentops-managed-files.mjs";

const root = resolve(import.meta.dirname, "../..");

async function createFixture(): Promise<string> {
	const fixtureRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-agentops-lock-"),
	);
	await mkdir(resolve(fixtureRoot, ".agentops"), { recursive: true });
	await cp(
		resolve(root, ".agentops/project.json"),
		resolve(fixtureRoot, ".agentops/project.json"),
	);
	for (const targetPath of expectedManagedFilePaths) {
		await mkdir(resolve(fixtureRoot, targetPath, ".."), { recursive: true });
		await cp(resolve(root, targetPath), resolve(fixtureRoot, targetPath));
	}
	return fixtureRoot;
}

test("AgentOps lock covers exactly the five managed files at current checksums", async () => {
	const result = await validateAgentOpsManagedFiles(root);
	assert.equal(result.count, 5);
	assert.deepEqual(
		[...result.paths].sort(),
		[...expectedManagedFilePaths].sort(),
	);
});

test("AgentOps lock rejects local managed-file drift", async () => {
	const fixtureRoot = await createFixture();
	try {
		const profilePath = resolve(fixtureRoot, "patterns/pattern-profile.md");
		const profile = await readFile(profilePath, "utf8");
		await writeFile(profilePath, `${profile}\n`);
		await assert.rejects(
			validateAgentOpsManagedFiles(fixtureRoot),
			/pattern-profile\.md checksum mismatch/u,
		);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
});

test("AgentOps lock rejects an incomplete managed-file inventory", async () => {
	const fixtureRoot = await createFixture();
	try {
		const manifestPath = resolve(fixtureRoot, ".agentops/project.json");
		const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
		manifest.promptFiles.files.pop();
		await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
		await assert.rejects(
			validateAgentOpsManagedFiles(fixtureRoot),
			/expected exactly/u,
		);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
});
