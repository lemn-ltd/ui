import type { HTMLAttributes, ReactElement } from 'react';
import './meter.css';

export type MeterTone = 'accent' | 'success' | 'warn' | 'danger';

export interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly value: number;
  readonly max: number;
  /** Optional leading label shown above the track. */
  readonly label?: string;
  readonly tone?: MeterTone;
  /** Show the `value / max` readout. Default true. */
  readonly showValue?: boolean;
  /** Override the readout text (e.g. format budget micros). */
  readonly formatValue?: (value: number, max: number) => string;
}

/**
 * A linear ratio bar for a single value against a max — quota used, budget
 * spent, progress. Controlled and presentational; the fill width is the
 * clamped `value / max`. Tone signals headroom (accent → warn → danger).
 */
export function Meter({
  value,
  max,
  label,
  tone = 'accent',
  showValue = true,
  formatValue,
  className,
  ...rest
}: MeterProps): ReactElement {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  const fillWidth = `${(ratio * 100).toFixed(1)}%`;
  const readout = formatValue ? formatValue(value, max) : `${value} / ${max}`;

  return (
    <div className={['ui-meter', className].filter(Boolean).join(' ')} data-tone={tone} {...rest}>
      {label !== undefined || showValue ? (
        <div className="ui-meter__row">
          {label !== undefined ? <span className="ui-meter__label">{label}</span> : <span />}
          {showValue ? <span className="ui-meter__value">{readout}</span> : null}
        </div>
      ) : null}
      <div className="ui-meter__track">
        <div className="ui-meter__fill" style={{ width: fillWidth }} />
      </div>
    </div>
  );
}
