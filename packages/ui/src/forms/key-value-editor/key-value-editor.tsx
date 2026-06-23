import type { ChangeEvent, ReactElement } from 'react';
import { Button } from '../../primitives/button/button.js';
import { Icon } from '../../primitives/icon/icon.js';
import { IconButton } from '../../primitives/icon-button/icon-button.js';
import { Input } from '../../primitives/input/input.js';
import './key-value-editor.css';

export interface KeyValueEditorEntry {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly disabled?: boolean;
}

export interface KeyValueEditorProps {
  readonly entries: readonly KeyValueEditorEntry[];
  readonly onEntriesChange: (entries: KeyValueEditorEntry[]) => void;

  readonly keyLabel?: string;
  readonly valueLabel?: string;
  readonly keyPlaceholder?: string;
  readonly valuePlaceholder?: string;
  readonly addLabel?: string;
  readonly emptyLabel?: string;
  readonly disabled?: boolean;

  readonly 'aria-label': string;
  readonly 'data-testid'?: string;
}

function nextEntryId(entries: readonly KeyValueEditorEntry[]): string {
  const numeric = entries
    .map((entry) => Number.parseInt(entry.id.replace(/^entry-/u, ''), 10))
    .filter((value) => Number.isFinite(value));
  const next = numeric.length > 0 ? Math.max(...numeric) + 1 : entries.length + 1;
  return `entry-${next}`;
}

export function KeyValueEditor({
  entries,
  onEntriesChange,
  keyLabel = 'Key',
  valueLabel = 'Value',
  keyPlaceholder = 'KEY',
  valuePlaceholder = 'value',
  addLabel = 'Add row',
  emptyLabel = 'No values yet.',
  disabled = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: KeyValueEditorProps): ReactElement {
  const updateEntry = (
    id: string,
    field: 'key' | 'value',
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const nextValue = event.target.value;
    onEntriesChange(
      entries.map((entry) => (entry.id === id ? { ...entry, [field]: nextValue } : entry)),
    );
  };

  const addEntry = (): void => {
    onEntriesChange([...entries, { id: nextEntryId(entries), key: '', value: '' }]);
  };

  const removeEntry = (id: string): void => {
    onEntriesChange(entries.filter((entry) => entry.id !== id));
  };

  return (
    <fieldset className="ui-key-value-editor" data-testid={dataTestId}>
      <legend className="ui-key-value-editor__legend">{ariaLabel}</legend>
      <div aria-hidden="true" className="ui-key-value-editor__header">
        <span>{keyLabel}</span>
        <span>{valueLabel}</span>
        <span />
      </div>

      {entries.length > 0 ? (
        <div className="ui-key-value-editor__rows">
          {entries.map((entry, index) => {
            const rowDisabled = disabled || entry.disabled === true;
            return (
              <div className="ui-key-value-editor__row" key={entry.id}>
                <Input
                  aria-label={`${keyLabel} ${index + 1}`}
                  disabled={rowDisabled}
                  onChange={(event) => updateEntry(entry.id, 'key', event)}
                  placeholder={keyPlaceholder}
                  value={entry.key}
                />
                <Input
                  aria-label={`${valueLabel} ${index + 1}`}
                  disabled={rowDisabled}
                  onChange={(event) => updateEntry(entry.id, 'value', event)}
                  placeholder={valuePlaceholder}
                  value={entry.value}
                />
                <IconButton
                  aria-label={`Remove row ${index + 1}`}
                  disabled={rowDisabled}
                  onClick={() => removeEntry(entry.id)}
                  variant="ghost-danger"
                >
                  <Icon name="trash-2" />
                </IconButton>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="ui-key-value-editor__empty">{emptyLabel}</p>
      )}

      <Button
        className="ui-key-value-editor__add"
        disabled={disabled}
        onClick={addEntry}
        variant="secondary"
      >
        <Icon name="plus" />
        {addLabel}
      </Button>
    </fieldset>
  );
}
