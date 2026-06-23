import { AlertDialog } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '../../primitives/index.js';
import './confirm-dialog.css';

export type ConfirmDialogVariant = 'default' | 'danger';

export interface ConfirmDialogProps {
  readonly title: ReactNode;
  readonly trigger?: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
  readonly variant?: ConfirmDialogVariant;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly confirmDisabled?: boolean;
  readonly cancelDisabled?: boolean;
  readonly confirmTestId?: string;
  readonly cancelTestId?: string;
  readonly onConfirm?: () => void;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  title,
  trigger,
  description,
  children,
  variant = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  cancelDisabled = false,
  confirmTestId,
  cancelTestId,
  onConfirm,
  open,
  defaultOpen,
  onOpenChange,
}: ConfirmDialogProps): ReactElement {
  return (
    <AlertDialog.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open}>
      {trigger ? <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger> : null}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="ui-confirm-dialog__overlay" />
        <AlertDialog.Content
          className="ui-confirm-dialog"
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="ui-confirm-dialog__body">
            <AlertDialog.Title className="ui-confirm-dialog__title">{title}</AlertDialog.Title>
            {description ? (
              <AlertDialog.Description className="ui-confirm-dialog__description">
                {description}
              </AlertDialog.Description>
            ) : null}
            {children ? <div className="ui-confirm-dialog__content">{children}</div> : null}
          </div>
          <div className="ui-confirm-dialog__divider" />
          <div className="ui-confirm-dialog__footer">
            <AlertDialog.Cancel asChild>
              <Button data-testid={cancelTestId} disabled={cancelDisabled} variant="secondary">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                data-testid={confirmTestId}
                disabled={confirmDisabled}
                onClick={onConfirm}
                variant={variant === 'danger' ? 'danger' : 'primary'}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
