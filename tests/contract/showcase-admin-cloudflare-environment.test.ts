import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

test("Showcase Admin selects the Cloudflare environment at Vite build time", async () => {
	const workspace = JSON.parse(
		await readFile(resolve(root, "package.json"), "utf8"),
	) as { scripts: Record<string, string> };
	const admin = JSON.parse(
		await readFile(resolve(root, "apps/showcase-admin/package.json"), "utf8"),
	) as { scripts: Record<string, string> };

	for (const environment of ["development", "staging", "production"] as const) {
		assert.equal(
			admin.scripts[`build:cloudflare:${environment}`],
			`CLOUDFLARE_ENV=${environment} vite build`,
		);
		assert.match(
			admin.scripts[`cf:dry-run:${environment}`] ?? "",
			new RegExp(`build:cloudflare:${environment}`, "u"),
		);
		assert.doesNotMatch(
			admin.scripts[`cf:dry-run:${environment}`] ?? "",
			/--env/u,
			"the Vite redirect config is already flattened and must not be re-selected at deploy time",
		);
	}

	assert.match(
		workspace.scripts["deploy:showcase-admin:prod"] ?? "",
		/build:cloudflare:production/u,
	);
	assert.doesNotMatch(
		workspace.scripts["deploy:showcase-admin:prod"] ?? "",
		/--env/u,
	);
});
