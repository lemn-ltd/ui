import { expect, gotoStable, test } from "../helpers/deterministic";

function bodyBackground(
	page: import("@playwright/test").Page,
): Promise<string> {
	return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
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
	await expect.poll(() => bodyBackground(page)).toBe("rgb(255, 255, 255)");

	await page.getByLabel("Switch to dark theme").click();
	await expect.poll(() => htmlTheme(page)).toBe("dark");
	await expect
		.poll(() => bodyBackground(page))
		.toBe("oklch(0.13 0.028 261.692)");

	await page.getByLabel("Switch to light theme").click();
	await expect.poll(() => htmlTheme(page)).toBe("light");
	await expect.poll(() => bodyBackground(page)).toBe("rgb(255, 255, 255)");
});
