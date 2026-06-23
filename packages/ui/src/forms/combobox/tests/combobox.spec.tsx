import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxOption } from '../combobox.js';

const options: ComboboxOption[] = [
  { value: 'utc', label: 'UTC' },
  { value: 'cet', label: 'Central European Time' },
  { value: 'pst', label: 'Pacific Standard Time' },
];

function openTrigger(): void {
  const trigger = document.querySelector('.ui-combobox') as HTMLButtonElement;
  fireEvent.click(trigger);
}

describe('Combobox', () => {
  afterEach(() => cleanup());

  it('shows the placeholder when nothing is selected', () => {
    render(<Combobox options={options} placeholder="Pick a zone" />);
    const placeholder = document.querySelector('.ui-combobox__placeholder');
    expect(placeholder?.textContent).toBe('Pick a zone');
  });

  it('passes the accessible label to the trigger', () => {
    render(<Combobox aria-label="Default target" options={options} placeholder="Pick a zone" />);
    expect(document.querySelector('.ui-combobox')?.getAttribute('aria-label')).toBe(
      'Default target',
    );
  });

  it('renders the selected label in single mode', () => {
    render(<Combobox options={options} value="cet" />);
    const value = document.querySelector('.ui-combobox__value') as HTMLElement;
    expect(value.textContent).toContain('Central European Time');
  });

  it('opens the popover and lists every option', () => {
    render(<Combobox options={options} />);
    openTrigger();
    const rows = document.querySelectorAll('.ui-combobox__option');
    expect(rows.length).toBe(3);
  });

  it('echoes the typed query in the controlled filter input', () => {
    render(<Combobox options={options} />);
    openTrigger();
    const input = document.querySelector('.ui-combobox__input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'pac' } });
    expect(input.value).toBe('pac');
  });

  it('emits the chosen value and closes in single mode', () => {
    const onValueChange = vi.fn();
    render(<Combobox onValueChange={onValueChange} options={options} />);
    openTrigger();
    const row = document.querySelector('.ui-combobox__option') as HTMLElement;
    fireEvent.click(row);
    expect(onValueChange).toHaveBeenCalledWith('utc');
    expect(document.querySelector('.ui-combobox__option')).toBeNull();
  });

  it('marks the selected row with aria-selected and a check', () => {
    render(<Combobox options={options} value="utc" />);
    openTrigger();
    const selected = document.querySelector('.ui-combobox__option[data-selected="true"]');
    expect(selected?.getAttribute('aria-selected')).toBe('true');
    expect(selected?.querySelector('.ui-combobox__option-check')).not.toBeNull();
  });

  it('renders selected values as chips in multi mode', () => {
    render(<Combobox mode="multi" options={options} value={['utc', 'cet']} />);
    const chips = document.querySelectorAll('.ui-combobox__value .ui-tag');
    expect(chips.length).toBe(2);
  });

  it('toggles values and keeps the popover open in multi mode', () => {
    const onValueChange = vi.fn();
    render(
      <Combobox mode="multi" onValueChange={onValueChange} options={options} value={['utc']} />,
    );
    openTrigger();
    const rows = document.querySelectorAll('.ui-combobox__option');
    fireEvent.click(rows[1] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith(['utc', 'cet']);
    expect(document.querySelector('.ui-combobox__option')).not.toBeNull();
  });

  it('renders the empty message via Command.Empty when the filter matches nothing', () => {
    render(<Combobox emptyMessage="No matches" options={options} />);
    openTrigger();
    const input = document.querySelector('.ui-combobox__input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'zzzz' } });
    const empty = document.querySelector('.ui-combobox__empty');
    expect(empty?.textContent).toBe('No matches');
    expect(document.querySelectorAll('.ui-combobox__option').length).toBe(0);
  });
});
