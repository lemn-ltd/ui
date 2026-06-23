import { Dialog as RadixDialog } from 'radix-ui';
import {
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon, IconButton } from '../../primitives/index.js';
import './settings-shell.css';
import {
  nextNavigableSettingsId,
  SettingsShellModal,
  SettingsShellSurface,
} from './settings-shell-parts.js';
import type {
  SettingsNavGroup,
  SettingsNavItem,
  SettingsShellVariant,
} from './settings-shell-types.js';

export type {
  SettingsNavGroup,
  SettingsNavItem,
  SettingsShellVariant,
} from './settings-shell-types.js';

export interface SettingsShellProps {
  readonly groups: readonly SettingsNavGroup[];

  /** Controlled active section id. */
  readonly activeSection?: string;
  /** Initial active section for uncontrolled use; defaults to the first enabled item. */
  readonly defaultActiveSection?: string;
  readonly onSectionChange?: (id: string) => void;

  /** Detail body: a static node, or a render function receiving the active section id. */
  readonly children: ReactNode | ((activeSection: string) => ReactNode);

  /** Optional heading shown above the panes (and used as the modal accessible name). */
  readonly title?: ReactNode;
  /** Renders a close control in the header; ignored in modal mode (the overlay owns close). */
  readonly onClose?: () => void;

  /** Show the nav filter field. Default `true`. */
  readonly searchable?: boolean;
  readonly searchPlaceholder?: string;
  /** Controlled search query. */
  readonly searchValue?: string;
  readonly onSearchChange?: (next: string) => void;
  /** Shown when the search filters every section out. */
  readonly searchEmpty?: ReactNode;

  /** Enable the left navigation collapse control. Default `false`. */
  readonly collapsibleNav?: boolean;
  /** Controlled collapsed state for the left navigation. */
  readonly navCollapsed?: boolean;
  /** Initial collapsed state for uncontrolled use. */
  readonly defaultNavCollapsed?: boolean;
  readonly onNavCollapsedChange?: (collapsed: boolean) => void;

  /** Sticky region above the scrolling detail body. */
  readonly detailHeader?: ReactNode;
  /** Sticky region below the scrolling detail body (e.g. Cancel / Save). */
  readonly detailFooter?: ReactNode;
  /** Error-summary banner at the end of the detail body; it scrolls with the content. */
  readonly error?: ReactNode;

  readonly variant?: SettingsShellVariant;

  /** Present the shell inside a focus-trapped overlay. */
  readonly modal?: boolean;
  readonly trigger?: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;

  readonly className?: string;
  readonly 'aria-label'?: string;
}

function firstEnabledId(groups: readonly SettingsNavGroup[]): string | undefined {
  for (const group of groups) {
    for (const item of group.items) {
      if (!item.disabled) return item.id;
    }
  }
  return undefined;
}

function itemText(item: SettingsNavItem): string {
  if (typeof item.label === 'string') return item.label;
  return item.keywords ?? '';
}

/**
 * A master-detail surface for settings and configuration screens: a grouped,
 * searchable section rail beside an independently scrolling detail pane. Section
 * selection and search are controllable, the rail is keyboard-navigable as a
 * vertical tab list, and the whole surface can present inline or as a
 * focus-trapped modal. The caller owns the detail body, so it can host any mix
 * of controls (pair with SettingsRow plus Toggle, Input, Select, and friends).
 */
