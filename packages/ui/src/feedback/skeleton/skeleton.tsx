import type { HTMLAttributes, ReactElement } from 'react';
import './skeleton.css';

export type SkeletonShape = 'line' | 'circle' | 'rect';

const TABLE_ROW_COUNT = 8;
const TEXT_LINE_COUNT = 3;

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: SkeletonShape;
}

/** Loading placeholder with a left-to-right shimmer; static under reduced motion. */
export function Skeleton({ shape = 'line', className, ...rest }: SkeletonProps): ReactElement {
  return (
    <div
      className={['ui-skeleton', className].filter(Boolean).join(' ')}
      data-shape={shape}
      {...rest}
    />
  );
}

/** Three text lines of varying width. */
export function SkeletonText({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div className={['ui-skeleton-text', className].filter(Boolean).join(' ')} {...rest}>
      {Array.from({ length: TEXT_LINE_COUNT }, (_, index) => (
        <Skeleton key={index} className="ui-skeleton-text__line" shape="line" />
      ))}
    </div>
  );
}

/** Card-shaped block: a media rect over two text lines. */
export function SkeletonCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div className={['ui-skeleton-card', className].filter(Boolean).join(' ')} {...rest}>
      <Skeleton className="ui-skeleton-card__media" shape="rect" />
      <Skeleton className="ui-skeleton-card__line" shape="line" />
      <Skeleton className="ui-skeleton-card__line" shape="line" />
    </div>
  );
}

/** Eight row placeholders matching the table rhythm. */
export function SkeletonTableRows({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div className={['ui-skeleton-table', className].filter(Boolean).join(' ')} {...rest}>
      {Array.from({ length: TABLE_ROW_COUNT }, (_, index) => (
        <Skeleton key={index} className="ui-skeleton-table__row" shape="rect" />
      ))}
    </div>
  );
}
