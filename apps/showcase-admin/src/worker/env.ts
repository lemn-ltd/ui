export interface ShowcaseAdminEnv {
	ASSETS?: Fetcher;
	ACCESS_AUDIENCE?: string;
	ACCESS_HEALTH_AUDIENCE?: string;
	ACCESS_ISSUER?: string;
	DEPLOYMENT_ENVIRONMENT?: "development" | "staging" | "production";
}
