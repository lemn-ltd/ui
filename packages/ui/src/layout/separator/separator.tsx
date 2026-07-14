import type { HTMLAttributes, ReactElement } from 'react';
import './separator.css';

export interface SeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly decorative?: boolean;
}

/** Explicit visual or semantic division with no implicit layout. */
export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
  ...rest
}: SeparatorProps): ReactElement {
  return (
    <div
      aria-hidden={decorative || undefined}
      aria-orientation={decorative ? undefined : orientation}
      className={['ui-separator', className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      role={decorative ? 'presentation' : 'separator'}
      {...rest}
    />
  );
}
