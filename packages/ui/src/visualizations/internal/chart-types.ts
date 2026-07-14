import type { CSSProperties } from 'react';

export type ChartDatum = Readonly<Record<string, unknown>>;
export type ChartColor = `var(--${string})`;

export type ChartAccessibleName =
  | {
      readonly 'aria-label': string;
      readonly 'aria-labelledby'?: never;
    }
  | {
      readonly 'aria-label'?: never;
      readonly 'aria-labelledby': string;
    };

export interface ChartSeries<TDatum extends ChartDatum> {
  readonly color?: ChartColor;
  readonly dataKey: Extract<keyof TDatum, string>;
  readonly name: string;
  readonly valueFormatter?: (value: number) => string;
}

export interface ChartStateProps {
  readonly className?: string;
  readonly emptyMessage?: string;
  readonly error?: string;
  readonly height?: number;
  readonly loading?: boolean;
  readonly onRetry?: () => void;
  readonly style?: CSSProperties;
}

export type ChartAnimation = 'auto' | 'none';

export const CHART_COLORS: readonly ChartColor[] = [
  'var(--chart-series-1)',
  'var(--chart-series-2)',
  'var(--chart-series-3)',
  'var(--chart-series-4)',
  'var(--chart-series-5)',
  'var(--chart-series-6)',
  'var(--chart-series-7)',
  'var(--chart-series-8)',
];

const DEFAULT_CHART_COLOR: ChartColor = 'var(--chart-series-1)';

export function chartColor(color: ChartColor | undefined, index: number): ChartColor {
  return color ?? CHART_COLORS[index % CHART_COLORS.length] ?? DEFAULT_CHART_COLOR;
}

export function numericValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function chartAccessibleName(
  ariaLabel: string | undefined,
  ariaLabelledBy: string | undefined,
): ChartAccessibleName {
  if (ariaLabel) return { 'aria-label': ariaLabel };
  if (ariaLabelledBy) return { 'aria-labelledby': ariaLabelledBy };
  throw new Error('An informative chart requires aria-label or aria-labelledby.');
}
