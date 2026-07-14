import type { ReactElement } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartVisualizationFrame } from '../internal/chart-a11y.js';
import { useChartSeriesVisibility } from '../internal/chart-legend.js';
import {
  chartAccessibleName,
  chartColor,
  type ChartAccessibleName,
  type ChartAnimation,
  type ChartColor,
  type ChartStateProps,
} from '../internal/chart-types.js';
import './donut-chart.css';

export interface DonutChartDatum {
  readonly color?: ChartColor;
  readonly label: string;
  readonly value: number;
}

export type DonutChartProps = ChartAccessibleName &
  ChartStateProps & {
    readonly animation?: ChartAnimation;
    readonly centerLabel?: string;
    readonly data: readonly DonutChartDatum[];
    readonly showLegend?: boolean;
    readonly showTooltip?: boolean;
    readonly valueFormatter?: (value: number) => string;
  };

/** Donut chart with an explicit zero-total state and optional center label. */
export function DonutChart({
  animation = 'auto',
  centerLabel,
  className,
  data,
  emptyMessage = 'No non-zero data available.',
  error,
  height = 320,
  loading,
  onRetry,
  showLegend = true,
  showTooltip = true,
  style,
  valueFormatter = (value) => String(value),
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: DonutChartProps): ReactElement {
  const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
  const legendItems = data.map((item, index) => ({
    color: chartColor(item.color, index),
    id: item.label,
    name: item.label,
  }));
  const visibleData = data.filter((item) => !hiddenSeries.has(item.label));
  const total = visibleData.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);

  return (
    <ChartVisualizationFrame
      {...frameName}
      className={['ui-donut-chart', className].filter(Boolean).join(' ')}
      dataLength={total > 0 ? data.length : 0}
      emptyMessage={emptyMessage}
      error={error}
      height={height}
      hiddenSeries={showLegend ? hiddenSeries : undefined}
      legendItems={showLegend ? legendItems : undefined}
      loading={loading}
      onRetry={onRetry}
      onToggleSeries={showLegend ? toggleSeries : undefined}
      style={style}
      summary={`${data.length} donut segments with a visible total of ${valueFormatter(total)}: ${data.map((item) => `${item.label} ${valueFormatter(item.value)}`).join(', ')}.`}
    >
      <div className="ui-donut-chart__canvas">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart accessibilityLayer>
            <Pie
              cx="50%"
              cy="50%"
              data={visibleData}
              dataKey="value"
              innerRadius="58%"
              isAnimationActive={animation !== 'none'}
              nameKey="label"
              outerRadius="84%"
              paddingAngle={2}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {visibleData.map((item) => {
                const originalIndex = data.indexOf(item);
                return <Cell fill={chartColor(item.color, originalIndex)} key={item.label} />;
              })}
            </Pie>
            {showTooltip ? (
              <Tooltip
                contentStyle={{
                  background: 'var(--chart-tooltip-surface)',
                  border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? valueFormatter(value) : String(value ?? '—'),
                  String(name),
                ]}
              />
            ) : null}
          </PieChart>
        </ResponsiveContainer>
        {centerLabel ? (
          <span aria-hidden="true" className="ui-donut-chart__center-label">
            {centerLabel}
          </span>
        ) : null}
      </div>
    </ChartVisualizationFrame>
  );
}
