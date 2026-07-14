export interface DateRangeValue {
  readonly start: Date | null;
  readonly end: Date | null;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function normalizeDateRange(value?: DateRangeValue): DateRangeValue {
  return {
    start: value?.start ? startOfDay(value.start) : null,
    end: value?.end ? startOfDay(value.end) : null,
  };
}

export function orderedDateRange(a: Date, b: Date): DateRangeValue {
  const first = startOfDay(a);
  const second = startOfDay(b);
  return first.getTime() <= second.getTime()
    ? { start: first, end: second }
    : { start: second, end: first };
}

export function nextDateRangeSelection(current: DateRangeValue, day: Date): DateRangeValue {
  const selected = startOfDay(day);
  if (!current.start || current.end) return { start: selected, end: null };
  return orderedDateRange(current.start, selected);
}

export function isDateInRange(date: Date, range: DateRangeValue): boolean {
  if (!range.start) return false;
  const time = startOfDay(date).getTime();
  const start = range.start.getTime();
  const end = (range.end ?? range.start).getTime();
  return time >= Math.min(start, end) && time <= Math.max(start, end);
}

export function isDateInVisibleMonths(
  date: Date,
  firstMonth: Date,
  numberOfMonths: 1 | 2,
): boolean {
  const time = startOfMonth(date).getTime();
  const first = startOfMonth(firstMonth).getTime();
  const afterLast = addMonths(firstMonth, numberOfMonths).getTime();
  return time >= first && time < afterLast;
}

export function calendarWeeks(
  month: Date,
  weekStartsOn: 0 | 1,
): readonly (readonly (Date | null)[])[] {
  const first = startOfMonth(month);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let index = 0; index < lead; index += 1) cells.push(null);
  for (let day = 1; day <= total; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: Array<readonly (Date | null)[]> = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }
  return rows;
}
