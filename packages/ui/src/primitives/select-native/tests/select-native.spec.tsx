import { cleanup, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectNative } from '../select-native.js';

const OPTIONS = [
  { label: 'Recent', value: 'recent' },
  {
    label: 'Status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Paused', value: 'paused', disabled: true },
    ],
  },
] as const;

describe('SelectNative', () => {
  afterEach(cleanup);

  it('renders a native placeholder, groups, and disabled options', () => {
    const { getByRole } = render(
      <SelectNative aria-label="Filter" options={OPTIONS} placeholder="Choose a filter" />,
    );
    const select = getByRole('combobox') as HTMLSelectElement;
    expect(select.options[0]?.disabled).toBe(true);
    expect(select.querySelector('optgroup')?.label).toBe('Status');
    expect(select.options[3]?.disabled).toBe(true);
  });

  it('supports value callbacks, invalid wiring, and refs', () => {
    const onValueChange = vi.fn();
    const ref = createRef<HTMLSelectElement>();
    const { getByRole } = render(
      <SelectNative
        aria-label="Filter"
        defaultValue="recent"
        invalid
        onValueChange={onValueChange}
        options={OPTIONS}
        ref={ref}
      />,
    );
    const select = getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'active' } });
    expect(onValueChange).toHaveBeenCalledWith('active');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(ref.current).toBe(select);
  });
});
