import type {
  ExecutionMapEdge,
  ExecutionMapEntity,
  ExecutionMapEntityKind,
  ExecutionMapEvent,
} from '../types.js';
import { executionMapLaneForKind } from './execution-map-identity.js';
import {
  DEFAULT_EXECUTION_MAP_EVENT_DISPLAY,
  type ExecutionMapEventDisplay,
  type ExecutionMapEventDisplayKind,
  executionMapEventVocabulary,
} from './execution-map-model-types.js';

export function executionMapEntityTitle(entity: ExecutionMapEntity): string {
  const summary = entity.summary;
  if (typeof summary.displayName === 'string') return summary.displayName;
  if (typeof summary.eventType === 'string') return summary.eventType;
  if (typeof summary.label === 'string') return summary.label;
  if (typeof summary.toolName === 'string') return summary.toolName;
  if (typeof summary.name === 'string') return summary.name;
  return entity.entityKind;
}

export function executionMapEntitySubtitle(entity: ExecutionMapEntity): string {
  const summary = entity.summary;
  if (typeof summary.agentDefinitionId === 'string') return summary.agentDefinitionId;
  if (typeof summary.channel === 'string') return summary.channel;
  if (typeof summary.model === 'string') return summary.model;
  if (typeof summary.result === 'string') return summary.result;
  if (typeof summary.toolName === 'string') return summary.toolName;
  if (typeof summary.delegatedTo === 'string') return `delegated to ${summary.delegatedTo}`;
  return entity.updatedAt ?? entity.occurredAt ?? 'contract entity';
}

export function executionMapEntityIcon(kind: ExecutionMapEntityKind): string {
  switch (kind) {
    case 'agent_instance':
      return 'AI';
    case 'runtime_input':
      return 'IN';
    case 'agent_communication':
      return 'AC';
    case 'runtime_run':
      return 'WK';
    case 'attempt':
      return 'AT';
    case 'child_run':
      return 'CH';
    case 'attempt_result':
      return 'OK';
    case 'turn':
      return 'TR';
    case 'inference_run':
      return 'LLM';
    case 'tool_call':
    case 'tool_call_execution':
      return 'TOOL';
    case 'hitl_request':
      return 'HITL';
    case 'runtime_event':
      return 'EV';
    case 'usage_summary':
      return 'USG';
    default:
      return 'RT';
  }
}

export function executionMapEventDisplay(event: ExecutionMapEvent): ExecutionMapEventDisplay {
  const eventType = event.eventType.toLowerCase();
  if (
    eventType.includes('error') ||
    eventType.includes('failed') ||
    eventType.includes('failure') ||
    eventType.includes('cancelled')
  ) {
    return executionMapEventDisplayForKind('error');
  }
  if (eventType.includes('delegation') || eventType.includes('delegated')) {
    return executionMapEventDisplayForKind('delegation');
  }
  if (eventType.includes('hitl')) return executionMapEventDisplayForKind('hitl');
  if (eventType.includes('tool')) return executionMapEventDisplayForKind('tool');
  if (eventType.includes('child_run') || eventType.includes('fiber')) {
    return executionMapEventDisplayForKind('delegation');
  }
  if (eventType.includes('inference')) return executionMapEventDisplayForKind('inference');
  if (eventType.includes('attempt')) return executionMapEventDisplayForKind('attempt');
  if (eventType.includes('runtime_run')) return executionMapEventDisplayForKind('work');
  if (eventType.includes('input')) return executionMapEventDisplayForKind('input');
  if (eventType.includes('usage')) return executionMapEventDisplayForKind('usage');
  if (eventType.includes('completed')) return executionMapEventDisplayForKind('completed');
  return executionMapEventDisplayForKind('event');
}

function executionMapEventDisplayForKind(
  kind: ExecutionMapEventDisplayKind,
): ExecutionMapEventDisplay {
  return (
    executionMapEventVocabulary.find((candidate) => candidate.kind === kind) ??
    DEFAULT_EXECUTION_MAP_EVENT_DISPLAY
  );
}

export function executionMapEdgeColor(kind: ExecutionMapEdge['edgeKind']): string {
  switch (kind) {
    case 'delegates':
      return 'var(--ui-color-success-500, #22c55e)';
    case 'requests':
      return 'var(--ui-color-warning-500, #f59e0b)';
    case 'executes':
      return 'var(--ui-color-accent-500, #a78bfa)';
    case 'produces':
      return 'var(--ui-color-info-500, #60a5fa)';
    case 'emits':
      return 'var(--ui-color-danger-500, #fb7185)';
    case 'replies_to':
      return '#38bdf8';
    case 'summarizes':
      return 'var(--ui-color-text-muted, #94a3b8)';
    default:
      return 'var(--ui-color-text-subtle, #64748b)';
  }
}

export function executionMapNodeColor(kind: unknown): string {
  switch (kind) {
    case 'agent_instance':
      return '#2dd4bf';
    case 'runtime_input':
    case 'agent_communication':
      return '#fbbf24';
    case 'attempt':
    case 'child_run':
    case 'turn':
    case 'attempt_result':
      return '#60a5fa';
    case 'inference_run':
    case 'tool_call':
    case 'tool_call_execution':
      return '#a78bfa';
    case 'hitl_request':
      return '#fb7185';
    case 'runtime_event':
    case 'usage_summary':
      return '#f59e0b';
    default:
      return '#64748b';
  }
}

export function executionMapIsEvidenceEntity(entity: ExecutionMapEntity): boolean {
  return entity.entityKind === 'runtime_event' || entity.entityKind === 'usage_summary';
}

export function executionMapEdgeBundleIndex(edges: readonly ExecutionMapEdge[]) {
  const counts = new Map<string, number>();
  const firstEdgeIds = new Map<string, string>();
  for (const edge of edges) {
    const key = executionMapEdgeLanePairKey(edge);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!firstEdgeIds.has(key)) firstEdgeIds.set(key, edge.edgeId);
  }
  return { counts, firstEdgeIds };
}

export function executionMapEdgeLanePairKey(edge: ExecutionMapEdge): string {
  return `${executionMapLaneForKind(edge.from.entityKind).id}->${executionMapLaneForKind(edge.to.entityKind).id}`;
}

export function executionMapEdgeLabel(
  edge: ExecutionMapEdge,
  bundleCount: number,
  firstBundledEdge: boolean,
  active: boolean,
): string | undefined {
  if (active || bundleCount === 1) return `${edge.edgeKind} ->`;
  if (!firstBundledEdge) return undefined;
  const fromLane = executionMapLaneForKind(edge.from.entityKind).name;
  const toLane = executionMapLaneForKind(edge.to.entityKind).name;
  return `${fromLane} -> ${toLane} (${bundleCount})`;
}
