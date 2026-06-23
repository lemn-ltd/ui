export type AgentMessagePartState = 'streaming' | 'done';

export interface AgentMessageContentPart {
  readonly id: string;
  readonly text: string;
  readonly state?: AgentMessagePartState;
}
