import {
	Brand,
	Breadcrumb,
	CommandPalette,
	type CommandPaletteGroup,
	DockPanel,
	type DockTab,
	Icon,
	type IconName,
	MenuItem,
	OrgSwitcher,
	ScreenShell,
	SearchCommand,
	Sidebar,
	type SidebarNavGroup,
	SidebarUserRow,
	ThemeToggle,
	TopBar,
} from "@lemn-ltd/ui";
import {
	type CSSProperties,
	type ReactElement,
	useEffect,
	useState,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { uiShowcaseAppDescriptor } from "../../app-descriptor";
import {
	DEFAULT_SHOWCASE_MODULE_ID,
	entriesForModule,
	moduleForId,
	moduleIdForPathname,
	SHOWCASE_MODULES,
	type ShowcaseModuleId,
} from "../registry/showcase-modules";
import {
	navGroups,
	pathFor,
	SHOWCASE_REGISTRY,
} from "../registry/showcase-registry";

const DOCK_PANE: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	gap: "var(--space-3)",
	height: "100%",
	padding: "var(--space-6)",
	textAlign: "center",
};

function DockPane({
	icon,
	title,
	description,
}: {
	readonly icon: IconName;
	readonly title: string;
	readonly description: string;
}): ReactElement {
	return (
		<div style={DOCK_PANE}>
			<Icon name={icon} size={32} />
			<strong
				style={{ color: "var(--text)", fontSize: "var(--font-size-heading)" }}
			>
				{title}
			</strong>
			<span
				style={{
					color: "var(--text-muted)",
					fontSize: "var(--font-size-small)",
					maxWidth: 240,
				}}
			>
				{description}
			</span>
		</div>
	);
}

const DOCK_TABS: readonly DockTab[] = [
	{
		id: "preview",
		label: "Preview",
		icon: "monitor",
		content: (
			<DockPane
				description="Run a build to see the live preview here."
				icon="monitor"
				title="No preview yet"
			/>
		),
	},
	{
		id: "code",
		label: "Code",
		icon: "code",
		content: (
			<DockPane
				description="Edits to the workspace show up here."
				icon="code"
				title="No code changes yet"
			/>
		),
	},
	{
		id: "files",
		label: "Files",
		icon: "file-text",
		content: (
			<DockPane
				description="Generated files will be listed here."
				icon="file-text"
				title="No files yet"
			/>
		),
	},
];

export function ShowcaseShell(): ReactElement {
	const location = useLocation();
	const navigate = useNavigate();
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [moduleId, setModuleId] = useState<ShowcaseModuleId>(() =>
		moduleIdForPathname(location.pathname),
	);

	useEffect(() => {
		if (location.pathname !== "/")
			setModuleId(moduleIdForPathname(location.pathname));
	}, [location.pathname]);

	const moduleEntries = entriesForModule(SHOWCASE_REGISTRY, moduleId);
	const sections = navGroups(moduleEntries);
	const activeModule =
		moduleForId(moduleId) ?? moduleForId(DEFAULT_SHOWCASE_MODULE_ID);

	const sidebarGroups: SidebarNavGroup[] = sections.map((section) => ({
		header: section.group,
		items: section.entries.map((entry) => ({
			id: entry.slug,
			label: entry.title,
			active: location.pathname === pathFor(entry),
			onSelect: () => navigate(pathFor(entry)),
		})),
	}));

	const selectModule = (nextId: string): void => {
		const nextModule = moduleForId(nextId);
		if (!nextModule) return;
		const nextEntries = entriesForModule(SHOWCASE_REGISTRY, nextModule.id);
		const nextPath = nextEntries[0] ? pathFor(nextEntries[0]) : "/";

		setModuleId(nextModule.id);
		if (location.pathname !== nextPath) navigate(nextPath);
	};

	const paletteGroups: CommandPaletteGroup[] = sections.map((section) => ({
		label: section.group,
		items: section.entries.map((entry) => ({
			id: entry.slug,
			label: entry.title,
			keywords: [entry.summary, entry.group, activeModule?.name ?? ""],
			onSelect: () => navigate(pathFor(entry)),
		})),
	}));

	const activeEntry = SHOWCASE_REGISTRY.find(
		(entry) => pathFor(entry) === location.pathname,
	);
	const settingsEntry = SHOWCASE_REGISTRY.find(
		(entry) => entry.slug === "settings-form",
	);

	const sidebar = (
		<Sidebar
			brand={<Brand name={uiShowcaseAppDescriptor.displayName} />}
			groups={sidebarGroups}
			orgSwitcher={
				<OrgSwitcher
					currentOrgId={moduleId}
					onSelectOrg={selectModule}
					orgs={SHOWCASE_MODULES.map((module) => ({
						id: module.id,
						mark: module.mark,
						name: module.name,
					}))}
				/>
			}
			search={<SearchCommand onSelect={() => setPaletteOpen(true)} />}
			userRow={
				<SidebarUserRow
					avatarColor="teal"
					email="avery@example.com"
					initials="AV"
					name="Avery Quinn"
				>
					<MenuItem icon="user-check">Profile</MenuItem>
					<MenuItem
						icon="settings"
						onSelect={() => settingsEntry && navigate(pathFor(settingsEntry))}
					>
						Settings
					</MenuItem>
					<MenuItem icon="log-out" tone="danger">
						Sign out
					</MenuItem>
				</SidebarUserRow>
			}
		/>
	);

	const topBar = (
		<TopBar
			actions={
				<div className="showcase-topbar-actions">
					<ThemeToggle />
				</div>
			}
			breadcrumb={
				<Breadcrumb
					items={[
						{ label: uiShowcaseAppDescriptor.displayName },
						{ label: activeModule?.name ?? "Core" },
						{ label: activeEntry?.group ?? "Overview" },
					]}
				/>
			}
		/>
	);

	return (
		<>
			<ScreenShell
				defaultDockMode="hidden"
				rightPanel={<DockPanel tabs={DOCK_TABS} />}
				sidebar={sidebar}
				topBar={topBar}
			>
				<Outlet />
			</ScreenShell>
			<CommandPalette
				groups={paletteGroups}
				onOpenChange={setPaletteOpen}
				open={paletteOpen}
			/>
		</>
	);
}
