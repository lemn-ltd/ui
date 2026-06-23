import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './settings-row.css';

export interface SettingsRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
}

/** A labelled settings row: title (+ optional description) on the left, a value or control on the right. Stack several inside a Card. */
export function SettingsRow({
  label,
  description,
  className,
  children,
  ...rest
}: SettingsRowProps): ReactElement {
  return (
    <div className={['ui-settings-row', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ui-settings-row__body">
        <span className="ui-settings-row__label">{label}</span>
        {description != null ? (
          <span className="ui-settings-row__description">{description}</span>
        ) : null}
      </div>
      <div className="ui-settings-row__control">{children}</div>
    </div>
  );
}
