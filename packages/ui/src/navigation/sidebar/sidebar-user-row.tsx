import type { ReactElement, ReactNode } from 'react';
import { useShell } from '../../layout/screen-shell/shell-context.js';
import { Menu } from '../../overlays/index.js';
import { Avatar, type AvatarColor, Icon } from '../../primitives/index.js';
import { useSidebarChrome } from './sidebar-chrome-context.js';
import './sidebar-user-row.css';

export interface SidebarUserRowProps {
  readonly initials: ReactNode;
  readonly name: ReactNode;
  readonly children: ReactNode;
  readonly email?: ReactNode;
  readonly avatarColor?: AvatarColor;
  readonly collapsed?: boolean;
}

export function SidebarUserRow({
  initials,
  name,
  children,
  email,
  avatarColor = 'teal',
  collapsed: explicitCollapsed,
}: SidebarUserRowProps): ReactElement {
  const shell = useShell();
  const rail = useSidebarChrome()?.rail ?? shell?.sidebar.mode === 'rail';
  // Follows the shell's desktop rail; the mobile drawer always shows the full row.
  const collapsed = explicitCollapsed ?? rail;
  const trigger = (
    <button
      className="ui-sidebar-user-row"
      data-collapsed={collapsed ? 'true' : 'false'}
      type="button"
    >
      <Avatar color={avatarColor} size={32}>
        {initials}
      </Avatar>
      {collapsed ? null : (
        <>
          <span className="ui-sidebar-user-row__meta">
            <span className="ui-sidebar-user-row__name">{name}</span>
            {email != null ? <span className="ui-sidebar-user-row__email">{email}</span> : null}
          </span>
          <span className="ui-sidebar-user-row__trigger">
            <Icon name="ellipsis" size={16} />
          </span>
        </>
      )}
    </button>
  );

  return (
    <Menu align="start" trigger={trigger}>
      {children}
    </Menu>
  );
}
