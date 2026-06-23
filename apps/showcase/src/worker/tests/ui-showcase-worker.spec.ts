import { describe, expect, it, vi } from 'vitest';
import { uiShowcaseAppDescriptor } from '../../app-descriptor';
import type { UiShowcaseEnv } from '../env';
import UiShowcaseWorker from '../index';

function assetsFetcher(): Fetcher {
  return {
    fetch: vi.fn(async () => new Response('<div id="root"></div>', { status: 200 })),
  } as unknown as Fetcher;
}

function createWorker(overrides: Partial<UiShowcaseEnv> = {}) {
  const env: UiShowcaseEnv = {
    ASSETS: assetsFetcher(),
    DEPLOYMENT_ENVIRONMENT: 'test',
    ...overrides,
  };
  return new UiShowcaseWorker({} as ExecutionContext, env);
}

function request(pathname: string, init?: RequestInit): Request {
  return new Request(`https://ui-showcase.example.test${pathname}`, init);
}

describe('ui showcase worker', () => {
  it('answers /health with a 200 health shape', async () => {
    const worker = createWorker();
    const response = await worker.fetch(request('/health'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      service: uiShowcaseAppDescriptor.name,
    });
  });

  it('serves the SPA bundle for application routes through ASSETS', async () => {
    const assets = assetsFetcher();
    const worker = createWorker({ ASSETS: assets });
    const response = await worker.fetch(request('/core/components/button'));
    expect(response.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledTimes(1);
  });

  it('has no api branch — /api/* falls through to the SPA assets', async () => {
    const assets = assetsFetcher();
    const worker = createWorker({ ASSETS: assets });
    const response = await worker.fetch(request('/api/anything'));
    expect(response.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledTimes(1);
  });

  it('reports readiness 503 when the ASSETS binding is missing', async () => {
    const worker = createWorker({ ASSETS: undefined });
    const response = await worker.fetch(request('/core/components/button'));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: 'service_not_ready',
      missingBindings: ['ASSETS'],
    });
  });
});
