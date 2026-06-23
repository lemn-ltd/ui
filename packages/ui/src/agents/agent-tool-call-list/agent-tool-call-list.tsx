import { type HTMLAttributes, type ReactElement, useState } from 'react';
import { Icon } from '../../primitives/index.js';
import { AgentToolCallCard } from './agent-tool-call-card.js';
import type { AgentToolCallPart } from './tool-call-part.js';
import './agent-tool-call-list.css';

export interface AgentToolCallListProps extends HTMLAttributes<HTMLDivElement> {
  readonly toolCalls: readonly AgentToolCallPart[];
  readonly defaultOpen?: boolean;
}

export function AgentToolCallList({
  toolCalls,
  defaultOpen = true,
  className,
  ...rest
}: AgentToolCallListProps): ReactElement | null {
  const [open, setOpen] = useState(defaultOpen);

  if (toolCalls.length === 0) return null;

  const lastIndex = toolCalls.length - 1;
  const summary = buildSummary(toolCalls);

  return (
    <div className={['ui-agent-tool-call-list', className].filter(Boolean).join(' ')} {...rest}>
      <button
        aria-expanded={open}
        className="ui-agent-tool-call-list__header"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <Icon className="ui-agent-tool-call-list__chevron" name="chevron-down" size={16} />
        <span className="ui-agent-tool-call-list__count">
          {toolCalls.length} {toolCalls.length === 1 ? 'tool call' : 'tool calls'}
        </span>
        {summary ? <span className="ui-agent-tool-call-list__summary">· {summary}</span> : null}
      </button>

      {open ? (
        <div className="ui-agent-tool-call-list__rows">
          {toolCalls.map((toolCall, index) => (
            <AgentToolCallCard
              defaultOpen={toolCall.status === 'running' || index === lastIndex}
              key={toolCall.id}
              toolCall={toolCall}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Summarizes the states that draw attention: in-flight, failed, and awaiting review.
function buildSummary(toolCalls: readonly AgentToolCallPart[]): string | null {
  let running = 0;
  let error = 0;
  let confirming = 0;
  for (const toolCall of toolCalls) {
    if (toolCall.status === 'running') running += 1;
    else if (toolCall.status === 'error') error += 1;
    else if (toolCall.status === 'confirming') confirming += 1;
  }

  const segments: string[] = [];
  if (running > 0) segments.push(`${running} running`);
  if (error > 0) segments.push(`${error} error`);
  if (confirming > 0) segments.push(`${confirming} needs review`);
  return segments.length > 0 ? segments.join(' · ') : null;
}
