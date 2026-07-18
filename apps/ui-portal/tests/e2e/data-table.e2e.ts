import { expect, gotoStable, test } from "../helpers/deterministic";

test.describe("Data table", () => {
	test.beforeEach(async ({ page }) => {
		await gotoStable(page, "/components/data-table");
	});

	test("cycles a column through tri-state sort", async ({ page }) => {
		const sortButton = page.locator("button.ui-data-table__sort").first();
		await expect(sortButton).toHaveAttribute("data-sort", "unsorted");

		await sortButton.click();
		await expect(sortButton).toHaveAttribute("data-sort", "asc");

		await sortButton.click();
		await expect(sortButton).toHaveAttribute("data-sort", "desc");

		await sortButton.click();
		await expect(sortButton).toHaveAttribute("data-sort", "unsorted");
	});

	test("select-all reveals the bulk actions bar over 137 rows", async ({
		page,
	}) => {
		const table = page.locator(".ui-data-table").first();
		await expect(table.locator(".ui-data-table__bulk")).toHaveCount(0);

		await page.getByLabel("Select all rows").first().check();

		const bulk = table.locator(".ui-data-table__bulk");
		await expect(bulk).toBeVisible();
		// Select-all spans the whole dataset, not just the visible page.
		await expect(bulk.locator(".ui-data-table__bulk-count")).toHaveText(
			"137 selected",
		);
	});

	test("paginates across the 137-row dataset", async ({ page }) => {
		const range = page
			.locator(".ui-data-table__footer .ui-pagination__range")
			.first();
		await expect(range).toHaveText("1–25 of 137");

		await page.getByLabel("Next page").first().click();
		await expect(range).toHaveText("26–50 of 137");

		await page.getByLabel("Previous page").first().click();
		await expect(range).toHaveText("1–25 of 137");
	});
});
