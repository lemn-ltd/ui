import { lazy } from "react";
import { catalogEntryId } from "../../../catalog/catalog-manifest.js";
import {
	type CatalogPageBinding,
	catalogPageBinding,
} from "../catalog-types.js";

const ListTablePage = lazy(
	() => import("../../pages/core/patterns/list-table.page.js"),
);
const ListGridPage = lazy(
	() => import("../../pages/core/patterns/list-grid.page.js"),
);
const ListSplitPage = lazy(
	() => import("../../pages/core/patterns/list-split.page.js"),
);
const DetailPage = lazy(
	() => import("../../pages/core/patterns/detail.page.js"),
);
const SettingsFormPage = lazy(
	() => import("../../pages/core/patterns/settings-form.page.js"),
);
const DashboardPage = lazy(
	() => import("../../pages/core/patterns/dashboard.page.js"),
);
const StatesPage = lazy(
	() => import("../../pages/core/patterns/states.page.js"),
);
const ResponsivePage = lazy(
	() => import("../../pages/core/patterns/responsive.page.js"),
);
const ResourceManagerPage = lazy(
	() => import("../../pages/core/patterns/resource-manager.page.js"),
);

function patternEntry(
	slug: string,
	page: CatalogPageBinding["page"],
): CatalogPageBinding {
	return catalogPageBinding(catalogEntryId("pattern", slug), page);
}

export const patternsEntries: CatalogPageBinding[] = [
	patternEntry("list-table", () => <ListTablePage />),
	patternEntry("list-grid", () => <ListGridPage />),
	patternEntry("list-split", () => <ListSplitPage />),
	patternEntry("detail", () => <DetailPage />),
	patternEntry("settings-form", () => <SettingsFormPage />),
	patternEntry("dashboard", () => <DashboardPage />),
	patternEntry("states", () => <StatesPage />),
	patternEntry("responsive", () => <ResponsivePage />),
	patternEntry("resource-manager", () => <ResourceManagerPage />),
];
