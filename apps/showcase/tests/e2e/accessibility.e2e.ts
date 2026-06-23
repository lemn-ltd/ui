import AxeBuilder from '@axe-core/playwright';
import { expect, gotoStable, test } from '../helpers/deterministic';

test('no critical accessibility violations across every registry page', async ({ page }) => {
  test.setTimeout(600_000);

  await gotoStable(page, '/');
  const hrefs = await page
    .locator('a.showcase-overview-card')
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
