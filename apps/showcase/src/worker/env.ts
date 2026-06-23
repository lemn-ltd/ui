// biome-ignore-all lint/style/useNamingConvention: Cloudflare binding names are runtime contracts.

export type DeploymentEnvironment = 'local' | 'production' | 'test';

export interface UiShowcaseEnv {
  ASSETS?: Fetcher;
  STATUS_TOKEN?: string;
  BUILD_VERSION?: string;
  BUILD_GIT_SHA?: string;
  BUILD_TIME?: string;
  DEPLOYMENT_ENVIRONMENT?: DeploymentEnvironment | string;
}
