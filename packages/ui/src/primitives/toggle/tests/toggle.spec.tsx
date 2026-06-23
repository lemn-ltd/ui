import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Toggle } from '../toggle.js';

describe('Toggle', () => {
  afterEach(() => cleanup());

  it('reflects the checked state via data-state', () => {
    const { container, rerender } = render(<Toggle checked={false} aria-label="Wrap" />);
    expect(container.querySelector('.ui-toggle')?.getAttribute('data-state')).toBe('unchecked');
    rerender(<Toggle checked aria-label="Wrap" />);
    expect(container.querySelector('.ui-toggle')?.getAttribute('data-state')).toBe('checked');
  });

  it('renders a thumb', () => {
    const { container } = render(<Toggle checked aria-label="Wrap" />);
    expect(container.querySelector('.ui-toggle__thumb')).not.toBeNull();
  });

  it('emits onCheckedChange', () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Toggle checked={false} onCheckedChange={onCheckedChange} aria-label="Wrap" />,
    );
    fireEvent.click(container.querySelector('.ui-toggle') as HTMLElement);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
