import { useId, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { Button } from '../../primitives/button/button.js';
import './chart-frame.css';

type ChartFrameAccessibleName =
  | {
      readonly 'aria-label': string;
      readonly 'aria-labelledby'?: never;
      readonly title?: ReactNode;
    }
  | {
      readonly 'aria-label'?: never;
      readonly 'aria-labelledby': string;
      readonly title?: ReactNode;
    }
  | {
      readonly 'aria-label'?: never;
      readonly 'aria-labelledby'?: never;
      readonly title: ReactNode;
    };

type ChartFrameBaseProps = Omit<
  HTMLAttributes<HTMLElement>,
  'aria-label' | 'aria-labelledby' | 'children' | 'title'
> & {
  readonly action?: ReactNode;
  readonly children?: ReactNode;
  readonly description?: ReactNode;
  readonly empty?: boolean;
  readonly emptyMessage?: ReactNode;
  readonly error?: ReactNode;
  readonly height?: number | string;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly onRetry?: () => void;
};

export type ChartFrameProps = ChartFrameBaseProps & ChartFrameAccessibleName;

/** State-aware, engine-independent frame for charts and compact report visualizations. */
export function ChartFrame({
  action,
  children,
  className,
  description,
  empty = false,
  emptyMessage = 'No data available.',
  error,
  height,
  loading = false,
  loadingLabel = 'Loading visualization',
  onRetry,
  style,
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ChartFrameProps): ReactElement {
  const generatedTitleId = useId();
  const titleId = title && !ariaLabel && !ariaLabelledBy ? generatedTitleId : undefined;
  const hasHeader = Boolean(title || description || action);

  let content = children;
  if (loading) {
    content = (
      <div aria-live="polite" className="ui-chart-frame__state" role="status">
        <span aria-hidden="true" className="ui-chart-frame__loading" />
        <span>{loadingLabel}</span>
      </div>
    );
  } else if (error) {
    content = (
      <div className="ui-chart-frame__state" role="alert">
        <span>{error}</span>
        {onRetry ? (
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry
          </Button>
        ) : null}
      </div>
    );
  } else if (empty) {
    content = (
      <div className="ui-chart-frame__state" role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? titleId}
      className={['ui-chart-frame', className].filter(Boolean).join(' ')}
      style={{ ...style, minHeight: height }}
      {...rest}
    >
      {hasHeader ? (
        <header className="ui-chart-frame__header">
          <div className="ui-chart-frame__heading">
            {title ? (
              <h3 className="ui-chart-frame__title" id={titleId}>
                {title}
              </h3>
            ) : null}
            {description ? <p className="ui-chart-frame__description">{description}</p> : null}
          </div>
          {action ? <div className="ui-chart-frame__action">{action}</div> : null}
        </header>
      ) : null}
      <div className="ui-chart-frame__body">{content}</div>
    </section>
  );
}
