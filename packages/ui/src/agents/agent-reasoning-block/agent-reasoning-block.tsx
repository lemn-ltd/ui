import type { HTMLAttributes, ReactElement } from 'react';
import { Markdown } from '../../data-display/index.js';
import { Accordion } from '../../forms/index.js';
import type { AgentMessageContentPart } from '../agent-message-content-part.js';
import './agent-reasoning-block.css';

export interface AgentReasoningBlockProps extends HTMLAttributes<HTMLDivElement> {
  readonly entries: readonly AgentMessageContentPart[];
  readonly defaultOpen?: boolean;
  readonly durationMs?: number;
}

export function AgentReasoningBlock({
  entries,
  defaultOpen,
  durationMs,
  className,
  ...rest
}: AgentReasoningBlockProps): ReactElement | null {
  const renderedEntries = entries.filter((entry) => entry.text.trim().length > 0);
  const isStreaming = renderedEntries.some((entry) => entry.state === 'streaming');
  const shouldOpen = defaultOpen ?? isStreaming;
  const resolvedDurationMs = validDurationMs(durationMs);
  const label = isStreaming ? 'Thinking' : completedLabel(resolvedDurationMs);

  if (renderedEntries.length === 0) return null;

  return (
    <div
      className={['ui-agent-reasoning-block', className].filter(Boolean).join(' ')}
      data-agent-reasoning-state={isStreaming ? 'streaming' : 'done'}
      {...rest}
    >
      <Accordion
        className="ui-agent-reasoning-block__accordion"
        defaultValue={shouldOpen ? 'thinking' : undefined}
        items={[
          {
            value: 'thinking',
            label,
            content: (
              <div className="ui-agent-reasoning-block__body">
                {renderedEntries.map((entry) => (
                  <Markdown
                    className="ui-agent-reasoning-block__entry"
                    content={entry.text}
                    key={entry.id}
                  />
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function completedLabel(durationMs: number | undefined): string {
  if (durationMs === undefined) return 'Thought';
  return `Thought for ${formatReasoningDuration(durationMs)}`;
}

function validDurationMs(durationMs: number | undefined): number | undefined {
  return typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs >= 0
    ? durationMs
    : undefined;
}

function formatReasoningDuration(durationMs: number): string {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}
