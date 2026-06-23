import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox } from '../checkbox.js';

describe('Checkbox', () => {
  afterEach(() => cleanup());

  it('reflects the unchecked state', () => {
    const { container } = render(<Checkbox checked={false} aria-label="Accept" />);
    const root = container.querySelector('.ui-checkbox');
    expect(root?.getAttribute('data-state')).toBe('unchecked');
  });

  it('reflects the checked state and renders the indicator', () => {
    const { container } = render(<Checkbox checked aria-label="Accept" />);
    const root = container.querySelector('.ui-checkbox');
    expect(root?.getAttribute('data-state')).toBe('checked');
    expect(container.querySelector('.ui-checkbox__indicator svg')).not.toBeNull();
  });

  it('emits onCheckedChange with the next value', () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Checkbox checked={false} onCheckedChange={onCheckedChange} aria-label="Accept" />,
    );
    fireEvent.click(container.querySelector('.ui-checkbox') as HTMLElement);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('marks the disabled state', () => {
    const { container } = render(<Checkbox checked disabled aria-label="Accept" />);
    expect(container.querySelector('.ui-checkbox')?.hasAttribute('data-disabled')).toBe(true);
  });
});