export function SettingsShell({
  groups,
  activeSection,
  defaultActiveSection,
  onSectionChange,
  children,
  title,
  onClose,
  searchable = true,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchEmpty,
  collapsibleNav = false,
  navCollapsed,
  defaultNavCollapsed = false,
  onNavCollapsedChange,
  detailHeader,
  detailFooter,
  error,
  variant = 'plain',
  modal,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  className,
  'aria-label': ariaLabel,
}: SettingsShellProps): ReactElement {
  const baseId = useId();
  const navId = `${baseId}-nav`;
  const panelId = `${baseId}-panel`;
  const tabId = useCallback((id: string) => `${baseId}-tab-${id}`, [baseId]);

  const isControlledActive = activeSection !== undefined;
  const [internalActive, setInternalActive] = useState<string | undefined>(
    () => defaultActiveSection ?? firstEnabledId(groups),
  );
  const activeId = isControlledActive ? activeSection : internalActive;

  const selectSection = useCallback(
    (id: string) => {
      if (!isControlledActive) setInternalActive(id);
      onSectionChange?.(id);
    },
    [isControlledActive, onSectionChange],
  );

  const isControlledSearch = searchValue !== undefined;
  const [internalQuery, setInternalQuery] = useState('');
  const query = isControlledSearch ? searchValue : internalQuery;
  const setQuery = useCallback(
    (next: string) => {
      if (!isControlledSearch) setInternalQuery(next);
      onSearchChange?.(next);
    },
    [isControlledSearch, onSearchChange],
  );

  const isControlledNavCollapsed = navCollapsed !== undefined;
  const [internalNavCollapsed, setInternalNavCollapsed] = useState(defaultNavCollapsed);
  const resolvedNavCollapsed = isControlledNavCollapsed ? navCollapsed : internalNavCollapsed;
  const isNavCollapsed = collapsibleNav && resolvedNavCollapsed;
  const setNavCollapsed = useCallback(
    (next: boolean) => {
      if (!isControlledNavCollapsed) setInternalNavCollapsed(next);
      onNavCollapsedChange?.(next);
    },
    [isControlledNavCollapsed, onNavCollapsedChange],
  );

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => itemText(item).toLowerCase().includes(needle)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const navigableIds = useMemo(
    () =>
      filteredGroups.flatMap((group) =>
        group.items.filter((item) => !item.disabled).map((item) => item.id),
      ),
    [filteredGroups],
  );

  // The rail keeps exactly one tab in the tab order (roving tabindex). The active
  // section wins; if it is filtered out, focus parks on the first visible item.
  const rovingId =
    activeId !== undefined && navigableIds.includes(activeId) ? activeId : navigableIds[0];

  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const onNavKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const nextId = nextNavigableSettingsId(event.key, navigableIds, rovingId);
      if (nextId === null) return;
      event.preventDefault();
      selectSection(nextId);
      tabRefs.current.get(nextId)?.focus();
    },
    [navigableIds, rovingId, selectSection],
  );

  const inModal = settingsInModal({ defaultOpen, modal, onOpenChange, open, trigger });
  const surface = (
    <SettingsShellSurface
      activeId={activeId}
      ariaLabel={ariaLabel}
      className={className}
      collapsibleNav={collapsibleNav}
      detail={settingsDetail(children, activeId)}
      detailFooter={detailFooter}
      detailHeader={detailHeader}
      error={error}
      filteredGroups={filteredGroups}
      header={settingsHeader(title, inModal, onClose)}
      isNavCollapsed={isNavCollapsed}
      navId={navId}
      navToggle={settingsNavToggle(collapsibleNav, isNavCollapsed, navId, setNavCollapsed)}
      onNavKeyDown={onNavKeyDown}
      panelId={panelId}
      registerTab={(itemId, element) => {
        if (element) tabRefs.current.set(itemId, element);
        else tabRefs.current.delete(itemId);
      }}
      rovingId={rovingId}
      search={settingsSearch(searchable, query, searchPlaceholder, setQuery)}
      searchEmpty={searchEmpty}
      selectSection={selectSection}
      tabId={tabId}
      variant={variant}
    />
  );

  return inModal ? (
    <SettingsShellModal
      baseId={baseId}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      open={open}
      surface={surface}
      title={title}
      trigger={trigger}
    />
  ) : (
    surface
  );
}

function settingsInModal(input: {
  readonly defaultOpen?: boolean;
  readonly modal?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly open?: boolean;
  readonly trigger?: ReactNode;
}): boolean {
  return (
    input.modal === true ||
    input.trigger != null ||
    input.open !== undefined ||
    input.defaultOpen !== undefined ||
    input.onOpenChange != null
  );
}

function settingsDetail(
  children: ReactNode | ((activeSection: string) => ReactNode),
  activeId: string | undefined,
): ReactNode {
  if (typeof children !== 'function') return children;
  return activeId !== undefined ? children(activeId) : null;
}

function settingsHeader(
  title: ReactNode | undefined,
  inModal: boolean,
  onClose: (() => void) | undefined,
): ReactElement | null {
  const titleNode = settingsTitle(title, inModal);
  const closeButton = settingsCloseButton(inModal, onClose);
  if (titleNode == null && closeButton == null) return null;
  return (
    <div className="ui-settings-shell__header">
      {titleNode ?? <span aria-hidden="true" />}
      {closeButton}
    </div>
  );
}

function settingsTitle(title: ReactNode | undefined, inModal: boolean): ReactElement | null {
  if (title == null) return null;
  const heading = <h2 className="ui-settings-shell__title">{title}</h2>;
  return inModal ? <RadixDialog.Title asChild>{heading}</RadixDialog.Title> : heading;
}

function settingsCloseButton(
  inModal: boolean,
  onClose: (() => void) | undefined,
): ReactElement | null {
  if (inModal) {
    return (
      <RadixDialog.Close asChild>
        <IconButton aria-label="Close" variant="ghost">
          <Icon name="x" size={16} />
        </IconButton>
      </RadixDialog.Close>
    );
  }
  return onClose ? (
    <IconButton aria-label="Close" onClick={onClose} variant="ghost">
      <Icon name="x" size={16} />
    </IconButton>
  ) : null;
}

function settingsNavToggle(
  collapsibleNav: boolean,
  isNavCollapsed: boolean,
  navId: string,
  setNavCollapsed: (next: boolean) => void,
): ReactElement | null {
  if (!collapsibleNav) return null;
  const label = isNavCollapsed ? 'Expand settings navigation' : 'Collapse settings navigation';
  return (
    <IconButton
      aria-controls={navId}
      aria-expanded={!isNavCollapsed}
      aria-label={label}
      className="ui-settings-shell__nav-toggle"
      onClick={() => setNavCollapsed(!isNavCollapsed)}
      title={label}
      variant="ghost-accent"
    >
      <Icon name={isNavCollapsed ? 'panel-left-open' : 'panel-left-close'} size={16} />
    </IconButton>
  );
}

function settingsSearch(
  searchable: boolean,
  query: string,
  searchPlaceholder: string | undefined,
  setQuery: (next: string) => void,
): ReactElement | null {
  if (!searchable) return null;
  return (
    <div className="ui-settings-shell__search">
      <Icon name="search" size={16} />
      <input
        aria-label="Filter settings"
        className="ui-settings-shell__search-input"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder ?? 'Search settings'}
        type="search"
        value={query}
      />
    </div>
  );
}
