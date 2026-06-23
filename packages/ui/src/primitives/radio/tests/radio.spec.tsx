import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RadioGroup, RadioGroupItem } from '../radio.js';

function renderGroup(value: string, onValueChange = vi.fn()) {
  return render(
    <RadioGroup value={value} onValueChange={onValueChange}>
      <RadioGroupItem value="a" aria-label="A" />
      <RadioGroupItem value="b" aria-label="B" />
    </RadioGroup>,
  );
}

describe('RadioGroup', () => {
  afterEach(() => cleanup());

  it('marks the selected item as checked', () => {
    const { container } = renderGroup('a');
    const items = container.querySelectorAll('.ui-radio');
    expect(items[0]?.getAttribute('data-state')).toBe('checked');
    expect(items[1]?.getAttribute('data-state')).toBe('unchecked');
  });

  it('emits onValueChange with the clicked item value', () => {
    const onValueChange = vi.fn();
    const { container } = renderGroup('a', onValueChange);
    const items = container.querySelectorAll('.ui-radio');
    fireEvent.click(items[1] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });
});
