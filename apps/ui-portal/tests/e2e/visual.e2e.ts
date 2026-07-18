import type { Locator } from "@playwright/test";
import { PORTAL_VISUAL_PAGE_CASES } from "../fixtures/visual-baselines.ts";
import { componentRoutesFromCatalog } from "../helpers/component-catalog";
import {
	expect,
	gotoStable,
	newDeterministicPage,
	test,
} from "../helpers/deterministic";

// A representative slice across foundations, primitives, complex data display,
// the dogfooded shell, and a pattern — each captured Light/Dark x {375,768,1280}
// by the six visual projects.
const PAGES: readonly (readonly [string, string])[] = PORTAL_VISUAL_PAGE_CASES;

function routeForBrandMode(route: string, projectName: string): string {
	const separator = route.includes("?") ? "&" : "?";
	const mode = projectName.includes("dark") ? "dark" : "light";
	return `${route}${separator}brandMode=${mode}`;
}

async function expectCompleteSidebarTarget(target: Locator): Promise<void> {
	const footer = target.locator(".ui-sidebar__footer");
	const search = target
		.locator(".ui-sidebar__item")
		.filter({ hasText: /^Search$/u });
	await expect(target).toBeVisible();
	await expect(footer, "canonical Sidebar footer").toHaveCount(1);
	await expect(footer, "canonical Sidebar footer").toBeVisible();
	await expect(search, "canonical Sidebar Search item").toHaveCount(1);
	await expect(search, "canonical Sidebar Search item").toBeVisible();

	const geometry = await target.evaluate((frame) => {
		if (!(frame instanceof HTMLElement)) {
			throw new Error("Sidebar visual target must be an HTML element");
		}
		const tolerance = 1;
		const frameRect = frame.getBoundingClientRect();
		const sidebar = frame.querySelector<HTMLElement>(".ui-sidebar");
		const nav = frame.querySelector<HTMLElement>(".ui-sidebar__nav");
		const footer = frame.querySelector<HTMLElement>(".ui-sidebar__footer");
		const search = Array.from(
			frame.querySelectorAll<HTMLElement>(".ui-sidebar__item"),
		).find(
			(element) =>
				element
					.querySelector(".ui-sidebar__item-label")
					?.textContent?.trim() === "Search",
		);
		const overflow = (element: HTMLElement) => ({
			horizontal: Math.max(0, element.scrollWidth - element.clientWidth),
			vertical: Math.max(0, element.scrollHeight - element.clientHeight),
		});
		const measure = (
			element: HTMLElement | undefined | null,
			parent: HTMLElement | null,
		) => {
			if (!element || !parent) return null;
			const rect = element.getBoundingClientRect();
			const parentRect = parent.getBoundingClientRect();
			return {
				contained:
					rect.top >= parentRect.top - tolerance &&
					rect.left >= parentRect.left - tolerance &&
					rect.bottom <= parentRect.bottom + tolerance &&
					rect.right <= parentRect.right + tolerance,
				...overflow(element),
			};
		};
		const relevant = Array.from(
			frame.querySelectorAll<HTMLElement>(
				".ui-sidebar, .ui-sidebar__nav, .ui-sidebar__footer, .ui-org-switcher, .ui-sidebar__group-header, .ui-sidebar__item, .ui-sidebar-user-row, .ui-version-tag",
			),
		);
		const outside = relevant.flatMap((element) => {
			const rect = element.getBoundingClientRect();
			const contained =
				rect.top >= frameRect.top - tolerance &&
				rect.left >= frameRect.left - tolerance &&
				rect.bottom <= frameRect.bottom + tolerance &&
				rect.right <= frameRect.right + tolerance;
			return contained
				? []
				: [element.textContent?.trim() || element.className || element.tagName];
		});
		const labels = Array.from(
			frame.querySelectorAll<HTMLElement>(".ui-sidebar__item-label"),
			(element) => element.textContent?.trim() ?? "",
		);

		return {
			elements: {
				footer: measure(footer, sidebar),
				nav: measure(nav, sidebar),
				search: measure(search, nav),
				sidebar: measure(sidebar, frame),
			},
			footerCount: frame.querySelectorAll(
				".ui-sidebar-user-row, .ui-version-tag",
			).length,
			frameOverflow: overflow(frame),
			itemCount: labels.length,
			labels,
			outside,
		};
	});

	expect(geometry.itemCount, "canonical Sidebar item count").toBe(15);
	expect(geometry.labels, "canonical Sidebar includes Search").toContain(
		"Search",
	);
	expect(geometry.footerCount, "Sidebar user and version footer slots").toBe(2);
	expect(geometry.frameOverflow, "visual target has no overflow").toEqual({
		horizontal: 0,
		vertical: 0,
	});
	for (const [name, element] of Object.entries(geometry.elements)) {
		expect(element, `${name} geometry is available`).not.toBeNull();
		expect(element?.contained, `${name} stays inside its parent`).toBe(true);
		expect(element?.horizontal, `${name} has no horizontal overflow`).toBe(0);
		expect(element?.vertical, `${name} has no vertical overflow`).toBe(0);
	}
	expect(geometry.outside, "all Sidebar chrome stays inside the frame").toEqual(
		[],
	);
}

