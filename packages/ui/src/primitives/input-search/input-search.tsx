import {
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Icon } from '../icon/icon.js';
import './input-search.css';

export interface InputSearchProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly placeholder?: string;
  readonly 'aria-label': string;
  readonly className?: string;
}

export function InputSearch({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  className,
}: InputSearchProps): ReactElement {
  const [expanded, setExpanded] = useState(() => value.length > 0);
  const rootRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value.length > 0 && !expanded) setExpanded(true);
  }, [value, expanded]);

  // Collapse on an outside pointer press while expanded and empty; a started
  // search keeps its query, so a non-empty field stays open.
  useEffect(() => {
    if (!expanded || value.length > 0) return;
    function onPointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded, value]);

  const open = useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    if (value.length > 0) onChange('');
    setExpanded(false);
    triggerRef.current?.focus();
  }, [onChange, value]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') close();
    },
    [close],
  );

  return (
    <span
      className={['ui-input-search', className].filter(Boolean).join(' ')}
      data-expanded={expanded ? 'expanded' : 'collapsed'}
      ref={rootRef}
    >
      <button
        aria-label={ariaLabel}
        className="ui-input-search__trigger"
        onClick={open}
        ref={triggerRef}
        type="button"
      >
        <Icon name="search" size={16} />
      </button>
      <input
        aria-label={ariaLabel}
        className="ui-input-search__input"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        type="search"
        value={value}
      />
      {value.length > 0 ? (
        <button
          aria-label="Clear search"
          className="ui-input-search__clear"
          onClick={close}
          type="button"
        >
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </span>
  );
}
