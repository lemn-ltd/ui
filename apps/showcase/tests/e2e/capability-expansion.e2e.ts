import type { ConsoleMessage, Page } from "@playwright/test";
import { expect, gotoStable, test } from "../helpers/deterministic";

const EXPANDED_ROUTES = [
	"area-chart",
	"bar-chart",
	"combo-chart",
	"bar-list",
	"category-bar",
	"donut-chart",
	"line-chart",
	"progress-circle",
	"spark-chart",
	"tracker",
	"select-native",
	"radio-card-group",
	"toggle-group",
	"slider",
	"date-picker",
	"date-range-picker",
	"tab-navigation",
	"separator",
] as const;

function runtimeErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("console", (message: ConsoleMessage) => {
		if (message.type() === "error") errors.push(message.text());
	});
	page.on("pageerror", (error) => errors.push(error.message));
	return errors;
}

test("all expanded component routes render without runtime errors", async ({
	page,
}) => {
	const errors = runtimeErrors(page);
	for (const slug of EXPANDED_ROUTES) {
		await gotoStable(page, `/core/components/${slug}`);
		await expect(page.locator(".showcase-docs-page")).toBeVisible();
	}
	expect(errors).toEqual([]);
});

test("chart legends are keyboard-operable series controls", async ({ page }) => {
	await gotoStable(page, "/core/components/line-chart");
	const legend = page.getByRole("button", { name: "Revenue" });
	await expect(legend).toHaveAttribute("aria-pressed", "true");
	await legend.focus();
	await page.keyboard.press("Space");
	await expect(legend).toHaveAttribute("aria-pressed", "false");
	await page.keyboard.press("Enter");
	await expect(legend).toHaveAttribute("aria-pressed", "true");
});

test("date range selection completes by keyboard and returns focus", async ({
	page,
}) => {
	await gotoStable(page, "/core/components/date-range-picker");
	const trigger = page.getByRole("button", { name: "Reporting period" });
	await trigger.click();

	const start = page.locator('[data-date="2026-07-10"]');
	await start.focus();
	await page.keyboard.press("ArrowRight");
	await expect(page.locator('[data-date="2026-07-11"]')).toBeFocused();
	await page.keyboard.press("Enter");

	await expect(page.getByRole("grid")).toHaveCount(0);
	await expect(trigger).toBeFocused();
	await expect(trigger).toContainText("Jul 10, 2026 – Jul 11, 2026");
	await expect(page.locator('input[name="period.start"]')).toHaveValue("2026-07-10");
	await expect(page.locator('input[name="period.end"]')).toHaveValue("2026-07-11");
});

test("Tabs own panels while TabNavigation remains URL navigation", async ({
	page,
}) => {
	await gotoStable(page, "/core/components/tabs");
	const tabsExample = page.locator(".showcase-example").first();
	const activityTab = tabsExample.getByRole("tab", { name: /Activity/ });
	await activityTab.click();
	await expect(activityTab).toHaveAttribute("aria-selected", "true");
	await expect(
		tabsExample.getByRole("tabpanel").filter({ hasText: "Activity panel content" }),
	).toBeVisible();

	await page.setViewportSize({ width: 375, height: 812 });
	await gotoStable(page, "/core/components/tab-navigation");
	const navigation = page.getByRole("navigation", { name: "Report sections" });
	await expect(navigation.getByRole("link", { name: /Activity/ })).toHaveAttribute(
		"aria-current",
		"page",
	);
	const dimensions = await navigation.evaluate((element) => ({
		clientWidth: element.clientWidth,
		scrollWidth: element.scrollWidth,
	}));
	expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
});

test("the structured InfoBanner action and dismiss control remain interactive", async ({
	page,
}) => {
	await gotoStable(page, "/core/components/info-banner");
	const example = page.locator(".showcase-example").first();
	await expect(example.getByRole("button", { name: "Review" })).toBeVisible();
	await example.getByRole("button", { name: "Dismiss" }).click();
	await expect(example.getByText("Scheduled sync")).toHaveCount(0);
});
