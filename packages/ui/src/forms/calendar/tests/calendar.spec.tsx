import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Calendar } from '../calendar.js';

const TODAY = new Date(2026, 5, 24);
const SELECTED = new Date(2026, 5, 12);

function day(date: string): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(`[data-date="${date}"]`);
}

describe('Calendar', () => {
  afterEach(() => cleanup());

  it('renders the visible month label and a weekday header per day', () => {
    render(<Calendar defaultValue={SELECTED} today={TODAY} />);
    expect(document.querySelector('.ui-calendar__switch-label')?.textContent).toBe('June 2026');
    expect(document.querySelectorAll('.ui-calendar__weekday').length).toBe(7);
  });

  it('renders every day of the month and marks today and the selection', () => {
    render(<Calendar defaultValue={SELECTED} today={TODAY} />);
    const days = document.querySelectorAll('.ui-calendar__day');
    expect(days.length).toBe(30); // June has 30 days
    expect(day('2026-06-12')?.getAttribute('data-selected')).toBe('true');
    expect(day('2026-06-12')?.closest('[role="gridcell"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(day('2026-06-12')?.getAttribute('aria-selected')).toBeNull();
    expect(day('2026-06-24')?.getAttribute('data-today')).toBe('true');
    expect(day('2026-06-24')?.getAttribute('aria-current')).toBe('date');
  });

  it('selects an enabled day on click and reports a midnight-floored date', () => {
    const onChange = vi.fn();
    render(<Calendar defaultValue={SELECTED} onChange={onChange} today={TODAY} />);
    fireEvent.click(day('2026-06-15') as HTMLButtonElement);
    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = onChange.mock.calls[0]?.[0] as Date;
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(5);
    expect(picked.getDate()).toBe(15);
    expect(picked.getHours()).toBe(0);
    // Uncontrolled: the selection moves to the clicked day.
    expect(day('2026-06-15')?.getAttribute('data-selected')).toBe('true');
  });

  it('disables future days under disableFuture and ignores their clicks', () => {
    const onChange = vi.fn();
    render(<Calendar defaultValue={SELECTED} disableFuture onChange={onChange} today={TODAY} />);
    expect(day('2026-06-24')?.getAttribute('aria-disabled')).toBeNull(); // today stays enabled
    expect(day('2026-06-25')?.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(day('2026-06-27') as HTMLButtonElement);
    expect(onChange).not.toHaveBeenCalled();
    expect(day('2026-06-27')?.getAttribute('data-selected')).toBeNull();
  });

  it('disables days outside the min/max range', () => {
    render(
      <Calendar
        defaultValue={SELECTED}
        maxDate={new Date(2026, 5, 20)}
        minDate={new Date(2026, 5, 8)}
        today={TODAY}
      />,
    );
    expect(day('2026-06-07')?.getAttribute('aria-disabled')).toBe('true');
    expect(day('2026-06-08')?.getAttribute('aria-disabled')).toBeNull();
    expect(day('2026-06-20')?.getAttribute('aria-disabled')).toBeNull();
    expect(day('2026-06-21')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('navigates months and disables the next chevron at the future bound', () => {
    const onMonthChange = vi.fn();
    render(
      <Calendar
        defaultValue={SELECTED}
        disableFuture
        onMonthChange={onMonthChange}
        today={TODAY}
      />,
    );
    const [prev, next] = document.querySelectorAll<HTMLButtonElement>('.ui-calendar__nav button');
    expect(next.disabled).toBe(true); // viewing the current month with future disabled
    expect(prev.disabled).toBe(false);
    fireEvent.click(prev);
    expect(document.querySelector('.ui-calendar__switch-label')?.textContent).toBe('May 2026');
    const month = onMonthChange.mock.calls[0]?.[0] as Date;
    expect(month.getMonth()).toBe(4);
    expect(month.getDate()).toBe(1);
  });

  it('keeps internal selection fixed when controlled, but still fires onChange', () => {
    const onChange = vi.fn();
    render(<Calendar onChange={onChange} today={TODAY} value={SELECTED} />);
    fireEvent.click(day('2026-06-18') as HTMLButtonElement);
    expect(onChange).toHaveBeenCalledTimes(1);
    // Parent never updated `value`, so the rendered selection stays on the 12th.
    expect(day('2026-06-12')?.getAttribute('data-selected')).toBe('true');
    expect(day('2026-06-18')?.getAttribute('data-selected')).toBeNull();
  });

  it('roves focus with arrow keys and selects with Enter', () => {
    const onChange = vi.fn();
    render(<Calendar defaultValue={SELECTED} onChange={onChange} today={TODAY} />);
    expect(day('2026-06-12')?.tabIndex).toBe(0); // selection owns initial roving focus
    const grid = document.querySelector('.ui-calendar__grid') as HTMLElement;
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(day('2026-06-13')?.tabIndex).toBe(0);
    expect(day('2026-06-12')?.tabIndex).toBe(-1);
    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]?.[0] as Date).getDate()).toBe(13);
  });

  it('toggles the quick year list from the header switch', () => {
    render(<Calendar defaultValue={SELECTED} today={TODAY} />);
    expect(document.querySelector('.ui-calendar__years')).toBeNull();
    fireEvent.click(document.querySelector('.ui-calendar__switch') as HTMLButtonElement);
    const years = document.querySelector('.ui-calendar__years');
    expect(years).not.toBeNull();
    expect(years?.getAttribute('role')).toBe('listbox');
    // The current year is marked selected in the list.
    const selectedYear = years?.querySelector('[data-selected="true"]');
    expect(selectedYear?.textContent).toBe('2026');
  });
});
