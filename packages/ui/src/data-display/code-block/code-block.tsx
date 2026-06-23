import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Icon, IconButton } from '../../primitives/index.js';
import './code-block.css';

export type CodeBlockVariant = 'command' | 'token' | 'inline';

export interface CodeBlockProps {
  readonly value: string;
  readonly variant?: CodeBlockVariant;
  readonly label?: string;
  readonly className?: string;
}

const COPIED_RESET_MS = 1600;

/**
 * Monospace value with a copy control that swaps `copy` → `check` while a copy is fresh.
 *
 * The `inline` variant drops chrome and inherits surrounding text so ids in
 * dense rows keep their natural height.
 */
export function CodeBlock({
  value,
  variant = 'command',
  label,
  className,
}: CodeBlockProps): ReactElement {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = useCallback(() => {
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [value]);

  return (
    <div className={['ui-code-block', className].filter(Boolean).join(' ')} data-variant={variant}>
      {label ? <span className="ui-code-block__label">{label}</span> : null}
      <div className="ui-code-block__row" data-copied={copied ? 'true' : 'false'}>
        <code className="ui-code-block__value">{value}</code>
        <IconButton
          aria-label={copied ? 'Copied' : 'Copy'}
          className="ui-code-block__copy"
          onClick={handleCopy}
        >
          <Icon name={copied ? 'check' : 'copy'} size={variant === 'inline' ? 14 : 16} />
        </IconButton>
      </div>
    </div>
  );
}
