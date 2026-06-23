import { type ReactElement, type ReactNode, useId } from 'react';
import { InfoBanner, Spinner } from '../../feedback/index.js';
import { Button } from '../../primitives/index.js';
import { Dialog, type DialogSize } from '../dialog/dialog.js';
import './form-dialog.css';

export interface FormDialogProps {
  readonly title: ReactNode;
  readonly children: ReactNode;
  readonly trigger?: ReactNode;
  readonly description?: ReactNode;

  /** Error-summary banner at the end of the form body; it scrolls with the fields. */
  readonly error?: ReactNode;

  readonly size?: DialogSize;
  readonly submitLabel?: ReactNode;
  readonly cancelLabel?: ReactNode;
  readonly submitting?: boolean;
  readonly submitDisabled?: boolean;

  readonly onSubmit: () => void;
  readonly onCancel?: () => void;

  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

/**
 * The create/edit form modal. It composes `Dialog` (so it inherits the focus trap, Escape-close,
 * focus return, sizing and mobile bottom-sheet) and adds form semantics: a scrollable `<form>`
 * body, a pinned Cancel/Submit footer, a `submitting` state, and an optional error-summary banner.
 * The submit button lives in the dialog footer and associates with the body form via the `form`
 * attribute, so Enter-to-submit and the footer button drive the same `onSubmit`. The caller fills
 * the body with `Field` rows and owns validation and open state.
 */
export function FormDialog({
  title,
  children,
  trigger,
  description,
  error,
  size = 'lg',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitting = false,
  submitDisabled = false,
  onSubmit,
  onCancel,
  open,
  defaultOpen,
  onOpenChange,
}: FormDialogProps): ReactElement {
  const formId = useId();

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    if (!submitting) onSubmit();
  };

  return (
    <Dialog
      defaultOpen={defaultOpen}
      description={description}
      footer={
        <>
          <Button onClick={onCancel} type="button" variant="ghost">
            {cancelLabel}
          </Button>
          <Button
            disabled={submitting || submitDisabled}
            form={formId}
            type="submit"
            variant="primary"
          >
            {submitting ? <Spinner className="ui-form-dialog__spinner" size="sm" /> : null}
            {submitLabel}
          </Button>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      size={size}
      title={title}
      trigger={trigger}
    >
      <form className="ui-form-dialog__form" id={formId} onSubmit={handleSubmit}>
        {children}
        {error ? (
          <InfoBanner className="ui-form-dialog__error" variant="danger">
            {error}
          </InfoBanner>
        ) : null}
      </form>
    </Dialog>
  );
}
