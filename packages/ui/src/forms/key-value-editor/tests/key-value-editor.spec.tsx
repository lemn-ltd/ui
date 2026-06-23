import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeyValueEditor, type KeyValueEditorEntry } from '../key-value-editor.js';

const entries: KeyValueEditorEntry[] = [
  { id: 'entry-1', key: 'Authorization', value: 'Bearer token' },
  { id: 'entry-2', key: 'Accept', value: 'application/json' },
];

describe('KeyValueEditor', () => {
  afterEach(() => cleanup());

  it('renders editable key/value rows', () => {
    render(<KeyValueEditor aria-label="Headers" entries={entries} onEntriesChange={() => {}} />);
    expect(document.querySelectorAll('.ui-key-value-editor__row').length).toBe(2);
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Key 1"]')?.value).toBe(
      'Authorization',
    );
  });

  it('emits a changed key while preserving the other rows', () => {
    const onEntriesChange = vi.fn();
    render(
      <KeyValueEditor
        aria-label="Headers"
        entries={entries}
        keyLabel="Header"
        onEntriesChange={onEntriesChange}
      />,
    );
    fireEvent.change(requiredElement<HTMLInputElement>('input[aria-label="Header 1"]'), {
      target: { value: 'X-Agent' },
    });
    expect(onEntriesChange).toHaveBeenCalledWith([
      { id: 'entry-1', key: 'X-Agent', value: 'Bearer token' },
      entries[1],
    ]);
  });

  it('adds the next deterministic row id', () => {
    const onEntriesChange = vi.fn();
    render(
      <KeyValueEditor aria-label="Headers" entries={entries} onEntriesChange={onEntriesChange} />,
    );
    fireEvent.click(requiredElement<HTMLButtonElement>('.ui-key-value-editor__add'));
    expect(onEntriesChange).toHaveBeenCalledWith([
      ...entries,
      { id: 'entry-3', key: '', value: '' },
    ]);
  });

  it('removes a row', () => {
    const onEntriesChange = vi.fn();
    render(
      <KeyValueEditor aria-label="Headers" entries={entries} onEntriesChange={onEntriesChange} />,
    );
    fireEvent.click(requiredElement<HTMLButtonElement>('button[aria-label="Remove row 1"]'));
    expect(onEntriesChange).toHaveBeenCalledWith([entries[1]]);
  });
});

function requiredElement<TElement extends Element>(selector: string): TElement {
  const element = document.querySelector<TElement>(selector);
  expect(element).not.toBeNull();
  return element as TElement;
}
