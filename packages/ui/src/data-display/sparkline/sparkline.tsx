import type { HTMLAttributes, ReactElement } from 'react';
import './sparkline.css';

export interface SparklineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly points: readonly number[];
}

/** Compact inline bar chart: thin accent bars scaled to the series maximum. */
export function Sparkline({ points, className, ...rest }: SparklineProps): ReactElement {
  const max = points.reduce((peak, point) => Math.max(peak, point), 0);

  return (
    <div className={['ui-sparkline', className].filter(Boolean).join(' ')} role="img" {...rest}>
      {points.map((point, index) => {
        const ratio = max > 0 ? point / max : 0;
        // Floor at 8% so a zero bar still reads as a baseline tick.
        const height = `${Math.max(8, Math.round(ratio * 100))}%`;
        return (
          <span
            className="ui-sparkline__bar"
            // Index is the stable key: the series is a fixed-position ordinal sequence.
            key={index}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}
