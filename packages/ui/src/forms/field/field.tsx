import { type ReactElement, type ReactNode, useId } from 'react';
import './field.css';

export type FieldState = 'default' | 'invalid' | 'disabled';

/**
 * The wiring a `Field` hands to its control so labeling and validity stay on the
 * field while the control keeps owning its own border and disabled rendering.
 */
export interface FieldControlProps {
  readonly id: string;
  readonly 'aria-invalid': boolean | undefined;
  readonly 'aria-describedby': string | undefined;
  readonly invalid: boolean | undefined;
  readonly disabled: boolean | undefined;
}

export interface FieldProps {
  readonly label: ReactNode;
  readonly children: (control: FieldControlProps) => ReactNode;

  readonly state?: FieldState;
  readonly required?: boolean;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;

  readonly className?: string;
}

/**
 * The canonical form row. Owns the label, required asterisk, hint, and error
 * line and wires them to its control via a render contract; the control reads
 * `invalid`/`disabled` flags and `Field` never styles the control's border.
 */
export function Field({
  label,
  children,
  state = 'default',
  required,
  hint,
  error,
  className,
}: FieldProps): ReactElement {
  const controlId = useId();
  const helperId = useId();

  const invalid = state === 'invalid';
  const disabled = state === 'disabled';

  // The error line replaces the hint when invalid — they never both render.
  const helper = invalid ? error : hint;
  const describedBy = helper ? helperId : undefined;

  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')} data-state={state}>
      <label className="ui-field__label" htmlFor={controlId}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ui-field__required">
            *
          </span>
        ) : null}
      </label>

      <div className="ui-field__control">
        {children({
          id: controlId,
          'aria-invalid': invalid || undefined,
          'aria-describedby': describedBy,
          invalid: invalid || undefined,
          disabled: disabled || undefined,
        })}
      </div>

      {helper ? (
        <p className="ui-field__helper" data-tone={invalid ? 'error' : 'hint'} id={helperId}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
