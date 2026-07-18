import { lazy, type ReactElement } from "react";
import {
	type CatalogSectionId,
	PUBLIC_PAGE_MANIFEST,
	type PublicPageId,
} from "../../catalog/catalog-manifest.js";
import { OverviewPage } from "../shell/overview-page.js";

const BlocksPage = lazy(() =>
	import("../pages/ecosystem/blocks.page.js").then((module) => ({
		default: module.BlocksPage,
	})),
);
const CatalogIndexPage = lazy(() =>
	import("../pages/ecosystem/catalog.page.js").then((module) => ({
		default: module.CatalogIndexPage,
	})),
);
const PlaygroundPage = lazy(() =>
	import("../pages/ecosystem/playground.page.js").then((module) => ({
		default: module.PlaygroundPage,
	})),
);
const ProvidersPage = lazy(() =>
	import("../pages/ecosystem/providers.page.js").then((module) => ({
		default: module.ProvidersPage,
	})),
);

interface PublicPageBinding {
	readonly id: PublicPageId;
	readonly page: () => ReactElement;
}

function catalogIndexPage(section: CatalogSectionId): ReactElement {
	return <CatalogIndexPage section={section} />;
}

/** React implementations keyed only by IDs declared in the React-free manifest. */
const PUBLIC_PAGE_BINDINGS: readonly PublicPageBinding[] = [
	{ id: "home", page: () => <OverviewPage /> },
	{ id: "foundations", page: () => catalogIndexPage("foundations") },
	{ id: "components", page: () => catalogIndexPage("components") },
	{ id: "visualizations", page: () => catalogIndexPage("visualizations") },
	{ id: "blocks", page: () => <BlocksPage /> },
	{ id: "patterns", page: () => catalogIndexPage("patterns") },
	{ id: "providers", page: () => <ProvidersPage /> },
	{ id: "playground", page: () => <PlaygroundPage /> },
];

const PAGES_BY_ID = new Map<PublicPageId, PublicPageBinding["page"]>();
for (const binding of PUBLIC_PAGE_BINDINGS) {
	if (PAGES_BY_ID.has(binding.id)) {
		throw new Error(`Duplicate public page binding for id "${binding.id}"`);
	}
	PAGES_BY_ID.set(binding.id, binding.page);
}

const unknownIds = [...PAGES_BY_ID.keys()].filter(
	(id) => !PUBLIC_PAGE_MANIFEST.some((entry) => entry.id === id),
);
if (unknownIds.length > 0) {
	throw new Error(
		`Public page bindings have no manifest entry: ${unknownIds.join(", ")}`,
	);
}

export function publicPageFor(id: PublicPageId): ReactElement {
	const page = PAGES_BY_ID.get(id);
	if (!page)
		throw new Error(`Missing public page binding for manifest id "${id}"`);
	return page();
}
