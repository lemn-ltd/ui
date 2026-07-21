import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseZeroTrustConfig } from "../../tooling/src/ops/zero-trust.ts";

const manifestPath = resolve(
	import.meta.dirname,
	"../../tooling/manifests/infrastructure/zero-trust.json",
);

export function parseProductionPortalEdgeAccessEnabled(
	source: string,
): boolean {
	const manifest = parseZeroTrustConfig(JSON.parse(source));
	const production = manifest.environments.production;
	if (manifest.projectId !== "lemn-ui" || !production) {
		throw new Error(
			"The Lemn UI Zero Trust manifest has no valid production posture",
		);
	}
	const portalApplications = production.applications.filter(
		(application) => application.id === "portal",
	);
	if (portalApplications.length !== 1) {
		throw new Error(
			"The Lemn UI Zero Trust manifest has no valid production posture",
		);
	}
	return production.enabled && portalApplications[0]?.enabled !== false;
}

export async function productionPortalEdgeAccessEnabled(): Promise<boolean> {
	return parseProductionPortalEdgeAccessEnabled(
		await readFile(manifestPath, "utf8"),
	);
}
