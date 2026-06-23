import { Dialog as RadixDialog } from 'radix-ui';
import type { ReactElement, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { InfoBanner } from '../../feedback/index.js';
import {
  modalStackLayerProps,
  preventDismissFromStackedModal,
} from '../../overlays/dialog-stack.js';
import { Icon } from '../../primitives/index.js';
import type {
  SettingsNavGroup,
  SettingsNavItem,
  SettingsShellVariant,
} from './settings-shell-types.js';

const NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);

export function SettingsShellSurface({
  activeId,
  ariaLabel,
  className,
  collapsibleNav,
  detail,
  detailFooter,
  detailHeader,
  error,
  filteredGroups,
  header,
  isNavCollapsed,
  navId,
  navToggle,
  onNavKeyDown,
  panelId,
  registerTab,
  rovingId,
  search,
  searchEmpty,
  selectSection,
  tabId,
  variant,
}: {
  readonly activeId: string | undefined;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly collapsibleNav: boolean;
  readonly detail: ReactNode;
  readonly detailFooter?: ReactNode;
  readonly detailHeader?: ReactNode;
  readonly error?: ReactNode;
  readonly filteredGroups: readonly SettingsNavGroup[];
  readonly header: ReactElement | null;
  readonly isNavCollapsed: boolean;
  readonly navId: string;
  readonly navToggle: ReactElement | null;
  readonly onNavKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  readonly panelId: string;
  readonly registerTab: (itemId: string, element: HTMLButtonElement | null) => void;
  readonly rovingId: string | undefined;
  readonly search: ReactElement | null;
  readonly searchEmpty?: ReactNode;
  readonly selectSection: (id: string) => void;
  readonly tabId: (id: string) => string;
  readonly variant: SettingsShellVariant;
}): ReactElement {
  return (
    <div
      className={['ui-settings-shell', className].filter(Boolean).join(' ')}
      data-nav-collapsed={collapsibleNav ? String(isNavCollapsed) : undefined}
      data-nav-collapsible={collapsibleNav ? 'true' : undefined}
      data-variant={variant}
    >
      {header}
      <div className="ui-settings-shell__body">
        <SettingsShellNav
          activeId={activeId}
          ariaLabel={ariaLabel}
          filteredGroups={filteredGroups}
          isNavCollapsed={isNavCollapsed}
          navId={navId}
          onNavKeyDown={onNavKeyDown}
          panelId={panelId}
          registerTab={registerTab}
          rovingId={rovingId}
          search={search}
          searchEmpty={searchEmpty}
          selectSection={selectSection}
          tabId={tabId}
        />
        <SettingsShellDetail
          activeId={activeId}
          detail={detail}
          detailFooter={detailFooter}
          detailHeader={detailHeader}
          error={error}
          navToggle={navToggle}
          panelId={panelId}
          tabId={tabId}
        />
      </div>
    </div>
  );
}

