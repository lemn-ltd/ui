import {
  type CSSProperties,
  Fragment,
  type KeyboardEvent,
  type ReactElement,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Popover } from '../../overlays/index.js';
import { Icon } from '../../primitives/index.js';
import type { SidebarNavItem } from './sidebar.js';

/** Whether a group needs tree semantics: tree only when something actually nests. */
export function hasNesting(items: readonly SidebarNavItem[]): boolean {
  return items.some((item) => (item.children?.length ?? 0) > 0);
}

// ---------------------------------------------------------------------------
// Expand state — multi-open, controlled or uncontrolled, with active-trail reveal
// ---------------------------------------------------------------------------

export interface SidebarTreeState {
  isExpanded(id: string): boolean;
  toggle(id: string): void;
}

interface UseSidebarTreeParams {
  readonly groups: readonly { readonly items: readonly SidebarNavItem[] }[];
  readonly expandedIds?: readonly string[];
  readonly defaultExpandedIds?: readonly string[];
  readonly onExpandedChange?: (ids: readonly string[]) => void;
}

function eachNode(
  items: readonly SidebarNavItem[],
  visit: (item: SidebarNavItem, parentId: string | undefined) => void,
  parentId?: string,
): void {
  for (const item of items) {
    visit(item, parentId);
    if (item.children) eachNode(item.children, visit, item.id);
  }
}

function buildParentMap(groups: UseSidebarTreeParams['groups']): Map<string, string> {
  const parents = new Map<string, string>();
  for (const group of groups) {
    eachNode(group.items, (item, parentId) => {
      if (parentId) parents.set(item.id, parentId);
    });
  }
  return parents;
}

function firstActiveId(groups: UseSidebarTreeParams['groups']): string | undefined {
  let found: string | undefined;
  for (const group of groups) {
    eachNode(group.items, (item) => {
      if (found === undefined && item.active) found = item.id;
    });
  }
  return found;
}

function ancestorsOf(id: string, parents: Map<string, string>): string[] {
  const trail: string[] = [];
  let cursor = parents.get(id);
  while (cursor) {
    trail.push(cursor);
    cursor = parents.get(cursor);
  }
  return trail;
}

/** Expand-state controller shared across a sidebar's nested groups. */
export function useSidebarTree({
  groups,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
}: UseSidebarTreeParams): SidebarTreeState {
  const controlled = expandedIds !== undefined;
  const parents = useMemo(() => buildParentMap(groups), [groups]);
  const activeId = useMemo(() => firstActiveId(groups), [groups]);

  // Seed: explicit defaults + per-item defaultExpanded + the active item's trail.
  const seed = useMemo(() => {
    const set = new Set<string>(defaultExpandedIds ?? []);
    for (const group of groups) {
      eachNode(group.items, (item) => {
        if (item.defaultExpanded) set.add(item.id);
      });
    }
    if (activeId) for (const id of ancestorsOf(activeId, parents)) set.add(id);
    return set;
  }, [groups, defaultExpandedIds, activeId, parents]);

  const [internal, setInternal] = useState<Set<string>>(seed);
  const internalRef = useRef(internal);
  internalRef.current = internal;

  // Reveal the active item's ancestors whenever the active node changes (uncontrolled).
  const trailKey = activeId ? ancestorsOf(activeId, parents).join('>') : '';
  useEffect(() => {
    if (controlled || !activeId) return;
    const trail = ancestorsOf(activeId, parents);
    if (trail.length === 0) return;
    setInternal((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of trail)
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      return changed ? next : prev;
    });
  }, [trailKey, controlled, activeId, parents]);

  const expandedSet = controlled ? new Set(expandedIds) : internal;

  const toggle = useCallback(
    (id: string) => {
      const current = controlled ? new Set(expandedIds) : internalRef.current;
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (!controlled) setInternal(next);
      onExpandedChange?.([...next]);
    },
    [controlled, expandedIds, onExpandedChange],
  );

  const isExpanded = useCallback((id: string) => expandedSet.has(id), [expandedSet]);

  return { isExpanded, toggle };
}

// ---------------------------------------------------------------------------
// Recursive tree view (WAI-ARIA tree pattern) for expanded / drawer layouts
// ---------------------------------------------------------------------------

function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value;
}

interface VisibleNode {
  readonly id: string;
  readonly depth: number;
  readonly hasChildren: boolean;
  readonly expanded: boolean;
  readonly parentId?: string;
}

