import { expect, type Page } from "@playwright/test";

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
	expect(catalog.components.filter((component) => component.area === "core")).toHaveLength(101);
	expect(catalog.components.filter((component) => component.area === "agents")).toHaveLength(29);

	return catalog.components.map((component) => ({
		area: component.area,
		group: component.group,
		route: `/${component.area}/components/${component.slug}`,
		slug: component.slug,
		title: component.title,
	}));
}
