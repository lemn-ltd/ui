import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './page-section.css';

export interface PageSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  readonly title?: ReactNode;
  readonly caption?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export function PageSection({
  title,
  caption,
  actions,
  className,
  children,
  ...rest
}: PageSectionProps): ReactElement {
  const hasHeader = title != null || caption != null || actions != null;

  return (
    <section className={['ui-page-section', className].filter(Boolean).join(' ')} {...rest}>
      {hasHeader ? (
        <header className="ui-page-section__header">
          <div className="ui-page-section__heading">
            {title != null ? <h2 className="ui-page-section__title">{title}</h2> : null}
            {caption != null ? <p className="ui-page-section__caption">{caption}</p> : null}
          </div>
          {actions != null ? <div className="ui-page-section__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ui-page-section__body">{children}</div>
    </section>
  );
}
