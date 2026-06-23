import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { RelativeTime } from '../data-display/index.js';
import { Icon, IconButton } from '../primitives/index.js';

export interface MessageBubbleFooterProps {
  readonly copyText?: string;
  readonly createdAt?: string | number | Date;
  readonly now?: number;
}

const COPIED_RESET_MS = 1600;

export function MessageBubbleFooter({
  copyText,
  createdAt,
  now,
}: MessageBubbleFooterProps): ReactElement | null {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const canCopy = typeof copyText === 'string' && copyText.length > 0;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = useCallback(() => {
    if (!canCopy) return;
    void navigator.clipboard?.writeText(copyText);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [canCopy, copyText]);

  if (!canCopy && createdAt === undefined) return null;

  return (
    <footer className="ui-message-bubble__footer">
      {canCopy ? (
        <IconButton
          aria-label={copied ? 'Copied message' : 'Copy message'}
          className="ui-message-bubble__copy"
          onClick={handleCopy}
          variant="ghost"
        >
          <Icon name={copied ? 'check' : 'copy'} size={16} />
        </IconButton>
      ) : null}
      {createdAt !== undefined ? (
        <RelativeTime className="ui-message-bubble__time" now={now} value={createdAt} />
      ) : null}
    </footer>
  );
}
