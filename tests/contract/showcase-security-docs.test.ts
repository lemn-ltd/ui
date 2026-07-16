import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const showcaseReadme = await readFile(
	resolve(root, "apps/showcase/README.md"),
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

test("showcase ownership and protected status boundaries are explicit", () => {
	assert.match(showcaseReadme, /Inbound consumers: none/u);
	assert.match(showcaseReadme, /79\s+local repositories\/worktrees/u);
	assert.match(showcaseReadme, /14 GitHub repositories/u);
	assert.match(showcaseReadme, /both Monitor D1 databases/u);
	assert.match(showcaseReadme, /mandatory in production/u);
	assert.doesNotMatch(showcaseReadme, /required in staging/u);
	assert.match(showcaseReadme, /Authorization: Bearer/u);
	assert.match(
		showcaseReadme,
		/query-parameter authentication is not supported/u,
	);
});

test("English and Spanish runbooks require scoped token auth and preserve rollback capability until stable smoke", () => {
	for (const docs of deployDocs) {
		assert.match(docs, /PRODUCTION_CLOUDFLARE_API_TOKEN/u);
		assert.doesNotMatch(docs, /PRODUCTION_CLOUDFLARE_API_KEY/u);
		assert.doesNotMatch(docs, /PRODUCTION_CLOUDFLARE_EMAIL/u);
		assert.match(docs, /PRODUCTION_STATUS_TOKEN/u);
		assert.match(docs, /Workers\s+Scripts:\s+Edit/u);
		assert.match(docs, /Workers\s+Scripts\s+Write/u);
		assert.match(docs, /Zone:\s+Read/u);
		assert.match(docs, /Workers\s+Routes:\s+Edit/u);
		assert.match(docs, /Zone\s+Workers\s+Routes\s+Write/u);
		assert.doesNotMatch(docs, /(?:Do not grant|No se otorga) Workers Routes/u);
		assert.match(docs, /(?:key\/email|key\/email)/u);
		assert.match(docs, /wrangler\s+deployments\s+list\s+--json/u);
		assert.match(docs, /wrangler\s+rollback/u);
		assert.match(docs, /PRODUCTION_STATUS_TOKEN[\s\S]*(?:stable|estable)/u);
		assert.doesNotMatch(docs, /CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL/u);
	}
});

test("release overview docs describe only the scoped production token", () => {
	for (const docs of releaseOverviewDocs) {
		assert.match(docs, /Workers\s+Scripts:\s+Edit/u);
		assert.match(docs, /Workers\s+Scripts\s+Write/u);
		assert.match(docs, /Zone:\s+Read/u);
		assert.match(docs, /Workers\s+Routes:\s+Edit/u);
		assert.match(docs, /Zone\s+Workers\s+Routes\s+Write/u);
		assert.match(docs, /Lemn DEV/u);
		assert.match(docs, /le-mn\.com/u);
		assert.doesNotMatch(docs, /Global API Key/u);
		assert.doesNotMatch(docs, /CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL/u);
	}
});
