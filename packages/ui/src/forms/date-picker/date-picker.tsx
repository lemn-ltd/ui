import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import { Popover } from '../../overlays/popover/popover.js';
import { Button } from '../../primitives/button/button.js';
import { Calendar } from '../calendar/calendar.js';
import { startOfDay, toDateKey } from '../calendar/date-helpers.js';
import { Field, type FieldState } from '../field/field.js';
import './date-picker.css';

export interface DatePickerProps {
  readonly label: ReactNode;
  readonly value?: Date | null;
  readonly defaultValue?: Date | null;
  readonly onChange?: (value: Date) => void;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placeholder?: string;
  readonly locale?: string;
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

/** Field-labelled single-date trigger composed from Button, Popover, and Calendar. */
export function DatePicker({
  label,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder = 'Choose a date',
  locale = 'en-US',
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
}: DatePickerProps): ReactElement {
  const isControlled = value !== undefined;
  const [selectionState, setSelectionState] = useState<Date | null>(
    defaultValue ? startOfDay(defaultValue) : null,
  );
  const selection = isControlled ? (value ? startOfDay(value) : null) : selectionState;
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
                className="ui-date-picker__trigger"
                data-placeholder={!selection || undefined}
                disabled={disabled}
                id={control.id}
                variant="outline"
              >
                {selection ? formatter.format(selection) : placeholder}
              </Button>
            }
          >
            <Calendar
              aria-label={typeof label === 'string' ? label : 'Choose a date'}
              locale={locale}
              maxDate={maxDate}
              minDate={minDate}
              onChange={(next) => {
                if (!isControlled) setSelectionState(next);
                onChange?.(next);
                changeOpen(false);
              }}
              shouldDisableDate={shouldDisableDate}
              today={today}
              value={selection}
              weekStartsOn={weekStartsOn}
            />
          </Popover>
          {name ? (
            <input
              disabled={disabled}
              form={form}
              name={name}
              type="hidden"
              value={selection ? toDateKey(selection) : ''}
            />
          ) : null}
        </>
      )}
    </Field>
  );
}
