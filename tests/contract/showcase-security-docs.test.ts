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

const repositorySecretDeletionOrder = [
	"gh secret delete CLOUDFLARE_API_TOKEN --repo lemn-ltd/ui",
	"gh secret delete CLOUDFLARE_API_KEY --repo lemn-ltd/ui",
	"gh secret delete CLOUDFLARE_EMAIL --repo lemn-ltd/ui",
	"gh secret delete STATUS_TOKEN --repo lemn-ltd/ui",
];

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

test("English and Spanish runbooks preserve rollback secrets until stable smoke", () => {
	for (const docs of deployDocs) {
		assert.match(docs, /PRODUCTION_CLOUDFLARE_API_KEY/u);
		assert.match(docs, /PRODUCTION_CLOUDFLARE_EMAIL/u);
		assert.match(docs, /PRODUCTION_STATUS_TOKEN/u);
		assert.match(
			docs,
			/79 (?:local repositories\/worktrees|repositorios\/worktrees locales)/u,
		);
		assert.match(docs, /14 (?:GitHub repositories|repositorios GitHub)/u);
		assert.match(docs, /wrangler deployments list --json/u);
		assert.match(docs, /wrangler rollback/u);
		assert.match(docs, /STATUS_TOKEN.*(?:last|ultimo)/su);

		let previousIndex = -1;
		for (const command of repositorySecretDeletionOrder) {
			const commandIndex = docs.indexOf(command);
			assert.ok(commandIndex > previousIndex, `${command} is out of order`);
			previousIndex = commandIndex;
		}
	}
});
