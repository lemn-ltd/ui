import {
  type KeyboardEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon } from '../../primitives/icon/icon.js';
import { IconButton } from '../../primitives/icon-button/icon-button.js';
import './calendar.css';

/** Which picker surface is showing: the day grid or the quick year list. */
export type CalendarView = 'day' | 'year';

export interface CalendarProps {
  /** Controlled selected date. Pass `null` for "no selection" in controlled mode. */
  readonly value?: Date | null;
  /** Uncontrolled initial selection. */
  readonly defaultValue?: Date | null;
  /** Fires with the chosen date (floored to midnight) when a day is picked. */
  readonly onChange?: (date: Date) => void;

  /** Controlled visible month (any day within it). */
  readonly month?: Date;
  /** Uncontrolled initial visible month. Falls back to the selection, then `today`. */
  readonly defaultMonth?: Date;
  /** Fires with the first day of the newly visible month. */
  readonly onMonthChange?: (month: Date) => void;

  /** Earliest selectable day (inclusive). */
  readonly minDate?: Date;
  /** Latest selectable day (inclusive). */
  readonly maxDate?: Date;
  /** Disable every day after `today`. */
  readonly disableFuture?: boolean;
  /** Disable every day before `today`. */
  readonly disablePast?: boolean;
  /** Per-day predicate; return `true` to disable that day. */
  readonly shouldDisableDate?: (date: Date) => boolean;

  /** Reference "today". Injectable so showcases and tests stay deterministic. */
  readonly today?: Date;
  /** First column of the week. `0` = Sunday (default), `1` = Monday. */
  readonly weekStartsOn?: 0 | 1;
  /** BCP-47 locale for the month and weekday labels. */
  readonly locale?: string;

