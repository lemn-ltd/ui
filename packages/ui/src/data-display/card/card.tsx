import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './card.css';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: ReactNode;
  readonly footer?: ReactNode;
  readonly elevated?: boolean;
  /** Lift + shadow transition on hover. Off by default; opt in for clickable card surfaces. */
  readonly interactive?: boolean;
}

/** Surface container with optional title, body, and footer slots that collapse when absent. */
export function Card({
  title,
  footer,
  elevated = false,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps): ReactElement {
  return (
    <div
      className={['ui-card', className].filter(Boolean).join(' ')}
      data-elevated={elevated ? 'true' : 'false'}
      data-interactive={interactive ? 'true' : 'false'}
      {...rest}
    >
      {title ? <div className="ui-card__title">{title}</div> : null}
      {children ? <div className="ui-card__body">{children}</div> : null}
      {footer ? <div className="ui-card__footer">{footer}</div> : null}
    </div>
  );
}
