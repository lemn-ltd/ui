import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToggleGroup } from '../toggle-group.js';

const ITEMS = [
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
] as const;

describe('ToggleGroup', () => {
  afterEach(cleanup);

  it('supports a single uncontrolled value', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <ToggleGroup
        aria-label="Alignment"
        defaultValue="bold"
        items={ITEMS}
        onValueChange={onValueChange}
        type="single"
      />,
    );
    const italic = getByRole('radio', { name: 'Italic' });
    fireEvent.click(italic);
    expect(onValueChange).toHaveBeenCalledWith('italic');
    expect(italic.getAttribute('data-state')).toBe('on');
  });

  it('supports multiple controlled values', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <ToggleGroup
        aria-label="Formatting"
        items={ITEMS}
        onValueChange={onValueChange}
        type="multiple"
        value={['bold']}
      />,
    );
    expect(getByRole('button', { name: 'Bold' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(getByRole('button', { name: 'Italic' }));
    expect(onValueChange).toHaveBeenCalledWith(['bold', 'italic']);
  });
});
