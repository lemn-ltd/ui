import { timezones } from '../../src/client/fixtures/timezones';
import { expect, gotoStable, test } from '../helpers/deterministic';

test('Dialog opens, traps Escape, and returns focus to its trigger', async ({ page }) => {
  await gotoStable(page, '/components/dialog');

  const trigger = page.locator('.portal-example__preview button').first();
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('Menu opens, roves focus across items with arrow keys, and closes on Escape', async ({
  page,
}) => {
  await gotoStable(page, '/components/menu');

  await page.locator('.portal-example__preview button').first().click();

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Delete')).toBeVisible();

  // Radix DropdownMenu drives real roving focus: the arrow keys move the
  // highlight (and DOM focus) across the enabled items, skipping the disabled one.
  const highlighted = menu.locator('[role="menuitem"][data-highlighted]');

  await page.keyboard.press('ArrowDown');
  await expect(highlighted).toHaveText(/Settings/);
  await expect(highlighted).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(highlighted).toHaveText(/Show hidden files/);

  await page.keyboard.press('ArrowDown');
  await expect(highlighted).toHaveText(/Delete/); // skips the disabled "Duplicate"

  await page.keyboard.press('ArrowUp');
  await expect(highlighted).toHaveText(/Show hidden files/);

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('Combobox filters its options and shows a no-matches state', async ({ page }) => {
  await gotoStable(page, '/components/combobox');

  await page.locator('button.ui-combobox').first().click();

  const input = page.locator('.ui-combobox__input').first();
  await expect(input).toBeVisible();

  // Before any filtering the popover renders every fixture option (84 timezones).
  await expect(page.locator('.ui-combobox__option')).toHaveCount(timezones.length);

  await input.fill('Tokyo');
  await expect(page.locator('.ui-combobox__option', { hasText: 'Tokyo' }).first()).toBeVisible();

  await input.fill('zzzznotazone');
  await expect(page.locator('.ui-combobox__empty').first()).toBeVisible();
});

test('Accordion expands a collapsed item', async ({ page }) => {
  await gotoStable(page, '/components/accordion');

  const trigger = page.getByRole('button', { name: /Access/ }).first();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
});