  /** Accessible name for the grid. */
  readonly 'aria-label'?: string;
  readonly className?: string;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** The day that should own roving focus for a month: selection, else today, else day 1. */
function pickFocusDate(month: Date, selected: Date | null, today: Date): Date {
  if (selected && isSameMonth(selected, month)) return selected;
  if (isSameMonth(today, month)) return today;
  return month;
}

/** Stable `YYYY-MM-DD` key, used both for React keys and focus targeting. */
function toKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function Calendar({
  value,
  defaultValue,
  onChange,
  month,
  defaultMonth,
  onMonthChange,
  minDate,
  maxDate,
  disableFuture,
  disablePast,
  shouldDisableDate,
  today: todayProp,
  weekStartsOn = 0,
  locale = 'en-US',
  'aria-label': ariaLabel,
  className,
}: CalendarProps): ReactElement {
  const labelId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  // Set when keyboard/year navigation should move DOM focus after the next paint.
  const pendingFocus = useRef(false);

  const today = useMemo(() => startOfDay(todayProp ?? new Date()), [todayProp]);

  // Selection: controlled by `value`, otherwise locally held from `defaultValue`.
  const isValueControlled = value !== undefined;
  const [selectedState, setSelectedState] = useState<Date | null>(
    defaultValue ? startOfDay(defaultValue) : null,
  );
  const selected = isValueControlled ? (value ? startOfDay(value) : null) : selectedState;

  // Visible month: controlled by `month`, otherwise locally held.
  const isMonthControlled = month !== undefined;
  const [monthState, setMonthState] = useState<Date>(() =>
    startOfMonth(month ?? defaultMonth ?? defaultValue ?? value ?? today),
  );
  const visibleMonth = isMonthControlled ? startOfMonth(month) : monthState;

  const [view, setView] = useState<CalendarView>('day');
  // The day that currently owns roving focus (tabIndex 0). Always inside the month.
  const [focusDate, setFocusDate] = useState<Date>(() =>
    pickFocusDate(visibleMonth, selected, today),
  );

  const minDay = useMemo(() => (minDate ? startOfDay(minDate) : undefined), [minDate]);
  const maxDay = useMemo(() => (maxDate ? startOfDay(maxDate) : undefined), [maxDate]);

  const isDisabled = useCallback(
    (day: Date): boolean => {
      if (minDay && day.getTime() < minDay.getTime()) return true;
      if (maxDay && day.getTime() > maxDay.getTime()) return true;
      if (disablePast && day.getTime() < today.getTime()) return true;
      if (disableFuture && day.getTime() > today.getTime()) return true;
      return shouldDisableDate?.(day) ?? false;
    },
    [minDay, maxDay, disablePast, disableFuture, today, shouldDisableDate],
  );

  // Weekday header labels (narrow) in declaration order from the week start.
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    // 2021-08-01 is a Sunday — a stable anchor for generating weekday names.
    return Array.from({ length: 7 }, (_, i) =>
      formatter.format(new Date(2021, 7, 1 + ((i + weekStartsOn) % 7))),
    );
  }, [locale, weekStartsOn]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth),
    [locale, visibleMonth],
  );

  // The visible month laid out as weeks, with leading blanks before day 1.
  const weeks = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    const lead = (first.getDay() - weekStartsOn + 7) % 7;
    const total = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < lead; i += 1) cells.push(null);
    for (let d = 1; d <= total; d += 1) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: Array<Array<Date | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [visibleMonth, weekStartsOn]);

  // When the month changes, re-pin roving focus (selection > today > first enabled day).
  // Navigation within the current month is preserved, so keyboard motion isn't clobbered.
  useEffect(() => {
    setFocusDate((current) => {
      if (isSameMonth(current, visibleMonth)) return current;
      const base = pickFocusDate(visibleMonth, selected, today);
      if (!isDisabled(base)) return base;
      const total = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= total; d += 1) {
        const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d);
        if (!isDisabled(candidate)) return candidate;
      }
      return base;
    });
  }, [visibleMonth, selected, today, isDisabled]);

  // Move real DOM focus only after an explicit keyboard/year navigation.
  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    const target = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${toKey(focusDate)}"]`,
    );
    target?.focus();
  }, [focusDate]);

  const changeMonth = useCallback(
    (next: Date) => {
      const normalized = startOfMonth(next);
      if (!isMonthControlled) setMonthState(normalized);
      onMonthChange?.(normalized);
    },
    [isMonthControlled, onMonthChange],
  );

  const selectDay = useCallback(
    (day: Date) => {
      if (isDisabled(day)) return;
      if (!isValueControlled) setSelectedState(day);
      if (!isSameMonth(day, visibleMonth)) changeMonth(day);
      onChange?.(day);
    },
    [isDisabled, isValueControlled, visibleMonth, changeMonth, onChange],
  );

  // Whole-month bounds let us grey out a chevron when no day past it is reachable.
  const prevDisabled = useMemo(() => {
    const lastOfPrev = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 0);
    if (minDay && lastOfPrev.getTime() < minDay.getTime()) return true;
    return Boolean(disablePast && lastOfPrev.getTime() < today.getTime());
  }, [visibleMonth, minDay, disablePast, today]);

  const nextDisabled = useMemo(() => {
    const firstOfNext = addMonths(visibleMonth, 1);
    if (maxDay && firstOfNext.getTime() > maxDay.getTime()) return true;
    return Boolean(disableFuture && firstOfNext.getTime() > today.getTime());
  }, [visibleMonth, maxDay, disableFuture, today]);

  const handleGridKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      let next: Date | null = null;
      switch (event.key) {
        case 'ArrowLeft':
          next = addDays(focusDate, -1);
          break;
        case 'ArrowRight':
          next = addDays(focusDate, 1);
          break;
        case 'ArrowUp':
          next = addDays(focusDate, -7);
          break;
        case 'ArrowDown':
          next = addDays(focusDate, 7);
          break;
        case 'Home':
          next = addDays(focusDate, -((focusDate.getDay() - weekStartsOn + 7) % 7));
          break;
        case 'End':
          next = addDays(focusDate, 6 - ((focusDate.getDay() - weekStartsOn + 7) % 7));
          break;
        case 'PageUp':
          next = addMonths(focusDate, -1);
          break;
        case 'PageDown':
          next = addMonths(focusDate, 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          selectDay(focusDate);
          return;
        default:
          return;
      }
      event.preventDefault();
      pendingFocus.current = true;
      setFocusDate(next);
      if (!isSameMonth(next, visibleMonth)) changeMonth(next);
    },
    [focusDate, weekStartsOn, visibleMonth, selectDay, changeMonth],
  );

  // Quick year list: bounded by min/max, capped at today when future is disabled.
  const years = useMemo(() => {
    const start = minDay ? minDay.getFullYear() : today.getFullYear() - 100;
    const endCap = disableFuture ? today.getFullYear() : today.getFullYear() + 10;
    const end = maxDay ? maxDay.getFullYear() : endCap;
    const list: number[] = [];
    for (let y = start; y <= Math.max(start, end); y += 1) list.push(y);
    return list;
  }, [minDay, maxDay, disableFuture, today]);

  const selectYear = useCallback(
    (year: number) => {
      changeMonth(new Date(year, visibleMonth.getMonth(), 1));
      setView('day');
      pendingFocus.current = true;
    },
    [changeMonth, visibleMonth],
  );

  return (
    <div className={['ui-calendar', className].filter(Boolean).join(' ')} data-view={view}>
      <div className="ui-calendar__header">
        <button
          aria-expanded={view === 'year'}
          aria-label={view === 'year' ? 'Hide year selection' : 'Choose year'}
          className="ui-calendar__switch"
          onClick={() => setView((v) => (v === 'year' ? 'day' : 'year'))}
          type="button"
        >
          <span className="ui-calendar__switch-label">{monthLabel}</span>
          <Icon className="ui-calendar__switch-caret" name="chevron-down" size={16} />
        </button>

        <div className="ui-calendar__nav">
          <IconButton
            aria-label="Previous month"
            className="ui-calendar__nav-prev"
            disabled={prevDisabled || view === 'year'}
            onClick={() => changeMonth(addMonths(visibleMonth, -1))}
          >
            <Icon name="chevron-right" size={18} />
          </IconButton>
          <IconButton
            aria-label="Next month"
            disabled={nextDisabled || view === 'year'}
            onClick={() => changeMonth(addMonths(visibleMonth, 1))}
          >
            <Icon name="chevron-right" size={18} />
          </IconButton>
        </div>
      </div>

      {view === 'year' ? (
        <div className="ui-calendar__years" role="listbox" aria-label="Year">
          {years.map((year) => {
            const isCurrent = year === visibleMonth.getFullYear();
            return (
              <button
                aria-selected={isCurrent}
                className="ui-calendar__year"
                data-selected={isCurrent || undefined}
                key={year}
                onClick={() => selectYear(year)}
                role="option"
                type="button"
              >
                {year}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div aria-hidden="true" className="ui-calendar__weekdays">
            {weekdayLabels.map((label, index) => (
              // Narrow labels repeat (S/T twice) so the index disambiguates the key.
              <span className="ui-calendar__weekday" key={`${label}-${index}`}>
                {label}
              </span>
            ))}
          </div>

          <div
            aria-labelledby={ariaLabel ? undefined : labelId}
            aria-label={ariaLabel}
            className="ui-calendar__grid"
            onKeyDown={handleGridKeyDown}
            ref={gridRef}
            role="grid"
          >
            <span className="ui-calendar__sr-label" id={labelId}>
              {monthLabel}
            </span>
            {weeks.map((week, weekIndex) => (
              // Weeks have no stable id of their own; the index is the natural key.
              <div className="ui-calendar__week" key={weekIndex} role="row">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <span
                        className="ui-calendar__cell"
                        key={`blank-${weekIndex}-${dayIndex}`}
                        role="gridcell"
                      />
                    );
                  }
                  const disabled = isDisabled(day);
                  const isSelected = selected ? isSameDay(day, selected) : false;
                  const isToday = isSameDay(day, today);
                  const isFocusTarget = isSameDay(day, focusDate);
                  return (
                    <span className="ui-calendar__cell" key={toKey(day)} role="gridcell">
                      <button
                        aria-current={isToday ? 'date' : undefined}
                        aria-disabled={disabled || undefined}
                        aria-selected={isSelected}
                        className="ui-calendar__day"
                        data-date={toKey(day)}
                        data-disabled={disabled || undefined}
                        data-selected={isSelected || undefined}
                        data-today={isToday || undefined}
                        onClick={() => selectDay(day)}
                        tabIndex={isFocusTarget ? 0 : -1}
                        type="button"
                      >
                        {day.getDate()}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
