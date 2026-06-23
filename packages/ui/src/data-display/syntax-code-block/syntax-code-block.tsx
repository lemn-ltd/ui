import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { type ReactElement, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { Icon, IconButton } from '../../primitives/index.js';
import { highlightCode, resolveLanguage } from './highlighter.js';
import './syntax-code-block.css';

export interface SyntaxCodeBlockProps {
  readonly value: string;
  readonly language?: string;
  readonly wrap?: boolean;
  readonly className?: string;
}

const COPIED_RESET_MS = 1600;

/**
 * Copyable multi-line code snippet with lazy syntax highlighting for common
 * programming and configuration languages.
 */
export function SyntaxCodeBlock({
  value,
  language,
  wrap = false,
  className,
}: SyntaxCodeBlockProps): ReactElement {
  const [highlighted, setHighlighted] = useState<ReactNode>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resolvedLanguage = language ? resolveLanguage(language) : null;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setHighlighted(null);
    if (!language || !resolvedLanguage) return;

    let cancelled = false;
    highlightCode(value, language)
      .then((hast) => {
        if (cancelled || !hast) return;
        // biome-ignore lint/style/useNamingConvention: Fragment/jsx/jsxs are required API names
        setHighlighted(toJsxRuntime(hast, { Fragment, jsx, jsxs }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [value, language, resolvedLanguage]);

  const handleCopy = useCallback(() => {
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [value]);

  return (
    <div
      className={['ui-syntax-code-block', className].filter(Boolean).join(' ')}
      data-language={language}
      data-copied={copied ? 'true' : 'false'}
      data-resolved-language={resolvedLanguage ?? undefined}
      data-wrap={wrap ? 'true' : 'false'}
    >
      <div className="ui-syntax-code-block__chrome">
        {language ? <span className="ui-syntax-code-block__language">{language}</span> : null}
        <IconButton
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="ui-syntax-code-block__copy"
          onClick={handleCopy}
          variant="ghost"
        >
          <Icon name={copied ? 'check' : 'copy'} size={12} />
        </IconButton>
      </div>
      <div className="ui-syntax-code-block__content">
        {highlighted ? (
          highlighted
        ) : (
          <pre>
            <code>{value}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
