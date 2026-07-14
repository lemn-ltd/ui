import type { HTMLAttributes, ReactElement } from 'react';
import type { ChartAccessibleName } from '../internal/chart-types.js';
import './tracker.css';

export type TrackerStatus = 'complete' | 'active' | 'pending' | 'error';

export interface TrackerItem {
  readonly description?: string;
  readonly label: string;
  readonly status: TrackerStatus;
}

export type TrackerProps = ChartAccessibleName &
  Omit<HTMLAttributes<HTMLOListElement>, 'aria-label' | 'aria-labelledby' | 'children'> & {
    readonly items: readonly TrackerItem[];
  };

/** Discrete status sequence whose labels preserve meaning without its colors. */
export function Tracker({
  className,
  items,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: TrackerProps): ReactElement {
  return (
    <ol
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={['ui-tracker', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {items.map((item) => (
        <li
          className="ui-tracker__item"
          data-status={item.status}
          key={item.label}
          title={item.description}
        >
          <span aria-hidden="true" className="ui-tracker__block" />
          <span className="ui-tracker__sr-only">
            {item.label}: {item.status}. {item.description}
          </span>
        </li>
      ))}
    </ol>
  );
}
