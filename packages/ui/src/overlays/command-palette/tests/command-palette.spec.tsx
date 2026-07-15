import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette, type CommandPaletteGroup } from '../command-palette.js';

const groups: CommandPaletteGroup[] = [
  {
    label: 'Pages',
    items: [
      { id: 'overview', label: 'Overview', icon: 'layout-grid' },
      { id: 'settings', label: 'Settings', icon: 'settings', shortcut: '⌘,' },
    ],
  },
];

describe('CommandPalette', () => {
  afterEach(() => cleanup());

  it('renders the search input and grouped items when open', () => {
    render(<CommandPalette groups={groups} onOpenChange={vi.fn()} open />);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeDefined();
    const input = document.querySelector('.ui-command-palette__input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.getAttribute('placeholder')).toBe('Search pages, actions…');
    const items = document.querySelectorAll('.ui-command-palette__item');
    expect(items.length).toBe(2);
  });

  it('echoes the typed query in the controlled input', () => {
    render(<CommandPalette groups={groups} onOpenChange={vi.fn()} open />);
    const input = document.querySelector('.ui-command-palette__input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'set' } });
    expect(input.value).toBe('set');
  });

  it('invokes onSelect and closes on item selection', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    const withSelect: CommandPaletteGroup[] = [
      { label: 'Pages', items: [{ id: 'overview', label: 'Overview', onSelect }] },
    ];
    render(<CommandPalette groups={withSelect} onOpenChange={onOpenChange} open />);
    fireEvent.click(document.querySelector('.ui-command-palette__item') as HTMLElement);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('filters by substring across label and keywords, not fuzzy subsequence', () => {
    const filterable: CommandPaletteGroup[] = [
      {
        label: 'Components',
        items: [
          { id: 'input', label: 'Input', keywords: ['a single-line text field'] },
          { id: 'icons', label: 'Icons', keywords: ['the product-neutral glyph set'] },
        ],
      },
    ];
    render(<CommandPalette groups={filterable} onOpenChange={vi.fn()} open />);
    const input = document.querySelector('.ui-command-palette__input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'input' } });
    const labels = Array.from(document.querySelectorAll('.ui-command-palette__item-label')).map(
      (el) => el.textContent,
    );
    expect(labels).toContain('Input');
    expect(labels).not.toContain('Icons');
  });

  it('ranks an exact label above the same words in another item keyword', () => {
    const onDataTable = vi.fn();
    const onHeatmap = vi.fn();
    const ranked: CommandPaletteGroup[] = [
      {
        label: 'Visualizations',
        items: [
          {
            id: 'heatmap-chart',
            label: 'Heatmap chart',
            keywords: ['An interactive chart with an SSR data table'],
            onSelect: onHeatmap,
          },
        ],
      },
      {
        label: 'Data display',
        items: [{ id: 'data-table', label: 'Data table', onSelect: onDataTable }],
      },
    ];
    render(<CommandPalette groups={ranked} onOpenChange={vi.fn()} open />);
    const input = document.querySelector('.ui-command-palette__input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Data table' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onDataTable).toHaveBeenCalledTimes(1);
    expect(onHeatmap).not.toHaveBeenCalled();
  });
});
