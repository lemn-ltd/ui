import AxeBuilder from '@axe-core/playwright';
import { expect, gotoStable, test } from '../helpers/deterministic';

test('no critical accessibility violations across every registry page', async ({ page }) => {
  test.setTimeout(600_000);

  await gotoStable(page, '/');
  const hrefs = await page
    .locator('article.showcase-overview-card h3 a')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).getAttribute('href'))
        .filter((href): href is string => Boolean(href)),
    );

  const routes = ['/', ...hrefs];
  const offenders: string[] = [];

  for (const route of routes) {
    await gotoStable(page, route);
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((violation) => violation.impact === 'critical');
    if (critical.length > 0) {
      offenders.push(`${route}: ${critical.map((violation) => violation.id).join(', ')}`);
    }
  }

  expect(offenders, offenders.join(' | ')).toEqual([]);
});

test('the live playground has no critical accessibility violations', async ({ page }) => {
  await gotoStable(page, '/?preview=%2Fcore%2Fcomponents%2Fpopover');
  await expect(page.getByRole('dialog', { name: 'Popover playground' })).toBeVisible();
  await expect(
    page.frameLocator('iframe.showcase-playground__frame').locator('[data-showcase-preview-content]'),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  expect(
    critical.map((violation) => violation.id),
    critical.map((violation) => `${violation.id}: ${violation.help}`).join(' | '),
  ).toEqual([]);
});
