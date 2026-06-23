import { type KeyboardEvent, type ReactElement, useState } from 'react';
import { Spinner } from '../../feedback/index.js';
import { Icon, IconButton, Input, InputSelect } from '../../primitives/index.js';
import './inline-edit.css';

export interface InlineEditTestIds {
  readonly display?: string;
  readonly edit?: string;
  readonly input?: string;
  readonly save?: string;
  readonly cancel?: string;
}

export interface InlineEditOption {
  readonly value: string;
  readonly label: string;
}

interface InlineEditBaseProps {
  /** The current persisted value, serialized as a string. */
  readonly value: string;
  /** The value shown while not editing. */
  readonly displayValue: string;
  readonly onSave: (value: string) => Promise<void>;
  readonly disabled?: boolean;
  readonly editLabel?: string;
  readonly testIds?: InlineEditTestIds;
}

export interface InlineEditNumberProps extends InlineEditBaseProps {
  readonly kind: 'number';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly inputMode?: 'numeric' | 'decimal';
  readonly placeholder?: string;
}

export interface InlineEditSelectProps extends InlineEditBaseProps {
  readonly kind: 'select';
  readonly options: readonly InlineEditOption[];
}

export interface InlineEditTextProps extends InlineEditBaseProps {
  readonly kind: 'text';
  readonly placeholder?: string;
  readonly maxLength?: number;
}

export type InlineEditProps = InlineEditTextProps | InlineEditNumberProps | InlineEditSelectProps;

/**
 * Edit-in-place control: shows a value with an edit affordance, swaps to a text or
 * number input or a single-selection list on edit, and commits through `onSave`.
 * One reusable widget for editable rows — replaces per-app inline-edit duplication.
 */
export function InlineEdit(props: InlineEditProps): ReactElement {
  const { value, displayValue, onSave, disabled = false, editLabel = 'Edit', testIds } = props;
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function edit(): void {
    setDraft(value);
    setIsEditing(true);
  }

  function cancel(): void {
    setDraft(value);
    setIsEditing(false);
  }

  async function save(): Promise<void> {
    if (draft === value) {
      cancel();
      return;
    }
    setIsSaving(true);
    try {
      await onSave(draft);
      setIsEditing(false);
    } catch {
      setDraft(value);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') void save();
    if (event.key === 'Escape') cancel();
  }

  if (isEditing) {
    return (
      <div className="ui-inline-edit" data-editing="true">
        {props.kind === 'select' ? (
          <InputSelect
            aria-label={editLabel}
            className="ui-inline-edit__select"
            disabled={isSaving}
            id={testIds?.input}
            onValueChange={setDraft}
            options={props.options}
            value={draft}
          />
        ) : props.kind === 'number' ? (
          <Input
            autoFocus
            className="ui-inline-edit__input"
            data-testid={testIds?.input}
            disabled={isSaving}
            inputMode={props.inputMode ?? 'numeric'}
            max={props.max}
            min={props.min}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={props.placeholder}
            step={props.step}
            type="number"
            value={draft}
          />
        ) : (
          <Input
            autoFocus
            className="ui-inline-edit__input"
            data-testid={testIds?.input}
            disabled={isSaving}
            maxLength={props.maxLength}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={props.placeholder}
            type="text"
            value={draft}
          />
        )}
        <IconButton
          aria-label="Save setting"
          data-testid={testIds?.save}
          disabled={isSaving}
          onClick={() => void save()}
          variant="ghost"
        >
          {isSaving ? <Spinner size="sm" /> : <Icon name="check" size={16} />}
        </IconButton>
        <IconButton
          aria-label="Cancel setting edit"
          data-testid={testIds?.cancel}
          disabled={isSaving}
          onClick={cancel}
          variant="ghost"
        >
          <Icon name="x" size={16} />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="ui-inline-edit">
      <span className="ui-inline-edit__value" data-testid={testIds?.display}>
        {displayValue}
      </span>
      {disabled ? null : (
        <IconButton
          aria-label={editLabel}
          data-testid={testIds?.edit}
          onClick={edit}
          variant="ghost"
        >
          <Icon name="pencil" size={16} />
        </IconButton>
      )}
    </div>
  );
}
