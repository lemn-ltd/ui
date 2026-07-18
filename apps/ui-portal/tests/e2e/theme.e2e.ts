import { expect, gotoStable, test } from "../helpers/deterministic";

function htmlTheme(page: import("@playwright/test").Page): Promise<string> {
	return page.evaluate(() => document.documentElement.dataset.theme ?? "light");
}

function tokenValue(
	page: import("@playwright/test").Page,
	selector: string,
	token: string,
): Promise<string> {
	return page
		.locator(selector)
		.evaluate(
			(element, property) =>
				getComputedStyle(element).getPropertyValue(property).trim(),
			token,
		);
}

test("the theme toggle flips the document theme contract", async ({ page }) => {
	await gotoStable(page, "/");

	// The behavior project boots Light.
	await expect.poll(() => htmlTheme(page)).toBe("light");

	await page.getByLabel("Switch to dark theme").click();
	await expect.poll(() => htmlTheme(page)).toBe("dark");
	await expect(page.getByLabel("Switch to light theme")).toBeVisible();

	await page.getByLabel("Switch to light theme").click();
	await expect.poll(() => htmlTheme(page)).toBe("light");
	await expect(page.getByLabel("Switch to dark theme")).toBeVisible();
});

test("Playground presets and deep links change only the isolated preview scope", async ({
	page,
}) => {
	await gotoStable(page, "/playground?preset=verdant-ledger&theme=light");
	const preview = page.locator(".portal-brand-preview");
	await expect(preview).toHaveAttribute("data-brand-runtime-state", "ready");
	const initialScope = await preview.getAttribute("data-lemn-brand-scope");
	const chromeAccent = await tokenValue(
		page,
		".ui-screen-shell",
		"--lemn-color-accent",
	);
	const previewAccent = await tokenValue(
		page,
		".portal-brand-preview",
		"--lemn-color-accent",
	);

	await page.getByLabel("System branding preset").selectOption("aster-vault");
	await expect
		.poll(() => preview.getAttribute("data-lemn-brand-scope"))
		.not.toBe(initialScope);
	await expect
		.poll(() =>
			tokenValue(page, ".portal-brand-preview", "--lemn-color-accent"),
		)
		.not.toBe(previewAccent);
	expect(
		await tokenValue(page, ".ui-screen-shell", "--lemn-color-accent"),
	).toBe(chromeAccent);
	await expect(page).toHaveURL(/preset=aster-vault&theme=light$/u);

	await page.goBack();
	await expect(page).toHaveURL(/preset=verdant-ledger&theme=light$/u);
	await expect(page.getByLabel("System branding preset")).toHaveValue(
		"verdant-ledger",
	);
	await expect
		.poll(() =>
			tokenValue(page, ".portal-brand-preview", "--lemn-color-accent"),
		)
		.toBe(previewAccent);

	await page.goForward();
	await expect(page).toHaveURL(/preset=aster-vault&theme=light$/u);
	await expect(page.getByLabel("System branding preset")).toHaveValue(
		"aster-vault",
	);
	await expect
		.poll(() =>
			tokenValue(page, ".portal-brand-preview", "--lemn-color-accent"),
		)
		.not.toBe(previewAccent);

	await gotoStable(page, "/playground?preset=tideglass&theme=dark");
	await expect(page.getByLabel("System branding preset")).toHaveValue(
		"tideglass",
	);
	await expect.poll(() => htmlTheme(page)).toBe("dark");
	await expect(preview).toHaveAttribute("data-brand-runtime-state", "ready");
});
