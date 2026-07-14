import { expect, gotoStable, test } from "../helpers/deterministic";

test("info banner showcase fixture preserves the reviewed structured example", async ({
	page,
}) => {
	await gotoStable(page, "/core/components/info-banner");
	const banner = page.locator(".ui-info-banner").first();
	await expect(
		banner.getByText("Scheduled sync", { exact: true }),
	).toBeVisible();
	await expect(banner.getByRole("button", { name: "Review" })).toBeVisible();
	await expect(banner.getByRole("button", { name: "Dismiss" })).toBeVisible();
});

test("feedback component pages expose canonical visual error primitives", async ({
	page,
}) => {
	await gotoStable(page, "/core/components/info-banner");
	await expect(
		page.getByRole("heading", { level: 1, name: "Info banner" }),
	).toBeVisible();
	for (const variant of ["info", "warn", "danger", "success"]) {
		await expect(
			page.getByText(variant, { exact: true }).first(),
		).toBeVisible();
	}

	await gotoStable(page, "/core/components/system-bar");
	await expect(
		page.getByRole("heading", { level: 1, name: "System bar" }),
	).toBeVisible();
	for (const tone of ["info", "warn", "danger"]) {
		await expect(page.getByText(tone, { exact: true }).first()).toBeVisible();
	}
});
