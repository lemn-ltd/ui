import { describe, expect, it } from 'vitest';
import {
  isDateInRange,
  nextDateRangeSelection,
  normalizeDateRange,
  orderedDateRange,
  toDateKey,
} from '../date-helpers.js';

describe('calendar date helpers', () => {
  it('normalizes dates and creates stable local keys', () => {
    const value = normalizeDateRange({
      start: new Date(2026, 6, 14, 18, 30),
      end: null,
    });
    expect(value.start?.getHours()).toBe(0);
    expect(toDateKey(value.start as Date)).toBe('2026-07-14');
  });

  it('orders reverse selections and includes both boundaries', () => {
    const range = orderedDateRange(new Date(2026, 6, 20), new Date(2026, 6, 10));
    expect(range.start?.getDate()).toBe(10);
    expect(range.end?.getDate()).toBe(20);
    expect(isDateInRange(new Date(2026, 6, 15), range)).toBe(true);
  });

  it('starts a new range after a complete selection', () => {
    const first = nextDateRangeSelection({ start: null, end: null }, new Date(2026, 6, 10));
    const complete = nextDateRangeSelection(first, new Date(2026, 6, 12));
    const restarted = nextDateRangeSelection(complete, new Date(2026, 6, 20));
    expect(complete.end?.getDate()).toBe(12);
    expect(restarted).toEqual({ start: new Date(2026, 6, 20), end: null });
  });
});
