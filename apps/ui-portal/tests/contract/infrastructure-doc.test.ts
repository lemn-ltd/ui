import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";

const portalRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(portalRoot, "../..");
const documentPath = resolve(portalRoot, "docs/infrastructure/README.md");
const document = await readFile(documentPath, "utf8");
const wrangler = JSON.parse(
	await readFile(resolve(portalRoot, "wrangler.jsonc"), "utf8"),
) as {
	readonly name?: string;
	readonly main?: string;
	readonly routes?: readonly {
		readonly pattern?: string;
		readonly custom_domain?: boolean;
	}[];
	readonly assets?: {
		readonly binding?: string;
		readonly directory?: string;
		readonly run_worker_first?: boolean;
	};
};

async function exists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

test("documents the complete Portal target resource contract without claiming a deployment", () => {
	assert.match(document, /Status: \*\*target-state contract\*\*/u);
	assert.match(document, /It is not a deployment receipt/u);
	for (const heading of [
		"Service boundary",
		"Resource inventory",
		"Worker and assets",
		"DNS and custom domains",
		"Cloudflare Access topology",
		"Runtime bindings and configuration",
		"Ownership and sources of truth",
		"Lifecycle",
		"Invariants",
		"Failure modes",
		"Operations",
	]) {
		assert.match(document, new RegExp(`^## ${heading}$`, "mu"));
	}

	assert.equal(wrangler.name, "lemn-ui-portal");
	assert.equal(wrangler.main, "src/worker/index.ts");
	assert.equal(wrangler.assets?.binding, "ASSETS");
	assert.equal(wrangler.assets?.directory, "./dist/client");
	assert.equal(wrangler.assets?.run_worker_first, true);
	assert.match(document, new RegExp(`\`${wrangler.name}\``, "u"));
	assert.match(document, new RegExp(`\`${wrangler.assets.binding}\``, "u"));

	const customDomains = (wrangler.routes ?? [])
		.filter(({ custom_domain }) => custom_domain)
		.map(({ pattern }) => pattern)
		.filter((pattern): pattern is string => Boolean(pattern));
	assert.deepEqual(customDomains, [
		"portal.ui.le-mn.com",
		"schemas.ui.le-mn.com",
	]);
	for (const domain of customDomains) assert.ok(document.includes(domain));
});

test("documents separate human Admin and health-only service identities", () => {
	for (const path of [
		"/admin",
		"/api/admin",
		"/admin-assets",
		"/health/deep",
	]) {
		assert.ok(document.includes(path), `missing Access path ${path}`);
	}
	for (const runtimeInput of [
		"ACCESS_ISSUER",
		"ACCESS_AUDIENCE",
		"ACCESS_HEALTH_AUDIENCE",
		"PRODUCTION_CLOUDFLARE_API_TOKEN",
		"PRODUCTION_CLOUDFLARE_ACCOUNT_ID",
		"PRODUCTION_UI_PORTAL_ACCESS_CLIENT_ID",
		"PRODUCTION_UI_PORTAL_ACCESS_CLIENT_SECRET",
		"PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE",
		"PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE",
	]) {
		assert.ok(
			document.includes(`\`${runtimeInput}\``),
			`missing ${runtimeInput}`,
		);
	}
	assert.match(document, /service identity is health-only/iu);
	assert.match(document, /denied at every Admin boundary/iu);
	assert.match(document, /`403 service-health-only`/u);
	assert.match(document, /Admin and health audiences must be distinct/u);
	assert.match(document, /Worker has no runtime secret binding/u);
	assert.doesNotMatch(document, /[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{40,}/u);
});

test("keeps every local source-of-truth link resolvable", async () => {
	const links = [...document.matchAll(/\]\((\.\.\/[^)#]+)(?:#[^)]+)?\)/gu)].map(
		([, path]) => path,
	);
	assert.ok(links.length >= 10, "infrastructure sources are incomplete");
	for (const path of links) {
		assert.ok(path);
		const target = resolve(dirname(documentPath), path ?? "");
		assert.ok(
			await exists(target),
			`broken infrastructure source link: ${target.replace(`${repositoryRoot}/`, "")}`,
		);
	}
});

test("runs the infrastructure contract with the Portal build boundary gate", async () => {
	const manifest = JSON.parse(
		await readFile(resolve(portalRoot, "package.json"), "utf8"),
	) as { readonly scripts?: Readonly<Record<string, string>> };
	assert.equal(
		manifest.scripts?.["test:dist-boundaries"],
		"node --test tests/contract/*.test.ts",
	);
});
