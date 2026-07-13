import {
	ComponentPage,
	ExampleBlock,
	PropsTable,
} from "@appranks/showcase-kit";
import {
	Badge,
	Button,
	Card,
	Input,
	InputSelect,
	PageSection,
	SegmentedControl,
	type SettingsNavGroup,
	SettingsRow,
	SettingsShell,
	Toggle,
} from "@lemn-ltd/ui";
import type { ReactElement, ReactNode } from "react";

const GROUPS: readonly SettingsNavGroup[] = [
	{
		header: "Settings",
		items: [
			{ id: "general", label: "General", icon: "settings" },
			{ id: "account", label: "Account", icon: "user-check" },
			{ id: "security", label: "Security", icon: "lock" },
			{
				id: "integrations",
				label: "Integrations",
				icon: "plug",
				badge: <Badge tone="accent">Beta</Badge>,
			},
		],
	},
	{
		header: "Workspace",
		items: [
			{ id: "appearance", label: "Appearance", icon: "monitor" },
			{ id: "editor", label: "Editor", icon: "code" },
			{ id: "advanced", label: "Advanced", icon: "wrench" },
			{ id: "about", label: "About", icon: "info" },
		],
	},
];

function renderSection(id: string): ReactNode {
	if (id === "general") {
		return (
			<>
				<PageSection
					caption="How sessions are classified and surfaced."
					title="General"
				>
					<Card>
						<SettingsRow
							description="Automatically classify sessions as blocked, ready, or done."
							label="Classify session states"
						>
							<Toggle aria-label="Classify session states" defaultChecked />
						</SettingsRow>
						<SettingsRow
							description="Pick the language for the interface."
							label="Language"
						>
							<InputSelect
								aria-label="Language"
								defaultValue="en"
								options={[
									{ value: "en", label: "English" },
									{ value: "es", label: "Spanish" },
									{ value: "fr", label: "French" },
								]}
							/>
						</SettingsRow>
						<SettingsRow
							description="Density of list and table rows."
							label="Display density"
						>
							<SegmentedControl
								aria-label="Display density"
								defaultValue="comfortable"
								segments={[
									{ value: "compact", label: "Compact" },
									{ value: "comfortable", label: "Comfortable" },
								]}
							/>
						</SettingsRow>
						<SettingsRow
							description="Shown on shared sessions and exports."
							label="Display name"
						>
							<Input
								aria-label="Display name"
								defaultValue="Example User"
								style={{ width: 200 }}
							/>
						</SettingsRow>
					</Card>
				</PageSection>
				<PageSection
					caption="Long content scrolls within the detail pane."
					title="Telemetry"
				>
					<Card>
						{[
							"Crash reports",
							"Usage analytics",
							"Performance traces",
							"Beta features",
							"Email digests",
						].map((label) => (
							<SettingsRow
								description={`Toggle ${label.toLowerCase()}.`}
								key={label}
								label={label}
							>
								<Toggle aria-label={label} />
							</SettingsRow>
						))}
					</Card>
				</PageSection>
			</>
		);
	}
	if (id === "appearance") {
		return (
			<PageSection caption="Theme and motion preferences." title="Appearance">
				<Card>
					<SettingsRow
						description="Match the system or pick a fixed theme."
						label="Theme"
					>
						<SegmentedControl
							aria-label="Theme"
							defaultValue="system"
							segments={[
								{ value: "light", label: "Light" },
								{ value: "dark", label: "Dark" },
								{ value: "system", label: "System" },
							]}
						/>
					</SettingsRow>
					<SettingsRow
						description="Reduce non-essential animation."
						label="Reduced motion"
					>
						<Toggle aria-label="Reduced motion" />
					</SettingsRow>
				</Card>
			</PageSection>
		);
	}
	return (
		<PageSection
			caption="This section is a placeholder for the showcase."
			title={`${id[0]?.toUpperCase()}${id.slice(1)}`}
		>
			<Card>
				<p>
					Each section owns its own controls; the shell only routes between
					them.
				</p>
			</Card>
		</PageSection>
	);
}

