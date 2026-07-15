import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { CompiledBrandSnapshot } from "../../branding/compiler";
import { mountAreaChart, renderAreaChartSvg } from "./area-chart-runtime";

const useClientLayoutEffect =
	typeof document === "undefined" ? useEffect : useLayoutEffect;

export interface AreaChartProps {
	readonly snapshot: CompiledBrandSnapshot;
	readonly initialSvg?: string;
	readonly className?: string;
}

export function AreaChart({ snapshot, initialSvg, className }: AreaChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const serverSvg = useMemo(
		() => initialSvg ?? renderAreaChartSvg(snapshot),
		[initialSvg, snapshot],
	);

	useClientLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const mountedChart = mountAreaChart(container, snapshot);
		return () => mountedChart.dispose();
	}, [snapshot]);

	return (
		<div
			ref={containerRef}
			className={["brand-lab-area-chart", className].filter(Boolean).join(" ")}
			data-brand-hash={snapshot.hash}
			data-chart-provider="apache-echarts"
			role="img"
			aria-label="Monthly generated reports and completed automations"
			dangerouslySetInnerHTML={{ __html: serverSvg }}
		/>
	);
}
