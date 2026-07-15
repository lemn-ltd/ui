import type { ComponentCatalogEntry } from "./catalog-types.js";

export const visualizationComponentCatalogEntries: readonly ComponentCatalogEntry[] =
	[
		{
			slug: "area-chart",
			title: "Area chart",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A selectable normal, stacked, or percent area chart with configurable axes, legends, and tooltips.",
		},
		{
			slug: "bar-chart",
			title: "Bar chart",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A selectable grouped, stacked, or percent bar chart with vertical and horizontal orientations.",
		},
		{
			slug: "combo-chart",
			title: "Combo chart",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A declared composition of bar and line series with configurable primary and secondary axes.",
		},
		{
			slug: "bar-list",
			title: "Bar list",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A sortable, selectable category list whose native CSS bars compare values against the maximum.",
		},
		{
			slug: "category-bar",
			title: "Category bar",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A segmented native distribution bar with cumulative labels, an optional marker, and non-color cues.",
		},
		{
			slug: "donut-chart",
			title: "Donut chart",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A selectable donut or pie chart with normalized tooltips and an explicit zero-total state.",
		},
		{
			slug: "heatmap-chart",
			title: "Heatmap chart",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"An ECharts-backed categorical heatmap with a provider-neutral contract, live brand tokens, selection, and an SSR data table.",
		},
		{
			slug: "line-chart",
			title: "Line chart",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A selectable multi-series line chart with configurable axes, legends, and normalized tooltips.",
		},
		{
			slug: "progress-circle",
			title: "Progress circle",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A semantic native SVG progress indicator with determinate, indeterminate, and motion policies.",
		},
		{
			slug: "spark-chart",
			title: "Spark chart",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A compact multi-series line, area, or bar chart with domain, stack, and tooltip controls.",
		},
		{
			slug: "tracker",
			title: "Tracker",
			area: "core",
			group: "Visualizations",
			status: "beta",
			intent:
				"A discrete status sequence with optional token colors, tooltips, and hover emphasis.",
		},
	];
