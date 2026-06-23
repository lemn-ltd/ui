import { type CSSProperties, type ReactElement, useState } from 'react';
import { Markdown } from '../../data-display/markdown/markdown.js';
import { Icon } from '../../primitives/icon/icon.js';
import { Textarea } from '../../primitives/textarea/textarea.js';
import './markdown-editor.css';

export type MarkdownEditorMode = 'write' | 'preview';

export interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;

  readonly mode?: MarkdownEditorMode;
  readonly onModeChange?: (mode: MarkdownEditorMode) => void;
  readonly placeholder?: string;
  readonly minRows?: number;
  readonly disabled?: boolean;

  readonly 'aria-label': string;
  readonly 'data-testid'?: string;
}

const MIN_BLOCK_SIZE_PX = 14 * 16;
const TEXTAREA_ROW_HEIGHT_PX = 13 * 1.43;
const TEXTAREA_VERTICAL_CHROME_PX = 12 * 2 + 2;

function blockSizeForRows(rows: number): string {
  const normalizedRows = Number.isFinite(rows) && rows > 0 ? rows : 8;
  const rowSize = normalizedRows * TEXTAREA_ROW_HEIGHT_PX + TEXTAREA_VERTICAL_CHROME_PX;
  return `${Math.ceil(Math.max(MIN_BLOCK_SIZE_PX, rowSize))}px`;
}

/**
 * Markdown input with a single corner mode toggle: write shows the textarea,
 * preview renders the same value through the canonical `Markdown` component.
 * The accent icon button floats in the top-right corner — eye to preview,
 * pencil to return to writing.
 */
export function MarkdownEditor({
  value,
  onChange,
  mode,
  onModeChange,
  placeholder = 'Write Markdown...',
  minRows = 8,
  disabled = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: MarkdownEditorProps): ReactElement {
  const [uncontrolledMode, setUncontrolledMode] = useState<MarkdownEditorMode>('write');
  const activeMode = mode ?? uncontrolledMode;
  const writing = activeMode === 'write';
  const style = {
    '--ui-markdown-editor-block-size': blockSizeForRows(minRows),
  } as CSSProperties;

  const setMode = (next: MarkdownEditorMode): void => {
    onModeChange?.(next);
    if (mode === undefined) setUncontrolledMode(next);
  };

  return (
    <div
      className="ui-markdown-editor"
      data-mode={activeMode}
      data-testid={dataTestId}
      style={style}
    >
      <button
        aria-label={writing ? 'Preview Markdown' : 'Edit Markdown'}
        className="ui-markdown-editor__toggle"
        disabled={disabled}
        onClick={() => setMode(writing ? 'preview' : 'write')}
        type="button"
      >
        <Icon name={writing ? 'eye' : 'pencil'} size={14} />
      </button>
      {writing ? (
        <Textarea
          aria-label={ariaLabel}
          className="ui-markdown-editor__textarea"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={minRows}
          value={value}
        />
      ) : (
        <section aria-label="Markdown preview" className="ui-markdown-editor__preview">
          {value.trim() === '' ? (
            <p className="ui-markdown-editor__empty">Nothing to preview.</p>
          ) : (
            <Markdown content={value} />
          )}
        </section>
      )}
    </div>
  );
}
