import { coreBlockCatalog } from "@lemn-ltd/ui/blocks/core/catalog";
import { coreComponentCatalog } from "@lemn-ltd/ui/catalog/core";
import { describe, expect, it } from "vitest";
import { ADMIN_REGISTRY_READ_MODEL } from "../../../../src/catalog/admin-registry.js";
import {
	CATALOG_GROUPS,
	CATALOG_MANIFEST,
	CATALOG_SECTION_MANIFEST,
	ENABLED_CATALOG_AREAS,
	PUBLIC_PAGE_MANIFEST,
} from "../../../../src/catalog/catalog-manifest.js";
import {
	CATALOG_REGISTRY,
	navGroups,
} from "../../../../src/client/registry/catalog-registry.js";
import { PROVIDER_READ_MODEL } from "../../../../src/provider-read-model.js";

describe("Portal catalog authority", () => {
	it("binds every manifest record to exactly one live page without overriding metadata", () => {
		expect(CATALOG_REGISTRY).toHaveLength(CATALOG_MANIFEST.length);
		expect(
			CATALOG_REGISTRY.map(
				({ page: _page, ...manifestEntry }) => manifestEntry,
			),
		).toEqual(CATALOG_MANIFEST);
		expect(new Set(CATALOG_REGISTRY.map((entry) => entry.id)).size).toBe(
			CATALOG_REGISTRY.length,
		);
	});

	it("projects every enabled Core component through its manifest-owned family and path", () => {
		const componentEntries = CATALOG_REGISTRY.filter(
			(entry) => entry.kind === "component",
		);
		expect(componentEntries).toHaveLength(102);

		for (const catalogEntry of coreComponentCatalog) {
			const entry = componentEntries.find(
				(candidate) => candidate.slug === catalogEntry.slug,
			);
			expect(entry, catalogEntry.slug).toMatchObject({
				area: "core",
				group: catalogEntry.group,
			});
			if (entry) {
				const section =
					catalogEntry.group === "Visualizations"
						? "visualizations"
						: "components";
				expect(entry.section).toBe(section);
				expect(entry.path).toBe(`/${section}/${catalogEntry.slug}`);
			}
		}
	});

	it("includes every Core block as a searchable, routable manifest entry", () => {
		const blockEntries = CATALOG_REGISTRY.filter(
			(entry) => entry.kind === "block",
		);
		expect(blockEntries).toHaveLength(coreBlockCatalog.length);
		expect(
			blockEntries.map(({ components, path, slug }) => ({
				components,
				path,
				slug,
			})),
		).toEqual(
			coreBlockCatalog.map((entry) => ({
				components: entry.components,
				path: `/blocks/${entry.slug}`,
				slug: entry.slug,
			})),
		);
	});

	it("derives section navigation and grouped search taxonomy from the same manifest", () => {
		expect(PUBLIC_PAGE_MANIFEST[0]).toMatchObject({ id: "home", path: "/" });
		expect(PUBLIC_PAGE_MANIFEST.slice(1)).toEqual(CATALOG_SECTION_MANIFEST);
		expect(navGroups().map((group) => group.group)).toEqual(
			CATALOG_GROUPS.filter((group) =>
				CATALOG_MANIFEST.some((entry) => entry.group === group),
			),
		);
		for (const entry of CATALOG_MANIFEST) {
			expect(
				CATALOG_SECTION_MANIFEST.some(
					(section) => section.id === entry.section,
				),
			).toBe(true);
		}
	});

	it("keeps Core as the only enabled area with unique canonical paths", () => {
		expect(ENABLED_CATALOG_AREAS).toEqual(["core"]);
		expect(new Set(CATALOG_MANIFEST.map((entry) => entry.area))).toEqual(
			new Set(ENABLED_CATALOG_AREAS),
		);
		expect(CATALOG_REGISTRY.every((entry) => entry.area === "core")).toBe(true);
		expect(new Set(CATALOG_MANIFEST.map((entry) => entry.path)).size).toBe(
			CATALOG_MANIFEST.length,
		);
	});

	it("enriches one Core provider projection without creating a second capability catalog", () => {
		expect(
			ADMIN_REGISTRY_READ_MODEL.capabilities.map(
				(capability) => capability.capabilityId,
			),
		).toEqual(
			PROVIDER_READ_MODEL.capabilities.map(
				(capability) => capability.capabilityId,
			),
		);
		expect(ADMIN_REGISTRY_READ_MODEL.revision).toBe(
			PROVIDER_READ_MODEL.revision,
		);
	});
});
