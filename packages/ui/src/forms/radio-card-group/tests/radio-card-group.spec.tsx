import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RadioCardGroup } from '../radio-card-group.js';

const OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Every Monday' },
] as const;

describe('RadioCardGroup', () => {
  afterEach(cleanup);

  it('renders full cards as accessible radios', () => {
    const { getAllByRole } = render(
      <RadioCardGroup aria-label="Cadence" defaultValue="daily" options={OPTIONS} />,
    );
    const radios = getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.getAttribute('aria-checked')).toBe('true');
    expect(radios[0]?.textContent).toContain('Every day');
  });

  it('supports uncontrolled selection and callbacks', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <RadioCardGroup
        aria-label="Cadence"
        defaultValue="daily"
        onValueChange={onValueChange}
        options={OPTIONS}
      />,
    );
    fireEvent.click(getByRole('radio', { name: /Weekly/ }));
    expect(onValueChange).toHaveBeenCalledWith('weekly');
    expect(getByRole('radio', { name: /Weekly/ }).getAttribute('aria-checked')).toBe('true');
  });
});
