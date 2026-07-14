import type { ReactElement, ReactNode } from 'react';
import './tab-navigation.css';

export interface TabNavigationItem {
  readonly href: string;
  readonly label: ReactNode;
  readonly count?: number;
  readonly badge?: ReactNode;
  readonly disabled?: boolean;
}

export interface TabNavigationProps {
  readonly items: readonly TabNavigationItem[];
  readonly currentHref?: string;
  readonly 'aria-label': string;
  readonly className?: string;
}

/** URL navigation styled as a tab rail; it never owns tab panels. */
export function TabNavigation({
  items,
  currentHref,
  'aria-label': ariaLabel,
  className,
}: TabNavigationProps): ReactElement {
  return (
    <nav
      aria-label={ariaLabel}
      className={['ui-tab-navigation', className].filter(Boolean).join(' ')}
    >
      <ul className="ui-tab-navigation__list">
        {items.map((item) => {
          const active = item.href === currentHref;
          return (
            <li className="ui-tab-navigation__item" key={item.href}>
              <a
                aria-current={active ? 'page' : undefined}
                aria-disabled={item.disabled || undefined}
                className="ui-tab-navigation__link"
                data-disabled={item.disabled || undefined}
                href={item.disabled ? undefined : item.href}
              >
                <span>{item.label}</span>
                {item.count != null ? (
                  <span className="ui-tab-navigation__count">{item.count}</span>
                ) : null}
                {item.badge ? <span className="ui-tab-navigation__badge">{item.badge}</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
