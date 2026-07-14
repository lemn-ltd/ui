import type { ReactElement, ReactNode } from 'react';
import { ChartFrame } from '../chart-frame/chart-frame.js';
import { ChartLegend, type ChartLegendItem } from './chart-legend.js';
import {
  chartAccessibleName,
  type ChartAccessibleName,
  type ChartStateProps,
} from './chart-types.js';
import './chart-internal.css';

type ChartVisualizationFrameProps = ChartAccessibleName &
  ChartStateProps & {
    readonly children: ReactNode;
    readonly dataLength: number;
    readonly hiddenSeries?: ReadonlySet<string>;
    readonly legendItems?: readonly ChartLegendItem[];
    readonly onToggleSeries?: (seriesId: string) => void;
    readonly summary: string;
  };

export function ChartVisualizationFrame({
  children,
  className,
  dataLength,
  emptyMessage,
  error,
  height = 320,
  hiddenSeries,
  legendItems,
  loading,
  onRetry,
  onToggleSeries,
  style,
  summary,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ChartVisualizationFrameProps): ReactElement {
  const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);

  return (
    <ChartFrame
      {...frameName}
      className={className}
      empty={dataLength === 0}
      emptyMessage={emptyMessage}
      error={error}
      loading={loading}
      onRetry={onRetry}
      style={style}
    >
      <div className="ui-chart-visualization" style={{ minHeight: height }}>
        <div className="ui-chart-visualization__canvas" style={{ height }}>
          {children}
        </div>
        {legendItems && hiddenSeries && onToggleSeries ? (
          <ChartLegend hidden={hiddenSeries} items={legendItems} onToggle={onToggleSeries} />
        ) : null}
        <p className="ui-chart-visually-hidden">{summary}</p>
      </div>
    </ChartFrame>
  );
}
