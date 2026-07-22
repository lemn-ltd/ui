import type { Locator } from "@playwright/test";
import { PORTAL_VISUAL_PAGE_CASES } from "../fixtures/visual-baselines.ts";
import {
	authorizeLocalAdminPage,
	gotoReadyAdminBrandStudio,
	selectPreviewMode,
} from "../helpers/admin";
import {
	catalogComponentRoutes,
	componentRoutesFromCatalog,
} from "../helpers/component-catalog";
import {
	expect,
	gotoReady,
	gotoStable,
	type Theme,
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

function themeForProject(projectName: string): Theme {
	return projectName.includes("dark") ? "dark" : "light";
}

async function expectResponsiveBrandStudioPreview(
	preview: Locator,
): Promise<void> {
	const geometry = await preview.evaluate((element) => {
		if (!(element instanceof HTMLElement)) {
			throw new Error("Brand Studio preview target must be an HTML element.");
		}
		const rect = element.getBoundingClientRect();
		const clinicNavigation = element.querySelector<HTMLElement>(
			'[aria-label="Clinic navigation"]',
		);
		const mobileBrand = element.querySelector<HTMLElement>(
			".lemn-brand-preview__mobile-brand",
		);
		const isVisible = (candidate: HTMLElement | null): boolean =>
			Boolean(candidate && getComputedStyle(candidate).display !== "none");

		return {
			documentHorizontalOverflow: Math.max(
				0,
				document.documentElement.scrollWidth - window.innerWidth,
			),
			previewHorizontalOverflow: Math.max(
				0,
				element.scrollWidth - element.clientWidth,
			),
			previewWidth: rect.width,
			staysInsideViewport:
				rect.left >= -1 && rect.right <= window.innerWidth + 1,
			clinicNavigationVisible: isVisible(clinicNavigation),
			mobileBrandVisible: isVisible(mobileBrand),
			overflowingElements: [...document.querySelectorAll<HTMLElement>("body *")]
				.map((candidate) => {
					const candidateRect = candidate.getBoundingClientRect();
					return {
						tag: candidate.tagName.toLowerCase(),
						className: candidate.className,
						right: Math.round(candidateRect.right),
						scrollWidth: candidate.scrollWidth,
						clientWidth: candidate.clientWidth,
					};
				})
				.filter(
					(candidate) =>
						candidate.right > window.innerWidth + 1 ||
						candidate.scrollWidth > candidate.clientWidth + 1,
				)
				.slice(0, 12),
		};
	});

	expect(
		geometry.documentHorizontalOverflow,
		JSON.stringify(geometry.overflowingElements),
	).toBeLessThanOrEqual(1);
	expect(geometry.previewHorizontalOverflow).toBeLessThanOrEqual(1);
	expect(geometry.staysInsideViewport).toBe(true);
	expect(geometry.previewWidth).toBeGreaterThan(280);

	if (geometry.previewWidth <= 680) {
		expect(geometry.clinicNavigationVisible).toBe(false);
		expect(geometry.mobileBrandVisible).toBe(true);
	} else {
		expect(geometry.clinicNavigationVisible).toBe(true);
		expect(geometry.mobileBrandVisible).toBe(false);
	}
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

test("visual: brand studio preview", async ({ page }, testInfo) => {
	const theme = themeForProject(testInfo.project.name);
	await test.step("authorize the protected Admin route", async () => {
		await authorizeLocalAdminPage(page);
	});
	const preview =
		await test.step("open the compiled Studio preview", async () =>
			gotoReadyAdminBrandStudio(page));
	await test.step("stabilize the selected branding mode", async () => {
		await selectPreviewMode(page, preview, theme);
		await preview.getByRole("radio", { name: "Month", exact: true }).click();
		await expectResponsiveBrandStudioPreview(preview);
	});
	await test.step("capture the full-bleed application specimen", async () => {
		await expect(preview).toHaveScreenshot("brand-studio-preview.png", {
			animations: "disabled",
			caret: "hide",
		});
	});
});

test("responsive inventory matches the runtime catalog", async ({ page }) => {
	await componentRoutesFromCatalog(page);
});

for (const entry of catalogComponentRoutes) {
	test(`responsive contract: ${entry.route}`, async ({ page }, testInfo) => {
		const expectedTheme = testInfo.project.name.includes("dark")
			? "dark"
			: "light";
		await gotoReady(
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
		expect(overflow, `${entry.route} horizontal overflow`).toBeLessThanOrEqual(
			1,
		);
	});
}
