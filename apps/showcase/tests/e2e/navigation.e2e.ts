import { expect, gotoStable, test } from '../helpers/deterministic';

test('every registry entry resolves to a rendered page', async ({ page }) => {
  await gotoStable(page, '/');

  const hrefs = await page
    .locator('article.showcase-overview-card h3 a')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).getAttribute('href'))
        .filter((href): href is string => Boolean(href)),
    );

  // Foundations (6) + core components + agent components + core and agent patterns.
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

test('the overview exposes lazy live previews instead of image thumbnails', async ({ page }) => {
  await gotoStable(page, '/');

  expect(await page.locator('article.showcase-overview-card').count()).toBeGreaterThanOrEqual(90);
  await expect(page.locator('article.showcase-overview-card img')).toHaveCount(0);

  const buttonPreview = page.getByRole('button', {
    name: 'Open Button interactive playground',
  });
  await buttonPreview.scrollIntoViewIfNeeded();
  await expect(buttonPreview.locator('[data-showcase-preview-content]')).toBeVisible();
  await expect(buttonPreview.locator('[data-preview-ready="true"]')).toHaveCount(1);

  const activePreviewCount = await page
    .locator('.showcase-live-preview[data-preview-active="true"]')
    .count();
  expect(activePreviewCount).toBeGreaterThan(0);
  expect(activePreviewCount).toBeLessThan(30);
});

test('a deep link restores the target component page', async ({ page }) => {
  await gotoStable(page, '/core/components/data-table');
  await expect(page.getByRole('heading', { name: 'Data table' })).toBeVisible();
});

test('the module switcher scopes sidebar navigation', async ({ page }) => {
  await gotoStable(page, '/core/components/button');

  await page.locator('.ui-org-switcher').click();
  await page.getByRole('menuitem', { name: /Agents/ }).click();

  await expect(page).toHaveURL(/\/agents\/components\/agent-activity-line$/);
  const sidebar = page.locator('.ui-sidebar');
  await expect(sidebar.getByText('Agent activity line')).toBeVisible();
  await expect(sidebar.getByText('Agent session')).toBeVisible();
  await expect(sidebar.getByText('Button')).toHaveCount(0);

  await page.locator('.ui-org-switcher').click();
  await page.getByRole('menuitem', { name: /Core/ }).click();

  await expect(page).toHaveURL(/\/core\/foundations\/colors$/);
  await expect(sidebar.getByText('Colors')).toBeVisible();
  await expect(sidebar.getByText('Agent activity line')).toHaveCount(0);
});

test('an unknown route renders the not-found page', async ({ page }) => {
  await gotoStable(page, '/core/components/does-not-exist');
  await expect(page.locator('.showcase-not-found')).toBeVisible();
});
