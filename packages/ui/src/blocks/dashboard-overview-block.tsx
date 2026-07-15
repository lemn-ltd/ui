import type { ReactElement, ReactNode } from 'react';
import { Alert } from '../feedback/alert/alert.js';
import { Skeleton } from '../feedback/skeleton/skeleton.js';
import { StatCard, type StatDelta } from '../data-display/stat-card/stat-card.js';
import { BarList, type BarListItem } from '../visualizations/bar-list/bar-list.js';
import { LineChart } from '../visualizations/line-chart/line-chart.js';
import type { ChartDatum, ChartSeries } from '../visualizations/internal/chart-types.js';
import './blocks.css';

export interface DashboardOverviewMetric {
  readonly delta?: StatDelta;
  readonly id: string;
  readonly label: ReactNode;
  readonly value: ReactNode;
}

export interface DashboardOverviewBlockProps {
  readonly description?: ReactNode;
  readonly error?: string;
  readonly loading?: boolean;
  readonly metrics: readonly DashboardOverviewMetric[];
  readonly onRetry?: () => void;
  readonly rankingItems: readonly BarListItem[];
  readonly title?: ReactNode;
  readonly trendData: readonly ChartDatum[];
  readonly trendIndex: string;
  readonly trendSeries: readonly ChartSeries<ChartDatum>[];
}

/** Curated operational dashboard composition with host-owned data and actions. */
export function DashboardOverviewBlock({
  description,
  error,
  loading = false,
  metrics,
  onRetry,
  rankingItems,
  title = 'Overview',
  trendData,
  trendIndex,
  trendSeries,
}: DashboardOverviewBlockProps): ReactElement {
  return (
    <section aria-busy={loading || undefined} className="ui-block ui-dashboard-overview-block">
      <header className="ui-block__header">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      </header>
      {error ? <Alert message={error} title="Overview unavailable" variant="error" /> : null}
      <div className="ui-dashboard-overview-block__metrics">
        {loading
          ? Array.from({ length: Math.max(3, metrics.length) }, (_, index) => (
              <Skeleton aria-label="Loading metric" key={index} shape="rect" />
            ))
          : metrics.map((metric) => (
              <StatCard delta={metric.delta} key={metric.id} label={metric.label} value={metric.value} />
            ))}
      </div>
      <div className="ui-dashboard-overview-block__visuals">
        <LineChart
          aria-label="Overview trend"
          data={trendData}
          error={error}
          index={trendIndex}
          loading={loading}
          onRetry={onRetry}
          series={trendSeries}
        />
        <BarList
          aria-label="Overview ranking"
          error={error}
          items={rankingItems}
          loading={loading}
          onRetry={onRetry}
        />
      </div>
    </section>
  );
}