function SettingsShellNav({
  activeId,
  ariaLabel,
  filteredGroups,
  isNavCollapsed,
  navId,
  onNavKeyDown,
  panelId,
  registerTab,
  rovingId,
  search,
  searchEmpty,
  selectSection,
  tabId,
}: {
  readonly activeId: string | undefined;
  readonly ariaLabel?: string;
  readonly filteredGroups: readonly SettingsNavGroup[];
  readonly isNavCollapsed: boolean;
  readonly navId: string;
  readonly onNavKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  readonly panelId: string;
  readonly registerTab: (itemId: string, element: HTMLButtonElement | null) => void;
  readonly rovingId: string | undefined;
  readonly search: ReactElement | null;
  readonly searchEmpty?: ReactNode;
  readonly selectSection: (id: string) => void;
  readonly tabId: (id: string) => string;
}): ReactElement {
  return (
    <div
      aria-hidden={isNavCollapsed ? true : undefined}
      className="ui-settings-shell__nav"
      id={navId}
      inert={isNavCollapsed ? true : undefined}
    >
      {search != null ? <div className="ui-settings-shell__nav-controls">{search}</div> : null}
      <div
        aria-label={ariaLabel ?? 'Settings sections'}
        aria-orientation="vertical"
        className="ui-settings-shell__list"
        onKeyDown={onNavKeyDown}
        role="tablist"
      >
        {filteredGroups.length === 0 ? (
          <div className="ui-settings-shell__empty">{searchEmpty ?? 'No matching settings'}</div>
        ) : (
          filteredGroups.map((group, index) => (
            <SettingsNavGroupView
              activeId={activeId}
              group={group}
              key={group.id ?? index}
              panelId={panelId}
              registerTab={registerTab}
              rovingId={rovingId}
              selectSection={selectSection}
              tabId={tabId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SettingsShellDetail({
  activeId,
  detail,
  detailFooter,
  detailHeader,
  error,
  navToggle,
  panelId,
  tabId,
}: {
  readonly activeId: string | undefined;
  readonly detail: ReactNode;
  readonly detailFooter?: ReactNode;
  readonly detailHeader?: ReactNode;
  readonly error?: ReactNode;
  readonly navToggle: ReactElement | null;
  readonly panelId: string;
  readonly tabId: (id: string) => string;
}): ReactElement {
  return (
    <div className="ui-settings-shell__detail">
      {detailHeader != null ? (
        <div className="ui-settings-shell__detail-header">{detailHeader}</div>
      ) : null}
      <div
        aria-labelledby={activeId !== undefined ? tabId(activeId) : undefined}
        className="ui-settings-shell__detail-content"
        data-nav-toggle={navToggle != null ? 'true' : undefined}
        id={panelId}
        role="tabpanel"
      >
        {navToggle}
        {detail}
        {error != null ? (
          <InfoBanner className="ui-settings-shell__error" variant="danger">
            {error}
          </InfoBanner>
        ) : null}
      </div>
      {detailFooter != null ? (
        <div className="ui-settings-shell__detail-footer">{detailFooter}</div>
      ) : null}
    </div>
  );
}

export function SettingsShellModal({
  baseId,
  defaultOpen,
  onOpenChange,
  open,
  surface,
  title,
  trigger,
}: {
  readonly baseId: string;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly open?: boolean;
  readonly surface: ReactElement;
  readonly title?: ReactNode;
  readonly trigger?: ReactNode;
}): ReactElement {
  return (
    <RadixDialog.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="ui-settings-shell__overlay"
          {...modalStackLayerProps(baseId)}
        />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="ui-settings-shell__modal"
          onInteractOutside={(event) => preventDismissFromStackedModal(event, baseId)}
          {...modalStackLayerProps(baseId)}
        >
          {title == null ? (
            <RadixDialog.Title className="ui-settings-shell__sr-only">Settings</RadixDialog.Title>
          ) : null}
          {surface}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function nextNavigableSettingsId(
  key: string,
  navigableIds: readonly string[],
  rovingId: string | undefined,
): string | null {
  if (!NAV_KEYS.has(key) || navigableIds.length === 0) return null;
  const current = rovingId !== undefined ? navigableIds.indexOf(rovingId) : -1;
  const next = nextNavigableIndex(key, current, navigableIds.length);
  return navigableIds[next] ?? null;
}

function nextNavigableIndex(key: string, current: number, count: number): number {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown') return current < 0 ? 0 : (current + 1) % count;
  return current <= 0 ? count - 1 : current - 1;
}

function SettingsNavGroupView({
  activeId,
  group,
  panelId,
  registerTab,
  rovingId,
  selectSection,
  tabId,
}: {
  readonly activeId: string | undefined;
  readonly group: SettingsNavGroup;
  readonly panelId: string;
  readonly registerTab: (itemId: string, element: HTMLButtonElement | null) => void;
  readonly rovingId: string | undefined;
  readonly selectSection: (id: string) => void;
  readonly tabId: (id: string) => string;
}): ReactElement {
  return (
    <div className="ui-settings-shell__group" role="presentation">
      {group.header != null ? (
        <div className="ui-settings-shell__group-header">{group.header}</div>
      ) : null}
      {group.items.map((item) => (
        <SettingsNavButton
          activeId={activeId}
          item={item}
          key={item.id}
          panelId={panelId}
          registerTab={registerTab}
          rovingId={rovingId}
          selectSection={selectSection}
          tabId={tabId}
        />
      ))}
    </div>
  );
}

function SettingsNavButton({
  activeId,
  item,
  panelId,
  registerTab,
  rovingId,
  selectSection,
  tabId,
}: {
  readonly activeId: string | undefined;
  readonly item: SettingsNavItem;
  readonly panelId: string;
  readonly registerTab: (itemId: string, element: HTMLButtonElement | null) => void;
  readonly rovingId: string | undefined;
  readonly selectSection: (id: string) => void;
  readonly tabId: (id: string) => string;
}): ReactElement {
  const selected = item.id === activeId;
  return (
    <button
      aria-controls={panelId}
      aria-selected={selected}
      className="ui-settings-shell__item"
      data-active={selected ? 'true' : undefined}
      disabled={item.disabled}
      id={tabId(item.id)}
      onClick={() => selectSection(item.id)}
      ref={(element) => registerTab(item.id, element)}
      role="tab"
      tabIndex={item.id === rovingId ? 0 : -1}
      type="button"
    >
      {item.icon ? <Icon name={item.icon} size={16} /> : null}
      <span className="ui-settings-shell__item-label">{item.label}</span>
      {item.badge != null ? (
        <span className="ui-settings-shell__item-badge">{item.badge}</span>
      ) : null}
    </button>
  );
}
