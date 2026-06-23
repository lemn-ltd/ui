import type { HTMLAttributes, ReactElement } from 'react';
import './tag.css';

export type TagVariant = 'default' | 'accent' | 'muted';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: TagVariant;
}

export function Tag({ variant = 'default', className, children, ...rest }: TagProps): ReactElement {
  return (
    <span
      className={['ui-tag', className].filter(Boolean).join(' ')}
      data-variant={variant}
      {...rest}
    >
      {children}
    </span>
  );
}
