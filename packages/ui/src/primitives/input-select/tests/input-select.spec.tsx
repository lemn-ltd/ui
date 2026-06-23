import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputSelect } from '../input-select.js';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('InputSelect', () => {
  afterEach(() => cleanup());

  it('renders a labelled trigger button', () => {
    const { container } = render(<InputSelect aria-label="Sort order" options={OPTIONS} />);
    const trigger = container.querySelector('.ui-input-select');
    expect(trigger?.tagName).toBe('BUTTON');
    expect(trigger?.getAttribute('aria-label')).toBe('Sort order');
  });

  it('shows the placeholder when no value is selected', () => {
    const { container } = render(
      <InputSelect aria-label="Sort order" options={OPTIONS} placeholder="Pick one" />,
    );
    expect(container.querySelector('.ui-input-select')?.textContent).toContain('Pick one');
  });

  it('renders the chevron icon', () => {
    const { container } = render(<InputSelect aria-label="Sort order" options={OPTIONS} />);
    expect(container.querySelector('.ui-input-select__chevron svg')).not.toBeNull();
  });

  it('disables the trigger', () => {
    const { container } = render(
      <InputSelect aria-label="Sort order" disabled options={OPTIONS} />,
    );
    expect(container.querySelector('.ui-input-select')?.hasAttribute('disabled')).toBe(true);
  });

  it('marks the trigger invalid through data-invalid', () => {
    const { container } = render(<InputSelect aria-label="Sort order" invalid options={OPTIONS} />);
    expect(container.querySelector('.ui-input-select')?.getAttribute('data-invalid')).toBe('true');
  });

  it('supports an empty-string option for clearable selections', () => {
    const onValueChange = vi.fn();

    render(
      <InputSelect
        aria-label="Model provider"
        onValueChange={onValueChange}
        options={[{ value: '', label: 'Default binding' }, ...OPTIONS]}
        value=""
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Model provider' }).textContent).toContain(
      'Default binding',
    );

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Model provider' }), {
      key: 'ArrowDown',
    });
    fireEvent.click(screen.getByText('Alpha'));

    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('maps option hints to hover titles', () => {
    render(
      <InputSelect
        aria-label="Mode"
        options={[{ value: 'live', label: 'Live', hint: 'Use for production traffic.' }]}
        value="live"
      />,
    );

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Mode' }), {
      key: 'ArrowDown',
    });

    expect(document.querySelector('.ui-input-select__option')?.getAttribute('title')).toBe(
      'Use for production traffic.',
    );
  });
});
