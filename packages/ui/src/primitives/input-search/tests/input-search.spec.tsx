import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputSearch } from '../input-search.js';

function ControlledSearch({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <InputSearch aria-label="Search" onChange={setValue} value={value} />;
}

describe('InputSearch', () => {
  afterEach(() => cleanup());

  it('renders collapsed with no clear button when value is empty', () => {
    const { container } = render(<InputSearch aria-label="Search" onChange={vi.fn()} value="" />);
    const wrapper = container.querySelector('.ui-input-search');
    expect(wrapper?.getAttribute('data-expanded')).toBe('collapsed');
    expect(container.querySelector('.ui-input-search__clear')).toBeNull();
  });

  it('renders expanded with a clear button when value is set', () => {
    const { container } = render(
      <InputSearch aria-label="Search" onChange={vi.fn()} value="abc" />,
    );
    const wrapper = container.querySelector('.ui-input-search');
    expect(wrapper?.getAttribute('data-expanded')).toBe('expanded');
    expect(container.querySelector('.ui-input-search__clear')).not.toBeNull();
  });

  it('expands when the trigger is clicked', () => {
    const { container } = render(<InputSearch aria-label="Search" onChange={vi.fn()} value="" />);
    fireEvent.click(container.querySelector('.ui-input-search__trigger') as HTMLElement);
    expect(container.querySelector('.ui-input-search')?.getAttribute('data-expanded')).toBe(
      'expanded',
    );
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    const { container } = render(<InputSearch aria-label="Search" onChange={onChange} value="" />);
    fireEvent.change(container.querySelector('.ui-input-search__input') as HTMLInputElement, {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onChange with an empty string when the clear button is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <InputSearch aria-label="Search" onChange={onChange} value="abc" />,
    );
    fireEvent.click(container.querySelector('.ui-input-search__clear') as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('drives a controlled wrapper from collapsed to expanded as the user types', () => {
    const { container } = render(<ControlledSearch />);
    expect(container.querySelector('.ui-input-search')?.getAttribute('data-expanded')).toBe(
      'collapsed',
    );
    fireEvent.change(container.querySelector('.ui-input-search__input') as HTMLInputElement, {
      target: { value: 'query' },
    });
    expect(container.querySelector('.ui-input-search')?.getAttribute('data-expanded')).toBe(
      'expanded',
    );
    expect(container.querySelector('.ui-input-search__clear')).not.toBeNull();
  });

  it('collapses on an outside pointer press when expanded and empty', () => {
    const { container } = render(<ControlledSearch />);
    fireEvent.click(container.querySelector('.ui-input-search__trigger') as HTMLElement);
    expect(container.querySelector('.ui-input-search')?.getAttribute('data-expanded')).toBe(
      'expanded',
    );
    fireEvent.pointerDown(document.body);
    expect(container.querySelector('.ui-input-search')?.getAttribute('data-expanded')).toBe(
      'collapsed',
    );
  });

  it('stays expanded on an outside press while it has a value', () => {
    const { container } = render(
      <InputSearch aria-label="Search" onChange={vi.fn()} value="abc" />,
    );
    fireEvent.pointerDown(document.body);
    expect(container.querySelector('.ui-input-search')?.getAttribute('data-expanded')).toBe(
      'expanded',
    );
  });
});
