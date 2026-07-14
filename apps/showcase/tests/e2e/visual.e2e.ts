import type { Locator } from "@playwright/test";
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
const PAGES: readonly (readonly [string, string])[] = [
	["overview", "/"],
	["button", "/core/components/button"],
	["checkbox", "/core/components/checkbox"],
	["badge", "/core/components/badge"],
	["calendar", "/core/components/calendar"],
	["dialog", "/core/components/dialog"],
	["data-table", "/core/components/data-table"],
	["sidebar", "/core/components/sidebar"],
	["info-banner", "/core/components/info-banner"],
	["settings-shell", "/core/components/settings-shell"],
	["approval-card", "/agents/components/approval-card"],
	["colors", "/core/foundations/colors"],
	["dashboard", "/core/patterns/dashboard"],
];

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
				: route;
		await gotoStable(page, stableRoute);
		if (route === "/core/components/checkbox") {
			await page.locator(".showcase-docs-page .shiki").first().waitFor();
		}
		if (route === "/") {
			await expect
				.poll(async () => {
					const active = await page
						.locator('.showcase-live-preview[data-preview-active="true"]')
						.count();
					const ready = await page
						.locator(
							'.showcase-live-preview[data-preview-active="true"][data-preview-ready="true"]',
						)
						.count();
					return active > 0 && active === ready;
				})
				.toBe(true);
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
				await gotoStable(page, entry.route);
				await expect(page.locator("html")).toHaveAttribute(
					"data-theme",
					expectedTheme,
				);
				await expect(page.locator(".showcase-docs-page")).toBeVisible();
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
