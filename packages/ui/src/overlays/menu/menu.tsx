import { DropdownMenu } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import { Icon, type IconName, Kbd } from '../../primitives/index.js';
import './menu.css';

export interface MenuProps {
  readonly trigger: ReactNode;
  readonly children: ReactNode;
  readonly align?: 'start' | 'center' | 'end';
  readonly contentClassName?: string;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function Menu({
  trigger,
  children,
  align = 'start',
  contentClassName,
  open,
  defaultOpen,
  onOpenChange,
}: MenuProps): ReactElement {
  return (
    <DropdownMenu.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          className={['ui-menu', contentClassName].filter(Boolean).join(' ')}
          sideOffset={6}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export type MenuItemTone = 'default' | 'danger';

export interface MenuItemProps {
  readonly children: ReactNode;
  readonly icon?: IconName;
  readonly leading?: ReactNode;
  readonly shortcut?: ReactNode;
  readonly checked?: boolean;
  readonly tone?: MenuItemTone;
  readonly disabled?: boolean;
  readonly onSelect?: (event: Event) => void;
}

export function MenuItem({
  children,
  icon,
  leading,
  shortcut,
  checked,
  tone = 'default',
  disabled,
  onSelect,
}: MenuItemProps): ReactElement {
  // The trailing slot collapses to zero width when empty so default items keep no
  // phantom right padding; only a check or a shortcut fills it.
  const trailing = checked ? (
    <Icon name="check" size={16} />
  ) : shortcut ? (
    <Kbd>{shortcut}</Kbd>
  ) : null;

  // A leading slot takes a custom node (e.g. an org mark); otherwise the icon
  // shorthand renders a glyph.
  const leadingNode =
    leading ?? (icon ? <Icon className="ui-menu__icon" name={icon} size={16} /> : null);

  return (
    <DropdownMenu.Item
      className="ui-menu__item"
      data-tone={tone}
      disabled={disabled}
      onSelect={onSelect}
    >
      {leadingNode}
      <span className="ui-menu__label">{children}</span>
      {trailing ? <span className="ui-menu__trailing">{trailing}</span> : null}
    </DropdownMenu.Item>
  );
}

export interface MenuLabelProps {
  readonly children: ReactNode;
}

export function MenuLabel({ children }: MenuLabelProps): ReactElement {
  return <DropdownMenu.Label className="ui-menu__section">{children}</DropdownMenu.Label>;
}

export function MenuSeparator(): ReactElement {
  return <DropdownMenu.Separator className="ui-menu__separator" />;
}
