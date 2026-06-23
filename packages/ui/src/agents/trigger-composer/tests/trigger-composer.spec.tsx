import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeSchedule, formatClock12h, formatDateTime } from '../describe-schedule.js';
import { type ComposerTrigger, TriggerComposer } from '../trigger-composer.js';

const STAGGER_NOTE = 'Runs are staggered by a few minutes to spread server load.';

describe('describeSchedule', () => {
  it('summarizes each preset', () => {
    expect(describeSchedule({ preset: 'once', runAt: '2026-06-21T12:54' }, 'GMT+4')).toBe(
      'Runs once on Jun 21, 2026, 12:54 PM GMT+4',
    );
    expect(describeSchedule({ preset: 'hourly', atMinute: 0 })).toBe('Runs every hour');
    expect(describeSchedule({ preset: 'daily', atTime: '09:00' }, 'GMT+4')).toBe(
      'Runs daily at 9:00 AM GMT+4',
    );
    expect(describeSchedule({ preset: 'weekdays', atTime: '09:00' })).toBe(
      'Runs weekdays at 9:00 AM',
    );
    expect(describeSchedule({ preset: 'weekly', weekday: 'mon', atTime: '09:00' })).toBe(
      'Runs every Monday at 9:00 AM',
    );
    expect(describeSchedule({ preset: 'custom', cron: '0 5 * * 1' })).toBe(
      'Runs on cron 0 5 * * 1',
    );
  });

  it('falls back when the active field is empty', () => {
    expect(describeSchedule({ preset: 'daily' })).toBe('Runs daily');
    expect(describeSchedule({ preset: 'custom' })).toBe('Custom schedule');
  });
});

describe('clock and datetime formatting', () => {
  it('formats 24h clocks as 12-hour labels', () => {
    expect(formatClock12h('00:00')).toBe('12:00 AM');
    expect(formatClock12h('09:00')).toBe('9:00 AM');
    expect(formatClock12h('12:30')).toBe('12:30 PM');
    expect(formatClock12h('13:05')).toBe('1:05 PM');
    expect(formatClock12h(undefined)).toBeNull();
  });

  it('formats local datetimes', () => {
    expect(formatDateTime('2026-06-21T12:54')).toBe('Jun 21, 2026, 12:54 PM');
    expect(formatDateTime('not-a-date')).toBeNull();
  });
});

describe('TriggerComposer', () => {
  afterEach(() => cleanup());

  it('renders a schedule summary, its preset input, and the stagger note', () => {
    const triggers: ComposerTrigger[] = [
      {
        id: 's',
        kind: 'schedule',
        timezoneLabel: 'GMT+4',
        value: { preset: 'daily', atTime: '09:00' },
      },
    ];
    const { container } = render(<TriggerComposer triggers={triggers} />);

    expect(screen.getByText('Runs daily at 9:00 AM GMT+4')).toBeTruthy();
    expect(container.querySelector('input[type="time"]')).not.toBeNull();
    expect(screen.getByText(STAGGER_NOTE)).toBeTruthy();
  });

  it('omits the stagger note for the once preset', () => {
    const triggers: ComposerTrigger[] = [
      { id: 's', kind: 'schedule', value: { preset: 'once', runAt: '2026-06-21T12:54' } },
    ];
    const { container } = render(<TriggerComposer triggers={triggers} />);

    expect(container.querySelector('input[type="datetime-local"]')).not.toBeNull();
    expect(screen.queryByText(STAGGER_NOTE)).toBeNull();
  });

  it('renders a generic trigger as a titled card and fires removal', () => {
    const onRemoveTrigger = vi.fn();
    const triggers: ComposerTrigger[] = [
      {
        id: 'a',
        kind: 'generic',
        icon: 'code',
        label: 'Call via API',
        description: 'Token will be generated when you save.',
      },
    ];
    render(<TriggerComposer onRemoveTrigger={onRemoveTrigger} triggers={triggers} />);

    expect(screen.getByText('Call via API')).toBeTruthy();
    expect(screen.getByText('Token will be generated when you save.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Call via API' }));
    expect(onRemoveTrigger).toHaveBeenCalledWith('a');
  });

  it('reveals the add picker and disables unavailable options', () => {
    const onAddTrigger = vi.fn();
    render(
      <TriggerComposer
        addableTriggers={[
          { kind: 'schedule', icon: 'clock', label: 'Schedule' },
          {
            kind: 'repository-event',
            icon: 'radio',
            label: 'Repository event',
            disabled: true,
            disabledReason: 'Select a repository first',
          },
        ]}
        onAddTrigger={onAddTrigger}
        triggers={[]}
      />,
    );

    expect(screen.queryByText('Schedule')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add another trigger' }));

    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(onAddTrigger).toHaveBeenCalledWith('schedule');

    const disabledOption = screen.getByText('Select a repository first');
    expect(disabledOption).toBeTruthy();
    expect(screen.getByRole('button', { name: /Repository event/ })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
