import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../../../..");

test("tracked Git hooks delegate to the governed local validation profiles", async () => {
	const preCommit = await readFile(
		resolve(root, ".githooks/pre-commit"),
		"utf8",
	);
	const prePush = await readFile(resolve(root, ".githooks/pre-push"), "utf8");
	assert.match(preCommit, /exec pnpm validate:quick/u);
	assert.match(prePush, /exec pnpm pipeline:local/u);
	assert.ok(
		((await stat(resolve(root, ".githooks/pre-commit"))).mode & 0o111) !== 0,
	);
	assert.ok(
		((await stat(resolve(root, ".githooks/pre-push"))).mode & 0o111) !== 0,
	);
});
