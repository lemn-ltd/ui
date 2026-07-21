import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const manifestPath = resolve(
	import.meta.dirname,
	"../../tooling/manifests/infrastructure/zero-trust.json",
);

function record(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

export function parseProductionPortalEdgeAccessEnabled(
	source: string,
): boolean {
	const manifest = record(JSON.parse(source));
	const environments = record(manifest?.environments);
	const production = record(environments?.production);
	if (
		manifest?.version !== 1 ||
		manifest.projectId !== "lemn-ui" ||
		typeof production?.enabled !== "boolean"
	) {
		throw new Error(
			"The Lemn UI Zero Trust manifest has no valid production posture",
		);
	}
	return production.enabled;
}

export async function productionPortalEdgeAccessEnabled(): Promise<boolean> {
	return parseProductionPortalEdgeAccessEnabled(
		await readFile(manifestPath, "utf8"),
	);
}
