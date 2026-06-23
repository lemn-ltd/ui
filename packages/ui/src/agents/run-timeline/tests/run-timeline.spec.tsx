import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EventRow } from '../event-row.js';
import { RunTimeline, type RunTimelineEvent } from '../run-timeline.js';

const EVENTS: readonly RunTimelineEvent[] = [
  { id: '1', time: '14:00:00', tone: 'info', message: 'triggered' },
  { id: '2', time: '14:00:35', tone: 'danger', message: 'node.failed' },
];

describe('RunTimeline', () => {
  afterEach(() => cleanup());

  it('renders one row per event', () => {
    const { container } = render(<RunTimeline events={EVENTS} />);
    expect(container.querySelectorAll('.ui-event-row')).toHaveLength(2);
    expect(container.querySelector('.ui-empty-state')).toBeNull();
  });

  it('shows an empty state with no events', () => {
    const { container } = render(<RunTimeline events={[]} />);
    expect(container.querySelector('.ui-event-row')).toBeNull();
    expect(container.querySelector('.ui-empty-state')).not.toBeNull();
  });

  it('EventRow exposes the tone hook and the timestamp', () => {
    const { container } = render(<EventRow message="ok" time="14:00:00" tone="success" />);
    const row = container.querySelector('.ui-event-row');
    expect(row?.getAttribute('data-tone')).toBe('success');
    expect(container.querySelector('.ui-event-row__time')?.textContent).toBe('14:00:00');
  });
});
