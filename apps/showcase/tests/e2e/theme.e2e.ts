import { expect, gotoStable, test } from "../helpers/deterministic";

function brandScopeBackground(
	page: import("@playwright/test").Page,
): Promise<string> {
	return page
		.locator(".showcase-brand-scope")
		.evaluate((scope) => getComputedStyle(scope).backgroundColor);
}

function htmlTheme(page: import("@playwright/test").Page): Promise<string> {
	return page.evaluate(() => document.documentElement.dataset.theme ?? "light");
}

test("the theme toggle flips data-theme and the token-bound background", async ({
	page,
}) => {
	await gotoStable(page, "/");

	// The behavior project boots Light.
	await expect.poll(() => htmlTheme(page)).toBe("light");
	await expect
		.poll(() => brandScopeBackground(page))
		.toBe("rgb(243, 248, 245)");

	await page.getByLabel("Switch to dark theme").click();
	await expect.poll(() => htmlTheme(page)).toBe("dark");
	await expect.poll(() => brandScopeBackground(page)).toBe("rgb(7, 17, 13)");

	await page.getByLabel("Switch to light theme").click();
	await expect.poll(() => htmlTheme(page)).toBe("light");
	await expect
		.poll(() => brandScopeBackground(page))
		.toBe("rgb(243, 248, 245)");
});
