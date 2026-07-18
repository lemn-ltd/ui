import type { ConsoleMessage, Page } from "@playwright/test";
import {
	expect,
	gotoStable,
	newDeterministicPage,
	test,
} from "../helpers/deterministic";

const EXPANDED_ROUTES = [
	["/visualizations/area-chart", "Area chart"],
	["/visualizations/bar-chart", "Bar chart"],
	["/visualizations/combo-chart", "Combo chart"],
	["/visualizations/bar-list", "Bar list"],
	["/visualizations/category-bar", "Category bar"],
	["/visualizations/donut-chart", "Donut chart"],
	["/visualizations/line-chart", "Line chart"],
	["/visualizations/progress-circle", "Progress circle"],
	["/visualizations/spark-chart", "Spark chart"],
	["/visualizations/tracker", "Tracker"],
	["/components/select-native", "Select native"],
	["/components/radio-card-group", "Radio card group"],
	["/components/toggle-group", "Toggle group"],
	["/components/slider", "Slider"],
	["/components/date-picker", "Date picker"],
	["/components/date-range-picker", "Date range picker"],
	["/components/tab-navigation", "Tab navigation"],
	["/components/separator", "Separator"],
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
	context,
}, testInfo) => {
	for (const [route, title] of EXPANDED_ROUTES) {
		await test.step(route, async () => {
			const page = await newDeterministicPage(context, testInfo.project.name);
			const errors = runtimeErrors(page);
			try {
				await gotoStable(page, route);
				expect(new URL(page.url()).pathname).toBe(route);
				await expect(page.locator(".portal-docs-page")).toBeVisible();
				await expect(
					page.getByRole("heading", { level: 1, name: title, exact: true }),
				).toBeVisible();
				await expect(page.locator(".portal-page-fallback")).toHaveCount(0);
				await expect(page.locator(".portal-route-error")).toHaveCount(0);
				expect(errors, `${route} runtime errors`).toEqual([]);
			} finally {
				await page.close();
			}
		});
	}
});

test("chart legends are keyboard-operable series controls", async ({
	page,
}) => {
	await gotoStable(page, "/visualizations/line-chart");
	const legend = page.getByRole("button", { name: "Revenue" });
	await expect(legend).toHaveAttribute("aria-pressed", "true");
	await legend.focus();
	await page.keyboard.press("Space");
	await expect(legend).toHaveAttribute("aria-pressed", "false");
	await page.keyboard.press("Enter");
	await expect(legend).toHaveAttribute("aria-pressed", "true");
});

test("Tracker preserves the provider HoverCard click lifecycle", async ({
	page,
}) => {
	await gotoStable(page, "/visualizations/tracker");
	const running = page
		.getByRole("listitem")
		.filter({ hasText: "Running: active." });
	await running.click();
	const hoverCard = page.locator(".ui-tracker-provider__tooltip");
	await expect(hoverCard).toHaveText("Executing the approved plan.");
	const hoverCardId = await hoverCard.getAttribute("id");
	expect(hoverCardId).toBeTruthy();
	await expect(running).toHaveAttribute("aria-describedby", hoverCardId ?? "");
	// Radix HoverCard remains open while either its pointer or focus lifecycle is
	// active. Leave both boundaries to assert the provider-native close behavior.
	await page.mouse.move(0, 0);
	await running.blur();
	await expect(hoverCard).toHaveCount(0);
});

test("date range selection completes by keyboard and returns focus", async ({
	page,
}) => {
	await gotoStable(page, "/components/date-range-picker");
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
	await expect(page.locator('input[name="period.start"]')).toHaveValue(
		"2026-07-10",
	);
	await expect(page.locator('input[name="period.end"]')).toHaveValue(
		"2026-07-11",
	);
});

test("Tabs own panels while TabNavigation remains URL navigation", async ({
	page,
}) => {
	await gotoStable(page, "/components/tabs");
	const tabsExample = page.locator(".portal-example").first();
	const activityTab = tabsExample.getByRole("tab", { name: /Activity/ });
	await activityTab.click();
	await expect(activityTab).toHaveAttribute("aria-selected", "true");
	await expect(
		tabsExample
			.getByRole("tabpanel")
			.filter({ hasText: "Activity panel content" }),
	).toBeVisible();

	await page.setViewportSize({ width: 375, height: 812 });
	await gotoStable(page, "/components/tab-navigation");
	const navigation = page.getByRole("navigation", { name: "Report sections" });
	await expect(
		navigation.getByRole("link", { name: /Activity/ }),
	).toHaveAttribute("aria-current", "page");
	const dimensions = await navigation.evaluate((element) => ({
		clientWidth: element.clientWidth,
		scrollWidth: element.scrollWidth,
	}));
	expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
});

test("the structured InfoBanner action and dismiss control remain interactive", async ({
	page,
}) => {
	await gotoStable(page, "/components/info-banner");
	const example = page.locator(".portal-example").first();
	await expect(example.getByRole("button", { name: "Review" })).toBeVisible();
	await example.getByRole("button", { name: "Dismiss" }).click();
	await expect(example.getByText("Scheduled sync")).toHaveCount(0);
});
