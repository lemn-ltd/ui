import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './stat-card.css';

export type StatDeltaDirection = 'up' | 'down' | 'flat';

const DELTA_ICON = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
} as const;

export interface StatDelta {
  readonly direction: StatDeltaDirection;
  readonly label: ReactNode;
}

export interface StatCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly delta?: StatDelta;
}

/** A single metric tile: muted label, display-sized value, and an optional signed delta. */
export function StatCard({ label, value, delta, className, ...rest }: StatCardProps): ReactElement {
  return (
    <div className={['ui-stat-card', className].filter(Boolean).join(' ')} {...rest}>
      <span className="ui-stat-card__label">{label}</span>
      <span className="ui-stat-card__value">{value}</span>
      {delta
        ? (() => {
            const DeltaIcon = DELTA_ICON[delta.direction];
            return (
              <span className="ui-stat-card__delta" data-direction={delta.direction}>
                <DeltaIcon aria-hidden className="ui-stat-card__delta-icon" />
                {delta.label}
              </span>
            );
          })()
        : null}
    </div>
  );
}
