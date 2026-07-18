import { coreBlockCatalog } from "@lemn-ltd/ui/blocks/core/catalog";
import { coreComponentCatalog } from "@lemn-ltd/ui/catalog/core";

export type CatalogArea = "core" | "agents";

/**
 * Compile-time catalog composition. Only enabled areas can enter the active
 * manifest, route graph, navigation, search, or machine-readable projections.
 */
export const ENABLED_CATALOG_AREAS = [
	"core",
] as const satisfies readonly CatalogArea[];
export type EnabledCatalogArea = (typeof ENABLED_CATALOG_AREAS)[number];
export const DEFAULT_CATALOG_AREA: CatalogArea = ENABLED_CATALOG_AREAS[0];

export const CATALOG_GROUPS = [
	"Foundations",
	"Primitives",
	"Inputs",
	"Forms",
	"Visualizations",
	"Overlays",
	"Navigation",
	"Data display",
	"Feedback",
	"Layout",
	"Blocks",
	"Patterns",
] as const;

export type CatalogGroup = (typeof CATALOG_GROUPS)[number];
export type CatalogManifestKind =
	| "foundation"
	| "component"
	| "block"
	| "pattern";
export type CatalogManifestStatus = "stable" | "beta";
export type CatalogEntryId = `${CatalogManifestKind}:${string}`;

export const CATALOG_SECTION_MANIFEST = [
	{
		id: "foundations",
		path: "/foundations",
		label: "Foundations",
		summary:
			"The color, type, spacing, elevation, motion, and icon foundations behind Lemn UI.",
	},
	{
		id: "components",
		path: "/components",
		label: "Components",
		summary:
			"Core interactive capabilities with live behavior and production usage guidance.",
	},
	{
		id: "visualizations",
		path: "/visualizations",
		label: "Visualizations",
		summary:
			"Charts and statistical displays driven by the same compiled branding palette.",
	},
	{
		id: "blocks",
		path: "/blocks",
		label: "Blocks",
		summary:
			"Curated purpose-built compositions whose hosts retain data and business actions.",
	},
	{
		id: "patterns",
		path: "/patterns",
		label: "Patterns",
		summary:
			"Reusable compositions for complete product workflows and interface states.",
	},
	{
		id: "providers",
		path: "/providers",
		label: "Providers",
		summary: "Provider provenance and pinned upstream references.",
	},
	{
		id: "playground",
		path: "/playground",
		label: "Playground",
		summary:
			"Persistence-free previews of public capabilities and approved branding presets.",
	},
] as const;

export type CatalogSectionId = (typeof CATALOG_SECTION_MANIFEST)[number]["id"];

export const PORTAL_HOME_MANIFEST = {
	id: "home",
	path: "/",
	label: "Overview",
	summary: "Lemn UI catalog overview.",
} as const;

export const PUBLIC_PAGE_MANIFEST = [
	PORTAL_HOME_MANIFEST,
	...CATALOG_SECTION_MANIFEST,
] as const;

export type PublicPageId = (typeof PUBLIC_PAGE_MANIFEST)[number]["id"];

export interface CatalogManifestEntry {
	readonly area: EnabledCatalogArea;
	readonly components?: readonly string[];
	readonly group: CatalogGroup;
	readonly id: CatalogEntryId;
	readonly kind: CatalogManifestKind;
	readonly path: string;
	readonly section: CatalogSectionId;
	readonly slug: string;
	readonly status: CatalogManifestStatus;
	readonly summary: string;
	readonly title: string;
}

const FOUNDATION_MANIFEST = [
	{
		slug: "colors",
		title: "Colors",
		summary:
			"Surface, text, accent, status, and soft-status tokens — resolved per theme.",
	},
	{
		slug: "typography",
		title: "Typography",
		summary:
			"Type scale with unitless line-height ratios, weights, and the mono family.",
	},
	{
		slug: "spacing",
		title: "Spacing & radii",
		summary: "The non-contiguous spacing scale and the four corner radii.",
	},
	{
		slug: "elevation",
		title: "Elevation",
		summary:
			"Three elevation levels, shadow-led in Light and border-led in Dark.",
	},
	{
		slug: "motion",
		title: "Motion",
		summary:
			"Durations, easings, and loops that go static under reduced motion.",
	},
	{
		slug: "icons",
		title: "Icons",
		summary: "The product-neutral base glyph set the package re-exports.",
	},
] as const;

const PATTERN_MANIFEST = [
	{
		slug: "list-table",
		title: "List + table",
		summary:
			"The canonical list screen: shell, page header, filter bar, and a sortable data table.",
		status: "stable",
	},
	{
		slug: "list-grid",
		title: "List + grid",
		summary:
			"A card-grid variant of the list screen wrapping a responsive section grid.",
		status: "stable",
	},
	{
		slug: "list-split",
		title: "List + split",
		summary:
			"A master-detail split with a selectable list and a labeled detail panel.",
		status: "stable",
	},
	{
		slug: "detail",
		title: "Detail",
		summary:
			"An entity detail screen: toolbar, stats strip, summary panels, and a tab strip.",
		status: "stable",
	},
	{
		slug: "settings-form",
		title: "Settings form",
		summary:
			"A settings screen with a drill-in rail, form sections, and a Save footer.",
		status: "stable",
	},
	{
		slug: "dashboard",
		title: "Dashboard",
		summary:
			"An overview screen with a stats strip and a section grid of sparkline trend cards.",
		status: "stable",
	},
	{
		slug: "states",
		title: "States",
		summary:
			"The loading, empty, and error states a data surface moves through, side by side.",
		status: "stable",
	},
	{
		slug: "responsive",
		title: "Responsive",
		summary:
			"How the shell composition reflows across the 375, 768, and 1280px breakpoints.",
		status: "stable",
	},
	{
		slug: "resource-manager",
		title: "Resource manager",
		summary:
			"The end-to-end CRUD screen with row actions, bulk selection, filters, search, and a create/edit dialog.",
		status: "beta",
	},
] as const satisfies readonly {
	slug: string;
	title: string;
	summary: string;
	status: CatalogManifestStatus;
}[];

