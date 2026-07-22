import AxeBuilder from "@axe-core/playwright";
import type { Browser, Page, TestInfo } from "@playwright/test";
import {
	componentAccessibilityCases,
	componentAccessibilityTestTitle,
	componentRoutesFromCatalog,
} from "../helpers/component-catalog";
import {
	expect,
	gotoReady,
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

async function criticalAxeViolations(page: Page) {
	const results = await new AxeBuilder({ page }).analyze();
	return results.violations.filter(
		(violation) => violation.impact === "critical",
	);
}

test.describe("non-component registry accessibility", () => {
	test.describe.configure({ timeout: 180_000 });

	test("no critical accessibility violations across non-component registry pages", async ({
		browser,
	}, testInfo) => {
		const { context: catalogContext, page: catalogPage } =
			await newAccessibilityPage(browser, testInfo, "light");
		let hrefs: string[];
		try {
			await gotoReady(catalogPage, "/");
			hrefs = await catalogPage
				.locator('.portal-home a[href^="/"]')
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
					!route.startsWith("/components/") &&
					!route.startsWith("/visualizations/"),
			),
		];
		const offenders: string[] = [];

		for (const route of routes) {
			await test.step(route, async () => {
				console.log(`[accessibility] route=${route} theme=light`);
				const { context, page } = await newAccessibilityPage(
					browser,
					testInfo,
					"light",
				);
				try {
					await gotoReady(page, route);
					const critical = await criticalAxeViolations(page);
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
});

test("component accessibility inventory matches the runtime catalog", async ({
	browser,
}, testInfo) => {
	const { context, page } = await newAccessibilityPage(
		browser,
		testInfo,
		"light",
	);
	try {
		await componentRoutesFromCatalog(page);
	} finally {
		await context.close();
	}
});

test.describe("component catalog accessibility", () => {
	test.describe.configure({ timeout: 60_000 });

	for (const accessibilityCase of componentAccessibilityCases) {
		test(
			componentAccessibilityTestTitle(accessibilityCase),
			async ({ browser }, testInfo) => {
				const { route, theme } = accessibilityCase;
				console.log(`[accessibility] route=${route} theme=${theme}`);
				const { context, page } = await newAccessibilityPage(
					browser,
					testInfo,
					theme,
				);
				try {
					await gotoReady(page, route);
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme",
						theme,
					);
					const critical = await criticalAxeViolations(page);
					expect(
						critical.map((violation) => violation.id),
						critical
							.map(
								(violation) =>
									`${route} (${theme}): ${violation.id}: ${violation.help}`,
							)
							.join(" | "),
					).toEqual([]);
				} finally {
					await context.close();
				}
			},
		);
	}
});

test("accessibility contexts do not inherit route or theme state", async ({
	browser,
}, testInfo) => {
	const marker = "portal-accessibility-isolation-probe";
	const first = await newAccessibilityPage(browser, testInfo, "dark");
	try {
		await gotoReady(first.page, "/");
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
		await gotoReady(second.page, "/");
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
		await gotoReady(page, "/");
		await page
			.locator('[data-home-feature="overlays"]')
			.getByRole("button", { name: "Open dialog" })
			.click();
		await expect(
			page.getByRole("dialog", { name: "Review report access" }),
		).toBeVisible();

		const critical = await criticalAxeViolations(page);
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
