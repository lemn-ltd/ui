import { expect, gotoStable, test } from '../helpers/deterministic';

const POPOVER_PATH = '/core/components/popover';

test('a live preview opens a responsive, themeable, deep-linked playground', async ({ page }) => {
  await gotoStable(page, `/?preview=${encodeURIComponent(POPOVER_PATH)}`);

  await expect(page).toHaveURL(/preview=%2Fcore%2Fcomponents%2Fpopover/);
  await expect(page.getByRole('dialog', { name: 'Popover playground' })).toBeVisible();

  const frame = page.frameLocator('iframe[title="Popover interactive preview"]');
  await expect(frame.locator('[data-showcase-preview-content]')).toBeVisible();
  await frame.getByRole('button', { name: 'Open popover' }).click();
  await expect(frame.locator('.ui-popover')).toBeVisible();

  await page
    .locator('.showcase-playground__toolbar .ui-segmented-control__segment')
    .filter({ hasText: 'Dark' })
    .click();
  await expect(page.locator('iframe.showcase-playground__frame')).toHaveAttribute(
    'src',
    /theme=dark/,
  );
  await expect(frame.locator('html[data-theme="dark"]')).toHaveCount(1);

  await page
    .locator('.showcase-playground__toolbar .ui-segmented-control__segment')
    .filter({ hasText: '375' })
    .click();
  await expect
    .poll(() =>
      page
        .locator('iframe.showcase-playground__frame')
        .evaluate((element) => (element as HTMLIFrameElement).contentWindow?.innerWidth),
    )
    .toBe(375);

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL('/');
});

test('every catalog entry renders in the playground and accepts a canonical interaction', async ({
  page,
}) => {
  test.setTimeout(600_000);
  await gotoStable(page, '/');

  const paths = await page
    .locator('article.showcase-overview-card h3 a')
    .evaluateAll((links) =>
      links
        .map((link) => (link as HTMLAnchorElement).getAttribute('href'))
        .filter((href): href is string => Boolean(href)),
    );
  expect(paths.length).toBeGreaterThanOrEqual(90);

  const errors: string[] = [];
  let currentPath = '/';
  let renderedCount = 0;
  let controlInteractionCount = 0;
  page.on('pageerror', (error) => errors.push(`${currentPath}: ${error.message}`));

  for (const path of paths) {
    currentPath = path;
    try {
      await page.goto(`/?preview=${encodeURIComponent(path)}`);
      await page.locator('.showcase-playground').waitFor({ timeout: 15_000 });
      const frame = page.frameLocator('iframe.showcase-playground__frame');
      const preview = frame.locator('[data-showcase-preview-content]');
      await preview.waitFor({ timeout: 15_000 });
      await preview.hover();
      renderedCount += 1;

      const control = frame
        .locator(
          'button:visible:not([disabled]), input:visible:not([disabled]):not([type="file"]), textarea:visible:not([disabled]), select:visible:not([disabled])',
        )
        .first();
      if ((await control.count()) === 0) continue;

      const controlKind = await control.evaluate((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element instanceof HTMLInputElement ? element.type : '',
      }));
      if (
        controlKind.tag === 'input' &&
        ['button', 'checkbox', 'radio', 'reset', 'submit'].includes(controlKind.type)
      ) {
        await control.click();
      } else if (controlKind.tag === 'input') {
        const valueByType: Readonly<Record<string, string>> = {
          date: '2026-07-13',
          'datetime-local': '2026-07-13T12:00',
          month: '2026-07',
          number: '42',
          range: '42',
          time: '12:00',
          week: '2026-W29',
        };
        await control.fill(valueByType[controlKind.type] ?? 'Live preview interaction');
      } else if (controlKind.tag === 'textarea') {
        await control.fill('Live preview interaction');
      } else if (controlKind.tag === 'select') {
        const option = control.locator('option').nth(1);
        if ((await option.count()) > 0) await control.selectOption({ index: 1 });
      } else {
        await control.click();
      }
      controlInteractionCount += 1;
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.info(
    `live catalog receipt: ${renderedCount}/${paths.length} rendered, ${controlInteractionCount} control interactions`,
  );
  expect(renderedCount).toBe(paths.length);
  expect(controlInteractionCount).toBeGreaterThan(40);
  expect(errors, `playground errors: ${errors.join(' | ')}`).toEqual([]);
});
