export type ComponentCapability =
	| "button"
	| "checkbox"
	| "area-chart"
	| "bar-chart"
	| "donut-chart";

export type ProviderIntegrationMode = "runtime" | "source-snapshot";

export interface ComponentProviderSelection {
	readonly capability: ComponentCapability;
	readonly publicComponent:
		| "BrandButton"
		| "BrandCheckbox"
		| "AreaChart"
		| "RechartsBarChart"
		| "RechartsDonutChart";
	readonly provider: {
		readonly id: "react-aria" | "shadcn" | "apache-echarts" | "recharts";
		readonly name: string;
		readonly version: string;
		readonly license: "Apache-2.0" | "MIT";
		readonly repository: string;
		readonly immutableRef: string;
	};
	readonly integration: {
		readonly mode: ProviderIntegrationMode;
		readonly imports: readonly string[];
		readonly dependencies: readonly {
			readonly packageName: string;
			readonly version: string;
			readonly license: "Apache-2.0" | "ISC" | "MIT";
		}[];
		readonly nativeApiPreserved: true;
		readonly source?: {
			readonly path: string;
			readonly url: string;
			readonly sha256: string;
			readonly transformations: readonly string[];
		};
	};
}

/**
 * The MVP is an explicit component allowlist, not a provider allowlist. Each
 * capability has one owner and every runtime import names the smallest public
 * provider entrypoint required by that component.
 */
export const componentSelections = Object.freeze([
	{
		capability: "button",
		publicComponent: "BrandButton",
		provider: {
			id: "react-aria",
			name: "React Aria Components",
			version: "1.19.0",
			license: "Apache-2.0",
			repository: "https://github.com/adobe/react-spectrum",
			immutableRef: "1c84a49a1faf50b571c84e00bcf9c60b22ddd03e",
		},
		integration: {
			mode: "runtime",
			imports: ["react-aria-components/Button"],
			dependencies: [
				{
					packageName: "react-aria-components",
					version: "1.19.0",
					license: "Apache-2.0",
				},
			],
			nativeApiPreserved: true,
		},
	},
	{
		capability: "checkbox",
		publicComponent: "BrandCheckbox",
		provider: {
			id: "shadcn",
			name: "shadcn/ui with Radix Checkbox",
			version: "source-snapshot",
			license: "MIT",
			repository: "https://github.com/shadcn-ui/ui",
			immutableRef: "bc0705384b51252af26dcc65425b216bf5eb063c",
		},
		integration: {
			mode: "source-snapshot",
			imports: ["@radix-ui/react-checkbox", "lucide-react"],
			dependencies: [
				{
					packageName: "@radix-ui/react-checkbox",
					version: "1.3.7",
					license: "MIT",
				},
				{ packageName: "lucide-react", version: "0.469.0", license: "ISC" },
			],
			nativeApiPreserved: true,
			source: {
				path: "apps/v4/registry/new-york-v4/ui/checkbox.tsx",
				url: "https://github.com/shadcn-ui/ui/blob/bc0705384b51252af26dcc65425b216bf5eb063c/apps/v4/registry/new-york-v4/ui/checkbox.tsx",
				sha256:
					"b23ab9d4deeedf2ac8f512c368361ede681aa383437ef48563a6f9b7dbe95f27",
				transformations: [
					"Omit the React Server Component boundary directive because this Vite/Worker app hydrates the same component directly.",
					"Replace the radix-ui barrel with @radix-ui/react-checkbox.",
					"Replace Tailwind and cn with Brand Lab token class names and local class concatenation.",
					"Rename the local wrapper to BrandCheckbox; retain Root, Indicator, props, state, and events.",
				],
			},
		},
	},
	{
		capability: "area-chart",
		publicComponent: "AreaChart",
		provider: {
			id: "apache-echarts",
			name: "Apache ECharts",
			version: "6.1.0",
			license: "Apache-2.0",
			repository: "https://github.com/apache/echarts",
			immutableRef: "c5a48f5f97d23e5379720870b8444cd05b50ffb4",
		},
		integration: {
			mode: "runtime",
			imports: [
				"echarts/core",
				"echarts/charts",
				"echarts/components",
				"echarts/renderers",
			],
			dependencies: [
				{ packageName: "echarts", version: "6.1.0", license: "Apache-2.0" },
			],
			nativeApiPreserved: true,
		},
	},
	{
		capability: "bar-chart",
		publicComponent: "RechartsBarChart",
		provider: {
			id: "recharts",
			name: "Recharts",
			version: "3.9.2",
			license: "MIT",
			repository: "https://github.com/recharts/recharts",
			immutableRef: "b3451050c027a23957ffa50a2665c9119df21e47",
		},
		integration: {
			mode: "runtime",
			imports: ["recharts"],
			dependencies: [
				{ packageName: "recharts", version: "3.9.2", license: "MIT" },
			],
			nativeApiPreserved: true,
		},
	},
	{
		capability: "donut-chart",
		publicComponent: "RechartsDonutChart",
		provider: {
			id: "recharts",
			name: "Recharts",
			version: "3.9.2",
			license: "MIT",
			repository: "https://github.com/recharts/recharts",
			immutableRef: "b3451050c027a23957ffa50a2665c9119df21e47",
		},
		integration: {
			mode: "runtime",
			imports: ["recharts"],
			dependencies: [
				{ packageName: "recharts", version: "3.9.2", license: "MIT" },
			],
			nativeApiPreserved: true,
		},
	},
] as const satisfies readonly ComponentProviderSelection[]);
