import type { HTMLAttributes, ReactElement } from 'react';
import { MessageBubbleFooter } from '../message-bubble-footer.js';
import './user-message-bubble.css';

export interface UserMessageBubbleProps extends HTMLAttributes<HTMLDivElement> {
  readonly content: string;
  readonly copyText?: string;
  readonly createdAt?: string | number | Date;
  readonly now?: number;
}

export function UserMessageBubble({
  content,
  copyText = content,
  createdAt,
  now,
  className,
  ...rest
}: UserMessageBubbleProps): ReactElement {
  return (
    <div
      className={['ui-user-message-bubble', className].filter(Boolean).join(' ')}
      data-message-role="user"
      {...rest}
    >
      <article className="ui-user-message-bubble__surface">
        <p className="ui-user-message-bubble__content">{content}</p>
      </article>
      <MessageBubbleFooter copyText={copyText} createdAt={createdAt} now={now} />
    </div>
  );
}
