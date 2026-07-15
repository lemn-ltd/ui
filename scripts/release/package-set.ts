import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface ReleasePackageDefinition {
	readonly id: "brand-contract" | "ui" | "brand-studio";
	readonly name:
		| "@lemn-ltd/brand-contract"
		| "@lemn-ltd/ui"
		| "@lemn-ltd/brand-studio";
	readonly directory: string;
	readonly expectedVersion: string;
	readonly requiredExports: readonly string[];
}

/**
 * This order is the release dependency graph: contract first, the provider UI
 * second, and Studio last after both of its exact public dependencies exist.
 */
export const releasePackages = [
	{
		id: "brand-contract",
		name: "@lemn-ltd/brand-contract",
		directory: "packages/brand-contract",
		expectedVersion: "0.1.0",
		requiredExports: ["."],
	},
	{
		id: "ui",
		name: "@lemn-ltd/ui",
		directory: "packages/ui",
		expectedVersion: "0.3.0",
		requiredExports: [".", "./tokens", "./catalog", "./blocks", "./styles.css"],
	},
	{
		id: "brand-studio",
		name: "@lemn-ltd/brand-studio",
		directory: "packages/brand-studio",
		expectedVersion: "0.1.0",
		requiredExports: [".", "./styles.css"],
	},
] as const satisfies readonly ReleasePackageDefinition[];

export interface ReleasePackageManifest {
	readonly name?: string;
	readonly version?: string;
	readonly exports?: Record<string, unknown>;
	readonly dependencies?: Record<string, string>;
	readonly optionalDependencies?: Record<string, string>;
	readonly peerDependencies?: Record<string, string>;
	readonly devDependencies?: Record<string, string>;
	readonly publishConfig?: {
		readonly registry?: string;
		readonly access?: string;
	};
	readonly scripts?: Record<string, string>;
}

export async function readReleasePackageManifest(
	root: string,
	definition: ReleasePackageDefinition,
): Promise<ReleasePackageManifest> {
	return JSON.parse(
		await readFile(resolve(root, definition.directory, "package.json"), "utf8"),
	) as ReleasePackageManifest;
}

export function packageSetReleaseId(
	manifests: readonly ReleasePackageManifest[],
): string {
	return manifests
		.map((manifest) => `${manifest.name}@${manifest.version}`)
		.join("+");
}
