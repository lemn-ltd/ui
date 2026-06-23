import { uiShowcaseAppDescriptor } from '../app-descriptor';
import type { UiShowcaseEnv } from './env';

export interface UiShowcaseServiceDescriptor {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly ownerPackage: string;
  readonly workerName: string;
  readonly accent: string;
}

export interface UiShowcaseValidationResult {
  readonly ready: boolean;
  readonly missingBindings: string[];
  readonly missingConfiguration: string[];
}

export const uiShowcaseServiceDescriptor: UiShowcaseServiceDescriptor = {
  name: uiShowcaseAppDescriptor.name,
  displayName: uiShowcaseAppDescriptor.displayName,
  description: 'Serves the @appranks/ui design-system showcase SPA.',
  ownerPackage: '@appranks/ui-showcase',
  workerName: uiShowcaseAppDescriptor.name,
  accent: uiShowcaseAppDescriptor.accent,
};

export function validateUiShowcaseEnv(env: UiShowcaseEnv): UiShowcaseValidationResult {
  const missingBindings = env.ASSETS ? [] : ['ASSETS'];
  const missingConfiguration =
    env.DEPLOYMENT_ENVIRONMENT === 'production' && !env.STATUS_TOKEN ? ['STATUS_TOKEN'] : [];

  return {
    ready: missingBindings.length === 0 && missingConfiguration.length === 0,
    missingBindings,
    missingConfiguration,
  };
}

export function buildStatusReport(env: UiShowcaseEnv) {
  const validation = validateUiShowcaseEnv(env);

  return {
    ok: validation.ready,
    service: uiShowcaseAppDescriptor.name,
    descriptor: uiShowcaseServiceDescriptor,
    build: {
      environment: env.DEPLOYMENT_ENVIRONMENT ?? 'local',
      version: env.BUILD_VERSION ?? '0.1.0',
      gitSha: env.BUILD_GIT_SHA ?? 'local',
      time: env.BUILD_TIME ?? 'local',
    },
    validation,
  };
}
