import { expect, gotoStable, test } from '../helpers/deterministic';

const PALETTE_PLACEHOLDER = 'Search pages, actions…';

test('Cmd-K opens the palette, filters, and Enter navigates', async ({ page }) => {
  await gotoStable(page, '/');

  await page.keyboard.press('Meta+k');
  const input = page.getByPlaceholder(PALETTE_PLACEHOLDER);
  await expect(input).toBeVisible();

  await input.fill('Data table');
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/core\/components\/data-table$/);
});

test('the palette shows a no-matches state for unknown queries', async ({ page }) => {
  await gotoStable(page, '/');

  await page.keyboard.press('Meta+k');
  const input = page.getByPlaceholder(PALETTE_PLACEHOLDER);
  await expect(input).toBeVisible();

  await input.fill('zzzznotacommand');
  await expect(page.getByText('No matches')).toBeVisible();
});

test('Esc closes the palette and returns to the page', async ({ page }) => {
  await gotoStable(page, '/');

  await page.keyboard.press('Meta+k');
  const input = page.getByPlaceholder(PALETTE_PLACEHOLDER);
  await expect(input).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(input).toBeHidden();
});
