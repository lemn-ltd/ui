import type { HTMLAttributes, ReactElement } from 'react';
import './spinner.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  readonly size?: SpinnerSize;
}

/** Indeterminate circular spinner; the ring is static under reduced motion. */
export function Spinner({
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Loading',
  ...rest
}: SpinnerProps): ReactElement {
  return (
    <div
      aria-label={ariaLabel}
      className={['ui-spinner', className].filter(Boolean).join(' ')}
      data-size={size}
      role="status"
      {...rest}
    />
  );
}
