import {
	type DocumentationApiRow,
	DocumentationFooter,
	DocumentationPage,
	DocumentationSection,
	DocumentationSteps,
	ExampleBlock,
	UI_PACKAGE_INSTALL_COMMAND,
} from "@portal/catalog-kit";
import { SyntaxCodeBlock } from "@lemn-ltd/ui";
import type { ReactElement, ReactNode } from "react";

export const VISUALIZATION_PREVIEW_STYLE = {
	width: "min(720px, 100%)",
} as const;

interface VisualizationDocsProps {
	readonly apiRows: readonly DocumentationApiRow[];
	readonly children?: ReactNode;
	readonly code: string;
	readonly componentName: string;
	readonly includeCartesianApi?: boolean;
	readonly includeChartStateApi?: boolean;
	readonly defaultHeight?: string;
	readonly render: () => ReactElement;
	readonly summary: string;
	readonly title: string;
}

function cartesianChartApiRows(): readonly DocumentationApiRow[] {
	return [
		{
			prop: "xAxis",
			type: "ChartXAxisOptions | false",
			description:
				"Configures visibility, label, start/end ticks, interval policy, and tick gap; false hides the axis.",
		},
		{
			prop: "yAxis",
			type: "ChartYAxisOptions | false",
			description:
				"Configures visibility, label, width, domain, decimal policy, and tick formatting; false hides the axis.",
		},
		{
			prop: "legendPosition",
			type: "'left' | 'center' | 'right'",
			defaultValue: "'right'",
			description: "Aligns the engine-independent series legend.",
		},
		{
			prop: "legendOverflow",
			type: "'wrap' | 'scroll'",
			defaultValue: "'wrap'",
			description:
				"Wraps legend controls or exposes a keyboard-operable horizontal scroller.",
		},
		{
			prop: "onValueChange",
			type: "(selection: ChartSelection<TDatum>) => void",
			description:
				"Makes data marks selectable and emits the selected datum or null when cleared.",
		},
		{
			prop: "onTooltipChange",
			type: "(context: ChartTooltipContext<TDatum> | null) => void",
			description:
				"Reports normalized tooltip lifecycle changes without exposing renderer payloads.",
		},
		{
			prop: "renderTooltip",
			type: "(context: ChartTooltipContext<TDatum>) => ReactNode",
			description:
				"Renders custom tooltip content from the normalized Lemn context.",
		},
	];
}

function chartStateApiRows(
	defaultHeight?: string,
): readonly DocumentationApiRow[] {
	return [
		{
			prop: "aria-label",
			type: "string",
			description: "Accessible name; use this or aria-labelledby.",
		},
		{
			prop: "aria-labelledby",
			type: "string",
			description:
				"ID of an external accessible label; use this or aria-label.",
		},
		{
			prop: "className",
			type: "string",
			description: "Additional class name on the engine-independent frame.",
		},
		{
			prop: "emptyMessage",
			type: "string",
			defaultValue: "'No data available.'",
			description: "Announced empty-state copy.",
		},
		{
			prop: "error",
			type: "string",
			description: "Recoverable error message rendered with alert semantics.",
		},
		{
			prop: "height",
			type: "number",
			defaultValue: defaultHeight,
			description: "Stable visualization height in CSS pixels.",
		},
		{
			prop: "loading",
			type: "boolean",
			defaultValue: "false",
			description: "Replaces content with an announced loading state.",
		},
		{
			prop: "onRetry",
			type: "() => void",
			description: "Adds a Retry action when error is present.",
		},
		{
			prop: "style",
			type: "CSSProperties",
			description:
				"Additional frame styles; renderer internals remain private.",
		},
	];
}

type AllKeys<T> = T extends unknown ? keyof T : never;
type StringKey<T> = Extract<AllKeys<T>, string>;
type VisualizationApiRow<T> = Omit<DocumentationApiRow, "prop"> & {
	readonly prop: StringKey<T>;
};
type SharedChartApiKey =
	| "aria-label"
	| "aria-labelledby"
	| "className"
	| "emptyMessage"
	| "error"
	| "height"
	| "loading"
	| "onRetry"
	| "style"
	| "legendOverflow"
	| "legendPosition"
	| "onTooltipChange"
	| "onValueChange"
	| "renderTooltip"
	| "xAxis"
	| "yAxis";

/** Compile-time drift gate: every non-shared public prop must have one API row. */
export function defineVisualizationApiRows<T>() {
	return <const TRows extends readonly VisualizationApiRow<T>[]>(
		rows: TRows &
			(Exclude<
				StringKey<T>,
				TRows[number]["prop"] | SharedChartApiKey
			> extends never
				? unknown
				: {
						readonly missingPublicApiRows: Exclude<
							StringKey<T>,
							TRows[number]["prop"] | SharedChartApiKey
						>;
					}),
	): readonly DocumentationApiRow[] => rows;
}

export function VisualizationDocs({
	apiRows,
	children,
	code,
	componentName,
	defaultHeight = "320",
	includeCartesianApi = false,
	includeChartStateApi = true,
	render,
	summary,
	title,
}: VisualizationDocsProps): ReactElement {
	return (
		<DocumentationPage
			category="Visualizations"
			resources={[{ href: "https://github.com/lemn-ltd/ui", label: "GitHub" }]}
			summary={summary}
			title={title}
		>
			<ExampleBlock code={code} presentation="documentation" render={render} />

			<DocumentationSection title="Installation">
				<DocumentationSteps
					steps={[
						{
							title: "Install the package:",
							content: (
								<SyntaxCodeBlock
									language="bash"
									value={UI_PACKAGE_INSTALL_COMMAND}
								/>
							),
						},
						{
							title: "Load the component:",
							description: (
								<p>
									Import the shared stylesheet once at the application root,
									then use the public package entrypoint.
								</p>
							),
							content: (
								<SyntaxCodeBlock
									language="tsx"
									value={`import '@lemn-ltd/ui/styles.css';\nimport { ${componentName} } from '@lemn-ltd/ui';`}
								/>
							),
						},
					]}
				/>
			</DocumentationSection>

			{children}

			<DocumentationFooter
				apiHref="https://github.com/lemn-ltd/ui/tree/main/packages/ui/src/visualizations"
				apiLabel="Source"
				apiRows={[
					...apiRows,
					...(includeCartesianApi ? cartesianChartApiRows() : []),
					...(includeChartStateApi ? chartStateApiRows(defaultHeight) : []),
				]}
				componentName={title}
				copyright="2026 LEMN. All rights reserved."
				issueHref="https://github.com/lemn-ltd/ui/issues/new"
			/>
		</DocumentationPage>
	);
}
