import type { HTMLAttributes, ReactElement } from 'react';
import './relative-time.css';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const RELATIVE_TIME_UNITS: readonly {
  readonly max: number;
  readonly divisor: number;
  readonly suffix: string;
}[] = [
  { max: HOUR, divisor: MINUTE, suffix: 'm' },
  { max: DAY, divisor: HOUR, suffix: 'h' },
  { max: WEEK, divisor: DAY, suffix: 'd' },
  { max: MONTH, divisor: WEEK, suffix: 'w' },
  { max: YEAR, divisor: MONTH, suffix: 'mo' },
  { max: Number.POSITIVE_INFINITY, divisor: YEAR, suffix: 'y' },
];

function formatRelative(fromMs: number, toMs: number): string {
  const delta = toMs - fromMs;
  const absDelta = Math.abs(delta);
  if (absDelta < MINUTE) return 'just now';

  const unit = RELATIVE_TIME_UNITS.find((candidate) => absDelta < candidate.max);
  const unitValue = `${Math.floor(absDelta / (unit?.divisor ?? YEAR))}${unit?.suffix ?? 'y'}`;

  return delta > 0 ? `${unitValue} ago` : `in ${unitValue}`;
}

export interface RelativeTimeProps extends Omit<HTMLAttributes<HTMLTimeElement>, 'children'> {
  readonly value: string | number | Date;
  readonly now?: number;
}

/** Renders an absolute timestamp as a muted relative label such as "2h ago". */
export function RelativeTime({ value, now, className, ...rest }: RelativeTimeProps): ReactElement {
  const fromMs = new Date(value).getTime();
  const toMs = now ?? Date.now();
  const iso = new Date(fromMs).toISOString();

  return (
    <time
      className={['ui-relative-time', className].filter(Boolean).join(' ')}
      dateTime={iso}
      {...rest}
    >
      {formatRelative(fromMs, toMs)}
    </time>
  );
}
