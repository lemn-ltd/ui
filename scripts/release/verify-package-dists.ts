#!/usr/bin/env node
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import {
	type ReleasePackageDefinition,
	readReleasePackageManifest,
	releasePackages,
} from "./package-set.ts";

const registry = "https://npm.pkg.github.com";
const exactVersion =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u;
const exactWorkspaceVersion =
	/^workspace:(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u;

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function exportTargets(definition: unknown): string[] {
	if (typeof definition === "string") return [definition];
	if (Array.isArray(definition)) return definition.flatMap(exportTargets);
	if (definition && typeof definition === "object") {
		return Object.values(definition).flatMap(exportTargets);
	}
	return [];
}

function assertExactDependency(
	definition: ReleasePackageDefinition,
	group: string,
	name: string,
	value: string,
): void {
	assert(
		exactVersion.test(value) ||
			exactWorkspaceVersion.test(value) ||
			value === "catalog:",
		`${definition.name} ${group}.${name} must use an exact version; received ${value}`,
	);
}

export async function verifyPackageDists(root: string): Promise<{
	readonly packages: readonly string[];
}> {
	const verified: string[] = [];
	for (const definition of releasePackages) {
		const manifest = await readReleasePackageManifest(root, definition);
		assert(
			manifest.name === definition.name,
			`${definition.id} package name is invalid`,
		);
		assert(
			exactVersion.test(manifest.version ?? ""),
			`${definition.name} must declare an exact release version; received ${manifest.version ?? "missing"}`,
		);
		assert(
			manifest.publishConfig?.registry === registry &&
				manifest.publishConfig.access === "restricted",
			`${definition.name} must publish restricted to GitHub Packages`,
		);
		assert(
			manifest.scripts?.prepublishOnly ===
				"pnpm --dir ../.. publish:packages:verify",
			`${definition.name} must use the governed package-set prepublish gate`,
		);

		for (const key of definition.requiredExports) {
			assert(
				manifest.exports?.[key],
				`${definition.name} export ${key} is missing`,
			);
		}
		for (const [key, exportDefinition] of Object.entries(
			manifest.exports ?? {},
		)) {
			const targets = exportTargets(exportDefinition);
			assert(
				targets.length > 0,
				`${definition.name} export ${key} has no target`,
			);
			for (const target of targets) {
				assert(
					target.startsWith("./dist/"),
					`${definition.name} export ${key} must target dist: ${target}`,
				);
				try {
					await access(resolve(root, definition.directory, target));
				} catch {
					throw new Error(
						`${definition.name} built dist is missing ${key} target ${target}`,
					);
				}
			}
		}

		for (const group of [
			"dependencies",
			"optionalDependencies",
			"peerDependencies",
		] as const) {
			for (const [name, value] of Object.entries(manifest[group] ?? {})) {
				assertExactDependency(definition, group, name, value);
			}
		}
		verified.push(`${definition.name}@${manifest.version}`);
	}

	const contract = await readReleasePackageManifest(root, releasePackages[0]);
	const ui = await readReleasePackageManifest(root, releasePackages[1]);
	const runtime = await readReleasePackageManifest(root, releasePackages[2]);
	const studio = await readReleasePackageManifest(root, releasePackages[3]);
	const contractVersion = contract.version ?? "missing";
	const uiVersion = ui.version ?? "missing";
	assert(
		runtime.dependencies?.["@lemn-ltd/brand-contract"] ===
			`workspace:${contractVersion}`,
		`Brand Runtime must source the exact brand-contract ${contractVersion} workspace release`,
	);
	assert(
		studio.dependencies?.["@lemn-ltd/brand-contract"] ===
			`workspace:${contractVersion}`,
		`Brand Studio must source the exact brand-contract ${contractVersion} workspace release`,
	);
	assert(
		studio.peerDependencies?.["@lemn-ltd/ui"] === uiVersion,
		`Brand Studio must require exact @lemn-ltd/ui ${uiVersion}`,
	);
	assert(
		studio.devDependencies?.["@lemn-ltd/ui"] === `workspace:${uiVersion}`,
		`Brand Studio development must use exact workspace @lemn-ltd/ui ${uiVersion}`,
	);
	return { packages: verified };
}

async function main(): Promise<void> {
	const root = resolve(import.meta.dirname, "../..");
	const result = await verifyPackageDists(root);
	console.log(
		`Publish-ready package set verified: ${result.packages.join(", ")}`,
	);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
