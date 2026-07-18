import { NOW } from './faker-seed.js';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

/** Pass to `RelativeTime`'s `now` prop so labels stay anchored to the fixed clock. */
export const relativeNow = NOW.getTime();

function ago(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString();
}

export interface RelativeSample {
  readonly id: string;
  readonly value: string;
}

/** 8 timestamps spanning now → months, all derived from the fixed `NOW`. */
export const relativeSamples: readonly RelativeSample[] = [
  { id: 'now', value: ago(0) },
  { id: 'minutes', value: ago(8 * MINUTE_MS) },
  { id: 'hour', value: ago(3 * HOUR_MS) },
  { id: 'day', value: ago(DAY_MS) },
  { id: 'days', value: ago(4 * DAY_MS) },
  { id: 'week', value: ago(2 * WEEK_MS) },
  { id: 'month', value: ago(MONTH_MS) },
  { id: 'months', value: ago(5 * MONTH_MS) },
];
