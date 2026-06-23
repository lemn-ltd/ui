import { Children, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { AgentTextBlock } from '../agent-text-block/agent-text-block.js';
import { MessageBubbleFooter } from '../message-bubble-footer.js';
import './agent-message-bubble.css';

export interface AgentMessageBubbleProps extends HTMLAttributes<HTMLElement> {
  readonly content: string;
  readonly children?: ReactNode;
  readonly copyText?: string;
  readonly createdAt?: string | number | Date;
  readonly now?: number;
}

export function AgentMessageBubble({
  content,
  children,
  copyText = content,
  createdAt,
  now,
  className,
  ...rest
}: AgentMessageBubbleProps): ReactElement {
  const hasChildren = Children.count(children) > 0;

  return (
    <article
      className={['ui-agent-message-bubble', className].filter(Boolean).join(' ')}
      data-message-role="agent"
      {...rest}
    >
      {content ? (
        <AgentTextBlock
          className="ui-agent-message-bubble__content"
          entries={[{ id: 'content', state: 'done', text: content }]}
        />
      ) : null}
      {hasChildren ? <div className="ui-agent-message-bubble__body">{children}</div> : null}
      <MessageBubbleFooter copyText={copyText} createdAt={createdAt} now={now} />
    </article>
  );
}
