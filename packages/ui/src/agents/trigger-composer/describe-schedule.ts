/** A friendly recurrence preset that selects the input affordance and summary shape. */
export type SchedulePreset = 'once' | 'hourly' | 'daily' | 'weekdays' | 'weekly' | 'custom';

export type ScheduleWeekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

/**
 * The controlled value of a schedule trigger. Only the field for the active
 * `preset` is meaningful; the others are retained so switching presets does not
 * discard prior input.
 */
export interface ScheduleTriggerValue {
  readonly preset: SchedulePreset;

  /** `once`: a local datetime, `YYYY-MM-DDTHH:MM`. */
  readonly runAt?: string;
  /** `hourly`: the minute of the hour, 0–59. */
  readonly atMinute?: number;
  /** `daily` / `weekdays` / `weekly`: a 24h time of day, `HH:MM`. */
  readonly atTime?: string;
  /** `weekly`: the day the run fires on. */
  readonly weekday?: ScheduleWeekday;
  /** `custom`: a raw cron expression. */
  readonly cron?: string;
}

/** Weekday options in display order, for the `weekly` preset select. */
export const SCHEDULE_WEEKDAYS: readonly {
  readonly value: ScheduleWeekday;
  readonly label: string;
}[] = [
  { value: 'sun', label: 'Sunday' },
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
];

const WEEKDAY_LABEL = Object.fromEntries(
  SCHEDULE_WEEKDAYS.map((day) => [day.value, day.label]),
) as Record<ScheduleWeekday, string>;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Formats a 24h `HH:MM` clock value as a 12-hour label, e.g. `09:00` → `9:00 AM`. */
export function formatClock12h(time: string | undefined): string | null {
  if (!time) return null;
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

/** Formats a local datetime `YYYY-MM-DDTHH:MM` as `Jun 21, 2026, 12:54 PM`. */
export function formatDateTime(value: string | undefined): string | null {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const clock = formatClock12h(timePart.slice(0, 5));
  if (!year || !month || !day || !clock) return null;

  const monthLabel = MONTHS[month - 1];
  if (!monthLabel) return null;

  return `${monthLabel} ${day}, ${year}, ${clock}`;
}

/** Appends ` at <12h time>` (plus the timezone) when a clock value is present, else the fallback. */
function clockClause(
  prefix: string,
  atTime: string | undefined,
  tz: string,
  fallback: string,
): string {
  const at = formatClock12h(atTime);
  return at ? `${prefix} at ${at}${tz}` : fallback;
}

function describeWeekly(value: ScheduleTriggerValue, tz: string): string {
  const day = value.weekday ? WEEKDAY_LABEL[value.weekday] : null;
  if (!day) return 'Runs weekly';
  return clockClause(`Runs every ${day}`, value.atTime, tz, `Runs every ${day}`);
}

const SUMMARY_BY_PRESET: Record<
  SchedulePreset,
  (value: ScheduleTriggerValue, tz: string) => string
> = {
  once: (value, tz) => {
    const at = formatDateTime(value.runAt);
    return at ? `Runs once on ${at}${tz}` : 'Runs once';
  },
  hourly: () => 'Runs every hour',
  daily: (value, tz) => clockClause('Runs daily', value.atTime, tz, 'Runs daily'),
  weekdays: (value, tz) => clockClause('Runs weekdays', value.atTime, tz, 'Runs on weekdays'),
  weekly: describeWeekly,
  custom: (value) => (value.cron ? `Runs on cron ${value.cron}` : 'Custom schedule'),
};

/**
 * Derives the human one-line summary shown in the schedule card header from the
 * controlled value. Pure and locale-stable; the optional `timezoneLabel` (e.g.
 * `GMT+4`) is appended to the clock-bearing presets.
 */
export function describeSchedule(value: ScheduleTriggerValue, timezoneLabel?: string): string {
  const tz = timezoneLabel ? ` ${timezoneLabel}` : '';
  return SUMMARY_BY_PRESET[value.preset](value, tz);
}

/**
 * Seeds the field for a newly selected preset so the summary and inputs render
 * immediately, while preserving any value the user already typed for it.
 */
export function presetDefaults(
  preset: SchedulePreset,
  previous: ScheduleTriggerValue,
): ScheduleTriggerValue {
  const base = { ...previous, preset };

  switch (preset) {
    case 'once':
      return { ...base, runAt: previous.runAt ?? '' };
    case 'hourly':
      return { ...base, atMinute: previous.atMinute ?? 0 };
    case 'daily':
    case 'weekdays':
      return { ...base, atTime: previous.atTime ?? '09:00' };
    case 'weekly':
      return { ...base, atTime: previous.atTime ?? '09:00', weekday: previous.weekday ?? 'mon' };
    case 'custom':
      return { ...base, cron: previous.cron ?? '0 9 * * 1' };
  }
}

/** Clamps free-typed minute input to the valid `0–59` range. */
export function clampMinute(raw: string): number {
  const value = Number(raw);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(59, Math.trunc(value)));
}
