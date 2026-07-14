import AxeBuilder from "@axe-core/playwright";
import type { Browser, TestInfo } from "@playwright/test";
import { componentRoutesFromCatalog } from "../helpers/component-catalog";
import {
	expect,
	gotoStable,
	newIsolatedDeterministicPage,
	type Theme,
	test,
} from "../helpers/deterministic";

async function newAccessibilityPage(
	browser: Browser,
	testInfo: TestInfo,
	theme: Theme,
) {
	const baseURL = testInfo.project.use.baseURL;
	if (typeof baseURL !== "string") {
		throw new Error("accessibility isolation requires a Playwright baseURL");
	}
	return newIsolatedDeterministicPage(browser, {
		baseURL,
		projectName: testInfo.project.name,
		theme,
		viewport: testInfo.project.use.viewport,
	});
}

test("no critical accessibility violations across non-component registry pages", async ({
	browser,
}, testInfo) => {
	test.setTimeout(900_000);

	const { context: catalogContext, page: catalogPage } =
		await newAccessibilityPage(browser, testInfo, "light");
	let hrefs: string[];
	try {
		await gotoStable(catalogPage, "/");
		hrefs = await catalogPage
			.locator('.showcase-home a[href^="/"]')
			.evaluateAll((els) => [
				...new Set(
					els
						.map((el) => (el as HTMLAnchorElement).getAttribute("href"))
						.filter((href): href is string => Boolean(href)),
				),
			]);
	} finally {
		await catalogContext.close();
	}

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
		await test.step(route, async () => {
			const { context, page } = await newAccessibilityPage(
				browser,
				testInfo,
				"light",
			);
			try {
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
			} finally {
				await context.close();
			}
		});
	}

	expect(offenders, offenders.join(" | ")).toEqual([]);
});

test("every component page has no critical Axe violations in Light or Dark", async ({
	browser,
}, testInfo) => {
	test.setTimeout(900_000);
	const { context: catalogContext, page: catalogPage } =
		await newAccessibilityPage(browser, testInfo, "light");
	let routes: Awaited<ReturnType<typeof componentRoutesFromCatalog>>;
	try {
		routes = await componentRoutesFromCatalog(catalogPage);
	} finally {
		await catalogContext.close();
	}
	const offenders: string[] = [];

	for (const entry of routes) {
		for (const theme of ["light", "dark"] as const) {
			await test.step(`${entry.route} (${theme})`, async () => {
				const { context, page } = await newAccessibilityPage(
					browser,
					testInfo,
					theme,
				);
				try {
					await gotoStable(page, entry.route);
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme",
						theme,
					);
					const results = await new AxeBuilder({ page }).analyze();
					const critical = results.violations.filter(
						(violation) => violation.impact === "critical",
					);
					if (critical.length > 0) {
						offenders.push(
							`${entry.route} (${theme}): ${critical.map((violation) => violation.id).join(", ")}`,
						);
					}
				} finally {
					await context.close();
				}
			});
		}
	}

	expect(offenders, offenders.join(" | ")).toEqual([]);
});

test("accessibility contexts do not inherit route or theme state", async ({
	browser,
}, testInfo) => {
	const marker = "showcase-accessibility-isolation-probe";
	const first = await newAccessibilityPage(browser, testInfo, "dark");
	try {
		await gotoStable(first.page, "/");
		await first.page.evaluate((key) => {
			window.localStorage.setItem(key, "leaked");
		}, marker);
		await first.context.addCookies([
			{ name: marker, url: first.page.url(), value: "leaked" },
		]);
	} finally {
		await first.context.close();
	}

	const second = await newAccessibilityPage(browser, testInfo, "light");
	try {
		await gotoStable(second.page, "/");
		await expect(second.page.locator("html")).toHaveAttribute(
			"data-theme",
			"light",
		);
		expect(await second.context.cookies()).toEqual([]);
		expect(
			await second.page.evaluate(
				(key) => window.localStorage.getItem(key),
				marker,
			),
		).toBeNull();
	} finally {
		await second.context.close();
	}
});

test("the homepage dialog preserves accessible modal behavior", async ({
	browser,
}, testInfo) => {
	const { context, page } = await newAccessibilityPage(
		browser,
		testInfo,
		"light",
	);
	try {
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
	} finally {
		await context.close();
	}
});
