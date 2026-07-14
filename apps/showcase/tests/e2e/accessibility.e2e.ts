import AxeBuilder from "@axe-core/playwright";
import { componentRoutesFromCatalog } from "../helpers/component-catalog";
import { expect, gotoStable, test } from "../helpers/deterministic";

test("no critical accessibility violations across non-component registry pages", async ({
	page,
}) => {
	test.setTimeout(900_000);

	await gotoStable(page, "/");
	const hrefs = await page
		.locator('.showcase-home a[href^="/"]')
		.evaluateAll((els) => [
			...new Set(
				els
					.map((el) => (el as HTMLAnchorElement).getAttribute("href"))
					.filter((href): href is string => Boolean(href)),
			),
		]);

	const routes = [
		"/",
		...hrefs.filter(
			(route) =>
				!route.startsWith("/core/components/") &&
				!route.startsWith("/agents/components/"),
		),
	];
	const offenders: string[] = [];

	for (const route of routes) {
		await gotoStable(page, route);
		const results = await new AxeBuilder({ page }).analyze();
		const critical = results.violations.filter(
			(violation) => violation.impact === "critical",
		);
		if (critical.length > 0) {
			offenders.push(
				`${route}: ${critical.map((violation) => violation.id).join(", ")}`,
			);
		}
	}

	expect(offenders, offenders.join(" | ")).toEqual([]);
});

test("every component page has no critical Axe violations in Light or Dark", async ({
	page,
}) => {
	test.setTimeout(900_000);
	const routes = await componentRoutesFromCatalog(page);
	const offenders: string[] = [];

	for (const entry of routes) {
		await gotoStable(page, entry.route);
		for (const theme of ["light", "dark"] as const) {
			if (theme === "dark") {
				await page.getByLabel("Switch to dark theme").click();
				await expect(page.locator("html")).toHaveAttribute(
					"data-theme",
					"dark",
				);
			}
			const results = await new AxeBuilder({ page }).analyze();
			const critical = results.violations.filter(
				(violation) => violation.impact === "critical",
			);
			if (critical.length > 0) {
				offenders.push(
					`${entry.route} (${theme}): ${critical.map((violation) => violation.id).join(", ")}`,
				);
			}
		}
	}

	expect(offenders, offenders.join(" | ")).toEqual([]);
});

test("the homepage dialog preserves accessible modal behavior", async ({
	page,
}) => {
	await gotoStable(page, "/");
	await page
		.locator('[data-home-feature="overlays"]')
		.getByRole("button", { name: "Open dialog" })
		.click();
	await expect(
		page.getByRole("dialog", { name: "Review report access" }),
	).toBeVisible();

	const results = await new AxeBuilder({ page }).analyze();
	const critical = results.violations.filter(
		(violation) => violation.impact === "critical",
	);
	expect(
		critical.map((violation) => violation.id),
		critical
			.map((violation) => `${violation.id}: ${violation.help}`)
			.join(" | "),
	).toEqual([]);
});