export interface SidebarTreeProps {
  readonly items: readonly SidebarNavItem[];
  readonly state: SidebarTreeState;
  readonly ariaLabel?: string;
  /** Receives the active treeitem so the sidebar can scroll it into view. */
  readonly activeRef?: RefObject<HTMLElement | null>;
  /** Indentation is clamped to this depth so deep trees never run out of width. */
  readonly maxInlineDepth?: number;
}

export function SidebarTree({
  items,
  state,
  ariaLabel,
  activeRef,
  maxInlineDepth = 3,
}: SidebarTreeProps): ReactElement {
  const treeRef = useRef<HTMLDivElement>(null);
  // Set when keyboard navigation should move DOM focus after the next paint.
  const pendingFocus = useRef(false);
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);

  const activeId = useMemo(() => firstActiveId([{ items }]), [items]);

  // Flattened, expansion-aware visible order — the model the arrow keys walk.
  const visible = useMemo(() => {
    const out: VisibleNode[] = [];
    const walk = (nodes: readonly SidebarNavItem[], depth: number, parentId?: string) => {
      for (const node of nodes) {
        const hasChildren = (node.children?.length ?? 0) > 0;
        const expanded = hasChildren && state.isExpanded(node.id);
        out.push({ id: node.id, depth, hasChildren, expanded, parentId });
        if (expanded && node.children) walk(node.children, depth + 1, node.id);
      }
    };
    walk(items, 1);
    return out;
  }, [items, state]);

  // Keep roving focus on a real, visible node: the active one, else the first.
  useEffect(() => {
    setFocusedId((current) => {
      if (current && visible.some((node) => node.id === current)) return current;
      if (activeId && visible.some((node) => node.id === activeId)) return activeId;
      return visible[0]?.id;
    });
  }, [visible, activeId]);

  useLayoutEffect(() => {
    if (!pendingFocus.current || !focusedId) return;
    pendingFocus.current = false;
    treeRef.current?.querySelector<HTMLElement>(`[data-tree-id="${cssEscape(focusedId)}"]`)?.focus();
  }, [focusedId]);

  const moveFocus = useCallback((id: string) => {
    pendingFocus.current = true;
    setFocusedId(id);
  }, []);

  const activate = useCallback((id: string) => {
    treeRef.current?.querySelector<HTMLElement>(`[data-tree-id="${cssEscape(id)}"]`)?.click();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!focusedId) return;
      const index = visible.findIndex((node) => node.id === focusedId);
      const node = index >= 0 ? visible[index] : undefined;
      if (!node) return;
      const focusAt = (target: number): void => {
        const next = visible[target];
        if (next) moveFocus(next.id);
      };
      switch (event.key) {
        case 'ArrowDown':
          focusAt(index + 1);
          break;
        case 'ArrowUp':
          focusAt(index - 1);
          break;
        case 'Home':
          focusAt(0);
          break;
        case 'End':
          focusAt(visible.length - 1);
          break;
        case 'ArrowRight':
          if (node.hasChildren && !node.expanded) state.toggle(node.id);
          else if (node.hasChildren && node.expanded) focusAt(index + 1);
          else return;
          break;
        case 'ArrowLeft':
          if (node.hasChildren && node.expanded) state.toggle(node.id);
          else if (node.parentId) moveFocus(node.parentId);
          else return;
          break;
        case 'Enter':
        case ' ':
          activate(node.id);
          break;
        default:
          return;
      }
      event.preventDefault();
    },
    [focusedId, visible, moveFocus, state, activate],
  );

  const renderNode = (item: SidebarNavItem, depth: number, posinset: number, setsize: number): ReactElement => {
    const hasChildren = (item.children?.length ?? 0) > 0;
    const expanded = hasChildren && state.isExpanded(item.id);
    const indent = Math.min(depth - 1, maxInlineDepth - 1);
    // --sidebar-depth lives on the treeitem so both the row padding and the
    // subtree guide rail inherit it.
    const itemStyle = { '--sidebar-depth': indent } as CSSProperties;
    const rowContent = (
      <>
        {item.icon ? <Icon name={item.icon} size={18} /> : null}
        <span className="ui-sidebar__item-label">{item.label}</span>
        {item.badge != null ? <span className="ui-sidebar__badge">{item.badge}</span> : null}
      </>
    );
    const rowProps = {
      'aria-current': item.active ? ('page' as const) : undefined,
      'aria-expanded': hasChildren ? expanded : undefined,
      'aria-level': depth,
      'aria-posinset': posinset,
      'aria-setsize': setsize,
      className: 'ui-sidebar__treeitem ui-sidebar__item',
      'data-active': item.active || undefined,
      'data-has-children': hasChildren || undefined,
      'data-tree-id': item.id,
      role: 'treeitem',
      tabIndex: focusedId === item.id ? 0 : -1,
    } as const;
    const onRowClick = (event: { stopPropagation(): void }): void => {
      event.stopPropagation();
      setFocusedId(item.id);
      if (!item.href && item.onSelect) item.onSelect();
      else if (!item.href && hasChildren) state.toggle(item.id);
    };
    const row = item.href ? (
      <a
        {...rowProps}
        href={item.href}
        onClick={onRowClick}
        ref={item.active && activeRef ? (activeRef as RefObject<HTMLAnchorElement>) : undefined}
      >
        {rowContent}
      </a>
    ) : (
      <button
        {...rowProps}
        onClick={onRowClick}
        ref={item.active && activeRef ? (activeRef as RefObject<HTMLButtonElement>) : undefined}
        type="button"
      >
        {rowContent}
      </button>
    );

    return (
      <div className="ui-sidebar__tree-node" key={item.id} role="none" style={itemStyle}>
        <div className="ui-sidebar__tree-row">
          {row}
          {hasChildren ? (
            <button
              aria-hidden="true"
              className="ui-sidebar__chevron"
              data-expanded={expanded || undefined}
              onClick={(event) => {
                event.stopPropagation();
                setFocusedId(item.id);
                state.toggle(item.id);
              }}
              tabIndex={-1}
              type="button"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          ) : null}
        </div>
        {hasChildren && expanded && item.children ? (
          <fieldset className="ui-sidebar__subtree">
            {item.children.map((child, childIndex) =>
              renderNode(child, depth + 1, childIndex + 1, item.children?.length ?? 0),
            )}
          </fieldset>
        ) : null}
      </div>
    );
  };

  return (
    <div aria-label={ariaLabel} className="ui-sidebar__tree" onKeyDown={onKeyDown} ref={treeRef} role="tree">
      {items.map((item, index) => renderNode(item, 1, index + 1, items.length))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rail layout: icon-only top level; parents reveal their subtree in a flyout
// ---------------------------------------------------------------------------

export interface SidebarRailNavProps {
  readonly items: readonly SidebarNavItem[];
  readonly state: SidebarTreeState;
  readonly railExpand: 'flyout' | 'hidden';
  readonly activeRef?: RefObject<HTMLElement | null>;
}

function railGlyph(item: SidebarNavItem): ReactElement {
  return item.icon ? (
    <Icon name={item.icon} size={18} />
  ) : (
    <span className="ui-sidebar__rail-mark">{item.label.charAt(0)}</span>
  );
}

export function SidebarRailNav({ items, state, railExpand, activeRef }: SidebarRailNavProps): ReactElement {
  return (
    <div className="ui-sidebar__rail-nav">
      {items.map((item) => {
        const hasChildren = (item.children?.length ?? 0) > 0;
        if (!hasChildren || railExpand === 'hidden') {
          if (item.href) {
            return (
              <a
                aria-current={item.active ? 'page' : undefined}
                className="ui-sidebar__item"
                data-active={item.active || undefined}
                href={item.href}
                key={item.id}
                ref={item.active && activeRef ? (activeRef as RefObject<HTMLAnchorElement>) : undefined}
                title={item.label}
              >
                {railGlyph(item)}
              </a>
            );
          }
          return (
            <button
              className="ui-sidebar__item"
              data-active={item.active || undefined}
              key={item.id}
              onClick={item.onSelect}
              ref={item.active && activeRef ? (activeRef as RefObject<HTMLButtonElement>) : undefined}
              title={item.label}
              type="button"
            >
              {railGlyph(item)}
            </button>
          );
        }
        return (
          <Fragment key={item.id}>
            <Popover
              placement="right"
              trigger={
                <button
                  className="ui-sidebar__item"
                  data-active={item.active || undefined}
                  title={item.label}
                  type="button"
                >
                  {railGlyph(item)}
                </button>
              }
            >
              <div className="ui-sidebar__flyout">
                <div className="ui-sidebar__flyout-title">{item.label}</div>
                <SidebarTree ariaLabel={item.label} items={item.children ?? []} state={state} />
              </div>
            </Popover>
          </Fragment>
        );
      })}
    </div>
  );
}
