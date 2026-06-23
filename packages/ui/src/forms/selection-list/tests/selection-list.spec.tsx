import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SelectionList, type SelectionListGroup } from '../selection-list.js';

const groups: SelectionListGroup[] = [
  {
    key: 'workspace',
    label: 'workspace',
    items: [
      {
        key: 'tool.workspace.read_file',
        label: 'Read file',
        description: 'tool.workspace.read_file',
        badge: { label: 'low', tone: 'dim' },
      },
      {
        key: 'tool.workspace.write_file',
        label: 'Write file',
        description: 'tool.workspace.write_file',
        badge: { label: 'high', tone: 'danger' },
      },
    ],
  },
  {
    key: 'memory',
    label: 'memory',
    items: [
      { key: 'tool.memory.save', label: 'Save memory' },
      { key: 'tool.memory.search', label: 'Search memory' },
    ],
  },
];

const groupsWithDisabledItem: SelectionListGroup[] = [
  {
    ...groups[0],
    items: [{ ...groups[0].items[0], disabled: true }, groups[0].items[1]],
  },
  groups[1],
];

function searchInput(): HTMLInputElement {
  return document.querySelector('.ui-selection-list__search-input') as HTMLInputElement;
}

describe('SelectionList', () => {
  afterEach(() => cleanup());

  it('renders every group with its items and counts', () => {
    render(<SelectionList groups={groups} />);
    expect(document.querySelectorAll('.ui-selection-list__group').length).toBe(2);
    expect(document.querySelectorAll('.ui-selection-list__item').length).toBe(4);
    const counter = document.querySelector('.ui-selection-list__counter');
    expect(counter?.textContent).toBe('0 of 4 selected');
  });

  it('reflects the controlled selection in counts and group state', () => {
    render(<SelectionList groups={groups} value={['tool.workspace.read_file']} />);
    const counter = document.querySelector('.ui-selection-list__counter');
    expect(counter?.textContent).toBe('1 of 4 selected');
    const groupCheckbox = document.querySelector(
      'input[aria-label="Select all workspace"], [aria-label="Select all workspace"]',
    );
    expect(groupCheckbox?.getAttribute('data-state')).toBe('indeterminate');
  });

  it('emits the toggled item key', () => {
    const onValueChange = vi.fn();
    render(<SelectionList groups={groups} onValueChange={onValueChange} />);
    const firstItem = document.querySelector(
      '.ui-selection-list__item .ui-checkbox',
    ) as HTMLElement;
    fireEvent.click(firstItem);
    expect(onValueChange).toHaveBeenCalledWith(['tool.workspace.read_file']);
  });

  it('selects and unselects a whole group from its header checkbox', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<SelectionList groups={groups} onValueChange={onValueChange} />);
    const header = document.querySelector(
      '.ui-selection-list__group-header .ui-checkbox',
    ) as HTMLElement;
    fireEvent.click(header);
    expect(onValueChange).toHaveBeenCalledWith([
      'tool.workspace.read_file',
      'tool.workspace.write_file',
    ]);
    rerender(
      <SelectionList
        groups={groups}
        onValueChange={onValueChange}
        value={['tool.workspace.read_file', 'tool.workspace.write_file']}
      />,
    );
    fireEvent.click(
      document.querySelector('.ui-selection-list__group-header .ui-checkbox') as HTMLElement,
    );
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('selects every enabled item from the Select all action', () => {
    const onValueChange = vi.fn();
    render(<SelectionList groups={groupsWithDisabledItem} onValueChange={onValueChange} />);
    fireEvent.click(document.querySelector('.ui-selection-list__select-all') as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith([
      'tool.workspace.write_file',
      'tool.memory.save',
      'tool.memory.search',
    ]);
  });

  it('filters items and hides groups without matches', () => {
    render(<SelectionList groups={groups} />);
    fireEvent.change(searchInput(), { target: { value: 'write' } });
    expect(document.querySelectorAll('.ui-selection-list__item').length).toBe(1);
    expect(document.querySelectorAll('.ui-selection-list__group').length).toBe(1);
  });

  it('narrows to one category via its pill and toggles back to all', () => {
    render(<SelectionList groups={groups} />);
    const pills = document.querySelectorAll('.ui-selection-list__pill');
    fireEvent.click(pills[2] as HTMLElement);
    expect(document.querySelectorAll('.ui-selection-list__group').length).toBe(1);
    fireEvent.click(pills[2] as HTMLElement);
    expect(document.querySelectorAll('.ui-selection-list__group').length).toBe(2);
  });

  it('shows the empty state when nothing matches', () => {
    render(<SelectionList emptyMessage="No tools match" groups={groups} />);
    fireEvent.change(searchInput(), { target: { value: 'zzzz' } });
    const empty = document.querySelector('.ui-selection-list__empty-title');
    expect(empty?.textContent).toBe('No tools match');
    expect(document.querySelectorAll('.ui-selection-list__item').length).toBe(0);
  });

  it('collapses a group from its toggle and expands it during search', () => {
    render(<SelectionList groups={groups} />);
    const toggle = document.querySelector('.ui-selection-list__group-toggle') as HTMLElement;
    fireEvent.click(toggle);
    expect(document.querySelectorAll('.ui-selection-list__item').length).toBe(2);
    fireEvent.change(searchInput(), { target: { value: 'file' } });
    expect(document.querySelectorAll('.ui-selection-list__item').length).toBe(2);
    expect(
      document.querySelector('.ui-selection-list__group-toggle')?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('clears the selection from the Clear action', () => {
    const onValueChange = vi.fn();
    render(
      <SelectionList groups={groups} onValueChange={onValueChange} value={['tool.memory.save']} />,
    );
    fireEvent.click(document.querySelector('.ui-selection-list__clear') as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('renders item badges with their tone', () => {
    render(<SelectionList groups={groups} />);
    const badge = document.querySelector('.ui-selection-list__item-badge') as HTMLElement;
    expect(badge.textContent).toBe('low');
    expect(badge.dataset.tone).toBe('dim');
  });

  it('disables every control when disabled', () => {
    render(<SelectionList disabled groups={groups} />);
    expect(searchInput().disabled).toBe(true);
    const selectAll = document.querySelector('.ui-selection-list__select-all') as HTMLButtonElement;
    expect(selectAll.disabled).toBe(true);
    const clear = document.querySelector('.ui-selection-list__clear') as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
    for (const pill of document.querySelectorAll<HTMLButtonElement>('.ui-selection-list__pill')) {
      expect(pill.disabled).toBe(true);
    }
  });
});
