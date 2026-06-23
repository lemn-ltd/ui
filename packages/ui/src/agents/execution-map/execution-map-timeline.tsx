import { useEffect, useMemo, useRef } from 'react';
import { Tooltip } from '../../overlays/index.js';
import { Icon } from '../../primitives/index.js';
import { FloatingBubble } from './execution-map-panels.js';
import { executionMapEventDisplay } from './model/execution-map-model.js';
import type { ExecutionMapEvent } from './types.js';

export function FloatingTimeline({
  events,
  open,
  relatedEventIds,
  selectedEventId,
  onOpen,
  onSelect,
}: {
  readonly events: readonly ExecutionMapEvent[];
  readonly open: boolean;
  readonly relatedEventIds: ReadonlySet<string>;
  readonly selectedEventId: string | null;
  readonly onOpen: () => void;
  readonly onSelect: (event: ExecutionMapEvent) => void;
}) {
  return (
    <FloatingBubble
      icon="clock"
      label="Execution timeline"
      open={open}
      side="bottom-left"
      tooltip={`${events.length} events. Open the timeline and jump from events back to the map.`}
      onOpen={onOpen}
    >
      <Timeline
        events={events}
        relatedEventIds={relatedEventIds}
        selectedEventId={selectedEventId}
        onSelect={onSelect}
      />
    </FloatingBubble>
  );
}

function Timeline({
  events,
  selectedEventId,
  relatedEventIds,
  onSelect,
}: {
  readonly events: readonly ExecutionMapEvent[];
  readonly selectedEventId: string | null;
  readonly relatedEventIds: ReadonlySet<string>;
  readonly onSelect: (event: ExecutionMapEvent) => void;
}) {
  const activeEventRef = useRef<HTMLButtonElement | null>(null);
  const timelineItems = useMemo(() => createTimelineItems(events), [events]);
  const activeEventId = selectedEventId ?? timelineItems[0]?.event.eventId ?? null;

  useEffect(() => {
    activeEventRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeEventId]);

  return (
    <section className="ui-execution-map__timeline" aria-label="Execution timeline">
      <div className="ui-execution-map__timeline-viewport">
        <div className="ui-execution-map__timeline-track">
          {timelineItems.map((item) => {
            return (
              <Tooltip content={item.display.label} key={item.event.eventId} placement="top">
                <button
                  aria-label={`${item.display.label} event ${item.event.persistence.eventSeq}: ${item.event.eventType} at ${item.timeLabel}`}
                  className="ui-execution-map__timeline-event"
                  data-event-kind={item.display.kind}
                  data-related={
                    relatedEventIds.size === 0 || relatedEventIds.has(item.event.eventId)
                      ? 'true'
                      : 'false'
                  }
                  data-selected={item.event.eventId === activeEventId ? 'true' : 'false'}
                  ref={item.event.eventId === activeEventId ? activeEventRef : null}
                  type="button"
                  onClick={() => onSelect(item.event)}
                >
                  <span className="ui-execution-map__timeline-meta">
                    <span className="ui-execution-map__event-glyph ui-execution-map__timeline-glyph">
                      <Icon name={item.display.iconName} size={14} />
                    </span>
                    <span className="ui-execution-map__timeline-seq">
                      {item.event.persistence.eventSeq}
                    </span>
                  </span>
                  <strong>{item.event.eventType}</strong>
                  <time
                    className="ui-execution-map__timeline-time"
                    dateTime={item.event.occurredAt}
                  >
                    {item.timeLabel}
                  </time>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface ExecutionMapTimelineItem {
  readonly event: ExecutionMapEvent;
  readonly display: ReturnType<typeof executionMapEventDisplay>;
  readonly timeLabel: string;
}

function createTimelineItems(
  events: readonly ExecutionMapEvent[],
): readonly ExecutionMapTimelineItem[] {
  return events.map((event) => ({
    event,
    display: executionMapEventDisplay(event),
    timeLabel: executionMapEventTimeLabel(event.occurredAt),
  }));
}

function executionMapEventTimeLabel(occurredAt: string): string {
  const parsed = new Date(occurredAt);
  if (Number.isNaN(parsed.getTime())) return occurredAt;
  return executionMapDateTimeLabel(parsed);
}

function executionMapDateTimeLabel(parsed: Date): string {
  const twoDigits = (value: number) => value.toString().padStart(2, '0');
  const threeDigits = (value: number) => value.toString().padStart(3, '0');
  return `${twoDigits(parsed.getUTCHours())}:${twoDigits(parsed.getUTCMinutes())}:${twoDigits(
    parsed.getUTCSeconds(),
  )}.${threeDigits(parsed.getUTCMilliseconds())}`;
}
