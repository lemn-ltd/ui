import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from '../date-picker.js';

const TODAY = new Date(2026, 6, 14);

describe('DatePicker', () => {
  afterEach(cleanup);

  it('opens the calendar, selects a date, closes, and updates its form value', () => {
    const onChange = vi.fn();
    const { getByRole, queryByRole, container } = render(
      <DatePicker
        defaultOpen
        label="Due date"
        name="dueDate"
        onChange={onChange}
        today={TODAY}
      />,
    );
    fireEvent.click(container.ownerDocument.querySelector('[data-date="2026-07-20"]') as Element);
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 20));
    expect(queryByRole('grid')).toBeNull();
    expect(getByRole('button', { name: 'Due date' }).textContent).toContain('Jul 20');
    expect(container.querySelector('input[name="dueDate"]')?.getAttribute('value')).toBe(
      '2026-07-20',
    );
  });

  it('keeps a controlled value fixed when the parent does not update', () => {
    const onChange = vi.fn();
    const { getByRole, container } = render(
      <DatePicker defaultOpen label="Due date" onChange={onChange} today={TODAY} value={TODAY} />,
    );
    fireEvent.click(container.ownerDocument.querySelector('[data-date="2026-07-20"]') as Element);
    expect(onChange).toHaveBeenCalled();
    expect(getByRole('button', { name: 'Due date' }).textContent).toContain('Jul 14');
  });
});
