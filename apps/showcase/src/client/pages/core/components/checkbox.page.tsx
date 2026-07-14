import {
	DocumentationFooter,
	DocumentationPage,
	DocumentationSection,
	DocumentationSteps,
	ExampleBlock,
} from "@lemn-ltd/showcase-kit";
import { Checkbox, SyntaxCodeBlock } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";

const CHECKBOX_USAGE = `import { Checkbox } from '@lemn-ltd/ui';

export function CheckboxExample() {
  return <Checkbox aria-label="Enable notifications" />;
}`;

const STATES_USAGE = `<div className="checkbox-stack">
  <div className="checkbox-row">
    <Checkbox id="sms-updates" />
    <label htmlFor="sms-updates">Receive updates by SMS.</label>
  </div>
  <div className="checkbox-row">
  <Checkbox
    defaultChecked
    id="sms-updates-default"
  />
  <label htmlFor="sms-updates-default">Receive updates by SMS.</label>
  </div>
  <div className="checkbox-row" data-disabled="true">
  <Checkbox
    disabled
    id="sms-updates-disabled"
  />
  <label htmlFor="sms-updates-disabled">Receive updates by SMS.</label>
  </div>
</div>`;

const INDETERMINATE_USAGE = `const [checked, setChecked] = useState<
  boolean | 'indeterminate'
>('indeterminate');

<div className="checkbox-row">
  <Checkbox
    checked={checked}
    id="select-all-rows"
    onCheckedChange={setChecked}
  />
  <label htmlFor="select-all-rows">Select all rows</label>
</div>`;

function CheckboxPage(): ReactElement {
	const [heroChecked, setHeroChecked] = useState(false);
	const [bulkChecked, setBulkChecked] = useState<boolean | "indeterminate">(
		"indeterminate",
	);

	return (
		<DocumentationPage
			category="Inputs"
			resources={[
				{
					href: "https://www.radix-ui.com/primitives/docs/components/checkbox",
					label: "Radix Docs",
				},
				{
					href: "https://www.radix-ui.com/primitives/docs/components/checkbox#api-reference",
					label: "API Reference",
				},
				{ href: "https://github.com/lemn-ltd/ui", label: "GitHub" },
			]}
			summary="Choose an option with checked, unchecked, and indeterminate states."
			title="Checkbox"
		>
			<ExampleBlock
				code={CHECKBOX_USAGE}
				presentation="documentation"
				render={() => (
					<Checkbox
						aria-label="Enable notifications"
						checked={heroChecked}
						onCheckedChange={(next) => setHeroChecked(next === true)}
					/>
				)}
			/>

			<DocumentationSection title="Installation">
				<DocumentationSteps
					steps={[
						{
							title: "Install the package:",
							content: (
								<SyntaxCodeBlock
									language="bash"
									value="pnpm add @lemn-ltd/ui"
								/>
							),
						},
						{
							title: "Load the component:",
							description: (
								<p>
									Import the shared stylesheet once at the application root,
									then import Checkbox from the package entrypoint.
								</p>
							),
							content: (
								<SyntaxCodeBlock
									language="tsx"
									value={`import '@lemn-ltd/ui/styles.css';
import { Checkbox } from '@lemn-ltd/ui';`}
								/>
							),
						},
					]}
				/>
			</DocumentationSection>

			<DocumentationSection title="Example: States">
				<ExampleBlock
					code={STATES_USAGE}
					presentation="documentation"
					render={() => (
						<div className="showcase-docs-checkbox-stack">
							<div className="showcase-docs-checkbox-label">
								<Checkbox id="sms-updates" />
								<label htmlFor="sms-updates">Unchecked</label>
							</div>
							<div className="showcase-docs-checkbox-label">
								<Checkbox defaultChecked id="sms-updates-default" />
								<label htmlFor="sms-updates-default">Default checked</label>
							</div>
							<div
								className="showcase-docs-checkbox-label"
								data-disabled="true"
							>
								<Checkbox disabled id="sms-updates-disabled" />
								<label htmlFor="sms-updates-disabled">Disabled</label>
							</div>
						</div>
					)}
				/>
			</DocumentationSection>

			<DocumentationSection
				description={
					<p>
						Use <code>indeterminate</code> for a mixed selection, such as a
						parent row whose children are only partly selected.
					</p>
				}
				title="Example: Indeterminate"
			>
				<ExampleBlock
					code={INDETERMINATE_USAGE}
					presentation="documentation"
					render={() => (
						<div className="showcase-docs-checkbox-label">
							<Checkbox
								checked={bulkChecked}
								id="select-all-rows"
								onCheckedChange={setBulkChecked}
							/>
							<label htmlFor="select-all-rows">Select all rows</label>
						</div>
					)}
				/>
			</DocumentationSection>

			<DocumentationFooter
				apiHref="https://www.radix-ui.com/primitives/docs/components/checkbox#api-reference"
				apiLabel="Radix UI API"
				apiRows={[
					{
						prop: "checked",
						type: "boolean | 'indeterminate'",
						description: "Controlled checked state.",
					},
					{
						prop: "defaultChecked",
						type: "boolean | 'indeterminate'",
						description: "Initial state when the checkbox is uncontrolled.",
					},
					{
						prop: "onCheckedChange",
						type: "(checked: CheckedState) => void",
						description: "Called when the checked state changes.",
					},
					{
						prop: "disabled",
						type: "boolean",
						description: "Prevents interaction when set.",
					},
					{
						prop: "required",
						type: "boolean",
						description: "Marks the checkbox as required in a form.",
					},
					{
						prop: "name",
						type: "string",
						description: "Name submitted with the form value.",
					},
					{
						prop: "value",
						type: "string",
						defaultValue: '"on"',
						description: "Value submitted when checked.",
					},
					{
						prop: "className",
						type: "string",
						description: "Additional class names applied to the root.",
					},
				]}
				componentName="Checkbox"
				copyright="2026 LEMN. All rights reserved."
				issueHref="https://github.com/lemn-ltd/ui/issues/new"
			/>
		</DocumentationPage>
	);
}

export default CheckboxPage;
