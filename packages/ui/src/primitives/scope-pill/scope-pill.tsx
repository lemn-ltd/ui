import type { HTMLAttributes, ReactElement } from 'react';
import './scope-pill.css';

export type ScopePillProps = HTMLAttributes<HTMLSpanElement>;

export function ScopePill({ className, children, ...rest }: ScopePillProps): ReactElement {
  return (
    <span className={['ui-scope-pill', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
