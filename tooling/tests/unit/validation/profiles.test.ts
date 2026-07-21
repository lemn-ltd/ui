import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { createQuickCommands } from "../../../src/validation/quick.ts";
import {
	discoverWorkspaces,
	selectQuickValidation,
} from "../../../src/validation/selection.ts";

test("quick selection includes transitive consumers and escalates authority files", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "lemn-ui-validation-"));
	await Promise.all([
		mkdir(resolve(root, "packages/base"), { recursive: true }),
		mkdir(resolve(root, "apps/consumer"), { recursive: true }),
	]);
	await writeFile(
		resolve(root, "packages/base/package.json"),
		JSON.stringify({
			name: "@lemn/base",
			scripts: { check: "tsc", test: "vitest" },
		}),
	);
	await writeFile(
		resolve(root, "apps/consumer/package.json"),
		JSON.stringify({
			name: "consumer",
			dependencies: { "@lemn/base": "1.0.0" },
			scripts: { check: "tsc" },
		}),
	);

	const workspaces = discoverWorkspaces(root);
	const scoped = selectQuickValidation(
		["packages/base/src/index.ts"],
		workspaces,
		{ root },
	);
	assert.equal(scoped.global, false);
	assert.deepEqual(scoped.markdownFiles, []);
	assert.deepEqual(
		scoped.affectedWorkspaces.map(({ name }) => name),
		["@lemn/base", "consumer"],
	);
	assert.equal(
		createQuickCommands(scoped).some(({ id }) => id === "repository policy"),
		false,
	);

	const global = selectQuickValidation(
		[".github/workflows/ci-cd.yml"],
		workspaces,
		{ root },
	);
	assert.equal(global.global, true);
	assert.equal(createQuickCommands(global).at(-1)?.id, "repository policy");

	await mkdir(resolve(root, "docs"), { recursive: true });
	await writeFile(resolve(root, "docs/guide.md"), "# Guide\n");
	const docs = selectQuickValidation(["docs/guide.md"], workspaces, { root });
	assert.deepEqual(docs.markdownFiles, ["docs/guide.md"]);
});
