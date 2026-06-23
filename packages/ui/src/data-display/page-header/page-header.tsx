import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './page-header.css';

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  readonly title: ReactNode;
  readonly titleAccessory?: ReactNode;
  readonly subtitle?: ReactNode;
  readonly actions?: ReactNode;
}

/** Page-level heading: title plus optional subtitle on the left, actions slot right-aligned. */
export function PageHeader({
  title,
  titleAccessory,
  subtitle,
  actions,
  className,
  ...rest
}: PageHeaderProps): ReactElement {
  return (
    <header className={['ui-page-header', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ui-page-header__heading">
        <div className="ui-page-header__title-row">
          <h1 className="ui-page-header__title">{title}</h1>
          {titleAccessory ? (
            <div className="ui-page-header__title-accessory">{titleAccessory}</div>
          ) : null}
        </div>
        {subtitle ? <p className="ui-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-page-header__actions">{actions}</div> : null}
    </header>
  );
}
