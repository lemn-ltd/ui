import { expect, gotoStable, test } from '../helpers/deterministic';

test('every registry entry resolves to a rendered page', async ({ page }) => {
  await gotoStable(page, '/');

  const hrefs = await page
    .locator('a.showcase-overview-card')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).getAttribute('href'))
        .filter((href): href is string => Boolean(href)),
    );

  // Foundations (6) + core components + agent components + patterns (9).
  expect(hrefs.length).toBeGreaterThanOrEqual(90);

  const broken: string[] = [];
  for (const href of hrefs) {
    const errors: string[] = [];
    const onError = (error: Error): void => {
      errors.push(error.message);
    };
    page.on('pageerror', onError);
    await gotoStable(page, href);
    const notFound = await page.locator('.showcase-not-found').count();
    const content = await page.locator('.ui-content-layout').count();
    page.off('pageerror', onError);

    if (notFound > 0 || content === 0 || errors.length > 0) {
      const reasons = [
        notFound > 0 ? 'not-found' : '',
        content === 0 ? 'no content-layout' : '',
        errors.length > 0 ? `error: ${errors[0]}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      broken.push(`${href} (${reasons})`);
    }
  }

  expect(broken, `failed routes: ${broken.join(' | ')}`).toEqual([]);
});

test('a deep link restores the target component page', async ({ page }) => {
  await gotoStable(page, '/core/components/data-table');
  await expect(page.getByRole('heading', { name: 'Data table' })).toBeVisible();
});

test('an unknown route renders the not-found page', async ({ page }) => {
  await gotoStable(page, '/core/components/does-not-exist');
  await expect(page.locator('.showcase-not-found')).toBeVisible();
});
