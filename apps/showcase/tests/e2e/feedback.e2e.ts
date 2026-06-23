import { expect, gotoStable, test } from '../helpers/deterministic';

test('feedback component pages expose canonical visual error primitives', async ({ page }) => {
  await gotoStable(page, '/core/components/info-banner');
  await expect(page.getByRole('heading', { name: 'Info banner' })).toBeVisible();
  for (const variant of ['info', 'warn', 'danger', 'success']) {
    await expect(page.getByText(variant, { exact: true }).first()).toBeVisible();
  }

  await gotoStable(page, '/core/components/system-bar');
  await expect(page.getByRole('heading', { name: 'System bar' })).toBeVisible();
  for (const tone of ['info', 'warn', 'danger']) {
    await expect(page.getByText(tone, { exact: true }).first()).toBeVisible();
  }
});
