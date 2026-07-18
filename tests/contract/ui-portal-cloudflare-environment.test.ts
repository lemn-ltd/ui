import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { parse } from "jsonc-parser";

const root = resolve(import.meta.dirname, "../..");
const workspace = JSON.parse(
	await readFile(resolve(root, "package.json"), "utf8"),
) as { scripts: Record<string, string> };
const portal = JSON.parse(
	await readFile(resolve(root, "apps/ui-portal/package.json"), "utf8"),
) as { name: string; private: boolean; scripts: Record<string, string> };
const wrangler = parse(
	await readFile(resolve(root, "apps/ui-portal/wrangler.jsonc"), "utf8"),
) as {
	account_id?: unknown;
	name: string;
	routes?: Array<{ pattern?: string; custom_domain?: boolean }>;
	vars?: Record<string, string>;
	workers_dev?: boolean;
	env?: Record<string, unknown>;
};
const docsWrangler = parse(
	await readFile(resolve(root, "apps/docs/wrangler.jsonc"), "utf8"),
) as { account_id?: unknown; name: string };

test("UI Portal is one private application with one production deploy entrypoint", () => {
	assert.equal(portal.name, "@lemn-ltd/ui-portal");
	assert.equal(portal.private, true);
	assert.equal(
		workspace.scripts["deploy:portal:prod"],
		"pnpm guard:release:mutation && node scripts/release/ui-portal-production-rollout.ts",
	);
	assert.equal(workspace.scripts["deploy:portal-admin:prod"], undefined);
	assert.equal(workspace.scripts["deploy:portal-admin"], undefined);
	assert.equal(
		portal.scripts["deploy:production"],
		"pnpm --dir ../.. deploy:portal:prod",
	);
	assert.match(
		portal.scripts["cf:dry-run"] ?? "",
		/wrangler deploy --dry-run/u,
	);
});

test("UI Portal production owns the Portal and schema domains on one Worker", () => {
	assert.equal(wrangler.name, "lemn-ui-portal");
	assert.equal(wrangler.env, undefined);
	assert.equal(wrangler.workers_dev, false);
	assert.deepEqual(wrangler.routes, [
		{ pattern: "portal.ui.le-mn.com", custom_domain: true },
		{ pattern: "schemas.ui.le-mn.com", custom_domain: true },
	]);
});

test("Wrangler configs resolve the Cloudflare account only from protected release environment", () => {
	assert.equal(wrangler.account_id, undefined);
	assert.equal(docsWrangler.account_id, undefined);
	assert.equal(docsWrangler.name, "lemn-ui-docs");
});

test("production requires release-injected Admin and service-health Access audiences", () => {
	const production = wrangler.vars ?? {};
	const retiredStatusBinding = ["STATUS", "TOKEN"].join("_");
	assert.equal(
		production.ACCESS_ISSUER,
		"https://lemn-dev.cloudflareaccess.com",
	);
	assert.equal("ACCESS_AUDIENCE" in production, false);
	assert.equal("ACCESS_HEALTH_AUDIENCE" in production, false);
	assert.equal(retiredStatusBinding in production, false);
});
