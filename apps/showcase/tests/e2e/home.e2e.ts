import { expect, gotoStable, test } from "../helpers/deterministic";

const legacyPreviewLabel = ["Live", "preview"].join(" ");
const legacyPreviewQuery = new RegExp(["pre", "view="].join(""));

function feature(page: import("@playwright/test").Page, id: string) {
	return page.locator(`[data-home-feature="${id}"]`);
}

test("the homepage is curated, live, and free of legacy preview machinery", async ({
	page,
}) => {
	await gotoStable(page, "/");

	await expect(page.locator(".showcase-home-feature")).toHaveCount(6);
	await expect(page.getByText(legacyPreviewLabel, { exact: true })).toHaveCount(
		0,
	);
	await expect(
		page.getByRole("button", { name: "Interact", exact: true }),
	).toHaveCount(0);
	await expect(page.locator("iframe, .showcase-home img")).toHaveCount(0);
	await expect(page).not.toHaveURL(legacyPreviewQuery);

	for (const card of await page.locator(".showcase-home-feature").all()) {
		await expect(
			card.getByRole("link", { name: "View components" }),
		).toHaveCount(1);
	}
});

test("every curated composition exposes a real interaction", async ({
	page,
}) => {
	await gotoStable(page, "/");

	const reporting = feature(page, "reporting");
	await reporting.getByRole("checkbox").nth(1).click();
	await expect(
		reporting.locator('.ui-data-table__row[data-selected="true"]'),
	).toHaveCount(1);

	const filters = feature(page, "filters");
	await filters
		.getByRole("searchbox", { name: "Search reports" })
		.fill("pipeline");
	await filters.getByLabel("Include archived reports").click();
	await filters.locator('[data-date="2026-07-15"]').click();
	await expect(filters).toContainText(
		"42 results for Operations through 7/15/2026.",
	);
	await filters.getByRole("button", { name: "Remove filter" }).first().click();
	await expect(filters.getByText("Updated: This month")).toHaveCount(0);

	const agents = feature(page, "agent-operations");
	await agents.getByRole("button", { name: "Advance run" }).click();
	await expect(agents.getByText("Waiting for approval")).toBeVisible();

	const data = feature(page, "data-display");
	await data.getByText("Runtime", { exact: true }).click();
	await expect(data.getByText("Europe West")).toBeVisible();
	await data.getByRole("button", { name: "Copy endpoint" }).click();
	await expect(
		data.getByText("Endpoint copied to the working set."),
	).toBeVisible();

	const feedback = feature(page, "feedback");
	await feedback.getByRole("button", { name: "Run sync" }).click();
	await expect(feedback.getByRole("progressbar")).toHaveAttribute(
		"aria-valuenow",
		"66",
	);

	const overlays = feature(page, "overlays");
	await overlays.getByRole("button", { name: "Open popover" }).click();
	await expect(
		page.getByText("Anchored context without leaving the overview."),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await overlays.getByRole("button", { name: "Open menu" }).click();
	await page.getByRole("menuitem", { name: "Duplicate" }).click();
	await expect(overlays.getByText("Report duplicated")).toBeVisible();
	await overlays.getByRole("button", { name: "Open dialog" }).click();
	await expect(
		page.getByRole("dialog", { name: "Review report access" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Confirm", exact: true }).click();
	await expect(
		page.getByRole("dialog", { name: "Review report access" }),
	).toHaveCount(0);
	await expect(
		overlays.getByText("Access confirmed", { exact: true }),
	).toBeVisible();
});

test("feature, hero, and catalog links preserve detailed routes", async ({
	page,
}) => {
	await gotoStable(page, "/");

	await feature(page, "reporting")
		.getByRole("link", { name: "View components" })
		.click();
	await expect(page).toHaveURL(/\/core\/components\/stats-strip$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Stats strip" }),
	).toBeVisible();

	await gotoStable(page, "/");
	await page.getByRole("link", { name: "Explore patterns" }).click();
	await expect(page).toHaveURL(/\/core\/patterns\/dashboard$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Dashboard" }),
	).toBeVisible();

	await gotoStable(page, "/");
	await page
		.locator(".showcase-home__catalog-grid")
		.getByRole("link", { name: /Agents/ })
		.click();
	await expect(page).toHaveURL(/\/agents\/components\//);
});

test("the bento reflows at desktop, tablet, and mobile without page overflow", async ({
	page,
}) => {
	const cases = [
		{ name: "desktop", width: 1280, height: 900, minimumColumns: 3 },
		{ name: "tablet", width: 768, height: 1024, minimumColumns: 2 },
		{ name: "mobile", width: 375, height: 812, minimumColumns: 1 },
	] as const;

	for (const viewport of cases) {
		await page.setViewportSize({
			width: viewport.width,
			height: viewport.height,
		});
		await gotoStable(page, "/");
		const receipt = await page
			.locator(".showcase-home-feature")
			.evaluateAll((cards) => ({
				columns: new Set(
					cards.map((card) => Math.round(card.getBoundingClientRect().left)),
				).size,
				count: cards.length,
				overflow:
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
			}));

		expect(receipt.count, viewport.name).toBe(6);
		expect(receipt.overflow, `${viewport.name} overflow`).toBeLessThanOrEqual(
			1,
		);
		if (viewport.name === "mobile") expect(receipt.columns).toBe(1);
		else
			expect(receipt.columns).toBeGreaterThanOrEqual(viewport.minimumColumns);
	}
});
