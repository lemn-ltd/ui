import { expect, type Page } from "@playwright/test";
import { automationComponentCatalogEntries } from "../../../../packages/ui/src/catalog-automation-entries.ts";
import { capabilityExpansionCatalogEntries } from "../../../../packages/ui/src/catalog-capability-expansion-entries.ts";
import { primaryComponentCatalogEntries } from "../../../../packages/ui/src/catalog-primary-entries.ts";
import { secondaryComponentCatalogEntries } from "../../../../packages/ui/src/catalog-secondary-entries.ts";
import { visualizationComponentCatalogEntries } from "../../../../packages/ui/src/catalog-visualization-entries.ts";

export const COMPONENT_CATALOG_ROUTE_COUNT = 130;
export const COMPONENT_ACCESSIBILITY_THEMES = ["light", "dark"] as const;
export const COMPONENT_ACCESSIBILITY_CASE_COUNT =
	COMPONENT_CATALOG_ROUTE_COUNT * COMPONENT_ACCESSIBILITY_THEMES.length;

export type ComponentAccessibilityTheme =
	(typeof COMPONENT_ACCESSIBILITY_THEMES)[number];

export interface CatalogComponentRoute {
	readonly area: "core" | "agents";
	readonly group: string;
	readonly route: string;
	readonly slug: string;
	readonly title: string;
}

interface CatalogResponse {
	readonly package: string;
	readonly source: string;
	readonly components: readonly {
		readonly area: "core" | "agents";
		readonly group: string;
		readonly slug: string;
		readonly title: string;
	}[];
}

export interface ComponentAccessibilityCase {
	readonly route: string;
	readonly theme: ComponentAccessibilityTheme;
}

// Native Playwright sharding needs cases at collection time. These are the same
// data-only modules assembled by the public catalog; the runtime endpoint is
// required to match this inventory exactly before the crawl can pass.
const sourceCatalogEntries = [
	...primaryComponentCatalogEntries,
	...secondaryComponentCatalogEntries,
	...automationComponentCatalogEntries,
	...visualizationComponentCatalogEntries,
	...capabilityExpansionCatalogEntries,
];

export const catalogComponentRoutes: readonly CatalogComponentRoute[] =
	sourceCatalogEntries.map((component) => ({
		area: component.area,
		group: component.group,
		route: `/${component.area}/components/${component.slug}`,
		slug: component.slug,
		title: component.title,
	}));

function assertSourceCatalogInventory(): void {
	const routeValues = catalogComponentRoutes.map((entry) => entry.route);
	const uniqueRoutes = new Set(routeValues);
	const coreRoutes = catalogComponentRoutes.filter(
		(entry) => entry.area === "core",
	).length;
	const agentRoutes = catalogComponentRoutes.filter(
		(entry) => entry.area === "agents",
	).length;

	if (
		catalogComponentRoutes.length !== COMPONENT_CATALOG_ROUTE_COUNT ||
		uniqueRoutes.size !== COMPONENT_CATALOG_ROUTE_COUNT ||
		coreRoutes !== 101 ||
		agentRoutes !== 29
	) {
		throw new Error(
			`Invalid source component catalog inventory: total=${catalogComponentRoutes.length}, unique=${uniqueRoutes.size}, core=${coreRoutes}, agents=${agentRoutes}`,
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
	expect(catalog.components).toHaveLength(130);
	expect(
		catalog.components.filter((component) => component.area === "core"),
	).toHaveLength(101);
	expect(
		catalog.components.filter((component) => component.area === "agents"),
	).toHaveLength(29);

	const routes = catalog.components.map((component) => ({
		area: component.area,
		group: component.group,
		route: `/${component.area}/components/${component.slug}`,
		slug: component.slug,
		title: component.title,
	}));
	expect(routes).toEqual(catalogComponentRoutes);
	return routes;
}
