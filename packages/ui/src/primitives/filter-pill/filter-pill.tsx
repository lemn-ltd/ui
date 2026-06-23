import type { ButtonHTMLAttributes, ReactElement, Ref } from 'react';
import { Icon } from '../icon/icon.js';
import './filter-pill.css';

export interface FilterPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly active?: boolean;
  readonly open?: boolean;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function FilterPill({
  active = false,
  open = false,
  type = 'button',
  className,
  children,
  ...rest
}: FilterPillProps): ReactElement {
  return (
    <button
      className={['ui-filter-pill', className].filter(Boolean).join(' ')}
      data-active={active ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
      type={type}
      {...rest}
    >
      <span className="ui-filter-pill__label">{children}</span>
      <Icon className="ui-filter-pill__chevron" name="chevron-down" size={14} />
    </button>
  );
}