const CATALOG_GROUP_SET: ReadonlySet<string> = new Set(CATALOG_GROUPS);

function canonicalGroup(group: string): CatalogGroup {
	if (!CATALOG_GROUP_SET.has(group)) {
		throw new Error(`Core component catalog uses undeclared group "${group}"`);
	}
	return group as CatalogGroup;
}

export function catalogEntryId(
	kind: CatalogManifestKind,
	slug: string,
): CatalogEntryId {
	return `${kind}:${slug}`;
}

const foundations: readonly CatalogManifestEntry[] = FOUNDATION_MANIFEST.map(
	(entry) => ({
		...entry,
		area: "core",
		group: "Foundations",
		id: catalogEntryId("foundation", entry.slug),
		kind: "foundation",
		path: `/foundations/${entry.slug}`,
		section: "foundations",
		status: "stable",
	}),
);

const components: readonly CatalogManifestEntry[] = coreComponentCatalog.map(
	(entry) => {
		const section =
			entry.group === "Visualizations" ? "visualizations" : "components";
		return {
			area: "core",
			group: canonicalGroup(entry.group),
			id: catalogEntryId("component", entry.slug),
			kind: "component",
			path: `/${section}/${entry.slug}`,
			section,
			slug: entry.slug,
			status: entry.status,
			summary: entry.intent,
			title: entry.title,
		};
	},
);

const blocks: readonly CatalogManifestEntry[] = coreBlockCatalog.map(
	(entry) => ({
		area: "core",
		components: entry.components,
		group: "Blocks",
		id: catalogEntryId("block", entry.slug),
		kind: "block",
		path: `/blocks/${entry.slug}`,
		section: "blocks",
		slug: entry.slug,
		status: entry.status,
		summary: entry.purpose,
		title: entry.title,
	}),
);

const patterns: readonly CatalogManifestEntry[] = PATTERN_MANIFEST.map(
	(entry) => ({
		...entry,
		area: "core",
		group: "Patterns",
		id: catalogEntryId("pattern", entry.slug),
		kind: "pattern",
		path: `/patterns/${entry.slug}`,
		section: "patterns",
	}),
);

/**
 * Pure, React-free authority for every enabled public catalog entry. Routes,
 * navigation, search, JSON feeds, and LLM documents project this exact data;
 * React modules may only bind a page implementation to one of these IDs.
 */
const CATALOG_ENTRIES_BY_ENABLED_AREA = {
	core: [...foundations, ...components, ...blocks, ...patterns],
} as const satisfies Record<
	EnabledCatalogArea,
	readonly CatalogManifestEntry[]
>;

export const CATALOG_MANIFEST: readonly CatalogManifestEntry[] =
	ENABLED_CATALOG_AREAS.flatMap(
		(area) => CATALOG_ENTRIES_BY_ENABLED_AREA[area],
	);

function assertUniqueCatalogAuthority(): void {
	const ids = new Set<string>();
	const paths = new Set<string>();
	const sectionIds = new Set<string>(
		CATALOG_SECTION_MANIFEST.map((section) => section.id),
	);
	for (const entry of CATALOG_MANIFEST) {
		if (ids.has(entry.id)) {
			throw new Error(`Duplicate catalog manifest id "${entry.id}"`);
		}
		if (paths.has(entry.path)) {
			throw new Error(`Duplicate catalog manifest path "${entry.path}"`);
		}
		if (!sectionIds.has(entry.section)) {
			throw new Error(
				`Catalog entry "${entry.id}" references unknown section "${entry.section}"`,
			);
		}
		ids.add(entry.id);
		paths.add(entry.path);
	}

	const publicPaths = new Set<string>();
	for (const page of PUBLIC_PAGE_MANIFEST) {
		if (publicPaths.has(page.path)) {
			throw new Error(`Duplicate public page manifest path "${page.path}"`);
		}
		publicPaths.add(page.path);
	}
}

assertUniqueCatalogAuthority();

const CATALOG_MANIFEST_BY_ID = new Map(
	CATALOG_MANIFEST.map((entry) => [entry.id, entry]),
);
const CATALOG_SECTION_BY_ID = new Map(
	CATALOG_SECTION_MANIFEST.map((entry) => [entry.id, entry]),
);

export function catalogManifestEntry(id: CatalogEntryId): CatalogManifestEntry {
	const entry = CATALOG_MANIFEST_BY_ID.get(id);
	if (!entry)
		throw new Error(`No enabled catalog manifest entry for id "${id}"`);
	return entry;
}

export function catalogSectionManifestEntry(id: CatalogSectionId) {
	const entry = CATALOG_SECTION_BY_ID.get(id);
	if (!entry) throw new Error(`No public catalog section for id "${id}"`);
	return entry;
}

export function catalogEntriesForSection(
	section: CatalogSectionId,
): readonly CatalogManifestEntry[] {
	return CATALOG_MANIFEST.filter((entry) => entry.section === section);
}

export function pathFor(entry: Pick<CatalogManifestEntry, "path">): string {
	return entry.path;
}

export function blockCatalogProjection() {
	return CATALOG_MANIFEST.filter((entry) => entry.kind === "block").map(
		(entry) => ({
			components: entry.components ?? [],
			purpose: entry.summary,
			slug: entry.slug,
			status: entry.status,
			title: entry.title,
		}),
	);
}
