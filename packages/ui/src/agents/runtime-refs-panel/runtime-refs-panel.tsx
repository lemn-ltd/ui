import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './runtime-refs-panel.css';

export interface RuntimeRef {
  readonly label: string;
  readonly value: string;
}

export interface RuntimeMetric {
  readonly label: string;
  readonly value: ReactNode;
}

export interface RuntimeRefsPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly refs: readonly RuntimeRef[];
  readonly metrics: readonly RuntimeMetric[];
  readonly refsTitle?: string;
  readonly metricsTitle?: string;
}

/**
 * The runtime integration summary for an automation execution node: the runtime
 * session/run refs and source context as aligned monospace lines, plus a
 * policy/limits/safety/knowledge metric strip. Read-only and presentational —
 * it consumes only public runtime refs and resolved summaries.
 */
export function RuntimeRefsPanel({
  refs,
  metrics,
  refsTitle = 'Runtime refs · source context',
  metricsTitle = 'Policy · limits · safety · knowledge',
  className,
  ...rest
}: RuntimeRefsPanelProps): ReactElement {
  return (
    <div className={['ui-runtime-refs-panel', className].filter(Boolean).join(' ')} {...rest}>
      <p className="ui-runtime-refs-panel__title">{refsTitle}</p>
      <dl className="ui-runtime-refs-panel__refs">
        {refs.map((ref) => (
          <div className="ui-runtime-refs-panel__ref" key={ref.label}>
            <dt className="ui-runtime-refs-panel__ref-label">{ref.label}</dt>
            <dd className="ui-runtime-refs-panel__ref-value">{ref.value}</dd>
          </div>
        ))}
      </dl>

      <p className="ui-runtime-refs-panel__title">{metricsTitle}</p>
      <div className="ui-runtime-refs-panel__metrics">
        {metrics.map((metric) => (
          <div className="ui-runtime-refs-panel__metric" key={metric.label}>
            <span className="ui-runtime-refs-panel__metric-label">{metric.label}</span>
            <span className="ui-runtime-refs-panel__metric-value">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
