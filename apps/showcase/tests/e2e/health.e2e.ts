import { uiShowcaseAppDescriptor } from '../../src/app-descriptor';
import { expect, test } from '../helpers/deterministic';

test('/health answers 200 with the ui-showcase health shape', async ({ request }) => {
  const response = await request.get('/health');

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, service: uiShowcaseAppDescriptor.name });
});
