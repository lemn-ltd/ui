import { expect, type Page } from "@playwright/test";

export interface CatalogComponentRoute {
	readonly group: string;
	readonly route: string;
	readonly slug: string;
	readonly title: string;
}

interface CatalogResponse {
	readonly package: string;
	readonly source: string;
	readonly components: readonly {
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
	expect(catalog.components).toHaveLength(112);

	return catalog.components.map((component) => ({
		group: component.group,
		route: `/${component.group === "Agents" ? "agents" : "core"}/components/${component.slug}`,
		slug: component.slug,
		title: component.title,
	}));
}
