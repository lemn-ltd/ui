import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NodePaletteItem } from '../node-palette.js';
import { NodePalette } from '../node-palette.js';

const ITEMS: readonly NodePaletteItem[] = [
  { kind: 'trigger', label: 'Trigger', icon: 'radio' },
  { kind: 'agent', label: 'Agent', icon: 'users' },
];

describe('NodePalette', () => {
  afterEach(() => cleanup());

  it('renders one button per item and marks the selected kind', () => {
    const { container } = render(<NodePalette items={ITEMS} selectedKind="agent" />);
    const buttons = container.querySelectorAll('.ui-node-palette__item');
    expect(buttons).toHaveLength(2);
    expect(container.querySelector('[data-kind="agent"]')?.getAttribute('data-selected')).toBe(
      'true',
    );
  });

  it('reports the selected kind through onSelect', () => {
    const onSelect = vi.fn();
    const { container } = render(<NodePalette items={ITEMS} onSelect={onSelect} />);
    const trigger = container.querySelector('[data-kind="trigger"]');
    if (trigger) fireEvent.click(trigger);
    expect(onSelect).toHaveBeenCalledWith('trigger');
  });
});
