import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResizableSplit } from '../resizable-split.js';

describe('ResizableSplit', () => {
  afterEach(() => cleanup());

  it('renders both slots and a separator handle', () => {
    const { getByText, getByRole } = render(
      <ResizableSplit
        leftPercent={60}
        leftSlot={<div>left</div>}
        onChange={() => {}}
        rightSlot={<div>right</div>}
      />,
    );
    expect(getByText('left')).not.toBeNull();
    expect(getByText('right')).not.toBeNull();
    expect(getByRole('separator')).not.toBeNull();
  });

  it('resizes with arrow keys, clamped to the bounds', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <ResizableSplit
        leftPercent={60}
        leftSlot={<div />}
        maxLeftPercent={82}
        minLeftPercent={44}
        onChange={onChange}
        rightSlot={<div />}
      />,
    );
    fireEvent.keyDown(getByRole('separator'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(62);
    fireEvent.keyDown(getByRole('separator'), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(58);
  });
});
