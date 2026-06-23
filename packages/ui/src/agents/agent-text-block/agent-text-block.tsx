import type { HTMLAttributes, ReactElement } from 'react';
import { Markdown } from '../../data-display/index.js';
import type { AgentMessageContentPart } from '../agent-message-content-part.js';
import './agent-text-block.css';

export interface AgentTextBlockProps extends HTMLAttributes<HTMLDivElement> {
  readonly entries: readonly AgentMessageContentPart[];
  readonly visible?: boolean;
}

export function AgentTextBlock({
  entries,
  visible = true,
  className,
  ...rest
}: AgentTextBlockProps): ReactElement | null {
  const renderedEntries = entries.filter((entry) => entry.text.trim().length > 0);

  if (!visible || renderedEntries.length === 0) return null;

  const state = renderedEntries.some((entry) => entry.state === 'streaming') ? 'streaming' : 'done';

  return (
    <div
      className={['ui-agent-text-block', className].filter(Boolean).join(' ')}
      data-agent-text-state={state}
      {...rest}
    >
      {renderedEntries.map((entry) => (
        <Markdown className="ui-agent-text-block__entry" content={entry.text} key={entry.id} />
      ))}
    </div>
  );
}
