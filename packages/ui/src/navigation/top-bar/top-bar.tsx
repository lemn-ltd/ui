import type { ReactElement, ReactNode } from 'react';
import { type SidebarMode, useShell } from '../../layout/screen-shell/shell-context.js';
import { Icon, IconButton } from '../../primitives/index.js';
import './top-bar.css';

export interface TopBarProps {
  readonly breadcrumb?: ReactNode;
  readonly actions?: ReactNode;
  readonly sidebarMode?: SidebarMode;
  readonly onToggleSidebar?: () => void;
}

export function TopBar({
  breadcrumb,
  actions,
  sidebarMode,
  onToggleSidebar,
}: TopBarProps): ReactElement {
  const shell = useShell();
  // Explicit props win; otherwise the collapse control wires itself to the
  // enclosing shell so consumers get it for free. On desktop the toggle cycles
  // expanded → rail → hidden.
  const mode = sidebarMode ?? shell?.sidebar.mode ?? 'expanded';
  const collapse = shell?.sidebar.collapse ?? 'cycle';
  const onToggle = onToggleSidebar ?? shell?.sidebar.cycle;
  const isMobile = shell?.isMobile ?? false;
  // The toggle only expands from the behavior's terminal collapsed state, so the
  // glyph stays correct whether collapse goes to rail, hidden, or the full cycle.
  const willExpand = collapse === 'expand-rail' ? mode === 'rail' : mode === 'hidden';
  // On mobile the control is a hamburger that opens the overlay drawer.
  const toggleIcon = isMobile ? 'menu' : willExpand ? 'panel-left-open' : 'panel-left-close';
  const toggleLabel = isMobile
    ? 'Open navigation'
    : willExpand
      ? 'Expand sidebar'
      : 'Collapse sidebar';

  return (
    <div className="ui-top-bar">
      <div className="ui-top-bar__left">
        {onToggle ? (
          <IconButton aria-label={toggleLabel} onClick={onToggle} variant="ghost">
            <Icon name={toggleIcon} size={18} />
          </IconButton>
        ) : null}
        {breadcrumb != null ? <div className="ui-top-bar__breadcrumb">{breadcrumb}</div> : null}
      </div>
      <div className="ui-top-bar__right">{actions}</div>
    </div>
  );
}
