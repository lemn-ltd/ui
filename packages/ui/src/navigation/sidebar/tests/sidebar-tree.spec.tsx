import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Sidebar, type SidebarNavGroup } from '../sidebar.js';

function nested(): SidebarNavGroup[] {
  return [
    {
      header: 'Platform',
      items: [
        {
          id: 'pg',
          label: 'Playground',
          icon: 'square-pen',
          children: [
            { id: 'hist', label: 'History' },
            {
              id: 'star',
              label: 'Starred',
              children: [
                { id: 'recent', label: 'Recent' },
                { id: 'pinned', label: 'Pinned', active: true },
              ],
            },
          ],
        },
        {
          id: 'models',
          label: 'Models',
          icon: 'layout-grid',
          children: [{ id: 'gen', label: 'Genesis' }],
        },
      ],
    },
  ];
}

const FLAT: readonly SidebarNavGroup[] = [
  { items: [{ id: 'home', label: 'Home', icon: 'layout-grid', active: true }] },
];

function treeId(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tree-id="${id}"]`);
}

function treeChevron(id: string): HTMLElement | null {
  return treeId(id)?.parentElement?.querySelector<HTMLElement>('.ui-sidebar__chevron') ?? null;
}

describe('Sidebar nesting (tree)', () => {
  afterEach(() => cleanup());

  it('renders a role=tree only when a group actually nests', () => {
    const { container, rerender } = render(<Sidebar groups={FLAT} mode="expanded" />);
    expect(container.querySelector('[role="tree"]')).toBeNull();
    expect(container.querySelectorAll('.ui-sidebar__item')).toHaveLength(1);

    rerender(<Sidebar groups={nested()} mode="expanded" />);
    expect(container.querySelector('[role="tree"]')).not.toBeNull();
  });

  it('auto-expands the active item trail and marks it aria-current', () => {
    render(<Sidebar groups={nested()} mode="expanded" />);
    expect(treeId('pg')?.getAttribute('aria-expanded')).toBe('true');
    expect(treeId('star')?.getAttribute('aria-expanded')).toBe('true');
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('false');
    expect(treeId('pinned')?.getAttribute('aria-current')).toBe('page');
    expect(treeId('pinned')?.getAttribute('aria-level')).toBe('3');
  });

  it('lazily mounts a subtree only while expanded', () => {
    render(<Sidebar groups={nested()} mode="expanded" />);
    expect(treeId('gen')).toBeNull(); // models is collapsed
    fireEvent.click(treeChevron('models') as HTMLElement);
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('true');
    expect(treeId('gen')).not.toBeNull();
    fireEvent.click(treeChevron('models') as HTMLElement);
    expect(treeId('gen')).toBeNull();
  });

  it('gives the active item the initial roving tabindex', () => {
    render(<Sidebar groups={nested()} mode="expanded" />);
    expect(treeId('pinned')?.tabIndex).toBe(0);
    expect(treeId('hist')?.tabIndex).toBe(-1);
  });

  it('moves roving focus with Down/Up arrows', () => {
    const { container } = render(<Sidebar groups={nested()} mode="expanded" />);
    const tree = container.querySelector('.ui-sidebar__tree') as HTMLElement;
    // visible order: pg, hist, star, recent, pinned, models — focus starts on pinned.
    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    expect(treeId('models')?.tabIndex).toBe(0);
    fireEvent.keyDown(tree, { key: 'ArrowUp' });
    expect(treeId('pinned')?.tabIndex).toBe(0);
  });

  it('expands with ArrowRight and collapses with ArrowLeft', () => {
    const { container } = render(<Sidebar groups={nested()} mode="expanded" />);
    const tree = container.querySelector('.ui-sidebar__tree') as HTMLElement;
    fireEvent.keyDown(tree, { key: 'ArrowDown' }); // pinned -> models (collapsed)
    fireEvent.keyDown(tree, { key: 'ArrowRight' }); // expand models
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(tree, { key: 'ArrowLeft' }); // collapse models
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('splits hit targets: the row navigates, the chevron toggles', () => {
    const onSelect = vi.fn();
    // A parent that is also a destination: the row navigates, only the chevron toggles.
    const groups: SidebarNavGroup[] = [
      {
        items: [
          {
            id: 'models',
            label: 'Models',
            icon: 'layout-grid',
            onSelect,
            children: [{ id: 'gen', label: 'Genesis' }],
          },
        ],
      },
    ];
    render(<Sidebar groups={groups} mode="expanded" />);
    // Click the label area -> navigates, does not expand.
    fireEvent.click(treeId('models')?.querySelector('.ui-sidebar__item-label') as HTMLElement);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('false');
    // Click the chevron -> expands, no extra navigation.
    fireEvent.click(treeChevron('models') as HTMLElement);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('supports controlled expanded state', () => {
    const onExpandedChange = vi.fn();
    const groups: SidebarNavGroup[] = [
      {
        items: [
          {
            id: 'models',
            label: 'Models',
            icon: 'layout-grid',
            children: [{ id: 'gen', label: 'Genesis' }],
          },
        ],
      },
    ];
    render(<Sidebar expandedIds={[]} groups={groups} mode="expanded" onExpandedChange={onExpandedChange} />);
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(treeChevron('models') as HTMLElement);
    expect(onExpandedChange).toHaveBeenCalledWith(['models']);
    // Controlled: prop did not change, so it stays collapsed.
    expect(treeId('models')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders nested destinations as treeitem links without consuming modified clicks', () => {
    const groups: SidebarNavGroup[] = [
      {
        items: [
          {
            id: 'models',
            label: 'Models',
            href: '/models',
            children: [{ id: 'gen', label: 'Genesis', href: '/models/genesis' }],
            defaultExpanded: true,
          },
        ],
      },
    ];
    render(<Sidebar groups={groups} mode="expanded" />);
    const parent = treeId('models');
    const child = treeId('gen');
    expect(parent?.tagName).toBe('A');
    expect(parent?.getAttribute('href')).toBe('/models');
    expect(child?.tagName).toBe('A');
    expect(child?.getAttribute('href')).toBe('/models/genesis');
    fireEvent.click(child as HTMLAnchorElement, { ctrlKey: true });
    expect(child?.getAttribute('href')).toBe('/models/genesis');
  });
});
