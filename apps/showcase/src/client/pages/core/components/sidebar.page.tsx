import {
	ComponentPage,
	ExampleBlock,
	PropsTable,
} from "@appranks/showcase-kit";
import {
	MenuItem,
	MenuSeparator,
	OrgSwitcher,
	Sidebar,
	SidebarUserRow,
	VersionTag,
} from "@lemn-ltd/ui";
import {
	type CSSProperties,
	type ReactElement,
	type ReactNode,
	useState,
} from "react";
import {
	currentOrgId,
	drillNavGroups,
	navGroups,
	nestedNavGroups,
	orgs,
} from "../../../fixtures";

// Each mode renders inside a stable bordered frame so the shell-scale
// component reads as a preview rather than taking over the page. Only the
// canonical visual target expands to show every navigation and footer item.
function Frame({
	width,
	children,
	visualTarget = false,
}: {
	readonly width: number;
	readonly children: ReactNode;
	readonly visualTarget?: boolean;
}): ReactElement {
	const style: CSSProperties = {
		width,
		height: visualTarget ? 1000 : 420,
		border: "1px solid var(--border)",
		borderRadius: "var(--radius-lg)",
		overflow: "hidden",
		display: "flex",
	};
	return (
		<div
			data-testid={visualTarget ? "sidebar-visual-target" : undefined}
			style={style}
		>
			{children}
		</div>
	);
}

function userRow(collapsed: boolean): ReactElement {
	return (
		<SidebarUserRow
			avatarColor="teal"
			collapsed={collapsed}
			email="avery@example.com"
			initials="AV"
			name="Avery Quinn"
		>
			<MenuItem icon="user-check">Profile</MenuItem>
			<MenuItem icon="settings">Settings</MenuItem>
			<MenuSeparator />
			<MenuItem icon="log-out" tone="danger">
				Sign out
			</MenuItem>
		</SidebarUserRow>
	);
}

function SidebarPage(): ReactElement {
	// The drill-in variant owns a back affordance; track which surface is shown so
	// the example mirrors a real drill-in / drill-out interaction.
	const [drillOpen, setDrillOpen] = useState(true);

	return (
		<ComponentPage
			status="stable"
			summary="The application rail. Collapse modes — rail (64px), expanded (264px), and hidden — plus a drill-in variant (264px), each composing the org switcher, nav groups, user row, and version tag slots. Nav items accept children, rendering an accessible multi-level tree with keyboard navigation and a rail flyout."
			title="Sidebar"
		>
			<ExampleBlock
				code={`<Sidebar
  mode="expanded"
  groups={navGroups}
  orgSwitcher={<OrgSwitcher orgs={orgs} currentOrgId={currentOrgId} />}
  userRow={<SidebarUserRow initials="AV" name="Avery Quinn" email="avery@example.com">…</SidebarUserRow>}
  versionTag={<VersionTag version="v1.4.0" env="local" />}
/>`}
				render={() => (
					<Frame visualTarget width={264}>
						<Sidebar
							groups={navGroups}
							mode="expanded"
							orgSwitcher={
								<OrgSwitcher
									currentOrgId={currentOrgId}
									orgs={orgs}
									variant="expanded"
								/>
							}
							userRow={userRow(false)}
							versionTag={<VersionTag env="local" version="v1.4.0" />}
						/>
					</Frame>
				)}
			/>

			<ExampleBlock
				code={`// Items with \`children\` render as an expandable tree (WAI-ARIA tree view).
// The active item's ancestors auto-expand; arrow keys move, →/← expand/collapse.
<Sidebar mode="expanded" groups={nestedNavGroups} />`}
				render={() => (
					<Frame width={264}>
						<Sidebar
							groups={nestedNavGroups}
							mode="expanded"
							orgSwitcher={
								<OrgSwitcher
									currentOrgId={currentOrgId}
									orgs={orgs}
									variant="expanded"
								/>
							}
							userRow={userRow(false)}
						/>
					</Frame>
				)}
			/>

			<ExampleBlock
				code={`// Rail navigation opens nested items in a flyout.
<Sidebar mode="rail" groups={nestedNavGroups} railExpand="flyout" />

// Drill-in navigation focuses a secondary navigation context.
<Sidebar variant="drill-in" groups={drillNavGroups} title="Settings" />`}
				render={() => (
					<div
						style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}
					>
						<Frame width={64}>
							<Sidebar
								groups={nestedNavGroups}
								mode="rail"
								orgSwitcher={
									<OrgSwitcher
										currentOrgId={currentOrgId}
										orgs={orgs}
										variant="rail"
									/>
								}
								railExpand="flyout"
								userRow={userRow(true)}
							/>
						</Frame>
						<Frame width={264}>
							<Sidebar
								back="Workspace"
								groups={drillNavGroups}
								hint={drillOpen ? "Project configuration" : "Reopened"}
								onBack={() => setDrillOpen((open) => !open)}
								title="Settings"
								variant="drill-in"
							/>
						</Frame>
					</div>
				)}
			/>

			<PropsTable
				rows={[
					{
						name: "mode",
						type: "'expanded' | 'rail' | 'hidden'",
						description:
							"Collapse mode. Rail shows icons only; expanded shows labels; hidden collapses it away. Inside a ScreenShell it follows the shell when unset.",
					},
					{
						name: "variant",
						type: "'primary' | 'drill-in'",
						description:
							"Content variant. Primary is the app rail; drill-in is a settings/section rail with a back affordance, title, and hint. Both collapse with the shell.",
					},
					{
						name: "groups",
						type: "readonly SidebarNavGroup[]",
						description:
							"Nav groups, each with an optional header and a list of items. An item with a children array becomes an expandable tree node; nest up to ~2 levels and use the drill-in variant for deeper sections.",
					},
					{
						name: "expandedIds / defaultExpandedIds",
						type: "readonly string[]",
						description:
							"Controlled / uncontrolled set of expanded item ids (multi-open). The active item’s ancestors expand regardless so the current page stays visible.",
					},
					{
						name: "onExpandedChange",
						type: "(ids: readonly string[]) => void",
						description:
							"Fires with the next expanded-id set whenever a node is toggled.",
					},
					{
						name: "railExpand",
						type: "'flyout' | 'hidden'",
						defaultValue: "'flyout'",
						description:
							"How nested groups behave in rail mode: open children in a Popover flyout, or show top-level icons only.",
					},
					{
						name: "maxInlineDepth",
						type: "number",
						defaultValue: "3",
						description:
							"Indentation is clamped to this depth so deep trees never run out of width.",
					},
					{
						name: "orgSwitcher",
						type: "ReactNode",
						description: "Top slot, typically an OrgSwitcher.",
					},
					{
						name: "userRow",
						type: "ReactNode",
						description: "Footer slot, typically a SidebarUserRow.",
					},
					{
						name: "versionTag",
						type: "ReactNode",
						description: "Footer slot, typically a VersionTag.",
					},
					{
						name: "back",
						type: "ReactNode",
						description: "Drill-in back label, rendered beside the back arrow.",
					},
					{
						name: "onBack",
						type: "() => void",
						description:
							"Drill-in back handler; the back control renders only when set.",
					},
					{
						name: "title",
						type: "ReactNode",
						description: "Drill-in title.",
					},
					{
						name: "hint",
						type: "ReactNode",
						description: "Drill-in subtitle below the title.",
					},
				]}
			/>
		</ComponentPage>
	);
}

export default SidebarPage;
