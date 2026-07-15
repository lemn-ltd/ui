import { LineChart, type LineSeriesOption } from "echarts/charts";
import {
	AriaComponent,
	type AriaComponentOption,
	GridComponent,
	type GridComponentOption,
	LegendComponent,
	type LegendComponentOption,
	TooltipComponent,
	type TooltipComponentOption,
} from "echarts/components";
import { type ComposeOption, type EChartsType, init, use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import type { CompiledBrandSnapshot } from "../../branding/compiler";

use([
	LineChart,
	GridComponent,
	TooltipComponent,
	LegendComponent,
	AriaComponent,
	SVGRenderer,
]);

const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 340;

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];
const REPORTS = [42, 48, 45, 58, 63, 68, 74, 72, 81, 86, 92, 98];
const AUTOMATIONS = [28, 31, 38, 41, 46, 53, 55, 62, 67, 73, 78, 84];

type AreaChartOption = ComposeOption<
	| LineSeriesOption
	| GridComponentOption
	| TooltipComponentOption
	| LegendComponentOption
	| AriaComponentOption
>;

export interface MountedAreaChart {
	readonly chart: EChartsType;
	dispose(): void;
}

function createAreaChartOption(interactive: boolean): AreaChartOption {
	return {
		animation: interactive,
		animationDuration: 320,
		animationDurationUpdate: 240,
		aria: {
			enabled: true,
			description:
				"Monthly comparison of generated reports and completed automations.",
		},
		grid: {
			left: 8,
			right: 8,
			top: 48,
			bottom: 8,
			outerBoundsMode: "same",
			outerBoundsContain: "axisLabel",
		},
		legend: {
			top: 0,
			right: 0,
			itemWidth: 12,
			itemHeight: 8,
		},
		tooltip: {
			trigger: "axis",
			confine: true,
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			axisTick: { show: false },
			data: MONTHS,
		},
		yAxis: {
			type: "value",
			min: 0,
			axisTick: { show: false },
		},
		series: [
			{
				name: "Reports",
				type: "line",
				data: REPORTS,
				smooth: true,
				showSymbol: false,
				lineStyle: { width: 3 },
				areaStyle: { opacity: 0.18 },
				emphasis: { focus: "series" },
			},
			{
				name: "Automations",
				type: "line",
				data: AUTOMATIONS,
				smooth: true,
				showSymbol: false,
				lineStyle: { width: 3 },
				areaStyle: { opacity: 0.12 },
				emphasis: { focus: "series" },
			},
		],
	};
}

export function renderAreaChartSvg(
	snapshot: CompiledBrandSnapshot,
	width = DEFAULT_WIDTH,
	height = DEFAULT_HEIGHT,
): string {
	const chart = init(null, snapshot.chartTheme, {
		renderer: "svg",
		ssr: true,
		width,
		height,
	});

	try {
		chart.setOption(createAreaChartOption(false));
		return chart.renderToSVGString({ useViewBox: true });
	} finally {
		chart.dispose();
	}
}

export function mountAreaChart(
	container: HTMLDivElement,
	snapshot: CompiledBrandSnapshot,
): MountedAreaChart {
	container.replaceChildren();

	const chart = init(container, snapshot.chartTheme, {
		renderer: "svg",
		width: container.clientWidth || DEFAULT_WIDTH,
		height: container.clientHeight || DEFAULT_HEIGHT,
	});
	chart.setOption(createAreaChartOption(true));

	const resize = (width?: number, height?: number) => {
		chart.resize({
			width: width && width > 0 ? width : undefined,
			height: height && height > 0 ? height : undefined,
		});
	};

	let disconnectResize: () => void;
	if (typeof ResizeObserver === "function") {
		const observer = new ResizeObserver(([entry]) => {
			if (entry) {
				resize(entry.contentRect.width, entry.contentRect.height);
			}
		});
		observer.observe(container);
		disconnectResize = () => observer.disconnect();
	} else {
		const onWindowResize = () => resize();
		window.addEventListener("resize", onWindowResize);
		disconnectResize = () =>
			window.removeEventListener("resize", onWindowResize);
	}

	return {
		chart,
		dispose() {
			disconnectResize();
			chart.dispose();
		},
	};
}
