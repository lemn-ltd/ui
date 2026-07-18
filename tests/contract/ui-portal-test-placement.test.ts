import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const portalRoot = resolve(root, "apps/ui-portal");

async function filesUnder(directory: string): Promise<string[]> {
	const output: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) output.push(...(await filesUnder(path)));
		if (entry.isFile()) {
			output.push(relative(portalRoot, path).split(sep).join("/"));
		}
	}
	return output.sort();
}

test("Portal keeps test-only files out of production source", async () => {
	const sourceFiles = await filesUnder(resolve(portalRoot, "src"));
	const misplaced = sourceFiles.filter(
		(path) =>
			/(?:^|\/)tests?\//u.test(path) ||
			/\.(?:spec|test)\.[cm]?[jt]sx?$/u.test(path),
	);
	assert.deepEqual(misplaced, []);

	const workerTests = await filesUnder(resolve(portalRoot, "tests/unit/worker"));
	assert(workerTests.includes("tests/unit/worker/portal-worker.spec.ts"));
	assert(workerTests.includes("tests/unit/worker/service-descriptor.spec.ts"));
});

test("Vitest collects only from the Portal tests tree", async () => {
	const config = await readFile(resolve(portalRoot, "vitest.config.ts"), "utf8");
	assert.match(config, /tests\/unit\/\*\*\/\*\.spec\.ts/u);
	assert.match(config, /tests\/unit\/\*\*\/\*\.spec\.tsx/u);
	assert.doesNotMatch(config, /["']src\/\*\*/u);
});
