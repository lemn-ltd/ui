import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const portalRoot = resolve(import.meta.dirname, "../..");
const demoRoot = resolve(portalRoot, "public/demos/halo-nine");
const builtDemoRoot = resolve(portalRoot, "dist/client/demos/halo-nine");

const textFiles = ["index.html", "styles.css", "app.js"] as const;
const imageFiles = [
	"assets/hero.jpg",
	"assets/solar-glide.jpg",
	"assets/cloud-gardens.jpg",
	"assets/eclipse-chamber.jpg",
] as const;

test("keeps the HALO/9 concept independent from UI packages and remote assets", async () => {
	const sources = await Promise.all(
		textFiles.map((file) => readFile(resolve(demoRoot, file), "utf8")),
	);
	const combinedSource = sources.join("\n");
	const [html, stylesheet, script] = sources;
	assert(
		html && stylesheet && script,
		"The standalone demo source files must exist",
	);

	assert.doesNotMatch(
		combinedSource,
		/@lemn-ltd\/ui|branding[_-]?mcp|\/mcp\b/iu,
	);
	assert.doesNotMatch(combinedSource, /(?:src|href)=["']https?:\/\//iu);
	assert.doesNotMatch(combinedSource, /@import\s|url\(["']?https?:\/\//iu);
	assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css"/u);
	assert.match(html, /<script src="\.\/app\.js" defer><\/script>/u);
	assert.match(html, /<dialog[^>]+data-booking-dialog/u);
	assert.match(html, /<select[^>]+data-branding-select/u);
	assert.match(html, /Solar Ink · claro/u);
	assert.match(stylesheet, /:root\[data-branding="solar-ink-dark"\]/u);
	assert.match(stylesheet, /--paper: #0d0b05/u);
	assert.match(script, /halo-nine-branding/u);

	for (const image of imageFiles) {
		const metadata = await stat(resolve(demoRoot, image));
		assert(
			metadata.size > 10_000,
			`${image} must be a substantive local asset`,
		);
	}

	const mark = await stat(resolve(demoRoot, "assets/halo-nine-mark.svg"));
	assert(mark.size > 100, "The local HALO/9 mark must be present");
});

test("publishes the standalone concept unchanged in the portal build", async () => {
	for (const file of [
		...textFiles,
		...imageFiles,
		"assets/halo-nine-mark.svg",
	]) {
		const source = await stat(resolve(demoRoot, file));
		const built = await stat(resolve(builtDemoRoot, file));
		assert.equal(
			built.size,
			source.size,
			`${file} must be copied without mutation`,
		);
	}
});
