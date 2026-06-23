import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type PresetOption, PresetSelector } from '../preset-selector.js';

const PRESETS: PresetOption[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
];

describe('PresetSelector', () => {
  afterEach(() => cleanup());

  it('flags the active segment through data-active', () => {
    const { container } = render(
      <PresetSelector onSelect={() => {}} presets={PRESETS} value="mine" />,
    );
    const segments = container.querySelectorAll('.ui-preset-selector__segment');
    expect(segments[0]?.getAttribute('data-active')).toBe('false');
    expect(segments[1]?.getAttribute('data-active')).toBe('true');
  });

  it('selects a preset and surfaces the manage affordance', () => {
    const onSelect = vi.fn();
    const onManage = vi.fn();
    const { getByText, getByLabelText } = render(
      <PresetSelector onManage={onManage} onSelect={onSelect} presets={PRESETS} value="all" />,
    );
    fireEvent.click(getByText('Mine'));
    expect(onSelect).toHaveBeenCalledWith('mine');

    fireEvent.click(getByLabelText('Manage presets'));
    expect(onManage).toHaveBeenCalledTimes(1);
  });
});
