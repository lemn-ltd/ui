import type { CSSProperties, HTMLAttributes, ReactElement } from 'react';
import './progress-bar.css';

export type ProgressBarVariant = 'determinate' | 'indeterminate' | 'route';

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  readonly variant?: ProgressBarVariant;
  readonly value?: number;
  readonly showLabel?: boolean;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Linear progress; determinate carries ARIA, loops are static under reduced motion. */
export function ProgressBar({
  variant = 'determinate',
  value = 0,
  showLabel = false,
  className,
  style,
  ...rest
}: ProgressBarProps): ReactElement {
  const isDeterminate = variant === 'determinate';
  const percent = clampPercent(value);

  const fillStyle = isDeterminate
    ? ({ '--ui-progress-value': `${percent}%` } as CSSProperties)
    : undefined;

  return (
    <div
      className={['ui-progress-bar', className].filter(Boolean).join(' ')}
      data-variant={variant}
      style={style}
      {...(isDeterminate
        ? {
            role: 'progressbar',
            'aria-valuenow': percent,
            'aria-valuemin': 0,
            'aria-valuemax': 100,
          }
        : {})}
      {...rest}
    >
      <div className="ui-progress-bar__fill" style={fillStyle} />
      {isDeterminate && showLabel ? (
        <span className="ui-progress-bar__label">{percent}%</span>
      ) : null}
    </div>
  );
}
