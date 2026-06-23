import { Dialog as RadixDialog } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import './drawer.css';

/** Panel width scale: sm 380, md 460, lg 600. */
export type DrawerWidth = 'sm' | 'md' | 'lg';

export interface DrawerProps {
  readonly title: ReactNode;
  readonly children: ReactNode;
  readonly trigger?: ReactNode;
  readonly description?: ReactNode;
  readonly footer?: ReactNode;
  readonly width?: DrawerWidth;
  readonly className?: string;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

/**
 * Floating, rounded right-side panel layered over a scrim. It has no close
 * button: it dismisses on click-outside or Escape and returns focus on close
 * (Radix Dialog). Reflows to a floating bottom sheet below the mobile breakpoint.
 */
export function Drawer({
  title,
  children,
  trigger,
  description,
  footer,
  width = 'md',
  className,
  open,
  defaultOpen,
  onOpenChange,
}: DrawerProps): ReactElement {
  return (
    <RadixDialog.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ui-drawer__overlay" />
        <RadixDialog.Content
          className={['ui-drawer', className].filter(Boolean).join(' ')}
          data-width={width}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="ui-drawer__header">
            <RadixDialog.Title className="ui-drawer__title">{title}</RadixDialog.Title>
          </div>
          <div className="ui-drawer__body">
            {description ? (
              <RadixDialog.Description className="ui-drawer__description">
                {description}
              </RadixDialog.Description>
            ) : null}
            <div className="ui-drawer__content">{children}</div>
          </div>
          {footer ? (
            <>
              <div className="ui-drawer__divider" />
              <div className="ui-drawer__footer">{footer}</div>
            </>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
