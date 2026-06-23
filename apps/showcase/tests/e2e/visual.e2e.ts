import { expect, gotoStable, test } from '../helpers/deterministic';

// A representative slice across foundations, primitives, complex data display,
// the dogfooded shell, and a pattern — each captured Light/Dark x {375,768,1280}
// by the six visual projects.
const PAGES: readonly (readonly [string, string])[] = [
  ['overview', '/'],
  ['button', '/core/components/button'],
  ['badge', '/core/components/badge'],
  ['data-table', '/core/components/data-table'],
  ['sidebar', '/core/components/sidebar'],
  ['colors', '/core/foundations/colors'],
  ['dashboard', '/core/patterns/dashboard'],
];

for (const [name, route] of PAGES) {
  test(`visual: ${name}`, async ({ page }) => {
    await gotoStable(page, route);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
