import { expect, gotoStable, test } from "../helpers/deterministic";
import { componentRoutesFromCatalog } from "../helpers/component-catalog";

// A representative slice across foundations, primitives, complex data display,
// the dogfooded shell, and a pattern — each captured Light/Dark x {375,768,1280}
// by the six visual projects.
const PAGES: readonly (readonly [string, string])[] = [
	["overview", "/"],
	["button", "/core/components/button"],
	["checkbox", "/core/components/checkbox"],
	["badge", "/core/components/badge"],
	["calendar", "/core/components/calendar"],
	["dialog", "/core/components/dialog"],
	["data-table", "/core/components/data-table"],
	["sidebar", "/core/components/sidebar"],
	["info-banner", "/core/components/info-banner"],
	["settings-shell", "/core/components/settings-shell"],
	["approval-card", "/agents/components/approval-card"],
	["colors", "/core/foundations/colors"],
	["dashboard", "/core/patterns/dashboard"],
];

for (const [name, route] of PAGES) {
	test(`visual: ${name}`, async ({ page }) => {
		await gotoStable(page, route);
		if (route === "/core/components/checkbox") {
			await page.locator(".showcase-docs-page .shiki").first().waitFor();
		}
		await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
	});
}

test("visual: overview bento", async ({ page }) => {
	await gotoStable(page, "/");
	await page
		.locator('[data-home-feature="reporting"]')
		.scrollIntoViewIfNeeded();
	await expect(page).toHaveScreenshot("overview-bento.png");

	await page
		.locator('[data-home-feature="data-display"]')
		.scrollIntoViewIfNeeded();
	await expect(page).toHaveScreenshot("overview-bento-compact.png");
});

test("visual contract: every component is responsive in the active viewport and theme", async ({
	page,
}, testInfo) => {
	test.setTimeout(900_000);
	const routes = await componentRoutesFromCatalog(page);
	const expectedTheme = testInfo.project.name.includes("dark")
		? "dark"
		: "light";

	for (const entry of routes) {
		await test.step(entry.route, async () => {
			await gotoStable(page, entry.route);
			await expect(page.locator("html")).toHaveAttribute(
				"data-theme",
				expectedTheme,
			);
			await expect(page.locator(".showcase-docs-page")).toBeVisible();
			const overflow = await page.evaluate(
				() =>
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
			);
			expect(
				overflow,
				`${entry.route} horizontal overflow`,
			).toBeLessThanOrEqual(1);
		});
	}
});
