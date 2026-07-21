import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface ReleasePackageDefinition {
	readonly id: "brand-contract" | "ui" | "brand-runtime" | "brand-studio";
	readonly name:
		| "@lemn-ltd/brand-contract"
		| "@lemn-ltd/ui"
		| "@lemn-ltd/brand-runtime"
		| "@lemn-ltd/brand-studio";
	readonly directory: string;
	readonly requiredExports: readonly string[];
}

/**
 * This order is the release dependency graph: contract first, provider UI
 * second, the server runtime third, and Studio last after its exact public
 * dependencies exist.
 */
export const releasePackages = [
	{
		id: "brand-contract",
		name: "@lemn-ltd/brand-contract",
		directory: "packages/brand-contract",
		requiredExports: [".", "./system-brandings"],
	},
	{
		id: "ui",
		name: "@lemn-ltd/ui",
		directory: "packages/ui",
		requiredExports: [".", "./tokens", "./catalog", "./blocks", "./styles.css"],
	},
	{
		id: "brand-runtime",
		name: "@lemn-ltd/brand-runtime",
		directory: "packages/brand-runtime",
		requiredExports: [".", "./server"],
	},
	{
		id: "brand-studio",
		name: "@lemn-ltd/brand-studio",
		directory: "packages/brand-studio",
		requiredExports: [".", "./styles.css"],
	},
] as const satisfies readonly ReleasePackageDefinition[];

const targetedReleaseUsage =
	"Targeted package release usage: --package <allowed release package>";

/**
 * Selects either the complete immutable release set (the existing no-argument
 * behavior) or one exact package from that set. The deliberately narrow CLI
 * grammar prevents a workflow input from becoming an arbitrary pnpm filter.
 */
export function selectReleasePackages(
	arguments_: readonly string[],
): readonly ReleasePackageDefinition[] {
	if (arguments_.length === 0) return releasePackages;
	if (arguments_.length !== 2 || arguments_[0] !== "--package") {
		throw new Error(targetedReleaseUsage);
	}

	const requestedPackage = arguments_[1];
	const selectedPackage = releasePackages.find(
		(definition) => definition.name === requestedPackage,
	);
	if (!selectedPackage) {
		throw new Error(
			`${requestedPackage || "Missing package name"} is not an allowed release package; allowed packages: ${releasePackages
				.map(({ name }) => name)
				.join(", ")}`,
		);
	}

	return Object.freeze([selectedPackage]);
}

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
