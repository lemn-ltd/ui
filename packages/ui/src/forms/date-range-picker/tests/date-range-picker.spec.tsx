import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from '../date-range-picker.js';

const TODAY = new Date(2026, 6, 14);

describe('DateRangePicker', () => {
  afterEach(cleanup);

  it('keeps the popover open for a partial range and closes when complete', () => {
    const onChange = vi.fn();
    const { queryByRole, container } = render(
      <DateRangePicker
        defaultOpen
        label="Reporting period"
        name="period"
        numberOfMonths={1}
        onChange={onChange}
        today={TODAY}
      />,
    );
    const document = container.ownerDocument;
    fireEvent.click(document.querySelector('[data-date="2026-07-10"]') as Element);
    expect(queryByRole('grid')).not.toBeNull();
    fireEvent.click(document.querySelector('[data-date="2026-07-20"]') as Element);
    expect(queryByRole('grid')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({
      start: new Date(2026, 6, 10),
      end: new Date(2026, 6, 20),
    });
    expect(container.querySelector('input[name="period.start"]')?.getAttribute('value')).toBe(
      '2026-07-10',
    );
    expect(container.querySelector('input[name="period.end"]')?.getAttribute('value')).toBe(
      '2026-07-20',
    );
  });
});
