import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { EmptyState } from '../../data-display/index.js';
import { EventRow, type EventTone } from './event-row.js';
import './run-timeline.css';

export interface RunTimelineEvent {
  readonly id: string;
  readonly time: string;
  readonly message: ReactNode;
  readonly tone?: EventTone;
}

export interface RunTimelineProps extends HTMLAttributes<HTMLDivElement> {
  readonly events: readonly RunTimelineEvent[];
  readonly emptyHint?: string;
}

/**
 * The chronological evidence log for an automation run: a bordered column of
 * `EventRow`s. Presentational and ordered by the caller; an empty run renders a
 * first-run empty state rather than a bare frame.
 */
export function RunTimeline({
  events,
  emptyHint = 'Events will appear here once the run starts.',
  className,
  ...rest
}: RunTimelineProps): ReactElement {
  return (
    <div className={['ui-run-timeline', className].filter(Boolean).join(' ')} {...rest}>
      {events.length === 0 ? (
        <EmptyState description={emptyHint} icon="clock" title="No events yet" />
      ) : (
        events.map((event) => (
          <EventRow key={event.id} message={event.message} time={event.time} tone={event.tone} />
        ))
      )}
    </div>
  );
}
