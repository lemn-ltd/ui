import { expect, type Page } from "@playwright/test";
import { CATALOG_MANIFEST } from "../../src/catalog/catalog-manifest.ts";

export const COMPONENT_CATALOG_ROUTE_COUNT = 102;
export const COMPONENT_ACCESSIBILITY_THEMES = ["light", "dark"] as const;
export const COMPONENT_ACCESSIBILITY_CASE_COUNT =
	COMPONENT_CATALOG_ROUTE_COUNT * COMPONENT_ACCESSIBILITY_THEMES.length;

export type ComponentAccessibilityTheme =
	(typeof COMPONENT_ACCESSIBILITY_THEMES)[number];

export interface CatalogComponentRoute {
	readonly area: "core";
	readonly group: string;
	readonly route: string;
	readonly slug: string;
	readonly title: string;
}

interface CatalogResponse {
	readonly package: string;
	readonly source: string;
	readonly components: readonly {
		readonly area: "core";
		readonly group: string;
		readonly path: string;
		readonly slug: string;
		readonly title: string;
	}[];
}

export interface ComponentAccessibilityCase {
	readonly route: string;
	readonly theme: ComponentAccessibilityTheme;
}

// Native Playwright sharding needs cases at collection time. The React-free
// manifest is the same authority used by routes and the public catalog endpoint;
// the runtime endpoint must still match it exactly before a crawl can pass.
const sourceCatalogEntries = CATALOG_MANIFEST.filter(
	(entry) => entry.kind === "component",
);

export const catalogComponentRoutes: readonly CatalogComponentRoute[] =
	sourceCatalogEntries.map((component) => ({
		area: component.area,
		group: component.group,
		route: component.path,
		slug: component.slug,
		title: component.title,
	}));

function assertSourceCatalogInventory(): void {
	const routeValues = catalogComponentRoutes.map((entry) => entry.route);
	const uniqueRoutes = new Set(routeValues);
	const coreRoutes = catalogComponentRoutes.filter(
		(entry) => entry.area === "core",
	).length;
	if (
		catalogComponentRoutes.length !== COMPONENT_CATALOG_ROUTE_COUNT ||
		uniqueRoutes.size !== COMPONENT_CATALOG_ROUTE_COUNT ||
		coreRoutes !== 102
	) {
		throw new Error(
			`Invalid source component catalog inventory: total=${catalogComponentRoutes.length}, unique=${uniqueRoutes.size}, core=${coreRoutes}`,
		);
	}
}

assertSourceCatalogInventory();

export const componentAccessibilityCases: readonly ComponentAccessibilityCase[] =
	catalogComponentRoutes.flatMap((entry) =>
		COMPONENT_ACCESSIBILITY_THEMES.map((theme) => ({
			route: entry.route,
			theme,
		})),
	);

export function componentAccessibilityTestTitle(
	accessibilityCase: ComponentAccessibilityCase,
): string {
	return `component accessibility: ${accessibilityCase.route} (${accessibilityCase.theme})`;
}

/** Runtime-derived component routes; never maintain a route allowlist in tests. */
export async function componentRoutesFromCatalog(
	page: Page,
): Promise<readonly CatalogComponentRoute[]> {
	const response = await page.request.get("/catalog.json");
	expect(response.ok()).toBe(true);
	const catalog = (await response.json()) as CatalogResponse;

	expect(catalog.package).toBe("@lemn-ltd/ui");
	expect(catalog.source).toBe("https://github.com/lemn-ltd/ui");
	expect(catalog.components).toHaveLength(102);
	expect(
		catalog.components.filter((component) => component.area === "core"),
	).toHaveLength(102);
	expect(catalog.components.every((component) => component.area === "core")).toBe(true);

	const routes = catalog.components.map((component) => ({
		area: component.area,
		group: component.group,
		route: component.path,
		slug: component.slug,
		title: component.title,
	}));
	expect(routes).toEqual(catalogComponentRoutes);
	return routes;
}
