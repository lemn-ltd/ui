import type { ReactElement, ReactNode } from 'react';
import {
  Field,
  type FieldState,
  SegmentedControl,
  type SegmentedControlSegment,
} from '../../forms/index.js';
import { Icon, IconButton, Input, InputSelect } from '../../primitives/index.js';
import {
  clampMinute,
  describeSchedule,
  presetDefaults,
  SCHEDULE_WEEKDAYS,
  type SchedulePreset,
  type ScheduleTriggerValue,
  type ScheduleWeekday,
} from './describe-schedule.js';

const PRESET_SEGMENTS: readonly SegmentedControlSegment[] = [
  { value: 'once', label: 'Once' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

const STAGGER_NOTE = 'Runs are staggered by a few minutes to spread server load.';

export interface ScheduleTriggerCardProps {
  readonly value: ScheduleTriggerValue;
  readonly onValueChange?: (value: ScheduleTriggerValue) => void;
  readonly onRemove?: () => void;

  /** A timezone gloss appended to the clock-bearing summary, e.g. `GMT+4`. */
  readonly timezoneLabel?: string;

  readonly disabled?: boolean;
}

/**
 * The deep schedule trigger card: a live human summary header, a frequency
 * segmented control, and the one input the active preset needs — a datetime,
 * a minute, a time of day, a weekday + time, or a raw cron expression. Fully
 * controlled; the host owns `value` and reacts to `onValueChange`.
 */
export function ScheduleTriggerCard({
  value,
  onValueChange,
  onRemove,
  timezoneLabel,
  disabled = false,
}: ScheduleTriggerCardProps): ReactElement {
  const state: FieldState = disabled ? 'disabled' : 'default';
  const emit = (patch: Partial<ScheduleTriggerValue>): void =>
    onValueChange?.({ ...value, ...patch });

  return (
    <div className="ui-trigger-composer__card" data-disabled={disabled ? 'true' : 'false'}>
      <header className="ui-trigger-composer__card-head">
        <Icon className="ui-trigger-composer__card-icon" name="clock" size={18} />
        <div className="ui-trigger-composer__card-text">
          <span className="ui-trigger-composer__card-title">
            {describeSchedule(value, timezoneLabel)}
          </span>
        </div>
        {onRemove ? (
          <IconButton
            aria-label="Remove trigger"
            className="ui-trigger-composer__card-remove"
            disabled={disabled}
            onClick={onRemove}
            variant="ghost"
          >
            <Icon name="x" size={16} />
          </IconButton>
        ) : null}
      </header>

      <SegmentedControl
        aria-label="Schedule frequency"
        disabled={disabled}
        onValueChange={(next) => onValueChange?.(presetDefaults(next as SchedulePreset, value))}
        segments={PRESET_SEGMENTS.map((segment) => ({ ...segment }))}
        value={value.preset}
      />

      <div className="ui-trigger-composer__card-config">{renderConfig(value, state, emit)}</div>

      {value.preset === 'once' ? null : <p className="ui-trigger-composer__note">{STAGGER_NOTE}</p>}
    </div>
  );
}

function renderConfig(
  value: ScheduleTriggerValue,
  state: FieldState,
  emit: (patch: Partial<ScheduleTriggerValue>) => void,
): ReactNode {
  switch (value.preset) {
    case 'once':
      return (
        <Field label="Run at" state={state}>
          {(control) => (
            <Input
              {...control}
              onChange={(event) => emit({ runAt: event.target.value })}
              type="datetime-local"
              value={value.runAt ?? ''}
            />
          )}
        </Field>
      );
    case 'hourly':
      return (
        <Field label="At minute" state={state}>
          {(control) => (
            <Input
              {...control}
              className="ui-trigger-composer__num"
              max={59}
              min={0}
              onChange={(event) => emit({ atMinute: clampMinute(event.target.value) })}
              type="number"
              value={value.atMinute ?? 0}
            />
          )}
        </Field>
      );
    case 'daily':
    case 'weekdays':
      return (
        <Field label="At" state={state}>
          {(control) => (
            <Input
              {...control}
              onChange={(event) => emit({ atTime: event.target.value })}
              type="time"
              value={value.atTime ?? ''}
            />
          )}
        </Field>
      );
    case 'weekly':
      return (
        <div className="ui-trigger-composer__row">
          <Field label="On" state={state}>
            {(control) => (
              <InputSelect
                {...control}
                aria-label="Weekday"
                onValueChange={(next) => emit({ weekday: next as ScheduleWeekday })}
                options={SCHEDULE_WEEKDAYS.map((day) => ({ value: day.value, label: day.label }))}
                value={value.weekday ?? 'mon'}
              />
            )}
          </Field>
          <Field label="At" state={state}>
            {(control) => (
              <Input
                {...control}
                onChange={(event) => emit({ atTime: event.target.value })}
                type="time"
                value={value.atTime ?? ''}
              />
            )}
          </Field>
        </div>
      );
    case 'custom':
      return (
        <Field hint="Standard five-field cron, in UTC." label="Cron expression" state={state}>
          {(control) => (
            <Input
              {...control}
              className="ui-trigger-composer__mono"
              onChange={(event) => emit({ cron: event.target.value })}
              spellCheck={false}
              value={value.cron ?? ''}
            />
          )}
        </Field>
      );
  }
}
