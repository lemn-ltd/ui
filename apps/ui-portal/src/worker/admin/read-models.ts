import { ADMIN_REGISTRY_READ_MODEL } from "../../catalog/admin-registry";
import { ENABLED_CATALOG_AREAS } from "../../catalog/catalog-manifest";
import { PROVIDER_READ_MODEL } from "../../provider-read-model";
import type { UiPortalEnv } from "../env";

const IMMUTABLE_GIT_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/iu;
const RELEASE_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const REPOSITORY_ORIGIN = "https://github.com/lemn-ltd/ui";

function immutableRepositoryUrl(gitSha: string, path?: string): string {
	return path
		? `${REPOSITORY_ORIGIN}/blob/${gitSha}/${path}`
		: `${REPOSITORY_ORIGIN}/commit/${gitSha}`;
}

export function releaseReadModel(env: UiPortalEnv) {
	const version = env.BUILD_VERSION?.trim() || "unavailable";
	const gitSha = env.BUILD_GIT_SHA?.trim() || "unavailable";
	const pinned = IMMUTABLE_GIT_SHA.test(gitSha);
	const exactPackageVersion =
		RELEASE_VERSION.test(version) && version !== "0.0.0";
	const receipts = [
		{
			id: "source-commit",
			label: "Deployed source commit",
			availability: pinned ? ("available" as const) : ("pending" as const),
			...(pinned ? { immutableUrl: immutableRepositoryUrl(gitSha) } : {}),
			detail: pinned
				? "The deployed source is pinned to an immutable Git commit."
				: "An immutable receipt is unavailable until the build is stamped with a full Git SHA.",
		},
		{
			id: "provider-registry-manifest",
			label: "Catalog provider manifest",
			availability: pinned ? ("available" as const) : ("pending" as const),
			...(pinned
				? {
						immutableUrl: immutableRepositoryUrl(
							gitSha,
							"packages/provider-registry/registry/provider-registry.v1.json",
						),
					}
				: {}),
			detail: pinned
				? `Registry revision ${PROVIDER_READ_MODEL.revision} at the deployed commit.`
				: "The catalog receipt is pending an immutable build SHA.",
		},
		{
			id: "ui-package-manifest",
			label: "UI package manifest",
			availability:
				pinned && exactPackageVersion
					? ("available" as const)
					: ("pending" as const),
			...(pinned && exactPackageVersion
				? {
						immutableUrl: immutableRepositoryUrl(
							gitSha,
							"packages/ui/package.json",
						),
					}
				: {}),
			detail:
				pinned && exactPackageVersion
					? `@lemn-ltd/ui ${version} declared by the deployed source.`
					: "The package receipt is pending an immutable SHA and non-placeholder release version.",
		},
	] as const;

	return {
		app: "@lemn-ltd/ui-portal" as const,
		worker: "lemn-ui-portal" as const,
		version,
		gitSha,
		buildTime: env.BUILD_TIME ?? "local",
		uiPackage: {
			name: "@lemn-ltd/ui" as const,
			version,
		},
		catalog: {
			version,
			providerRegistryRevision: PROVIDER_READ_MODEL.revision,
		},
		receipts,
	};
}

export function conformanceReadModel(env: UiPortalEnv) {
	type ReceiptAccumulator = {
		readonly path: string;
		readonly gates: Set<string>;
		readonly capabilityIds: Set<string>;
	};
	const byPath = new Map<string, ReceiptAccumulator>();
	for (const capability of ADMIN_REGISTRY_READ_MODEL.capabilities) {
		for (const [gate, paths] of Object.entries(capability.conformance)) {
			for (const path of paths) {
				const existing = byPath.get(path) ?? {
					path,
					gates: new Set<string>(),
					capabilityIds: new Set<string>(),
				};
				existing.gates.add(gate);
				existing.capabilityIds.add(capability.capabilityId);
				byPath.set(path, existing);
			}
		}
	}
	const gitSha = env.BUILD_GIT_SHA?.trim() || "unavailable";
	const pinned = IMMUTABLE_GIT_SHA.test(gitSha);
	return {
		authority: "git-provider-registry" as const,
		registryRevision: PROVIDER_READ_MODEL.revision,
		gitSha,
		verificationCommand: "pnpm --filter @lemn-ltd/provider-registry check",
		receipts: [...byPath.values()]
			.sort((left, right) => left.path.localeCompare(right.path))
			.map((entry) => ({
				path: entry.path,
				gates: [...entry.gates].sort(),
				capabilityIds: [...entry.capabilityIds].sort(),
				verification: pinned
					? {
							state: "commit-pinned" as const,
							immutableUrl: immutableRepositoryUrl(gitSha, entry.path),
						}
					: {
							state: "local-unpinned" as const,
							reason:
								"Local builds expose the declared evidence path without claiming an immutable CI result.",
						},
			})),
	};
}

function maskedConfiguration(
	value: string | undefined,
	mask: (configured: string) => string,
) {
	const configured = value?.trim();
	return configured
		? { state: "configured" as const, maskedValue: mask(configured) }
		: { state: "missing" as const, maskedValue: "Not configured" };
}

function maskedIssuer(value: string): string {
	try {
		const url = new URL(value);
		const labels = url.hostname.split(".");
		return `${url.protocol}//••••.${labels.slice(1).join(".")}`;
	} catch {
		return "Configured (invalid value hidden)";
	}
}

function audienceValues(value: string | undefined): readonly string[] {
	return (value ?? "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function maskedAudiences(value: string): string {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)
		.map((item) => `••••${item.slice(-6)}`)
		.join(", ");
}

export function settingsReadModel(env: UiPortalEnv) {
	const adminAudiences = audienceValues(env.ACCESS_AUDIENCE);
	const healthAudiences = audienceValues(env.ACCESS_HEALTH_AUDIENCE);
	const adminOriginAuthorization =
		env.DEPLOYMENT_ENVIRONMENT === "test"
			? "test-origin-gate"
			: env.DEPLOYMENT_ENVIRONMENT === "local"
				? "local-development"
				: "cloudflare-access-jwt";
	return {
		displayName: "Lemn UI" as const,
		environment: env.DEPLOYMENT_ENVIRONMENT ?? "local",
		enabledAreas: ENABLED_CATALOG_AREAS,
		security: {
			adminOriginAuthorization,
			adminRole: "portal-admin" as const,
			serviceCapability: "health-only" as const,
		},
		studioPersistence: "none" as const,
		operationalConfiguration: {
			assets: env.ASSETS
				? { state: "configured" as const, maskedValue: "ASSETS binding" }
				: { state: "missing" as const, maskedValue: "Not configured" },
			accessIssuer: maskedConfiguration(env.ACCESS_ISSUER, maskedIssuer),
			adminAudiences: {
				...maskedConfiguration(env.ACCESS_AUDIENCE, maskedAudiences),
				count: adminAudiences.length,
			},
			healthAudience: {
				...maskedConfiguration(env.ACCESS_HEALTH_AUDIENCE, maskedAudiences),
				count: healthAudiences.length,
			},
		},
		localPreferences: {
			theme: "browser-local" as const,
			durableWrites: false as const,
		},
	};
}