function SettingsShellPage(): ReactElement {
	return (
		<ComponentPage
			status="stable"
			summary="A master-detail surface for settings and configuration: a grouped, searchable section nav beside an independently scrolling detail pane. Selection, search, and optional full nav collapse are controllable, the nav is a keyboard-navigable vertical tab list, and it presents inline or as a focus-trapped modal."
			title="Settings shell"
		>
			<ExampleBlock
				code={`<SettingsShell
  variant="surface"
  groups={groups}
  detailFooter={
    <>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save changes</Button>
    </>
  }
>
  {(section) => renderSection(section)}
</SettingsShell>`}
				render={() => (
					<div style={{ height: 580 }}>
						<SettingsShell
							detailFooter={
								<>
									<Button variant="secondary">Cancel</Button>
									<Button variant="primary">Save changes</Button>
								</>
							}
							groups={GROUPS}
							variant="surface"
						>
							{(section) => renderSection(section)}
						</SettingsShell>
					</div>
				)}
			/>

			<ExampleBlock
				code={`<SettingsShell
  collapsibleNav
  defaultNavCollapsed
  variant="surface"
  groups={groups}
>
  {(section) => renderSection(section)}
</SettingsShell>`}
				render={() => (
					<div style={{ height: 420 }}>
						<SettingsShell
							collapsibleNav
							defaultNavCollapsed
							groups={GROUPS}
							variant="surface"
						>
							{(section) => renderSection(section)}
						</SettingsShell>
					</div>
				)}
			/>

			<ExampleBlock
				code={`<SettingsShell
  modal
  title="Preferences"
  trigger={<Button variant="secondary">Open preferences</Button>}
  groups={groups}
>
  {(section) => renderSection(section)}
</SettingsShell>`}
				render={() => (
					<SettingsShell
						groups={GROUPS}
						modal
						title="Preferences"
						trigger={<Button variant="secondary">Open preferences</Button>}
					>
						{(section) => renderSection(section)}
					</SettingsShell>
				)}
			/>

			<PropsTable
				rows={[
					{
						name: "groups",
						type: "readonly SettingsNavGroup[]",
						description:
							"Grouped sections; each group has an optional header and a list of items.",
					},
					{
						name: "children",
						type: "ReactNode | ((activeSection: string) => ReactNode)",
						description:
							"Detail body: a static node, or a render function receiving the active id.",
					},
					{
						name: "activeSection",
						type: "string",
						description: "Controlled active section id.",
					},
					{
						name: "defaultActiveSection",
						type: "string",
						description:
							"Initial section for uncontrolled use; defaults to the first enabled item.",
					},
					{
						name: "onSectionChange",
						type: "(id: string) => void",
						description:
							"Called when the active section changes (click or keyboard).",
					},
					{
						name: "title",
						type: "ReactNode",
						description:
							"Heading above the panes; also the accessible name in modal mode.",
					},
					{
						name: "onClose",
						type: "() => void",
						description:
							"Renders a header close control inline; ignored in modal mode.",
					},
					{
						name: "searchable",
						type: "boolean",
						description: "Show the built-in nav filter field. Default true.",
					},
					{
						name: "searchValue / onSearchChange",
						type: "string / (next: string) => void",
						description:
							"Control the search query externally; omit for built-in filtering.",
					},
					{
						name: "searchEmpty",
						type: "ReactNode",
						description: "Shown when the search filters every section out.",
					},
					{
						name: "collapsibleNav",
						type: "boolean",
						description:
							"Enable the left navigation collapse control. Default false, so existing shells stay expanded.",
					},
					{
						name: "navCollapsed / defaultNavCollapsed / onNavCollapsedChange",
						type: "boolean / boolean / (collapsed) => void",
						description:
							"Control or initialize the collapsed navigation state when collapsibleNav is enabled.",
					},
					{
						name: "detailHeader / detailFooter",
						type: "ReactNode",
						description:
							"Sticky regions above/below the scrolling detail body.",
					},
					{
						name: "error",
						type: "ReactNode",
						description:
							"Error-summary banner (InfoBanner danger) at the end of the detail body; scrolls with the content.",
					},
					{
						name: "variant",
						type: "'plain' | 'surface'",
						description:
							"'plain' fills a region; 'surface' adds a bordered, rounded card frame.",
					},
					{
						name: "modal / trigger / open / defaultOpen / onOpenChange",
						type: "boolean / ReactNode / boolean / boolean / (open) => void",
						description:
							"Present the shell inside a focus-trapped overlay with the usual open controls.",
					},
				]}
			/>
		</ComponentPage>
	);
}

export default SettingsShellPage;
