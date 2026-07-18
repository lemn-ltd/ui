import {
	ComponentPage,
	ExampleBlock,
	PropsTable,
} from "@portal/catalog-kit";
import { Tabs } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";
import {
	defaultTabValue,
	overflowDefaultTabValue,
	overflowTabs,
	tabs as tabItems,
} from "../../../fixtures";

function TabsPage(): ReactElement {
	const [value, setValue] = useState(defaultTabValue);
	const [overflowValue, setOverflowValue] = useState(overflowDefaultTabValue);
	const [railValue, setRailValue] = useState(defaultTabValue);
	const tabsWithPanels = tabItems.map((item) => ({
		...item,
		content: (
			<div style={{ padding: "var(--lemn-space-4) 0", color: "var(--lemn-color-text-muted)" }}>
				{item.label} panel content remains associated with its trigger.
			</div>
		),
	}));

	return (
		<ComponentPage
			status="stable"
			summary="Accessible triggers and real tab panels with stable relationships, controlled or uncontrolled state, and explicit preserve or lazy mounting."
			title="Tabs"
		>
			<ExampleBlock
				code={`const [value, setValue] = useState('overview');

<Tabs items={tabsWithPanels} value={value} onValueChange={setValue} />`}
				render={() => (
					<div style={{ width: "100%" }}>
						<Tabs
							aria-label="Entity views"
							items={tabsWithPanels}
							onValueChange={setValue}
							value={value}
						/>
					</div>
				)}
			/>

			<ExampleBlock
				code={`// orientation="vertical" renders a sidebar rail with a left accent bar.
<Tabs orientation="vertical" items={tabs} value={value} onValueChange={setValue} />`}
				render={() => (
					<div style={{ width: 240 }}>
						<Tabs
							items={tabsWithPanels}
							onValueChange={setRailValue}
							orientation="vertical"
							value={railValue}
						/>
					</div>
				)}
			/>

			<ExampleBlock
				code={`// 11 tabs overflow the rail.
<Tabs items={overflowTabs} value={value} onValueChange={setValue} />`}
				render={() => (
					<div style={{ width: "100%" }}>
						<Tabs
							items={overflowTabs}
							onValueChange={setOverflowValue}
							value={overflowValue}
						/>
					</div>
				)}
			/>

			<PropsTable
				rows={[
					{
						name: "items",
						type: "readonly TabItem[]",
						description:
							"Triggers and their associated panel content, count, and disabled state.",
					},
					{
						name: "value",
						type: "string",
						description: "Optional controlled active value.",
					},
					{
						name: "defaultValue",
						type: "string",
						description: "Initial active value for uncontrolled state.",
					},
					{
						name: "mountStrategy",
						type: "'preserve' | 'lazy'",
						defaultValue: "'preserve'",
						description:
							"Preserves inactive panel state unless lazy mounting is explicitly requested.",
					},
					{
						name: "onValueChange",
						type: "(value: string) => void",
						description:
							"Fires with the next value when a trigger is selected.",
					},
					{
						name: "orientation",
						type: "'horizontal' | 'vertical'",
						defaultValue: "'horizontal'",
						description:
							"Layout. 'horizontal' (default) is an underline tab row; 'vertical' is a sidebar rail with a left accent bar.",
					},
					{
						name: "activationMode",
						type: "'automatic' | 'manual'",
						defaultValue: "'automatic'",
						description:
							"Controls whether keyboard focus or an explicit action activates a tab.",
					},
					{
						name: "id",
						type: "string",
						description:
							"Stable base ID used to associate triggers and panels.",
					},
					{
						name: "aria-label",
						type: "string",
						description: "Accessible name for the tab list.",
					},
					{
						name: "className",
						type: "string",
						description: "Additional class name on the tabs root.",
					},
				]}
			/>
		</ComponentPage>
	);
}

export default TabsPage;
