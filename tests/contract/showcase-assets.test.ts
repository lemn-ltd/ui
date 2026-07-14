import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
	assertShowcaseAssetLayout,
	wranglerLocalArguments,
} from "../../scripts/release/showcase-assets-smoke.ts";

const root = resolve(import.meta.dirname, "../..");

async function fixture(nested: boolean): Promise<string> {
	const directory = await mkdtemp(resolve(tmpdir(), "lemn-ui-assets-"));
	const clientRoot = resolve(
		directory,
		nested ? "dist/client/client" : "dist/client",
	);
	await mkdir(resolve(clientRoot, "assets"), { recursive: true });
	await writeFile(
		resolve(clientRoot, "index.html"),
		'<div id="root"></div><script src="/assets/app.js"></script>',
	);
	await writeFile(resolve(clientRoot, "assets/app.js"), "export {};\n");
	return directory;
}

test("accepts the canonical Wrangler asset root", async () => {
	const directory = await fixture(false);
	try {
		const layout = await assertShowcaseAssetLayout(directory);
		assert.equal(layout.assetPath, "/assets/app.js");
		assert.equal(layout.clientRoot, resolve(directory, "dist/client"));
	} finally {
		await rm(directory, { force: true, recursive: true });
	}
});

test("rejects the Vite/Cloudflare dist/client/client nesting regression", async () => {
	const directory = await fixture(true);
	try {
		await assert.rejects(
			assertShowcaseAssetLayout(directory),
			/nested under dist\/client\/client/u,
		);
	} finally {
		await rm(directory, { force: true, recursive: true });
	}
});

test("Vite and Wrangler share one canonical dist/client asset root", async () => {
	const viteConfig = await readFile(
		resolve(root, "apps/showcase/vite.config.ts"),
		"utf8",
	);
	const wranglerConfig = await readFile(
		resolve(root, "apps/showcase/wrangler.jsonc"),
		"utf8",
	);
	assert.doesNotMatch(viteConfig, /outDir:\s*["']dist\/client["']/u);
	assert.match(wranglerConfig, /"directory": "\.\/dist\/client"/u);
});

test("local smoke runs Wrangler from the showcase package with the release config", () => {
	assert.deepEqual(wranglerLocalArguments(6543).slice(0, 14), [
		"--dir",
		"apps/showcase",
		"exec",
		"wrangler",
		"dev",
		"--config",
		"wrangler.jsonc",
		"--env",
		"production",
		"--local",
		"--ip",
		"127.0.0.1",
		"--port",
		"6543",
	]);
});
