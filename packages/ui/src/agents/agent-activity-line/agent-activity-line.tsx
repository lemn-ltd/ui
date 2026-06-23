import { Brain } from 'lucide-react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Badge } from '../../primitives/index.js';
import './agent-activity-line.css';

export const AGENT_ACTIVITY_LINE_STATES = [
  'connecting',
  'reconnecting',
  'disconnected',
  'idle',
  'working',
  'confirming',
  'reactivating',
  'cancelling',
  'cancelled',
] as const;

export type AgentActivityLineState = (typeof AGENT_ACTIVITY_LINE_STATES)[number];

export type AgentActivityLineTone = 'muted' | 'accent' | 'info' | 'warn' | 'danger' | 'success';

export interface AgentActivityLineProps extends HTMLAttributes<HTMLDivElement> {
  readonly state: AgentActivityLineState;
  readonly agentName?: string;
  readonly statusText?: string;
  readonly tone?: AgentActivityLineTone;
  readonly pulse?: boolean;
  readonly visual?: ReactNode;
  readonly toolName?: string;
}

const DEFAULT_STATUS_TEXT: Record<AgentActivityLineState, string> = {
  connecting: 'is connecting...',
  reconnecting: 'is reconnecting...',
  disconnected: 'is disconnected',
  idle: 'is idle',
  working: 'is working...',
  confirming: 'is waiting for confirmation',
  reactivating: 'is reactivating the sandbox...',
  cancelling: 'is cancelling run...',
  cancelled: 'cancelled run',
};

const STATE_TONE: Record<AgentActivityLineState, AgentActivityLineTone> = {
  connecting: 'info',
  reconnecting: 'warn',
  disconnected: 'danger',
  idle: 'muted',
  working: 'muted',
  confirming: 'warn',
  reactivating: 'warn',
  cancelling: 'info',
  cancelled: 'danger',
};

export function AgentActivityLine({
  state,
  agentName,
  statusText = DEFAULT_STATUS_TEXT[state],
  tone = STATE_TONE[state],
  pulse = false,
  visual,
  toolName,
  className,
  ...rest
}: AgentActivityLineProps): ReactElement {
  return (
    <div
      className={['ui-agent-activity-line', className].filter(Boolean).join(' ')}
      data-pulse={pulse ? 'true' : 'false'}
      data-state={state}
      data-tone={tone}
      {...rest}
    >
      <span className="ui-agent-activity-line__visual">
        {visual ?? <Brain aria-hidden="true" size={16} strokeWidth={2} />}
      </span>
      {agentName ? <span className="ui-agent-activity-line__name">{agentName}</span> : null}
      <span className="ui-agent-activity-line__action">{statusText}</span>
      {toolName ? (
        <Badge className="ui-agent-activity-line__tool" tone="info" variant="soft">
          {toolName}
        </Badge>
      ) : null}
    </div>
  );
}
