import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './event-row.css';

/** The semantic tone of a timeline event, driving the leading dot color. */
export type EventTone = 'neutral' | 'info' | 'success' | 'warn' | 'danger' | 'dim';

export interface EventRowProps extends HTMLAttributes<HTMLDivElement> {
  /** A preformatted timestamp, e.g. `14:00:02`. */
  readonly time: string;
  readonly message: ReactNode;
  readonly tone?: EventTone;
}

/**
 * A single automation run event: a monospace timestamp, a tone dot, and a
 * message. The presentational building block of `RunTimeline`; the host maps an
 * event family to a `tone`.
 */
export function EventRow({
  time,
  message,
  tone = 'neutral',
  className,
  ...rest
}: EventRowProps): ReactElement {
  return (
    <div
      className={['ui-event-row', className].filter(Boolean).join(' ')}
      data-tone={tone}
      {...rest}
    >
      <span className="ui-event-row__time">{time}</span>
      <span aria-hidden="true" className="ui-event-row__dot" />
      <span className="ui-event-row__message">{message}</span>
    </div>
  );
}
