import type { ConsoleMessage, Page } from "@playwright/test";
import {
	expect,
	gotoStable,
	newDeterministicPage,
	test,
} from "../helpers/deterministic";

const EXPANDED_ROUTES = [
	["area-chart", "Area chart"],
	["bar-chart", "Bar chart"],
	["combo-chart", "Combo chart"],
	["bar-list", "Bar list"],
	["category-bar", "Category bar"],
	["donut-chart", "Donut chart"],
	["line-chart", "Line chart"],
	["progress-circle", "Progress circle"],
	["spark-chart", "Spark chart"],
	["tracker", "Tracker"],
	["select-native", "Select native"],
	["radio-card-group", "Radio card group"],
	["toggle-group", "Toggle group"],
	["slider", "Slider"],
	["date-picker", "Date picker"],
	["date-range-picker", "Date range picker"],
	["tab-navigation", "Tab navigation"],
	["separator", "Separator"],
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
	for (const [slug, title] of EXPANDED_ROUTES) {
		const route = `/core/components/${slug}`;
		await test.step(route, async () => {
			const page = await newDeterministicPage(context, testInfo.project.name);
			const errors = runtimeErrors(page);
			try {
				await gotoStable(page, route);
				expect(new URL(page.url()).pathname).toBe(route);
				await expect(page.locator(".showcase-docs-page")).toBeVisible();
				await expect(
					page.getByRole("heading", { level: 1, name: title, exact: true }),
				).toBeVisible();
				await expect(page.locator(".showcase-page-fallback")).toHaveCount(0);
				await expect(page.locator(".showcase-route-error")).toHaveCount(0);
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
	await gotoStable(page, "/core/components/line-chart");
	const legend = page.getByRole("button", { name: "Revenue" });
	await expect(legend).toHaveAttribute("aria-pressed", "true");
	await legend.focus();
	await page.keyboard.press("Space");
	await expect(legend).toHaveAttribute("aria-pressed", "false");
	await page.keyboard.press("Enter");
	await expect(legend).toHaveAttribute("aria-pressed", "true");
});

test("Tracker preserves the provider HoverCard click lifecycle", async ({ page }) => {
	await gotoStable(page, "/core/components/tracker");
	const running = page.getByRole("listitem").filter({ hasText: "Running: active." });
	await running.click();
	const hoverCard = page.locator(".ui-tracker-provider__tooltip");
	await expect(hoverCard).toHaveText("Executing the approved plan.");
	const hoverCardId = await hoverCard.getAttribute("id");
	expect(hoverCardId).toBeTruthy();
	await expect(running).toHaveAttribute("aria-describedby", hoverCardId ?? "");
	await page.keyboard.press("Escape");
	await expect(hoverCard).toHaveCount(0);
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
	await gotoStable(page, "/core/components/tabs");
	const tabsExample = page.locator(".showcase-example").first();
	const activityTab = tabsExample.getByRole("tab", { name: /Activity/ });
	await activityTab.click();
	await expect(activityTab).toHaveAttribute("aria-selected", "true");
	await expect(
		tabsExample
			.getByRole("tabpanel")
			.filter({ hasText: "Activity panel content" }),
	).toBeVisible();

	await page.setViewportSize({ width: 375, height: 812 });
	await gotoStable(page, "/core/components/tab-navigation");
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
	await gotoStable(page, "/core/components/info-banner");
	const example = page.locator(".showcase-example").first();
	await expect(example.getByRole("button", { name: "Review" })).toBeVisible();
	await example.getByRole("button", { name: "Dismiss" }).click();
	await expect(example.getByText("Scheduled sync")).toHaveCount(0);
});
