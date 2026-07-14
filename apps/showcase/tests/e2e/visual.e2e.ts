import { componentRoutesFromCatalog } from "../helpers/component-catalog";
import {
	expect,
	gotoStable,
	newDeterministicPage,
	test,
} from "../helpers/deterministic";

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

test("visual contract: every component is responsive in the active viewport and theme", async ({
	page: catalogPage,
	context,
}, testInfo) => {
	test.setTimeout(900_000);
	const routes = await componentRoutesFromCatalog(catalogPage);
	await catalogPage.close();
	const expectedTheme = testInfo.project.name.includes("dark")
		? "dark"
		: "light";

	for (const entry of routes) {
		await test.step(entry.route, async () => {
			const page = await newDeterministicPage(context, testInfo.project.name);
			try {
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
			} finally {
				await page.close();
			}
		});
	}
});
