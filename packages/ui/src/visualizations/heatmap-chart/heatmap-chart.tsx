import type { ECharts, EChartsOption } from 'echarts';
import { type ReactElement, useEffect, useRef } from 'react';
import { ChartVisualizationFrame } from '../internal/chart-a11y.js';
import type { ChartAccessibleName, ChartStateProps } from '../internal/chart-types.js';
import './heatmap-chart.css';

export interface HeatmapChartDatum {
  readonly value: number;
  readonly x: string;
  readonly y: string;
}

export type HeatmapChartProps = ChartAccessibleName &
  ChartStateProps & {
    readonly data: readonly HeatmapChartDatum[];
    readonly onValueChange?: (datum: HeatmapChartDatum) => void;
    readonly showTooltip?: boolean;
    readonly showVisualMap?: boolean;
    readonly xLabel?: string;
    readonly yLabel?: string;
  };

const TOKEN_FALLBACKS = {
  axis: '#5a6b82',
  border: '#e3e8ef',
  canvas: '#ffffff',
  series1: '#2563eb',
  series2: '#0f766e',
  series3: '#d97706',
  series4: '#7c3aed',
  series5: '#e11d48',
  text: '#0e141b',
} as const;

function token(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: string,
): string {
  return styles.getPropertyValue(name).trim() || fallback;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function optionFor(
  element: HTMLElement,
  data: readonly HeatmapChartDatum[],
  showTooltip: boolean,
  showVisualMap: boolean,
  xLabel: string | undefined,
  yLabel: string | undefined,
): EChartsOption {
  const styles = getComputedStyle(element);
  const values = data.map((datum) => datum.value);
  const minimum = values.length > 0 ? Math.min(...values) : 0;
  const maximum = values.length > 0 ? Math.max(...values) : 0;
  const xValues = unique(data.map((datum) => datum.x));
  const yValues = unique(data.map((datum) => datum.y));
  const palette = [1, 2, 3, 4, 5].map((index) =>
    token(
      styles,
      `--lemn-chart-series-${index}`,
      TOKEN_FALLBACKS[`series${index}` as keyof typeof TOKEN_FALLBACKS],
    ),
  );

  return {
    animationDuration: 240,
    aria: { enabled: true },
    backgroundColor: 'transparent',
    grid: { bottom: showVisualMap ? 72 : 32, containLabel: true, left: 16, right: 20, top: 12 },
    series: [
      {
        data: data.map((datum) => [
          xValues.indexOf(datum.x),
          yValues.indexOf(datum.y),
          datum.value,
        ]),
        emphasis: {
          itemStyle: {
            borderColor: token(styles, '--lemn-color-text', TOKEN_FALLBACKS.text),
            borderWidth: 2,
          },
        },
        itemStyle: {
          borderColor: token(styles, '--lemn-color-canvas', TOKEN_FALLBACKS.canvas),
          borderRadius: 3,
          borderWidth: 2,
        },
        type: 'heatmap',
      },
    ],
    textStyle: {
      color: token(styles, '--lemn-color-text', TOKEN_FALLBACKS.text),
      fontFamily: token(styles, '--lemn-font-body', 'ui-sans-serif, system-ui, sans-serif'),
    },
    tooltip: {
      backgroundColor: token(styles, '--lemn-chart-tooltip-surface', '#0f172a'),
      borderColor: token(styles, '--lemn-chart-tooltip-border', '#334155'),
      confine: true,
      renderMode: 'richText',
      show: showTooltip,
      textStyle: { color: token(styles, '--lemn-chart-tooltip-text', '#ffffff') },
      trigger: 'item',
    },
    visualMap: {
      calculable: true,
      inRange: { color: palette },
      max: maximum,
      min: minimum,
      orient: 'horizontal',
      show: showVisualMap,
      textStyle: { color: token(styles, '--lemn-chart-axis', TOKEN_FALLBACKS.axis) },
      left: 'center',
      bottom: 8,
    },
    xAxis: {
      axisLabel: { color: token(styles, '--lemn-chart-axis', TOKEN_FALLBACKS.axis) },
      axisLine: { lineStyle: { color: token(styles, '--lemn-color-border', TOKEN_FALLBACKS.border) } },
      data: xValues,
      name: xLabel,
      nameLocation: 'middle',
      nameTextStyle: { padding: [18, 0, 0, 0] },
      splitArea: { show: true },
      type: 'category',
    },
    yAxis: {
      axisLabel: { color: token(styles, '--lemn-chart-axis', TOKEN_FALLBACKS.axis) },
      axisLine: { lineStyle: { color: token(styles, '--lemn-color-border', TOKEN_FALLBACKS.border) } },
      data: yValues,
      name: yLabel,
      nameLocation: 'middle',
      nameTextStyle: { padding: [0, 0, 22, 0] },
      splitArea: { show: true },
      type: 'category',
    },
  };
}

/** Provider-backed categorical heatmap. ECharts owns rendering; LEMN owns only the semantic contract. */
export function HeatmapChart({
  className,
  data,
  emptyMessage,
  error,
  height = 320,
  loading,
  onRetry,
  onValueChange,
  showTooltip = true,
  showVisualMap = true,
  style,
  xLabel,
  yLabel,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: HeatmapChartProps): ReactElement {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || error || data.length === 0) return undefined;

    let active = true;
    let chart: ECharts | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let brandObserver: MutationObserver | undefined;

    void import('echarts').then((echarts) => {
      if (!active) return;
      chart = echarts.init(canvas, undefined, { renderer: 'canvas' });
      const applyOption = (): void => {
        chart?.setOption(
          optionFor(canvas, data, showTooltip, showVisualMap, xLabel, yLabel),
          { notMerge: true },
        );
      };
      applyOption();
      chart.on('click', (event) => {
        if (!onValueChange || !Array.isArray(event.data)) return;
        const [xIndex, yIndex, value] = event.data;
        const xValues = unique(data.map((datum) => datum.x));
        const yValues = unique(data.map((datum) => datum.y));
        const match = data.find(
          (datum) =>
            datum.x === xValues[Number(xIndex)] &&
            datum.y === yValues[Number(yIndex)] &&
            datum.value === Number(value),
        );
        if (match) onValueChange(match);
      });

      resizeObserver = new ResizeObserver(() => chart?.resize());
      resizeObserver.observe(canvas);
      const scope = canvas.closest('[data-lemn-brand-scope]');
      if (scope) {
        brandObserver = new MutationObserver(applyOption);
        brandObserver.observe(scope, {
          attributeFilter: ['data-lemn-brand-scope'],
          attributes: true,
        });
      }
    });

    return () => {
      active = false;
      resizeObserver?.disconnect();
      brandObserver?.disconnect();
      chart?.dispose();
    };
  }, [data, error, loading, onValueChange, showTooltip, showVisualMap, xLabel, yLabel]);

  return (
    <ChartVisualizationFrame
      {...(ariaLabel ? { 'aria-label': ariaLabel } : { 'aria-labelledby': ariaLabelledBy as string })}
      className={['ui-heatmap-chart', className].filter(Boolean).join(' ')}
      dataLength={data.length}
      emptyMessage={emptyMessage}
      error={error}
      height={height}
      loading={loading}
      onRetry={onRetry}
      style={style}
      summary={`${data.length} heatmap cells across ${unique(data.map((datum) => datum.x)).length} columns and ${unique(data.map((datum) => datum.y)).length} rows.`}
    >
      <div aria-hidden="true" className="ui-heatmap-chart__canvas" ref={canvasRef} style={{ height }} />
      <table className="ui-heatmap-chart__table">
        <caption>{ariaLabel ?? 'Heatmap data'}</caption>
        <thead><tr><th scope="col">Column</th><th scope="col">Row</th><th scope="col">Value</th></tr></thead>
        <tbody>
          {data.map((datum, index) => (
            <tr key={`${datum.x}-${datum.y}-${index}`}><td>{datum.x}</td><td>{datum.y}</td><td>{datum.value}</td></tr>
          ))}
        </tbody>
      </table>
    </ChartVisualizationFrame>
  );
}
