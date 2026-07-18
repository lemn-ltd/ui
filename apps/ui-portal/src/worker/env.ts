// biome-ignore-all lint/style/useNamingConvention: Cloudflare binding names are runtime contracts.

export type DeploymentEnvironment = "local" | "production" | "test";

/**
 * Explicit, non-secret opt-in used only by the Worker-backed Playwright server.
 * Production never accepts this marker because its deployment environment is
 * not `test`.
 */
export const LOCAL_ADMIN_TEST_IDENTITY_HEADER =
	"x-lemn-local-admin-test-identity";
export const LOCAL_ADMIN_TEST_IDENTITY_VALUE = "worker-backed-playwright";

/**
 * Runtime configuration for the single Lemn UI Portal Worker.
 *
 * ACCESS_AUDIENCE accepts one audience or a comma-separated set when
 * Cloudflare requires multiple path-scoped applications for the Admin surface.
 * ACCESS_HEALTH_AUDIENCE is intentionally separate and can only authorize the
 * deep operational health route.
 */
export interface UiPortalEnv {
	ASSETS?: Fetcher;
	ACCESS_AUDIENCE?: string;
	ACCESS_HEALTH_AUDIENCE?: string;
	ACCESS_ISSUER?: string;
	BUILD_VERSION?: string;
	BUILD_GIT_SHA?: string;
	BUILD_TIME?: string;
	DEPLOYMENT_ENVIRONMENT?: DeploymentEnvironment | string;
}
