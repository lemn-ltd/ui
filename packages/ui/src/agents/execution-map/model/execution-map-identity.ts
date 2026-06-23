import type {
  ExecutionMapEntity,
  ExecutionMapEntityKind,
  ExecutionMapEntityRef,
  ExecutionMapEvent,
  ExecutionMapGraph,
  ExecutionMapSelection,
} from '../types.js';
import {
  DEFAULT_EXECUTION_MAP_LANE,
  type ExecutionMapLaneDefinition,
  executionMapLaneDefinitions,
} from './execution-map-model-types.js';

export function executionMapEntityKey(entity: ExecutionMapEntity): string {
  return executionMapRefKey(entity);
}

export function executionMapRefKey(ref: ExecutionMapEntityRef): string {
  return `${ref.entityKind}:${ref.entityId}`;
}

export function executionMapShortId(value: string): string {
  return value.length > 8 ? value.slice(0, 8) : value;
}

export function executionMapRenderedNodes(graph: ExecutionMapGraph): readonly ExecutionMapEntity[] {
  return graph.nodes.filter((node) => node.entityKind !== 'runtime_session');
}

export function executionMapInitialSelection(
  graph: ExecutionMapGraph | null,
): ExecutionMapSelection | null {
  if (!graph) return null;
  const rootAgent =
    graph.nodes.find(
      (node) =>
        node.entityKind === 'agent_instance' &&
        node.entityId === graph.summary?.rootAgentInstanceId,
    ) ?? graph.nodes.find((node) => node.entityKind === 'agent_instance');
  if (rootAgent) return { kind: 'node', key: executionMapEntityKey(rootAgent) };
  const firstRendered = executionMapRenderedNodes(graph)[0];
  return firstRendered ? { kind: 'node', key: executionMapEntityKey(firstRendered) } : null;
}

export function executionMapSelectionFromInputs(input: {
  readonly graph: ExecutionMapGraph | null;
  readonly selectedEntityRef?: ExecutionMapEntityRef | null;
  readonly selectedEdgeId?: string | null;
  readonly selectedEventId?: string | null;
}): ExecutionMapSelection | null {
  if (input.selectedEventId) return { kind: 'event', key: input.selectedEventId };
  if (input.selectedEdgeId) return { kind: 'edge', key: input.selectedEdgeId };
  if (input.selectedEntityRef)
    return { kind: 'node', key: executionMapRefKey(input.selectedEntityRef) };
  return executionMapInitialSelection(input.graph);
}

export function executionMapNodeByKey(
  graph: ExecutionMapGraph,
  key: string,
): ExecutionMapEntity | null {
  return graph.nodes.find((node) => executionMapEntityKey(node) === key) ?? null;
}

export function executionMapEventById(
  events: readonly ExecutionMapEvent[],
  eventId: string,
): ExecutionMapEvent | null {
  return events.find((event) => event.eventId === eventId) ?? null;
}

export function executionMapLaneForEntity(entity: ExecutionMapEntity): ExecutionMapLaneDefinition {
  return executionMapLaneForKind(entity.entityKind);
}

export function executionMapLaneForKind(kind: ExecutionMapEntityKind): ExecutionMapLaneDefinition {
  return (
    executionMapLaneDefinitions.find((lane) => lane.kinds.includes(kind)) ??
    DEFAULT_EXECUTION_MAP_LANE
  );
}
