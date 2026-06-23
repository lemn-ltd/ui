import { Fragment, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import './breadcrumb.css';

export interface BreadcrumbItem {
  readonly label: ReactNode;
  readonly href?: string;
  readonly onClick?: () => void;
}

export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly items: readonly BreadcrumbItem[];
}

export function Breadcrumb({ items, className, ...rest }: BreadcrumbProps): ReactElement {
  return (
    <nav
      aria-label="Breadcrumb"
      className={['ui-breadcrumb', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const key = `${index}`;
        return (
          <Fragment key={key}>
            {index > 0 ? (
              <span aria-hidden="true" className="ui-breadcrumb__separator">
                /
              </span>
            ) : null}
            {isLast ? (
              <span aria-current="page" className="ui-breadcrumb__item" data-active="true">
                {item.label}
              </span>
            ) : item.href != null ? (
              <a className="ui-breadcrumb__item" href={item.href} onClick={item.onClick}>
                {item.label}
              </a>
            ) : item.onClick != null ? (
              <button className="ui-breadcrumb__item" onClick={item.onClick} type="button">
                {item.label}
              </button>
            ) : (
              <span className="ui-breadcrumb__item" data-static="true">
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
