import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Pie,
	PieChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { CompiledBrandSnapshot } from "../../branding/compiler";

const REVENUE_DATA = Object.freeze([
	{ month: "Jan", revenue: 42, target: 31 },
	{ month: "Feb", revenue: 51, target: 38 },
	{ month: "Mar", revenue: 47, target: 41 },
	{ month: "Apr", revenue: 63, target: 46 },
	{ month: "May", revenue: 58, target: 50 },
	{ month: "Jun", revenue: 74, target: 56 },
]);

const CHANNEL_DATA = Object.freeze([
	{ name: "Direct", value: 46 },
	{ name: "Partners", value: 31 },
	{ name: "Organic", value: 23 },
]);

export interface RechartsBrandChartProps {
	readonly snapshot: CompiledBrandSnapshot;
	readonly className?: string;
}

export function RechartsBarChart({
	snapshot,
	className,
}: RechartsBrandChartProps) {
	const theme = readChartTokens(snapshot);
	const ready = useProviderReady();

	return (
		<div
			className={["brand-lab-recharts-chart", className]
				.filter(Boolean)
				.join(" ")}
			data-chart-provider="recharts"
			data-chart-kind="bar"
			data-chart-primary={theme.primary}
			data-brand-hash={snapshot.hash}
		>
			{ready ? (
				<BarChart
					accessibilityLayer
					responsive
					width="100%"
					height={300}
					data={REVENUE_DATA}
					margin={{ top: 16, right: 10, bottom: 4, left: -12 }}
				>
					<CartesianGrid
						stroke={theme.border}
						strokeOpacity={0.62}
						vertical={false}
					/>
					<XAxis
						dataKey="month"
						axisLine={false}
						tickLine={false}
						tick={{
							fill: theme.textMuted,
							fontFamily: theme.font,
							fontSize: 12,
						}}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{
							fill: theme.textMuted,
							fontFamily: theme.font,
							fontSize: 12,
						}}
					/>
					<Tooltip
						contentStyle={tooltipStyle(theme)}
						cursor={{ fill: theme.surfaceMuted }}
						itemStyle={{ color: theme.text }}
						labelStyle={{ color: theme.text, fontWeight: 700 }}
					/>
					<Legend
						iconType="circle"
						wrapperStyle={{ color: theme.textMuted, fontFamily: theme.font }}
					/>
					<Bar
						dataKey="revenue"
						name="Revenue"
						fill={theme.primary}
						radius={[6, 6, 0, 0]}
					/>
					<Bar
						dataKey="target"
						name="Target"
						fill={theme.secondary}
						radius={[6, 6, 0, 0]}
					/>
				</BarChart>
			) : (
				<BrandedChartFallback
					label="Revenue by month"
					primary={theme.primary}
				/>
			)}
		</div>
	);
}

export function RechartsDonutChart({
	snapshot,
	className,
}: RechartsBrandChartProps) {
	const theme = readChartTokens(snapshot);
	const ready = useProviderReady();
	const data = CHANNEL_DATA.map((item, index) => ({
		...item,
		fill: [theme.primary, theme.secondary, theme.tertiary][index],
	}));

	return (
		<div
			className={["brand-lab-recharts-chart", className]
				.filter(Boolean)
				.join(" ")}
			data-chart-provider="recharts"
			data-chart-kind="donut"
			data-chart-primary={theme.primary}
			data-brand-hash={snapshot.hash}
		>
			{ready ? (
				<PieChart accessibilityLayer responsive width="100%" height={300}>
					<Tooltip
						contentStyle={tooltipStyle(theme)}
						itemStyle={{ color: theme.text }}
						labelStyle={{ color: theme.text, fontWeight: 700 }}
					/>
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="45%"
						innerRadius={62}
						outerRadius={96}
						paddingAngle={3}
						cornerRadius={6}
						stroke={theme.surface}
						strokeWidth={2}
					/>
					<Legend
						iconType="circle"
						verticalAlign="bottom"
						wrapperStyle={{ color: theme.textMuted, fontFamily: theme.font }}
					/>
				</PieChart>
			) : (
				<BrandedChartFallback
					label="Revenue by channel"
					primary={theme.primary}
				/>
			)}
		</div>
	);
}

interface ResolvedChartTokens {
	readonly primary: string;
	readonly secondary: string;
	readonly tertiary: string;
	readonly surface: string;
	readonly surfaceMuted: string;
	readonly text: string;
	readonly textMuted: string;
	readonly border: string;
	readonly font: string;
	readonly radius: string;
	readonly shadow: string;
}

function readChartTokens(snapshot: CompiledBrandSnapshot): ResolvedChartTokens {
	return {
		primary: requiredToken(snapshot, "--brand-chart-primary"),
		secondary: requiredToken(snapshot, "--brand-chart-secondary"),
		tertiary: requiredToken(snapshot, "--brand-chart-tertiary"),
		surface: requiredToken(snapshot, "--brand-surface"),
		surfaceMuted: requiredToken(snapshot, "--brand-surface-muted"),
		text: requiredToken(snapshot, "--brand-text"),
		textMuted: requiredToken(snapshot, "--brand-text-muted"),
		border: requiredToken(snapshot, "--brand-border"),
		font: requiredToken(snapshot, "--brand-font-body"),
		radius: requiredToken(snapshot, "--brand-control-radius"),
		shadow: requiredToken(snapshot, "--brand-shadow-card"),
	};
}

function requiredToken(snapshot: CompiledBrandSnapshot, name: string): string {
	const value = snapshot.tokens[name];
	if (!value) throw new Error(`Missing compiled brand token: ${name}`);
	return value;
}

function tooltipStyle(theme: ResolvedChartTokens) {
	return {
		backgroundColor: theme.surface,
		border: `1px solid ${theme.border}`,
		borderRadius: theme.radius,
		boxShadow: theme.shadow,
		color: theme.text,
		fontFamily: theme.font,
	};
}

function useProviderReady(): boolean {
	const [ready, setReady] = useState(false);
	useEffect(() => setReady(true), []);
	return ready;
}

function BrandedChartFallback({
	label,
	primary,
}: {
	readonly label: string;
	readonly primary: string;
}) {
	return (
		<div
			className="brand-lab-chart-fallback"
			data-recharts-ssr-fallback="true"
			role="img"
			aria-label={`${label}. Interactive Recharts visualization loads after hydration.`}
		>
			<span aria-hidden="true" style={{ backgroundColor: primary }} />
			<strong>{label}</strong>
			<small>Chart 1 · {primary}</small>
		</div>
	);
}
