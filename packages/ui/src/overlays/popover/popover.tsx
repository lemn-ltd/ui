import { Popover as RadixPopover } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import './popover.css';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface PopoverProps {
  readonly trigger: ReactNode;
  readonly children: ReactNode;
  readonly placement?: PopoverPlacement;
  readonly arrow?: boolean;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function Popover({
  trigger,
  children,
  placement = 'bottom',
  arrow = false,
  open,
  defaultOpen,
  onOpenChange,
}: PopoverProps): ReactElement {
  return (
    <RadixPopover.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="ui-popover" side={placement} sideOffset={6}>
          {children}
          {arrow ? <RadixPopover.Arrow className="ui-popover__arrow" /> : null}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
