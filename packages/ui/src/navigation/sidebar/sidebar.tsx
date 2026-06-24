import {
  Fragment,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { type SidebarMode, useShell } from '../../layout/screen-shell/shell-context.js';
import { Icon, type IconName } from '../../primitives/index.js';
import { SidebarChromeProvider } from './sidebar-chrome-context.js';
import {
  hasNesting,
  SidebarRailNav,
  SidebarTree,
  type SidebarTreeState,
  useSidebarTree,
} from './sidebar-tree.js';
import './sidebar.css';

export interface SidebarNavItem {
  readonly id: string;
  readonly label: string;
  /** Optional: nested children are often label-only, so the icon is not required. */
  readonly icon?: IconName;
  readonly active?: boolean;
  readonly onSelect?: () => void;
  /** Child items. Any item with children renders as an expandable tree node. */
  readonly children?: readonly SidebarNavItem[];
  /** Trailing content, typically a count chip. */
  readonly badge?: ReactNode;
  /** Start expanded in uncontrolled mode. */
  readonly defaultExpanded?: boolean;
}

export interface SidebarNavGroup {
  readonly header?: ReactNode;
  readonly items: readonly SidebarNavItem[];
}

export interface SidebarProps {
  /** Collapse mode. Inside a ScreenShell it follows the shell when unset. */
  readonly mode?: SidebarMode;
  /** Content variant: the primary app rail, or a settings/section drill-in. */
  readonly variant?: 'primary' | 'drill-in';
  readonly groups: readonly SidebarNavGroup[];
  readonly brand?: ReactNode;
  readonly orgSwitcher?: ReactNode;
  readonly search?: ReactNode;
  readonly userRow?: ReactNode;
  readonly versionTag?: ReactNode;
  readonly back?: ReactNode;
  readonly onBack?: () => void;
  readonly title?: ReactNode;
  readonly hint?: ReactNode;
  /** Controlled set of expanded nav item ids (nested groups). */
  readonly expandedIds?: readonly string[];
  /** Uncontrolled initial expanded ids. The active item's trail expands anyway. */
  readonly defaultExpandedIds?: readonly string[];
  readonly onExpandedChange?: (ids: readonly string[]) => void;
  /** Rail behaviour for nested groups: open children in a flyout, or hide them. */
  readonly railExpand?: 'flyout' | 'hidden';
  /** Indentation is clamped to this depth so deep trees never run out of width. */
  readonly maxInlineDepth?: number;
}

/** First active item id anywhere in the (possibly nested) groups. */
function findActiveId(groups: readonly SidebarNavGroup[]): string | undefined {
  let found: string | undefined;
  const walk = (items: readonly SidebarNavItem[]): void => {
    for (const item of items) {
      if (found) return;
      if (item.active) {
        found = item.id;
        return;
      }
      if (item.children) walk(item.children);
    }
  };
  for (const group of groups) walk(group.items);
  return found;
}

export function Sidebar({
  mode: explicitMode,
  variant = 'primary',
  groups,
  brand,
  orgSwitcher,
  search,
  userRow,
  versionTag,
  back,
  onBack,
  title,
  hint,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  railExpand = 'flyout',
  maxInlineDepth = 3,
}: SidebarProps): ReactElement {
  const shell = useShell();
  // Shared expand-state for every nested group; flat groups never touch it.
  const tree = useSidebarTree({ groups, expandedIds, defaultExpandedIds, onExpandedChange });
  // An explicit mode wins; otherwise the sidebar follows the enclosing shell's
  // collapse state, defaulting to expanded when used standalone. The drill-in
  // variant is content only — it collapses with the shell just like the primary
  // rail, so Cmd/Ctrl+B and the TopBar toggle hide it on every screen.
  const mode: SidebarMode = explicitMode ?? shell?.sidebar.mode ?? 'expanded';
  const rail = mode === 'rail';
  const hidden = mode === 'hidden';
  const drillIn = variant === 'drill-in';
  // Single source of truth for the rail signal the brand/search/org/user slots read.
  const chrome = useMemo(() => ({ rail }), [rail]);

  // Keep the active item in view when navigation changes it from elsewhere
  // (e.g. a user-menu Settings entry that lives deep in the list or tree).
  const activeId = useMemo(() => findActiveId(groups), [groups]);
  const activeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId]);

  // Mobile drawer: when it opens, move focus in and return it to the opener on
  // close so keyboard users are not stranded behind the scrim.
  const drawerOpen = shell?.isMobile === true && shell.sidebar.mode === 'expanded';
  const isMobileRef = useRef(shell?.isMobile === true);
  isMobileRef.current = shell?.isMobile === true;
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!drawerOpen || typeof document === 'undefined') return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      // Reclaim focus only on a real user close, not when the viewport left mobile.
      if (isMobileRef.current) restoreRef.current?.focus?.();
    };
  }, [drawerOpen]);

  return (
    <SidebarChromeProvider value={chrome}>
      <aside
        aria-label={shell?.isMobile === true ? 'Navigation' : undefined}
        className="ui-sidebar"
        data-mode={mode}
        data-shell={shell ? 'true' : undefined}
        // Hidden (desktop collapse or closed mobile drawer): keep it out of the
        // tab order and the accessibility tree while it is off-screen.
        inert={hidden ? true : undefined}
      >
        <div className="ui-sidebar__top">
          {brand}
          {orgSwitcher}
          {search != null ? <div className="ui-sidebar__search">{search}</div> : null}
          {shell ? (
            <button
              aria-label="Close navigation"
              className="ui-sidebar__close"
              onClick={() => shell.sidebar.setMode('hidden')}
              ref={closeRef}
              type="button"
            >
              <Icon name="x" size={18} />
            </button>
          ) : null}
          {drillIn ? (
            <SidebarDrillHeader back={back} hint={hint} onBack={onBack} rail={rail} title={title} />
          ) : null}
        </div>

        <nav className="ui-sidebar__nav">
          {groups.map((group, index) => (
            <SidebarNavGroupView
              activeRef={activeRef}
              group={group}
              index={index}
              key={index}
              maxInlineDepth={maxInlineDepth}
              rail={rail}
              railExpand={railExpand}
              tree={tree}
            />
          ))}
        </nav>

        <div className="ui-sidebar__footer">
          {userRow}
          {versionTag}
        </div>
      </aside>
    </SidebarChromeProvider>
  );
}

