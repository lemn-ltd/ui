import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { compileBrandProject } from "../../../src/branding/compiler";
import { defaultBrandProject } from "../../../src/branding/presets";
import { AreaChart } from "../../../src/providers/echarts/area-chart";
import { renderAreaChartSvg } from "../../../src/providers/echarts/area-chart-runtime";
import { BrandButton } from "../../../src/providers/react-aria/button";
import {
	RechartsBarChart,
	RechartsDonutChart,
} from "../../../src/providers/recharts/charts";
import { BrandCheckbox } from "../../../src/providers/shadcn/checkbox";

describe("provider components on the server", () => {
	it("embeds the exact pre-rendered ECharts SVG and matching brand hash", () => {
		const snapshot = compileBrandProject(defaultBrandProject);
		const initialSvg = renderAreaChartSvg(snapshot);
		const html = renderToString(
			<AreaChart
				snapshot={snapshot}
				initialSvg={initialSvg}
				className="preview-chart"
			/>,
		);

		expect(html).toContain(`data-brand-hash="${snapshot.hash}"`);
		expect(html).toContain('data-chart-provider="apache-echarts"');
		expect(html).toContain("preview-chart");
		expect(html).toContain(initialSvg);
	});

	it("keeps Radix checkbox semantics in the server markup", () => {
		const html = renderToString(
			<BrandCheckbox aria-label="Enable weekly summary" defaultChecked />,
		);

		expect(html).toContain('role="checkbox"');
		expect(html).toContain('aria-checked="true"');
		expect(html).toContain('data-state="checked"');
		expect(html).toContain("brand-lab-checkbox__indicator");
	});

	it("keeps React Aria disabled and pending semantics in server markup", () => {
		const disabledHtml = renderToString(
			<BrandButton isDisabled>Disabled action</BrandButton>,
		);
		const pendingHtml = renderToString(
			<BrandButton isPending>Publishing</BrandButton>,
		);

		expect(disabledHtml).toContain("brand-lab-button");
		expect(disabledHtml).toContain("disabled");
		expect(disabledHtml).toContain("data-disabled");
		expect(pendingHtml).toContain("data-pending");
		expect(pendingHtml).toContain('aria-disabled="true"');
	});

	it("reserves branded SSR fallbacks before native Recharts mounts", () => {
		const snapshot = compileBrandProject(defaultBrandProject);
		const barHtml = renderToString(<RechartsBarChart snapshot={snapshot} />);
		const donutHtml = renderToString(
			<RechartsDonutChart snapshot={snapshot} />,
		);

		for (const html of [barHtml, donutHtml]) {
			expect(html).toContain('data-chart-provider="recharts"');
			expect(html).toContain(`data-brand-hash="${snapshot.hash}"`);
			expect(html).toContain(
				`data-chart-primary="${defaultBrandProject.colors.chartPrimary}"`,
			);
			expect(html).toContain('data-recharts-ssr-fallback="true"');
			expect(html).toContain(
				"Interactive Recharts visualization loads after hydration",
			);
			expect(html).not.toContain("recharts-surface");
		}

		expect(barHtml).toContain('data-chart-kind="bar"');
		expect(donutHtml).toContain('data-chart-kind="donut"');
	});
});
