import { componentRoutesFromCatalog } from "../helpers/component-catalog";
import {
	expect,
	gotoStable,
	newDeterministicPage,
	routeDiagnosticLifecycle,
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

	let successfulChunkReleasedAt = 0;
	await page.route("**/button.page.*", async (route) => {
		await new Promise<void>((resolve) => setTimeout(resolve, 500));
		successfulChunkReleasedAt = Date.now();
		await route.continue();
	});
	const successfulNavigation = gotoStable(
		page,
		"/core/components/button?embed=playground",
	).then(() => Date.now());
	await expect
		.poll(() => successfulChunkReleasedAt, {
			message: "the delayed lazy chunk should be requested",
		})
		.toBeGreaterThan(0);
	const successfulNavigationResolvedAt = await successfulNavigation;
	expect(successfulNavigationResolvedAt).toBeGreaterThanOrEqual(
		successfulChunkReleasedAt,
	);
	await expect(
		page.getByRole("button", { name: "Save changes" }),
	).toBeVisible();
	await page.unroute("**/button.page.*");

	let failedChunkReleasedAt = 0;
	await page.route("**/badge.page.*", async (route) => {
		await new Promise<void>((resolve) => setTimeout(resolve, 500));
		failedChunkReleasedAt = Date.now();
		await route.abort("failed");
	});
	const failedNavigation = gotoStable(
		page,
		"/core/components/badge?embed=playground",
	).then(
		() => ({ resolvedAt: Date.now(), error: undefined }),
		(error: unknown) => ({ resolvedAt: Date.now(), error }),
	);
	await expect
		.poll(() => failedChunkReleasedAt, {
			message: "the failing lazy chunk should be requested",
		})
		.toBeGreaterThan(0);
	const failedOutcome = await failedNavigation;
	expect(failedOutcome.resolvedAt).toBeGreaterThanOrEqual(
		failedChunkReleasedAt,
	);
	expect(failedOutcome.error).toBeInstanceOf(Error);
	expect((failedOutcome.error as Error).message).toMatch(
		/GET .*badge\.page\..* \(net::ERR_FAILED\)/u,
	);
	await page.unroute("**/badge.page.*");

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

test("route diagnostics reject failures emitted 500ms after operational DOM", async ({
	context,
}, testInfo) => {
	interface ProbeResource {
		readonly abort?: boolean;
		readonly body?: string;
		readonly path: string;
		readonly status?: number;
	}
	interface LateFailureProbe {
		readonly expected: readonly RegExp[];
		readonly name: string;
		readonly path: string;
		readonly resources?: readonly ProbeResource[];
		readonly script: string;
	}

	const delay = 500;
	const probes: readonly LateFailureProbe[] = [
		{
			expected: [
				/GET .*synthetic-late-abort \(net::ERR_FAILED\)/u,
				/500 GET .*synthetic-late-http-500/u,
			],
			name: "late failed request and response",
			path: "/synthetic-late-request",
			resources: [
				{ abort: true, path: "/synthetic-late-abort" },
				{
					body: "synthetic late server failure",
					path: "/synthetic-late-http-500",
					status: 500,
				},
			],
			script: `setTimeout(() => {
				void fetch("/synthetic-late-abort").catch(() => {});
				void fetch("/synthetic-late-http-500").catch(() => {});
			}, ${delay});`,
		},
		{
			expected: [/synthetic late console failure/u],
			name: "late console error",
			path: "/synthetic-late-console",
			script: `setTimeout(() => console.error("synthetic late console failure"), ${delay});`,
		},
		{
			expected: [/synthetic late page failure/u],
			name: "late page error",
			path: "/synthetic-late-pageerror",
			script: `setTimeout(() => { throw new Error("synthetic late page failure"); }, ${delay});`,
		},
		{
			expected: [/synthetic late lazy failure/u],
			name: "late lazy module failure",
			path: "/synthetic-late-lazy",
			resources: [
				{
					body: 'throw new Error("synthetic late lazy failure");',
					path: "/synthetic-late-lazy-module.js",
				},
			],
			script: `setTimeout(() => {
				const lazyModule = document.createElement("script");
				lazyModule.type = "module";
				lazyModule.src = "/synthetic-late-lazy-module.js";
				document.body.append(lazyModule);
			}, ${delay});`,
		},
	];

	for (const probe of probes) {
		await test.step(probe.name, async () => {
			const page = await newDeterministicPage(context, testInfo.project.name);
			const lifecycleBefore = routeDiagnosticLifecycle(page);
			try {
				for (const resource of probe.resources ?? []) {
					await page.route(`**${resource.path}`, async (route) => {
						if (resource.abort) {
							await route.abort("failed");
							return;
						}
						await route.fulfill({
							body: resource.body ?? "",
							contentType: "text/javascript",
							status: resource.status ?? 200,
						});
					});
				}
				await page.route(`**${probe.path}`, async (route) => {
					await route.fulfill({
						body: [
							'<main class="ui-content-layout">Operational before delayed work</main>',
							`<script>${probe.script}</script>`,
						].join(""),
						contentType: "text/html",
						status: 200,
					});
				});

				const startedAt = Date.now();
				let rejectedAt = 0;
				const navigation = gotoStable(page, probe.path).catch(
					(error: unknown) => {
						rejectedAt = Date.now();
						throw error;
					},
				);
				for (const expected of probe.expected) {
					await expect(navigation).rejects.toThrow(expected);
				}
				expect(rejectedAt - startedAt).toBeGreaterThanOrEqual(delay);
				expect(rejectedAt - startedAt).toBeLessThan(delay + 1_000);

				expect(routeDiagnosticLifecycle(page)).toEqual({
					activeWindowCount: 0,
					listenerSetCount: 1,
					pendingWaiterCount: 0,
					retainedFailureCount: 0,
				});
				await gotoStable(page, "/");
				expect(routeDiagnosticLifecycle(page)).toEqual({
					activeWindowCount: 0,
					listenerSetCount: 1,
					pendingWaiterCount: 0,
					retainedFailureCount: 0,
				});
			} finally {
				await page.close();
				expect(routeDiagnosticLifecycle(page)).toEqual(lifecycleBefore);
			}
		});
	}
});

test("route diagnostic listeners retain failures between stable windows until close", async ({
	context,
}, testInfo) => {
	const page = await newDeterministicPage(context, testInfo.project.name);
	try {
		await page.route("**/synthetic-diagnostics-idle", async (route) => {
			await route.fulfill({
				body: '<main class="ui-content-layout">Stable diagnostics window</main>',
				contentType: "text/html",
				status: 200,
			});
		});
		await gotoStable(page, "/synthetic-diagnostics-idle");
		expect(routeDiagnosticLifecycle(page)).toEqual({
			activeWindowCount: 0,
			listenerSetCount: 1,
			pendingWaiterCount: 0,
			retainedFailureCount: 0,
		});

		await page.evaluate(() => {
			console.error("synthetic failure between stable windows");
		});
		expect(routeDiagnosticLifecycle(page).retainedFailureCount).toBe(1);
		await expect(gotoStable(page, "/")).rejects.toThrow(
			/synthetic failure between stable windows/u,
		);
		expect(routeDiagnosticLifecycle(page)).toEqual({
			activeWindowCount: 0,
			listenerSetCount: 1,
			pendingWaiterCount: 0,
			retainedFailureCount: 0,
		});
	} finally {
		await page.close();
	}
	expect(routeDiagnosticLifecycle(page)).toEqual({
		activeWindowCount: 0,
		listenerSetCount: 0,
		pendingWaiterCount: 0,
		retainedFailureCount: 0,
	});
});

test("route diagnostics teardown settles an active quiet period without a false failure", async ({
	context,
}, testInfo) => {
	const page = await newDeterministicPage(context, testInfo.project.name);
	await page.route("**/synthetic-diagnostics-teardown", async (route) => {
		await route.fulfill({
			body: '<main class="ui-content-layout">Ready for teardown</main>',
			contentType: "text/html",
			status: 200,
		});
	});
	const navigation = gotoStable(page, "/synthetic-diagnostics-teardown");
	await page.getByText("Ready for teardown").waitFor();
	await expect
		.poll(() => routeDiagnosticLifecycle(page).pendingWaiterCount)
		.toBe(1);
	await page.close();

	await expect(navigation).resolves.toBeUndefined();
	expect(routeDiagnosticLifecycle(page)).toEqual({
		activeWindowCount: 0,
		listenerSetCount: 0,
		pendingWaiterCount: 0,
		retainedFailureCount: 0,
	});
});
