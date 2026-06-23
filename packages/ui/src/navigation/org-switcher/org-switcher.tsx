import { type ReactElement, type ReactNode, useState } from 'react';
import { useShell } from '../../layout/screen-shell/shell-context.js';
import { Menu, MenuItem, MenuSeparator, Tooltip } from '../../overlays/index.js';
import { Icon, type IconName } from '../../primitives/index.js';
import { useSidebarChrome } from '../sidebar/sidebar-chrome-context.js';
import './org-switcher.css';

export type OrgSwitcherVariant = 'expanded' | 'rail';

export interface OrgItem {
  readonly id: string;
  readonly name: ReactNode;
  readonly mark?: ReactNode;
}

export interface OrgSwitcherActiveAction {
  readonly label: string;
  readonly icon?: IconName;
  readonly onSelect: (id: string) => void;
}

export interface OrgSwitcherProps {
  readonly orgs: readonly OrgItem[];
  readonly currentOrgId: string;
  readonly variant?: OrgSwitcherVariant;
  readonly onSelectOrg?: (id: string) => void;
  readonly activeOrgAction?: OrgSwitcherActiveAction;
  readonly footer?: ReactNode;
}

export function OrgSwitcher({
  orgs,
  currentOrgId,
  variant: explicitVariant,
  onSelectOrg,
  activeOrgAction,
  footer,
}: OrgSwitcherProps): ReactElement {
  const shell = useShell();
  const rail = useSidebarChrome()?.rail ?? shell?.sidebar.mode === 'rail';
  // Follows the shell's desktop rail; the mobile drawer keeps the expanded form.
  const variant: OrgSwitcherVariant = explicitVariant ?? (rail ? 'rail' : 'expanded');
  const [open, setOpen] = useState(false);
  const current = orgs.find((org) => org.id === currentOrgId);

  const trigger = (
    <button
      className="ui-org-switcher"
      data-open={open ? 'true' : 'false'}
      data-variant={variant}
      type="button"
    >
      <span className="ui-org-switcher__mark">{current?.mark}</span>
      {variant === 'expanded' ? (
        <>
          <span className="ui-org-switcher__name">{current?.name}</span>
          <Icon className="ui-org-switcher__chevron" name="chevron-down" size={16} />
        </>
      ) : null}
    </button>
  );

  return (
    <Menu
      contentClassName="ui-org-switcher__menu"
      onOpenChange={setOpen}
      open={open}
      trigger={trigger}
    >
      {orgs.map((org) => {
        const active = org.id === currentOrgId;
        const item = (
          <MenuItem
            key={org.id}
            leading={<span className="ui-org-switcher__row-mark">{org.mark}</span>}
            onSelect={() => onSelectOrg?.(org.id)}
          >
            {org.name}
          </MenuItem>
        );

        if (!active) return item;

        // The selected org reads as one tinted row: the background wraps the
        // mark, name, and the optional active-org action so none reads as detached.
        const icon = activeOrgAction?.icon ?? 'settings';
        return (
          <div className="ui-org-switcher__active-row" key={org.id}>
            {item}
            {activeOrgAction ? (
              <Tooltip content={activeOrgAction.label} placement="right">
                <button
                  aria-label={activeOrgAction.label}
                  className="ui-org-switcher__active-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    activeOrgAction.onSelect(org.id);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <Icon name={icon} size={16} />
                </button>
              </Tooltip>
            ) : null}
          </div>
        );
      })}
      {footer != null ? (
        <>
          <MenuSeparator />
          {footer}
        </>
      ) : null}
    </Menu>
  );
}
