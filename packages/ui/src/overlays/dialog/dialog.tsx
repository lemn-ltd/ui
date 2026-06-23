import { Dialog as RadixDialog } from 'radix-ui';
import { type ReactElement, type ReactNode, useId } from 'react';
import { Icon, IconButton } from '../../primitives/index.js';
import { modalStackLayerProps, preventDismissFromStackedModal } from '../dialog-stack.js';
import './dialog.css';

/** Panel width scale: sm 440, md 560, lg 720, xl 960. */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DialogProps {
  readonly title: ReactNode;
  readonly children: ReactNode;
  readonly trigger?: ReactNode;
  readonly description?: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: DialogSize;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;

  /**
   * Master→detail affordance: when set, the header shows a Back control in place
   * of the title (the title stays for assistive tech). Pass it only while a
   * sub-view is open so the same modal walks list → detail and back.
   */
  readonly onBack?: () => void;
  readonly backLabel?: ReactNode;
}

export function Dialog({
  title,
  children,
  trigger,
  description,
  footer,
  size = 'sm',
  open,
  defaultOpen,
  onOpenChange,
  onBack,
  backLabel = 'Back',
}: DialogProps): ReactElement {
  const layerId = useId();

  return (
    <RadixDialog.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ui-dialog__overlay" {...modalStackLayerProps(layerId)} />
        <RadixDialog.Content
          className="ui-dialog"
          data-size={size}
          onInteractOutside={(event) => preventDismissFromStackedModal(event, layerId)}
          {...modalStackLayerProps(layerId)}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="ui-dialog__header">
            {onBack ? (
              <button className="ui-dialog__back" onClick={onBack} type="button">
                <Icon name="arrow-left" size={16} />
                {backLabel}
              </button>
            ) : null}
            <RadixDialog.Title className={onBack ? 'ui-dialog__sr-only' : 'ui-dialog__title'}>
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton aria-label="Close" variant="ghost">
                <Icon name="x" size={16} />
              </IconButton>
            </RadixDialog.Close>
          </div>
          <div className="ui-dialog__content">
            {description ? (
              <RadixDialog.Description className="ui-dialog__description">
                {description}
              </RadixDialog.Description>
            ) : null}
            <div className="ui-dialog__body">{children}</div>
          </div>
          {footer ? (
            <>
              <div className="ui-dialog__divider" />
              <div className="ui-dialog__footer">{footer}</div>
            </>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
