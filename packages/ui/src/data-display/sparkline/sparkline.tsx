import type { HTMLAttributes, ReactElement } from 'react';
import './sparkline.css';

type SparklineRootProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'children' | 'role'
>;

type InformativeSparklineProps =
  | {
      readonly decorative?: false;
      readonly 'aria-label': string;
      readonly 'aria-labelledby'?: never;
    }
  | {
      readonly decorative?: false;
      readonly 'aria-label'?: never;
      readonly 'aria-labelledby': string;
    };

type DecorativeSparklineProps = {
  readonly decorative: true;
  readonly 'aria-label'?: never;
  readonly 'aria-labelledby'?: never;
};

export type SparklineProps = SparklineRootProps &
  (InformativeSparklineProps | DecorativeSparklineProps) & {
  readonly points: readonly number[];
  };

/** Compact inline bar chart: thin accent bars scaled to the series maximum. */
export function Sparkline({
  points,
  className,
  decorative = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: SparklineProps): ReactElement {
  const max = points.reduce((peak, point) => Math.max(peak, point), 0);

  return (
    <div
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      aria-labelledby={decorative ? undefined : ariaLabelledBy}
      className={['ui-sparkline', className].filter(Boolean).join(' ')}
      role={decorative ? undefined : 'img'}
      {...rest}
    >
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
