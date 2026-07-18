import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const portalReadme = await readFile(
	resolve(root, "apps/ui-portal/README.md"),
	"utf8",
);
const deployDocs = await Promise.all([
	readFile(
		resolve(root, "apps/docs/src/content/docs/deploy/index.mdx"),
		"utf8",
	),
	readFile(
		resolve(root, "apps/docs/src/content/docs/es/deploy/index.mdx"),
		"utf8",
	),
]);
const releaseOverviewDocs = await Promise.all([
	readFile(resolve(root, "README.md"), "utf8"),
	readFile(
		resolve(root, "apps/docs/src/content/docs/lifecycle/index.mdx"),
		"utf8",
	),
	readFile(
		resolve(root, "apps/docs/src/content/docs/es/lifecycle/index.mdx"),
		"utf8",
	),
]);
const retiredStatusCredential = new RegExp(
	["PRODUCTION", "STATUS", "TOKEN"].join("_"),
	"u",
);

test("Portal ownership and public, human, and service boundaries are explicit", () => {
	assert.match(portalReadme, /portal\.ui\.le-mn\.com/u);
	assert.match(portalReadme, /public catalog/iu);
	assert.match(portalReadme, /Cloudflare Access/u);
	assert.match(portalReadme, /\/admin/u);
	assert.match(portalReadme, /\/api\/admin/u);
	assert.match(portalReadme, /\/admin-assets/u);
	assert.match(portalReadme, /\/health\/deep/u);
	assert.match(portalReadme, /service identity/u);
	assert.doesNotMatch(portalReadme, /Authorization:\s*Bearer/u);
	assert.doesNotMatch(portalReadme, retiredStatusCredential);
});

test("English and Spanish deploy runbooks preserve rollback with scoped API and service-health credentials", () => {
	for (const docs of deployDocs) {
		assert.match(docs, /PRODUCTION_CLOUDFLARE_API_TOKEN/u);
		assert.match(docs, /PRODUCTION_CLOUDFLARE_ACCOUNT_ID/u);
		assert.match(docs, /PRODUCTION_UI_PORTAL_ACCESS_CLIENT_ID/u);
		assert.match(docs, /PRODUCTION_UI_PORTAL_ACCESS_CLIENT_SECRET/u);
		assert.match(docs, /PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE/u);
		assert.match(docs, /PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE/u);
		assert.match(docs, /32(?:-character| caracteres)/u);
		assert.match(docs, /64(?:-character| caracteres)/u);
		assert.match(docs, /Workers\s+Scripts:\s+Edit/u);
		assert.match(docs, /Zone:\s+Read/u);
		assert.match(docs, /Workers\s+Routes:\s+Edit/u);
		assert.match(docs, /wrangler\s+deployments\s+list\s+--json/u);
		assert.match(docs, /wrangler\s+rollback/u);
		assert.match(docs, /\/health\/deep/u);
		assert.doesNotMatch(docs, /CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL/u);
		assert.doesNotMatch(docs, retiredStatusCredential);
	}
});

test("English and Spanish deploy runbooks place transactional Portal rollout before Docs and define safe reruns", () => {
	const [english, spanish] = deployDocs;
	assert.match(
		english,
		/Activate that exact Portal candidate transactionally[\s\S]*Deploy Docs last/u,
	);
	assert.match(
		english,
		/If the final Docs deployment fails[\s\S]*same protected-main workflow[\s\S]*exact-SHA frozen[\s\S]*never rolls the[\s\S]*Portal back/u,
	);
	assert.match(
		spanish,
		/Activa esa candidata exacta de forma transaccional[\s\S]*Despliega Docs al final/u,
	);
	assert.match(
		spanish,
		/Si el deploy final de Docs falla[\s\S]*mismo workflow de `main` protegido[\s\S]*SHA exacto[\s\S]*no hace[\s\S]*rollback del Portal/u,
	);
});

test("release overview docs describe the single Portal Worker and scoped production token", () => {
	for (const docs of releaseOverviewDocs) {
		assert.match(docs, /portal\.ui\.le-mn\.com/u);
		assert.match(docs, /lemn-ui-portal/u);
		assert.match(docs, /Workers\s+Scripts:\s+Edit/u);
		assert.match(docs, /Zone:\s+Read/u);
		assert.match(docs, /Workers\s+Routes:\s+Edit/u);
		assert.match(docs, /Lemn DEV/u);
		assert.match(docs, /le-mn\.com/u);
		assert.doesNotMatch(docs, /Global API Key/u);
		assert.doesNotMatch(docs, /CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL/u);
		assert.doesNotMatch(docs, retiredStatusCredential);
	}
});
