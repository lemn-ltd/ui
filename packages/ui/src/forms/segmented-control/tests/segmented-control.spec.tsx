import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SegmentedControl, type SegmentedControlSegment } from '../segmented-control.js';

const segments: SegmentedControlSegment[] = [
  { value: 'list', label: 'List', icon: 'list' },
  { value: 'grid', label: 'Grid', icon: 'layout-grid' },
];

describe('SegmentedControl', () => {
  afterEach(() => cleanup());

  it('renders one segment per entry with the active state on the selected value', () => {
    render(<SegmentedControl segments={segments} value="list" />);
    const items = document.querySelectorAll('.ui-segmented-control__segment');
    expect(items.length).toBe(2);
    expect(items[0]?.getAttribute('data-state')).toBe('on');
    expect(items[1]?.getAttribute('data-state')).toBe('off');
  });

  it('keeps only one segment active (single-select)', () => {
    render(<SegmentedControl segments={segments} value="grid" />);
    const active = document.querySelectorAll('.ui-segmented-control__segment[data-state="on"]');
    expect(active.length).toBe(1);
  });

  it('emits the new value on selection', () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl onValueChange={onValueChange} segments={segments} value="list" />);
    const items = document.querySelectorAll('.ui-segmented-control__segment');
    fireEvent.click(items[1] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith('grid');
  });

  it('does not clear the active value when the active segment is re-pressed', () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl onValueChange={onValueChange} segments={segments} value="list" />);
    const items = document.querySelectorAll('.ui-segmented-control__segment');
    fireEvent.click(items[0] as HTMLElement);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disables a single segment', () => {
    const withDisabled: SegmentedControlSegment[] = [
      { value: 'list', label: 'List' },
      { value: 'grid', label: 'Grid', disabled: true },
    ];
    render(<SegmentedControl segments={withDisabled} value="list" />);
    const items = document.querySelectorAll('.ui-segmented-control__segment');
    expect((items[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('supports three and four segments', () => {
    const four: SegmentedControlSegment[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
      { value: 'd', label: 'D' },
    ];
    render(<SegmentedControl segments={four} value="a" />);
    expect(document.querySelectorAll('.ui-segmented-control__segment').length).toBe(4);
  });
});
