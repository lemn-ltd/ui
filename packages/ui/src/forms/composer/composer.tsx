import {
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import { Icon } from '../../primitives/icon/icon.js';
import { IconButton } from '../../primitives/icon-button/icon-button.js';
import { Textarea } from '../../primitives/textarea/textarea.js';
import './composer.css';

/** The composer's interaction status, which drives its action and editability. */
export type ComposerStatus = 'idle' | 'streaming' | 'disabled';

export type ComposerWidth = 'fill' | 'content';

export interface ComposerProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onSubmit: (value: string) => void;
  readonly onStop?: () => void;

  readonly status?: ComposerStatus;

  readonly placeholder?: string;
  readonly maxRows?: number;
  readonly autoFocus?: boolean;
  readonly width?: ComposerWidth;

  readonly leadingSlot?: ReactNode;
  readonly footerSlot?: ReactNode;

  readonly 'aria-label': string;
  readonly 'data-testid'?: string;
  readonly sendButtonTestId?: string;
  readonly stopButtonTestId?: string;
}

/**
 * The chat/agent message input: a compact auto-grow composer with a lower
 * action that shows Send while idle and Stop while streaming. Layout-neutral —
 * the parent places it as the session composer or the home prompt box.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  status = 'idle',
  placeholder = 'What would you like to do?',
  maxRows = 8,
  autoFocus,
  width = 'fill',
  leadingSlot,
  footerSlot,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  sendButtonTestId,
  stopButtonTestId,
}: ComposerProps): ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = status === 'disabled';
  const isStreaming = status === 'streaming';
  const canSubmit = !isDisabled && !isStreaming && value.trim() !== '';

  // Auto-grow: reset to content height, then cap at maxRows and hand off to
  // the textarea's own scroll once the cap is reached.
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const styles = window.getComputedStyle(el);
    const px = (value: string): number => Number.parseFloat(value) || 0;
    const lineHeight = px(styles.lineHeight);
    const paddingY = px(styles.paddingTop) + px(styles.paddingBottom);
    const borderY = px(styles.borderTopWidth) + px(styles.borderBottomWidth);
    const maxHeight = lineHeight * maxRows + paddingY + borderY;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [maxRows]);

  useLayoutEffect(() => {
    resize();
  }, [resize, value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const submit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(value);
  }, [canSubmit, onSubmit, value]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter') return;
      // Shift+Enter inserts a newline; IME composition Enter commits a candidate.
      if (event.shiftKey || event.nativeEvent.isComposing) return;
      event.preventDefault();
      submit();
    },
    [submit],
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: a chat composer is a labelled region, not a form landmark.
    <div
      aria-busy={isStreaming || undefined}
      className="ui-composer"
      data-can-submit={canSubmit ? 'true' : 'false'}
      data-has-leading={leadingSlot ? 'true' : 'false'}
      data-status={status}
      data-width={width}
      role="group"
    >
      {leadingSlot ? <div className="ui-composer__leading">{leadingSlot}</div> : null}

      <Textarea
        aria-label={ariaLabel}
        className="ui-composer__textarea"
        data-testid={dataTestId}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={value}
      />

      <div className="ui-composer__actions">
        {footerSlot ? <div className="ui-composer__footer">{footerSlot}</div> : null}

        {isStreaming ? (
          <IconButton
            aria-label="Stop"
            data-testid={stopButtonTestId}
            disabled={isDisabled}
            onClick={() => onStop?.()}
            variant="ghost-danger"
          >
            <Icon name="square" />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Send"
            data-testid={sendButtonTestId}
            disabled={!canSubmit}
            onClick={submit}
            variant="primary"
          >
            <Icon name="corner-down-left" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