for (const [name, route] of PAGES) {
	test(`visual: ${name}`, async ({ page }, testInfo) => {
		const stableRoute =
			name === "sidebar"
				? `${route}?embed=playground&theme=${testInfo.project.name.includes("dark") ? "dark" : "light"}`
				: routeForBrandMode(route, testInfo.project.name);
		await gotoStable(page, stableRoute);
		if (
			(await page.locator(".portal-docs-page .ui-syntax-code-block").count()) >
			0
		) {
			await page.locator(".portal-docs-page .shiki").first().waitFor();
		}
		if (name === "info-banner") {
			const banner = page.locator(".ui-info-banner").first();
			await expect(
				banner.getByText("Scheduled sync", { exact: true }),
			).toBeVisible();
			await expect(
				banner.getByRole("button", { name: "Review" }),
			).toBeVisible();
			await expect(
				banner.getByRole("button", { name: "Dismiss" }),
			).toBeVisible();
		}
		if (name === "sidebar") {
			const target = page.getByTestId("sidebar-visual-target");
			await expect(target).toHaveCount(1);
			await expectCompleteSidebarTarget(target);
			await expect(target).toHaveScreenshot(`${name}.png`);
		} else {
			await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
		}
	});
}

test("visual: overview bento", async ({ page }, testInfo) => {
	await gotoStable(page, routeForBrandMode("/", testInfo.project.name));
	await page
		.locator('[data-home-feature="reporting"]')
		.scrollIntoViewIfNeeded();
	await expect(page).toHaveScreenshot("overview-bento.png");

	await page
		.locator('[data-home-feature="data-display"]')
		.scrollIntoViewIfNeeded();
	await expect(page).toHaveScreenshot("overview-bento-compact.png");
});

test("visual contract: every component is responsive in the active viewport and theme", async ({
	page: catalogPage,
	context,
}, testInfo) => {
	test.setTimeout(900_000);
	const routes = await componentRoutesFromCatalog(catalogPage);
	await catalogPage.close();
	const expectedTheme = testInfo.project.name.includes("dark")
		? "dark"
		: "light";

	for (const entry of routes) {
		await test.step(entry.route, async () => {
			const page = await newDeterministicPage(context, testInfo.project.name);
			try {
				await gotoStable(
					page,
					routeForBrandMode(entry.route, testInfo.project.name),
				);
				await expect(page.locator(".portal-brand-scope")).toHaveAttribute(
					"data-lemn-mode",
					expectedTheme,
				);
				await expect(page.locator(".portal-docs-page")).toBeVisible();
				const overflow = await page.evaluate(
					() =>
						document.documentElement.scrollWidth -
						document.documentElement.clientWidth,
				);
				expect(
					overflow,
					`${entry.route} horizontal overflow`,
				).toBeLessThanOrEqual(1);
			} finally {
				await page.close();
			}
		});
	}
});
