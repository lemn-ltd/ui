import { type ReactElement, useCallback, useState } from 'react';
import type { ChartColor } from './chart-types.js';

export interface ChartLegendItem {
  readonly color: ChartColor;
  readonly id: string;
  readonly name: string;
}

export function useChartSeriesVisibility(): readonly [
  ReadonlySet<string>,
  (seriesId: string) => void,
] {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = useCallback((seriesId: string): void => {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  }, []);
  return [hidden, toggle];
}

export function ChartLegend({
  hidden,
  items,
  onToggle,
}: {
  readonly hidden: ReadonlySet<string>;
  readonly items: readonly ChartLegendItem[];
  readonly onToggle: (seriesId: string) => void;
}): ReactElement {
  return (
    <ul aria-label="Chart series" className="ui-chart-legend">
      {items.map((item, index) => {
        const visible = !hidden.has(item.id);
        return (
          <li key={item.id}>
            <button
              aria-pressed={visible}
              className="ui-chart-legend__button"
              onClick={() => onToggle(item.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className="ui-chart-legend__swatch"
                data-pattern={(index % 4) + 1}
                style={{
                  backgroundColor: index % 4 === 2 ? 'transparent' : item.color,
                  borderColor: item.color,
                }}
              />
              <span>{item.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