function SidebarDrillHeader({
  back,
  hint,
  onBack,
  rail,
  title,
}: {
  readonly back?: ReactNode;
  readonly hint?: ReactNode;
  readonly onBack?: () => void;
  readonly rail: boolean;
  readonly title?: ReactNode;
}): ReactElement {
  return (
    <div className="ui-sidebar__drill">
      {onBack ? (
        <button
          aria-label={rail ? 'Back' : undefined}
          className="ui-sidebar__back"
          onClick={onBack}
          title={rail ? 'Back' : undefined}
          type="button"
        >
          <Icon name="arrow-left" size={16} />
          {rail ? null : back}
        </button>
      ) : null}
      {!rail && title != null ? <div className="ui-sidebar__title">{title}</div> : null}
      {!rail && hint != null ? <div className="ui-sidebar__hint">{hint}</div> : null}
    </div>
  );
}

function SidebarNavGroupView({
  activeRef,
  group,
  index,
  rail,
  railExpand,
  tree,
  maxInlineDepth,
}: {
  readonly activeRef: RefObject<HTMLElement | null>;
  readonly group: SidebarNavGroup;
  readonly index: number;
  readonly rail: boolean;
  readonly railExpand: 'flyout' | 'hidden';
  readonly tree: SidebarTreeState;
  readonly maxInlineDepth: number;
}): ReactElement {
  // Tree semantics only where the group actually nests; flat groups stay flat so
  // existing single-level rails keep their per-item tab stops and markup.
  const nested = hasNesting(group.items);
  return (
    <Fragment>
      {index > 0 && rail ? <div className="ui-sidebar__divider" /> : null}
      <div className="ui-sidebar__group">
        {!rail && group.header != null ? (
          <div className="ui-sidebar__group-header">{group.header}</div>
        ) : null}
        {nested ? (
          rail ? (
            <SidebarRailNav
              activeRef={activeRef}
              items={group.items}
              railExpand={railExpand}
              state={tree}
            />
          ) : (
            <SidebarTree
              activeRef={activeRef}
              ariaLabel={typeof group.header === 'string' ? group.header : undefined}
              items={group.items}
              maxInlineDepth={maxInlineDepth}
              state={tree}
            />
          )
        ) : (
          group.items.map((item) => (
            <SidebarNavButton activeRef={activeRef} item={item} key={item.id} rail={rail} />
          ))
        )}
      </div>
    </Fragment>
  );
}

function SidebarNavButton({
  activeRef,
  item,
  rail,
}: {
  readonly activeRef: RefObject<HTMLElement | null>;
  readonly item: SidebarNavItem;
  readonly rail: boolean;
}): ReactElement {
  return (
    <button
      className="ui-sidebar__item"
      data-active={item.active ? 'true' : 'false'}
      onClick={item.onSelect}
      ref={item.active ? (activeRef as RefObject<HTMLButtonElement>) : undefined}
      title={rail ? item.label : undefined}
      type="button"
    >
      {item.icon ? <Icon name={item.icon} size={18} /> : null}
      {rail ? null : <span className="ui-sidebar__item-label">{item.label}</span>}
    </button>
  );
}
