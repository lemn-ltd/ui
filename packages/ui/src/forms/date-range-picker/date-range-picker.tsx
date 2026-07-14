import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import { Popover } from '../../overlays/popover/popover.js';
import { Button } from '../../primitives/button/button.js';
import { Calendar } from '../calendar/calendar.js';
import {
  type DateRangeValue,
  normalizeDateRange,
  toDateKey,
} from '../calendar/date-helpers.js';
import { Field, type FieldState } from '../field/field.js';
import '../date-picker/date-picker.css';

export interface DateRangePickerProps {
  readonly label: ReactNode;
  readonly value?: DateRangeValue;
  readonly defaultValue?: DateRangeValue;
  readonly onChange?: (value: DateRangeValue) => void;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placeholder?: string;
  readonly locale?: string;
  readonly numberOfMonths?: 1 | 2;
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly shouldDisableDate?: (date: Date) => boolean;
  readonly today?: Date;
  readonly weekStartsOn?: 0 | 1;
  readonly name?: string;
  readonly form?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly state?: FieldState;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly className?: string;
}

/** Partial-aware date-range field composed from the shared Calendar range mode. */
export function DateRangePicker({
  label,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder = 'Choose a date range',
  locale = 'en-US',
  numberOfMonths = 2,
  minDate,
  maxDate,
  shouldDisableDate,
  today,
  weekStartsOn,
  name,
  form,
  required,
  disabled,
  state = 'default',
  hint,
  error,
  className,
}: DateRangePickerProps): ReactElement {
  const isControlled = value !== undefined;
  const [rangeState, setRangeState] = useState<DateRangeValue>(() =>
    normalizeDateRange(defaultValue),
  );
  const range = isControlled ? normalizeDateRange(value) : rangeState;
  const isOpenControlled = open !== undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const resolvedOpen = isOpenControlled ? open : openState;
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const changeOpen = (next: boolean): void => {
    if (!isOpenControlled) setOpenState(next);
    onOpenChange?.(next);
  };
  const formattedRange = range.start
    ? `${formatter.format(range.start)} – ${range.end ? formatter.format(range.end) : '…'}`
    : placeholder;

  return (
    <Field
      className={className}
      error={error}
      hint={hint}
      label={label}
      required={required}
      state={disabled ? 'disabled' : state}
    >
      {(control) => (
        <>
          <Popover
            onOpenChange={changeOpen}
            open={resolvedOpen}
            trigger={
              <Button
                aria-describedby={control['aria-describedby']}
                aria-invalid={control['aria-invalid']}
                className="ui-date-range-picker__trigger"
                data-placeholder={!range.start || undefined}
                disabled={disabled}
                id={control.id}
                variant="outline"
              >
                {formattedRange}
              </Button>
            }
          >
            <Calendar
              aria-label={typeof label === 'string' ? label : 'Choose a date range'}
              locale={locale}
              maxDate={maxDate}
              minDate={minDate}
              mode="range"
              numberOfMonths={numberOfMonths}
              onChange={(next) => {
                if (!isControlled) setRangeState(next);
                onChange?.(next);
                if (next.end) changeOpen(false);
              }}
              shouldDisableDate={shouldDisableDate}
              today={today}
              value={range}
              weekStartsOn={weekStartsOn}
            />
          </Popover>
          {name ? (
            <>
              <input
                disabled={disabled}
                form={form}
                name={`${name}.start`}
                type="hidden"
                value={range.start ? toDateKey(range.start) : ''}
              />
              <input
                disabled={disabled}
                form={form}
                name={`${name}.end`}
                type="hidden"
                value={range.end ? toDateKey(range.end) : ''}
              />
            </>
          ) : null}
        </>
      )}
    </Field>
  );
}
