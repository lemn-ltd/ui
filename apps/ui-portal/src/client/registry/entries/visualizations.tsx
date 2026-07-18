import { lazy } from "react";
import type { CatalogPageBinding } from "../catalog-types.js";
import { componentEntry } from "../component-entry.js";

const AreaChartPage = lazy(
	() => import("../../pages/core/components/area-chart.page.js"),
);
const BarChartPage = lazy(
	() => import("../../pages/core/components/bar-chart.page.js"),
);
const ComboChartPage = lazy(
	() => import("../../pages/core/components/combo-chart.page.js"),
);
const BarListPage = lazy(
	() => import("../../pages/core/components/bar-list.page.js"),
);
const CategoryBarPage = lazy(
	() => import("../../pages/core/components/category-bar.page.js"),
);
const DonutChartPage = lazy(
	() => import("../../pages/core/components/donut-chart.page.js"),
);
const LineChartPage = lazy(
	() => import("../../pages/core/components/line-chart.page.js"),
);
const HeatmapChartPage = lazy(
	() => import("../../pages/core/components/heatmap-chart.page.js"),
);
const ProgressCirclePage = lazy(
	() => import("../../pages/core/components/progress-circle.page.js"),
);
const SparkChartPage = lazy(
	() => import("../../pages/core/components/spark-chart.page.js"),
);
const TrackerPage = lazy(
	() => import("../../pages/core/components/tracker.page.js"),
);

export const visualizationEntries: CatalogPageBinding[] = [
	componentEntry("area-chart", () => <AreaChartPage />),
	componentEntry("bar-chart", () => <BarChartPage />),
	componentEntry("combo-chart", () => <ComboChartPage />),
	componentEntry("bar-list", () => <BarListPage />),
	componentEntry("category-bar", () => <CategoryBarPage />),
	componentEntry("donut-chart", () => <DonutChartPage />),
	componentEntry("heatmap-chart", () => <HeatmapChartPage />),
	componentEntry("line-chart", () => <LineChartPage />),
	componentEntry("progress-circle", () => <ProgressCirclePage />),
	componentEntry("spark-chart", () => <SparkChartPage />),
	componentEntry("tracker", () => <TrackerPage />),
];
