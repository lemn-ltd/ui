import { componentRoutesFromCatalog } from "../helpers/component-catalog";
import {
	expect,
	gotoStable,
	newDeterministicPage,
	test,
} from "../helpers/deterministic";

test("every catalog and homepage documentation link resolves to a rendered page", async ({
	page: homePage,
	context,
}, testInfo) => {
	test.setTimeout(900_000);
	await gotoStable(homePage, "/");

	const homepageHrefs = await homePage
		.locator('.showcase-home a[href^="/"]')
		.evaluateAll((els) => [
			...new Set(
				els
					.map((el) => (el as HTMLAnchorElement).getAttribute("href"))
					.filter((href): href is string => Boolean(href)),
			),
		]);
	expect(homepageHrefs.length).toBeGreaterThanOrEqual(12);

	const catalogRoutes = await componentRoutesFromCatalog(homePage);
	const hrefs = [
		...new Set([
			...homepageHrefs,
			...catalogRoutes.map((entry) => entry.route),
		]),
	];
	expect(hrefs.length).toBeGreaterThanOrEqual(112);
	await homePage.close();

	const broken: string[] = [];
	for (const href of hrefs) {
		await test.step(href, async () => {
			const page = await newDeterministicPage(context, testInfo.project.name);
			const errors: string[] = [];
			const onError = (error: Error): void => {
				errors.push(error.message);
			};
			page.on("pageerror", onError);
			try {
				await gotoStable(page, href);
				const notFound = await page.locator(".showcase-not-found").count();
				const content = await page.locator(".ui-content-layout").count();

				if (notFound > 0 || content === 0 || errors.length > 0) {
					const reasons = [
						notFound > 0 ? "not-found" : "",
						content === 0 ? "no content-layout" : "",
						errors.length > 0 ? `error: ${errors[0]}` : "",
					]
						.filter(Boolean)
						.join(", ");
					broken.push(`${href} (${reasons})`);
				}
			} finally {
				page.off("pageerror", onError);
				await page.close();
			}
		});
	}

	expect(broken, `failed routes: ${broken.join(" | ")}`).toEqual([]);
});

test("a deep link restores the target component page", async ({ page }) => {
	await gotoStable(page, "/core/components/data-table");
	await expect(
		page.getByRole("heading", { level: 1, name: "Data table" }),
	).toBeVisible();
});

test("the module switcher scopes sidebar navigation", async ({ page }) => {
	await gotoStable(page, "/core/components/button");

	await page.locator(".ui-org-switcher").click();
	await page.getByRole("menuitem", { name: /Agents/ }).click();

	await expect(page).toHaveURL(/\/agents\/components\/agent-activity-line$/);
	const sidebar = page.locator(".ui-sidebar");
	await expect(sidebar.getByText("Agent activity line")).toBeVisible();
	await expect(sidebar.getByText("Agent session")).toBeVisible();
	await expect(sidebar.getByText("Button")).toHaveCount(0);

	await page.locator(".ui-org-switcher").click();
	await page.getByRole("menuitem", { name: /Core/ }).click();

	await expect(page).toHaveURL(/\/core\/foundations\/colors$/);
	await expect(sidebar.getByText("Colors")).toBeVisible();
	await expect(sidebar.getByText("Agent activity line")).toHaveCount(0);
});

test("route readiness rejects false operational surfaces", async ({ page }) => {
	const missingRoute = "/core/components/does-not-exist";
	await expect(gotoStable(page, missingRoute)).rejects.toThrow(
		/expected operational surface but rendered not-found/u,
	);
	await gotoStable(page, missingRoute, { expectedSurface: "not-found" });
	await expect(page.locator(".showcase-not-found")).toBeVisible();

	await page.route("**/synthetic-document-404", async (route) => {
		await route.fulfill({
			body: '<main class="ui-content-layout">False operational surface</main>',
			contentType: "text/html",
			status: 404,
		});
	});
	await expect(gotoStable(page, "/synthetic-document-404")).rejects.toThrow(
		/404 GET .*synthetic-document-404/u,
	);
	await page.unroute("**/synthetic-document-404");

	await page.route("**/synthetic-subresource.js", async (route) => {
		await route.fulfill({
			body: "throw new Error('should not execute')",
			contentType: "text/javascript",
			status: 404,
		});
	});
	await page.route("**/synthetic-subresource-404", async (route) => {
		await route.fulfill({
			body: [
				'<main class="ui-content-layout">False operational surface</main>',
				'<script src="/synthetic-subresource.js"></script>',
			].join(""),
			contentType: "text/html",
			status: 200,
		});
	});
	await expect(gotoStable(page, "/synthetic-subresource-404")).rejects.toThrow(
		/404 GET .*synthetic-subresource\.js/u,
	);
	await page.unroute("**/synthetic-subresource-404");
	await page.unroute("**/synthetic-subresource.js");

	await page.route("**/synthetic-failed.js", async (route) => {
		await route.abort("failed");
	});
	await page.route("**/synthetic-request-failure", async (route) => {
		await route.fulfill({
			body: [
				'<main class="ui-content-layout">False operational surface</main>',
				'<script src="/synthetic-failed.js"></script>',
			].join(""),
			contentType: "text/html",
			status: 200,
		});
	});
	await expect(gotoStable(page, "/synthetic-request-failure")).rejects.toThrow(
		/GET .*synthetic-failed\.js \(net::ERR_FAILED\)/u,
	);
	await page.unroute("**/synthetic-request-failure");
	await page.unroute("**/synthetic-failed.js");

	await page.route("**/synthetic-browser-errors", async (route) => {
		await route.fulfill({
			body: [
				'<main class="ui-content-layout">False operational surface</main>',
				"<script>",
				"console.error('synthetic console failure');",
				"setTimeout(() => { throw new Error('synthetic page failure'); }, 0);",
				"</script>",
			].join(""),
			contentType: "text/html",
			status: 200,
		});
	});
	await expect(gotoStable(page, "/synthetic-browser-errors")).rejects.toThrow(
		/synthetic page failure.*synthetic console failure|synthetic console failure.*synthetic page failure/su,
	);
	await page.unroute("**/synthetic-browser-errors");

	await gotoStable(page, "/");
	await page.setViewportSize({ width: 375, height: 812 });
	await page.locator("#root").evaluate((root) => {
		root.innerHTML = [
			'<section class="showcase-route-error" role="alert">',
			"<h1>Page unavailable</h1>",
			"<p>The showcase could not render this route.</p>",
			`<p class="showcase-route-error__detail">RouteImportError:${"unbroken".repeat(32)}</p>`,
			'<button type="button">Reload page</button>',
			"</section>",
		].join("");
	});
	const errorSurface = page.locator(".showcase-route-error");
	const dimensions = await errorSurface.evaluate((element) => ({
		clientWidth: element.clientWidth,
		documentClientWidth: document.documentElement.clientWidth,
		documentScrollWidth: document.documentElement.scrollWidth,
		scrollWidth: element.scrollWidth,
	}));
	expect(dimensions.clientWidth).toBeGreaterThanOrEqual(dimensions.scrollWidth);
	expect(dimensions.documentClientWidth).toBeGreaterThanOrEqual(
		dimensions.documentScrollWidth,
	);
});
