import { expect, gotoStable, test } from "../helpers/deterministic";

test("checkbox reference page exposes its real examples and consumer guidance", async ({
	page,
}) => {
	await gotoStable(page, "/core/components/checkbox");

	await expect(
		page.getByRole("heading", { level: 1, name: "Checkbox" }),
	).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Installation" }),
	).toBeVisible();
	await expect(page.getByText("pnpm add @lemn-ltd/ui")).toBeVisible();

	const examples = page.locator(".showcase-example");
	await expect(examples).toHaveCount(3);
	const hero = examples
		.nth(0)
		.getByRole("checkbox", { name: "Enable notifications" });
	await expect(hero).toHaveAttribute("data-state", "unchecked");
	await hero.click();
	await expect(hero).toHaveAttribute("data-state", "checked");

	await examples.nth(0).getByRole("tab", { name: "Code" }).click();
	await expect(examples.nth(0)).toContainText(
		"import { Checkbox } from '@lemn-ltd/ui';",
	);
	await examples.nth(0).getByRole("button", { name: "Copy code" }).click();
	await expect(
		examples.nth(0).getByRole("button", { name: "Copied" }),
	).toBeVisible();

	const defaultChecked = page.locator("#sms-updates-default");
	await expect(defaultChecked).toHaveAttribute("data-state", "checked");
	await page.locator('label[for="sms-updates-default"]').click();
	await expect(defaultChecked).toHaveAttribute("data-state", "unchecked");

	const indeterminate = page.locator("#select-all-rows");
	await expect(indeterminate).toHaveAttribute("data-state", "indeterminate");
	await page.locator('label[for="select-all-rows"]').click();
	await expect(indeterminate).toHaveAttribute("data-state", "checked");

	await expect(
		page.getByRole("heading", { name: "API Reference: Checkbox" }),
	).toBeVisible();
	await expect(page.getByRole("table")).toBeVisible();
	await expect(
		page.getByRole("rowheader", { exact: true, name: "checked" }),
	).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "Controlled checked state." }),
	).toBeVisible();
	await expect(
		page.getByText("© 2026 LEMN. All rights reserved."),
	).toBeVisible();
});

test("a first showcase visit defaults to light", async ({
	browser,
}, testInfo) => {
	const baseURL = String(
		testInfo.project.use.baseURL ?? "http://localhost:6500",
	);
	const context = await browser.newContext({ baseURL, colorScheme: "dark" });
	const page = await context.newPage();

	await page.goto("/core/components/checkbox");
	await page.locator(".showcase-docs-page").waitFor();

	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	expect(await page.evaluate(() => localStorage.getItem("color-theme"))).toBe(
		"light",
	);

	await context.close();
});
