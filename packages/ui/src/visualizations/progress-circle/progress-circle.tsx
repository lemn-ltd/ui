import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import type { ChartAccessibleName } from '../internal/chart-types.js';
import './progress-circle.css';

export type ProgressCircleProps = ChartAccessibleName &
  Omit<HTMLAttributes<HTMLDivElement>, 'aria-label' | 'aria-labelledby' | 'children' | 'role'> & {
    readonly label?: ReactNode;
    readonly max?: number;
    readonly size?: number;
    readonly strokeWidth?: number;
    readonly value?: number;
  };

/** Native SVG circular progress indicator for determinate or indeterminate work. */
export function ProgressCircle({
  className,
  label,
  max = 100,
  size = 64,
  strokeWidth = 6,
  style,
  value,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ProgressCircleProps): ReactElement {
  const safeMax = max > 0 ? max : 100;
  const determinate = value !== undefined;
  const clampedValue = determinate ? Math.min(safeMax, Math.max(0, value)) : undefined;
  const percentage = clampedValue === undefined ? 25 : (clampedValue / safeMax) * 100;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <div
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-valuemax={determinate ? safeMax : undefined}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuenow={clampedValue}
      className={['ui-progress-circle', className].filter(Boolean).join(' ')}
      data-indeterminate={!determinate || undefined}
      role="progressbar"
      style={{ ...style, width: size, height: size }}
      {...rest}
    >
      <svg aria-hidden="true" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle className="ui-progress-circle__track" cx={center} cy={center} fill="none" r={radius} strokeWidth={strokeWidth} />
        <circle
          className="ui-progress-circle__indicator"
          cx={center}
          cy={center}
          fill="none"
          pathLength={100}
          r={radius}
          strokeDasharray="100"
          strokeDashoffset={100 - percentage}
          strokeWidth={strokeWidth}
        />
      </svg>
      {label ? <span className="ui-progress-circle__label">{label}</span> : null}
    </div>
  );
}
