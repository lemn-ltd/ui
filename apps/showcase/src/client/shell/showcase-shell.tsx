import {
  applyTheme,
  Brand,
  Breadcrumb,
  CommandPalette,
  type CommandPaletteGroup,
  DockPanel,
  type DockTab,
  getTheme,
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
} from '@appranks/ui';
import { type CSSProperties, type ReactElement, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { uiShowcaseAppDescriptor } from '../../app-descriptor';
import { currentOrgId, orgs } from '../fixtures';
import {
  navGroups,
  pathFor,
  SHOWCASE_REGISTRY,
  type ShowcaseGroup,
} from '../registry/showcase-registry';

// A Map (not an object literal) because the keys are the display-form
// ShowcaseGroup literals, which are not valid identifier property names.
const GROUP_ICON = new Map<ShowcaseGroup, IconName>([
  ['Foundations', 'settings'],
  ['Primitives', 'square-pen'],
  ['Forms', 'list'],
  ['Overlays', 'maximize'],
  ['Navigation', 'panel-left-open'],
  ['Data display', 'layout-grid'],
  ['Feedback', 'info'],
  ['Layout', 'maximize-2'],
  ['Agents', 'plug'],
  ['Patterns', 'copy'],
]);

const DOCK_PANE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-3)',
  height: '100%',
  padding: 'var(--space-6)',
  textAlign: 'center',
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
      <strong style={{ color: 'var(--text)', fontSize: 'var(--font-size-heading)' }}>
        {title}
      </strong>
      <span
        style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-small)', maxWidth: 240 }}
      >
        {description}
      </span>
    </div>
  );
}

const DOCK_TABS: readonly DockTab[] = [
  {
    id: 'preview',
    label: 'Preview',
    icon: 'monitor',
    content: (
      <DockPane
        description="Run a build to see the live preview here."
        icon="monitor"
        title="No preview yet"
      />
    ),
  },
  {
    id: 'code',
    label: 'Code',
    icon: 'code',
    content: (
      <DockPane
        description="Edits to the workspace show up here."
        icon="code"
        title="No code changes yet"
      />
    ),
  },
  {
    id: 'files',
    label: 'Files',
    icon: 'file-text',
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
  const [orgId, setOrgId] = useState(currentOrgId);

  // Restore the persisted theme choice to the document on first mount.
  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  const sections = navGroups();

  const sidebarGroups: SidebarNavGroup[] = sections.map((section) => ({
    header: section.group,
    items: section.entries.map((entry) => ({
      id: entry.slug,
      label: entry.title,
      icon: GROUP_ICON.get(entry.group) ?? 'square-pen',
      active: location.pathname === pathFor(entry),
      onSelect: () => navigate(pathFor(entry)),
    })),
  }));

  const paletteGroups: CommandPaletteGroup[] = sections.map((section) => ({
    label: section.group,
    items: section.entries.map((entry) => ({
      id: entry.slug,
      label: entry.title,
      keywords: [entry.summary, entry.group],
      onSelect: () => navigate(pathFor(entry)),
    })),
  }));

  const activeEntry = SHOWCASE_REGISTRY.find((entry) => pathFor(entry) === location.pathname);
  const settingsEntry = SHOWCASE_REGISTRY.find((entry) => entry.slug === 'settings-form');

  const sidebar = (
    <Sidebar
      brand={<Brand name={uiShowcaseAppDescriptor.displayName} />}
      groups={sidebarGroups}
      orgSwitcher={
        <OrgSwitcher
          currentOrgId={orgId}
          footer={<MenuItem icon="settings">Manage organizations</MenuItem>}
          onSelectOrg={setOrgId}
          orgs={orgs}
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
            { label: activeEntry?.group ?? 'Overview' },
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
      <CommandPalette groups={paletteGroups} onOpenChange={setPaletteOpen} open={paletteOpen} />
    </>
  );
}
