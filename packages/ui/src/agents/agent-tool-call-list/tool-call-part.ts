/** Lifecycle status of a single agent tool call, aligned to the public tool-part contract. */
export type AgentToolCallStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'interrupted'
  | 'confirming'
  | 'denied';

export type AgentExecutionLadderStage = 'workspace' | 'isolate' | 'npm' | 'browser' | 'sandbox';

export type AgentExecutionPolicyDecision = 'allowed' | 'requires_approval' | 'denied';

export interface AgentToolExecutionInfo {
  readonly requestedStage: AgentExecutionLadderStage;
  readonly minimumStage: AgentExecutionLadderStage;
  readonly selectedStage: AgentExecutionLadderStage;
  readonly adapterKind?: string;
  readonly providerKind?: string;
  readonly environmentRef?: string;
  readonly escalated: boolean;
  readonly policyDecision: AgentExecutionPolicyDecision;
  readonly reason?: string;
}

/** A normalized block from a tool output envelope's `content[]`. */
export type ToolOutputBlock =
  | {
      readonly kind: 'text';
      readonly text: string;
      readonly truncation?: { readonly strategy: string; readonly maxLines: number };
    }
  | { readonly kind: 'json'; readonly value: unknown }
  | { readonly kind: 'image'; readonly mimeType: string; readonly ref: string };

/** A single agent tool call, normalized from a UIMessage tool part or a public tool-part event. */
export interface AgentToolCallPart {
  readonly id: string;
  readonly name: string;
  readonly status: AgentToolCallStatus;

  readonly title?: string;
  readonly time?: { readonly start?: number; readonly end?: number };

  readonly input?: unknown;
  readonly output?: readonly ToolOutputBlock[];
  readonly errorText?: string;
  readonly rule?: string;
  readonly reason?: string;
  readonly execution?: AgentToolExecutionInfo;
}
