import { BarList, type BarListProps } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { reportCategories } from "../../../fixtures/index.js";
import {
	defineVisualizationApiRows,
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const API_ROWS = defineVisualizationApiRows<BarListProps>()([
	{
		prop: "items",
		type: "readonly BarListItem[]",
		description: "Label, value, and optional link or action for each row.",
	},
	{
		prop: "sortOrder",
		type: "'ascending' | 'descending' | 'none'",
		defaultValue: "'descending'",
		description: "Sorts by value or preserves input order.",
	},
	{
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description:
			"Animates representative bars while respecting reduced motion.",
	},
	{
		prop: "onValueChange",
		type: "(item: BarListItem) => void",
		description:
			"Reports the activated row without replacing native link or button behavior.",
	},
	{
		prop: "valueFormatter",
		type: "(value: number) => string",
		description: "Formats the visible value.",
	},
]);

const CODE = `import { BarList } from '@lemn-ltd/ui';

<BarList
  aria-label="Report views"
  items={reportCategories}
  valueFormatter={(value) => value.toLocaleString()}
/>`;

function BarListPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="BarList"
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<BarList aria-label="Report views" items={reportCategories} />
				</div>
			)}
			summary="Rank categories with readable values and CSS bars, using real links or buttons when rows are interactive."
			title="Bar list"
		/>
	);
}

export default BarListPage;
