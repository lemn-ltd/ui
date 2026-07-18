import { lazy } from "react";
import type { CatalogPageBinding } from "../catalog-types.js";
import { componentEntry } from "../component-entry.js";

const CardPage = lazy(() => import("../../pages/core/components/card.page.js"));
const SettingsRowPage = lazy(
	() => import("../../pages/core/components/settings-row.page.js"),
);
const DescriptionListPage = lazy(
	() => import("../../pages/core/components/description-list.page.js"),
);
const DataTablePage = lazy(
	() => import("../../pages/core/components/data-table.page.js"),
);
const StatCardPage = lazy(
	() => import("../../pages/core/components/stat-card.page.js"),
);
const StatsStripPage = lazy(
	() => import("../../pages/core/components/stats-strip.page.js"),
);
const CodeBlockPage = lazy(
	() => import("../../pages/core/components/code-block.page.js"),
);
const SyntaxCodeBlockPage = lazy(
	() => import("../../pages/core/components/syntax-code-block.page.js"),
);
const JsonViewerPage = lazy(
	() => import("../../pages/core/components/json-viewer.page.js"),
);
const MarkdownPage = lazy(
	() => import("../../pages/core/components/markdown.page.js"),
);
const SparklinePage = lazy(
	() => import("../../pages/core/components/sparkline.page.js"),
);
const RelativeTimePage = lazy(
	() => import("../../pages/core/components/relative-time.page.js"),
);
const ListShellPage = lazy(
	() => import("../../pages/core/components/list-shell.page.js"),
);
const ListFiltersBarPage = lazy(
	() => import("../../pages/core/components/list-filters-bar.page.js"),
);
const FilterPage = lazy(
	() => import("../../pages/core/components/filter.page.js"),
);
const FilterChipPage = lazy(
	() => import("../../pages/core/components/filter-chip.page.js"),
);
const EmptyStatePage = lazy(
	() => import("../../pages/core/components/empty-state.page.js"),
);
const RecentChipsPage = lazy(
	() => import("../../pages/core/components/recent-chips.page.js"),
);
const PresetSelectorPage = lazy(
	() => import("../../pages/core/components/preset-selector.page.js"),
);

export const dataDisplayEntries: CatalogPageBinding[] = [
	componentEntry("card", () => <CardPage />),
	componentEntry("settings-row", () => <SettingsRowPage />),
	componentEntry("description-list", () => <DescriptionListPage />),
	componentEntry("data-table", () => <DataTablePage />),
	componentEntry("stat-card", () => <StatCardPage />),
	componentEntry("stats-strip", () => <StatsStripPage />),
	componentEntry("code-block", () => <CodeBlockPage />),
	componentEntry("syntax-code-block", () => <SyntaxCodeBlockPage />),
	componentEntry("json-viewer", () => <JsonViewerPage />),
	componentEntry("markdown", () => <MarkdownPage />),
	componentEntry("sparkline", () => <SparklinePage />),
	componentEntry("relative-time", () => <RelativeTimePage />),
	componentEntry("list-shell", () => <ListShellPage />),
	componentEntry("list-filters-bar", () => <ListFiltersBarPage />),
	componentEntry("filter", () => <FilterPage />),
	componentEntry("filter-chip", () => <FilterChipPage />),
	componentEntry("empty-state", () => <EmptyStatePage />),
	componentEntry("recent-chips", () => <RecentChipsPage />),
	componentEntry("preset-selector", () => <PresetSelectorPage />),
];
