import { expect, gotoStable, test } from '../helpers/deterministic';

test('the toaster fires queued toasts and dismisses them', async ({ page }) => {
  await gotoStable(page, '/components/toaster');

  await page.getByRole('button', { name: 'Fire 8 toasts' }).click();
  const toasts = page.locator('[data-sonner-toast]');
  await expect(toasts.first()).toBeVisible();
  expect(await toasts.count()).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Dismiss all' }).click();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
});

test('the toaster stacks the three-tone subset', async ({ page }) => {
  await gotoStable(page, '/components/toaster');

  await page.getByRole('button', { name: 'Stack 3 tones' }).click();
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  const tones = await page
    .locator('[data-sonner-toast]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-type')));

  expect(tones).toContain('success');
  expect(tones).toContain('warning');
  expect(tones).toContain('error');
});
