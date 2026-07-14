import { ComponentPage } from "@lemn-ltd/showcase-kit";
import {
	AreaChart,
	BarChart,
	Card,
	DonutChart,
	LineChart,
	ListShell,
	PageHeader,
	SectionGrid,
	Sidebar,
	Sparkline,
	StatsStrip,
	TopBar,
} from "@lemn-ltd/ui";
import type { CSSProperties, ReactElement } from "react";
import { useSearchParams } from "react-router-dom";
import {
	monthlyReportData,
	navGroups,
	sparklinePoints,
	stats,
	trafficSources,
} from "../../../fixtures";

// A fixed-height bordered frame replicating the screen shell so the dashboard
// reads as a docs preview, not the page's own viewport.
const FRAME: CSSProperties = {
	display: "grid",
	gridTemplateColumns: "auto 1fr",
	height: 640,
	border: "1px solid var(--border)",
	borderRadius: "var(--radius-lg)",
	overflow: "hidden",
	background: "var(--bg)",
};

const MAIN: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	minWidth: 0,
};

const CONTENT: CSSProperties = {
	flex: 1,
	minHeight: 0,
	overflow: "auto",
};

const TREND: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: "var(--space-3)",
};

const TREND_VALUE: CSSProperties = {
	fontSize: "var(--font-size-display)",
	fontWeight: 600,
	lineHeight: "var(--line-height-display)",
};

const TREND_CHART: CSSProperties = {
	height: 64,
};

const TRENDS: readonly { id: string; label: string; value: string }[] = [
	{ id: "trend-throughput", label: "Throughput", value: "8.2k" },
	{ id: "trend-latency", label: "Latency", value: "128ms" },
	{ id: "trend-errors", label: "Errors", value: "0.4%" },
];

const STRESS_REPORT_DATA = Array.from({ length: 240 }, (_, index) => ({
	month: `P${String(index + 1).padStart(3, "0")}`,
	revenue: 48 + Math.round(Math.sin(index / 7) * 18 + index / 8),
	expenses: 31 + Math.round(Math.cos(index / 9) * 11 + index / 13),
	conversion: 34 + Math.round(Math.sin(index / 11) * 9),
}));

const CHART_CARD: CSSProperties = {
	minWidth: 0,
};

function DashboardPage(): ReactElement {
	const [searchParams] = useSearchParams();
	const reportData =
		searchParams.get("dataset") === "stress"
			? STRESS_REPORT_DATA
			: monthlyReportData;

	return (
		<ComponentPage
			status="stable"
			summary="An overview screen: the shell wraps a stats strip of headline metrics and a section grid of trend cards, each pairing a value with a sparkline."
			title="Dashboard"
		>
			<div data-benchmark-ready="true" style={FRAME}>
				<Sidebar groups={navGroups} mode="expanded" />
				<div style={MAIN}>
					<TopBar />
					<div style={CONTENT}>
						<ListShell>
							<PageHeader
								subtitle="Activity across the workspace."
								title="Overview"
							/>
							<StatsStrip stats={stats} />
							<SectionGrid>
								{TRENDS.map((trend) => (
									<Card key={trend.id} title={trend.label}>
										<div style={TREND}>
											<span style={TREND_VALUE}>{trend.value}</span>
											<Sparkline
												aria-label={`${trend.label} trend`}
												points={sparklinePoints}
												style={TREND_CHART}
											/>
										</div>
									</Card>
								))}
							</SectionGrid>
							<SectionGrid>
								<Card title="Revenue trend">
									<div style={CHART_CARD}>
										<LineChart
											aria-label="Dashboard revenue trend"
											data={reportData}
											height={220}
											index="month"
											series={[
												{ dataKey: "revenue", name: "Revenue" },
												{ dataKey: "expenses", name: "Expenses" },
											]}
										/>
									</div>
								</Card>
								<Card title="Revenue area">
									<div style={CHART_CARD}>
										<AreaChart
											aria-label="Dashboard revenue area"
											data={reportData}
											height={220}
											index="month"
											series={[{ dataKey: "revenue", name: "Revenue" }]}
										/>
									</div>
								</Card>
								<Card title="Monthly comparison">
									<div style={CHART_CARD}>
										<BarChart
											aria-label="Dashboard monthly comparison"
											data={reportData}
											height={220}
											index="month"
											series={[
												{ dataKey: "revenue", name: "Revenue" },
												{ dataKey: "expenses", name: "Expenses" },
											]}
										/>
									</div>
								</Card>
								<Card title="Traffic mix">
									<div style={CHART_CARD}>
										<DonutChart
											aria-label="Dashboard traffic mix"
											data={trafficSources}
											height={220}
										/>
									</div>
								</Card>
							</SectionGrid>
						</ListShell>
					</div>
				</div>
			</div>
		</ComponentPage>
	);
}

export default DashboardPage;
