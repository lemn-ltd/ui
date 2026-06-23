export type ExecutionMapEntityKind =
  | 'runtime_session'
  | 'agent_instance'
  | 'runtime_input'
  | 'agent_communication'
  | 'runtime_run'
  | 'attempt'
  | 'child_run'
  | 'attempt_result'
  | 'turn'
  | 'inference_run'
  | 'tool_call'
  | 'tool_call_execution'
  | 'hitl_request'
  | 'runtime_event'
  | 'usage_summary';

export type ExecutionMapEntityStatus =
  | 'pending'
  | 'active'
  | 'running'
  | 'completed'
  | 'blocked'
  | 'failed'
  | 'cancelled'
  | 'closed'
  | 'unknown';

export type ExecutionMapEdgeKind =
  | 'owns'
  | 'delegates'
  | 'materializes'
  | 'schedules'
  | 'attempts'
  | 'contains'
  | 'emits'
  | 'requests'
  | 'executes'
  | 'produces'
  | 'replies_to'
  | 'summarizes';

export interface ExecutionMapEntityRef {
  readonly entityKind: ExecutionMapEntityKind;
  readonly entityId: string;
}

export interface ExecutionMapEntity {
  readonly entityKind: ExecutionMapEntityKind;
  readonly entityId: string;
  readonly runtimeSessionId: string;

  readonly agentInstanceId: string | null;
  readonly attemptId: string | null;
  readonly parentEntityRef: ExecutionMapEntityRef | null;

  readonly status: ExecutionMapEntityStatus;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly occurredAt: string | null;

  readonly redaction?: unknown;

  readonly summary: Readonly<Record<string, unknown>>;
  readonly detail: Readonly<Record<string, unknown>> | null;
}

export interface ExecutionMapEdge {
  readonly edgeId: string;
  readonly edgeKind: ExecutionMapEdgeKind;
  readonly from: ExecutionMapEntityRef;
  readonly to: ExecutionMapEntityRef;

  readonly label: string | null;
  readonly createdAt: string | null;

  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ExecutionMapEvent {
  readonly eventId: string;
  readonly eventFamily: string;
  readonly eventType: string;
  readonly schemaVersion: number;
  readonly occurredAt: string;

  readonly trace?: unknown;
  readonly scope: {
    readonly runtimeSessionId?: string;
    readonly agentInstanceId?: string | null;
    readonly attemptId?: string | null;
    readonly rootAttemptId?: string | null;
    readonly [key: string]: unknown;
  };

  readonly persistence: {
    readonly eventSeq: number | string;
    readonly [key: string]: unknown;
  };

  readonly redaction?: unknown;
  readonly payload: unknown;
}

export interface ExecutionMapSummary {
  readonly runtimeSessionId: string;
  readonly status?: string;
  readonly rootAgentInstanceId?: string | null;
  readonly rootAgentDefinitionId?: string | null;
  readonly rootAgentDefinitionVersionNumber?: number | null;
  readonly sourceRef?: unknown;
  readonly [key: string]: unknown;
}

export interface ExecutionMapCounters {
  readonly entityCount: number;
  readonly edgeCount: number;
  readonly eventCount: number;
  readonly anomalyCount?: number;
  readonly byEntityKind?: Partial<Record<ExecutionMapEntityKind, number>>;
}

export interface ExecutionMapGraph {
  readonly runtimeSessionId: string;
  readonly generatedAt: string;

  readonly summary?: ExecutionMapSummary;
  readonly counters: ExecutionMapCounters;
  readonly nodes: readonly ExecutionMapEntity[];
  readonly edges: readonly ExecutionMapEdge[];
  readonly latestEvents: readonly ExecutionMapEvent[];
  readonly anomalies?: readonly unknown[];
}

export type ExecutionMapFocusMode = 'focus' | 'lineage' | 'causal' | 'all';
export type ExecutionMapDensity = 'comfortable' | 'compact';
export type ExecutionMapEvidenceMode = 'collapsed' | 'expanded';
export type ExecutionMapTimelineScope = 'focus' | 'all';

export type ExecutionMapSelection =
  | { readonly kind: 'node'; readonly key: string }
  | { readonly kind: 'edge'; readonly key: string }
  | { readonly kind: 'event'; readonly key: string };

export interface ExecutionMapProps {
  readonly graph: ExecutionMapGraph | null;
  readonly events?: readonly ExecutionMapEvent[];
  readonly entityEvents?: Readonly<Record<string, readonly ExecutionMapEvent[]>>;

  readonly selectedEntityRef?: ExecutionMapEntityRef | null;
  readonly selectedEdgeId?: string | null;
  readonly selectedEventId?: string | null;

  readonly title?: string;
  readonly subtitle?: string;
  readonly className?: string;
  readonly refreshLabel?: string;
  readonly refreshing?: boolean;

  readonly onRefresh?: () => void;
  readonly onSelectEntity?: (ref: ExecutionMapEntityRef) => void;
  readonly onSelectEdge?: (edge: ExecutionMapEdge) => void;
  readonly onSelectEvent?: (eventId: string) => void;
}
