import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const parentAccessAudience =
	"19ef47dd0e179e0ae6922daa94dbd76ae7afc8ecbd6dadbac41d39a7cbe52987";
const healthAccessAudience =
	"01bc1b8fac6e1cd0c1f6a47ae4bb66794e4285f2ccb149cec2c947a30f55d5a6";

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

test("Showcase Admin production verifies the exact health Access application audience", async () => {
	const wrangler = JSON.parse(
		await readFile(resolve(root, "apps/showcase-admin/wrangler.jsonc"), "utf8"),
	) as {
		env: Record<string, { vars?: Record<string, string> }>;
	};
	const production = wrangler.env.production?.vars ?? {};
	assert.equal(production.ACCESS_AUDIENCE, parentAccessAudience);
	assert.equal(production.ACCESS_HEALTH_AUDIENCE, healthAccessAudience);
	assert.notEqual(
		production.ACCESS_HEALTH_AUDIENCE,
		production.ACCESS_AUDIENCE,
	);
	for (const environment of ["development", "staging"]) {
		assert.equal(
			wrangler.env[environment]?.vars?.ACCESS_HEALTH_AUDIENCE,
			undefined,
		);
	}
});
