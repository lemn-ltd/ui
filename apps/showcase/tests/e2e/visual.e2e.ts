import { expect, gotoStable, test } from "../helpers/deterministic";

// A representative slice across foundations, primitives, complex data display,
// the dogfooded shell, and a pattern — each captured Light/Dark x {375,768,1280}
// by the six visual projects.
const PAGES: readonly (readonly [string, string])[] = [
	["overview", "/"],
	["button", "/core/components/button"],
	["checkbox", "/core/components/checkbox"],
	["badge", "/core/components/badge"],
	["data-table", "/core/components/data-table"],
	["sidebar", "/core/components/sidebar"],
	["colors", "/core/foundations/colors"],
	["dashboard", "/core/patterns/dashboard"],
];

for (const [name, route] of PAGES) {
	test(`visual: ${name}`, async ({ page }) => {
		await gotoStable(page, route);
		if (route === "/core/components/checkbox") {
			await page.locator(".showcase-docs-page .shiki").first().waitFor();
		}
		if (route === "/") {
			await expect
				.poll(async () => {
					const active = await page
						.locator('.showcase-live-preview[data-preview-active="true"]')
						.count();
					const ready = await page
						.locator(
							'.showcase-live-preview[data-preview-active="true"][data-preview-ready="true"]',
						)
						.count();
					return active > 0 && active === ready;
				})
				.toBe(true);
		}
		await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
	});
}
