#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CANONICAL_PACKAGE = "@lemn-ltd/ui";
const REQUIRED_EXPORTS = [".", "./tokens", "./catalog", "./styles.css"];

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

function exportTargets(definition) {
	if (typeof definition === "string") return [definition];
	if (Array.isArray(definition)) return definition.flatMap(exportTargets);
	if (definition && typeof definition === "object") {
		return Object.values(definition).flatMap(exportTargets);
	}
	return [];
}

export async function verifyUiDist(root) {
	const packageRoot = resolve(root, "packages/ui");
	const manifest = JSON.parse(
		await readFile(resolve(packageRoot, "package.json"), "utf8"),
	);
	assert(
		manifest.name === CANONICAL_PACKAGE,
		`Package must be ${CANONICAL_PACKAGE}`,
	);
	assert(
		typeof manifest.version === "string" && manifest.version.length > 0,
		"Package version must be present",
	);

	for (const key of REQUIRED_EXPORTS) {
		assert(manifest.exports?.[key], `Package export ${key} must be present`);
	}
	for (const [key, definition] of Object.entries(manifest.exports ?? {})) {
		const targets = exportTargets(definition);
		assert(targets.length > 0, `Package export ${key} must resolve to a file`);
		for (const target of targets) {
			assert(
				target.startsWith("./dist/"),
				`Package export ${key} must target dist: ${target}`,
			);
			try {
				await access(resolve(packageRoot, target));
			} catch {
				throw new Error(
					`Built package is missing export ${key} target ${target}`,
				);
			}
		}
	}

	return { package: manifest.name, version: manifest.version };
}

async function main() {
	const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
	const result = await verifyUiDist(root);
	console.log(
		`Publish-ready dist verified for ${result.package}@${result.version}`,
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
