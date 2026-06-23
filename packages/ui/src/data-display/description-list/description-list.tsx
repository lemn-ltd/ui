import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './description-list.css';

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  readonly children: ReactNode;
}

/** A label/value detail list: stack DescriptionRow children inside a detail panel or dialog. */
export function DescriptionList({
  className,
  children,
  ...rest
}: DescriptionListProps): ReactElement {
  return (
    <dl className={['ui-description-list', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </dl>
  );
}

export interface DescriptionRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly label: ReactNode;
  readonly children: ReactNode;
}

/**
 * One label/value row of a DescriptionList.
 *
 * The value should lead with text content (text, link, badge); trailing inline
 * controls such as an IconButton keep the first-line baseline alignment intact.
 */
export function DescriptionRow({
  label,
  className,
  children,
  ...rest
}: DescriptionRowProps): ReactElement {
  return (
    <div className={['ui-description-list__row', className].filter(Boolean).join(' ')} {...rest}>
      <dt className="ui-description-list__label">{label}</dt>
      <dd className="ui-description-list__value">{children}</dd>
    </div>
  );
}
