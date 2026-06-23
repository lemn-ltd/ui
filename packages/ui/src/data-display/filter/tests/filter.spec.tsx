import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Filter, type FilterOption } from '../filter.js';

const OPTIONS: FilterOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

describe('Filter', () => {
  afterEach(() => cleanup());

  it('defaults to the enum Menu surface and selects an option', () => {
    const onSelect = vi.fn();
    const { getByRole, getByText } = render(
      <Filter label="Status" onSelect={onSelect} options={OPTIONS} selected={['active']} />,
    );
    expect(getByRole('button').textContent).toContain('Status: Active');

    fireEvent.keyDown(getByRole('button'), { key: 'Enter' });
    expect(document.querySelector('.ui-menu')).not.toBeNull();
    fireEvent.click(getByText('Paused'));
    expect(onSelect).toHaveBeenCalledWith('paused');
  });

  it('maps the enum select mode and active state to data attributes', () => {
    const { container } = render(
      <Filter label="Status" onSelect={() => {}} options={OPTIONS} select="multi" selected={[]} />,
    );
    const root = container.querySelector('.ui-filter');
    expect(root?.getAttribute('data-select')).toBe('multi');
    expect(root?.getAttribute('data-type')).toBe('enum');
    expect(root?.getAttribute('data-active')).toBe('false');
  });

  it('emits text input changes and reflects the active state', () => {
    const onChange = vi.fn();
    const { container, getByRole } = render(
      <Filter label="Name" onChange={onChange} type="text" value="report" />,
    );
    expect(container.querySelector('.ui-filter')?.getAttribute('data-active')).toBe('true');
    expect(getByRole('button').textContent).toContain('Name: report');

    fireEvent.click(getByRole('button'));
    fireEvent.change(document.querySelector('input[aria-label="Name"]') as HTMLInputElement, {
      target: { value: 'budget' },
    });
    expect(onChange).toHaveBeenCalledWith('budget');
  });

  it('emits a number range and marks active when a bound is set', () => {
    const onChange = vi.fn();
    const { container, getByRole } = render(
      <Filter label="Value" onChange={onChange} type="number-range" value={{ min: 10 }} />,
    );
    expect(container.querySelector('.ui-filter')?.getAttribute('data-active')).toBe('true');

    fireEvent.click(getByRole('button'));
    fireEvent.change(
      document.querySelector('input[aria-label="Value maximum"]') as HTMLInputElement,
      {
        target: { value: '50' },
      },
    );
    expect(onChange).toHaveBeenCalledWith({ min: 10, max: 50 });
  });

  it('emits a boolean choice', () => {
    const onChange = vi.fn();
    const { getByRole, getByText } = render(
      <Filter label="Active" onChange={onChange} type="boolean" value={null} />,
    );
    expect(getByRole('button').textContent).toBe('Active');

    fireEvent.click(getByRole('button'));
    fireEvent.click(getByText('Yes'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
