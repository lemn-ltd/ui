import type { HTMLAttributes, ReactElement } from 'react';
import { StatCard, type StatCardProps } from '../stat-card/stat-card.js';
import './stats-strip.css';

export interface StatsStripProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly stats: readonly StatCardProps[];
}

/** Edge-to-edge horizontal row of `StatCard`s separated by thin border dividers. */
export function StatsStrip({ stats, className, ...rest }: StatsStripProps): ReactElement {
  return (
    <div className={['ui-stats-strip', className].filter(Boolean).join(' ')} {...rest}>
      {stats.map((stat, index) => (
        <div
          className="ui-stats-strip__cell"
          // Stats are a fixed ordinal strip; position is the stable key.
          key={index}
        >
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
}
