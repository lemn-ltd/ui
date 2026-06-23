import type { ExecutionMapEvent, ExecutionMapGraph, ExecutionMapTimelineScope } from '../types.js';
import {
  executionMapEntityKey,
  executionMapEventById,
  executionMapNodeByKey,
  executionMapRefKey,
} from './execution-map-identity.js';
import type { ExecutionMapFocusProjection } from './execution-map-model-types.js';

export function executionMapEventTargetKey(
  graph: ExecutionMapGraph,
  events: readonly ExecutionMapEvent[],
  eventId: string,
): string | null {
  const event = executionMapEventById(events, eventId);
  if (!event) return null;
  if (event.scope.attemptId) {
    const attemptKey = executionMapRefKey({
      entityKind: 'attempt',
      entityId: event.scope.attemptId,
    });
    if (executionMapNodeByKey(graph, attemptKey)) return attemptKey;
  }
  if (event.scope.agentInstanceId) {
    const agentKey = executionMapRefKey({
      entityKind: 'agent_instance',
      entityId: event.scope.agentInstanceId,
    });
    if (executionMapNodeByKey(graph, agentKey)) return agentKey;
  }
  const eventNode = graph.nodes.find(
    (node) =>
      node.entityKind === 'runtime_event' &&
      (node.entityId === event.eventId || node.summary.eventId === event.eventId),
  );
  return eventNode ? executionMapEntityKey(eventNode) : null;
}

export function executionMapTimelineEventsForFocus(
  focus: ExecutionMapFocusProjection,
  scope: ExecutionMapTimelineScope,
  allEvents: readonly ExecutionMapEvent[],
  entityEvents: Readonly<Record<string, readonly ExecutionMapEvent[]>>,
): readonly ExecutionMapEvent[] {
  if (scope === 'all' || focus.mode === 'all') return allEvents;
  const eventsById = new Map<string, ExecutionMapEvent>();
  for (const key of focus.activeNodeKeys) {
    for (const event of entityEvents[key] ?? []) eventsById.set(event.eventId, event);
  }
  const events = [...eventsById.values()].sort(compareExecutionMapEvents);
  return events.length > 0 ? events : allEvents;
}

export function executionMapRelatedTimelineEventIds(
  focus: ExecutionMapFocusProjection,
  entityEvents: Readonly<Record<string, readonly ExecutionMapEvent[]>>,
): ReadonlySet<string> {
  const eventIds = new Set<string>();
  for (const key of focus.activeNodeKeys) {
    for (const event of entityEvents[key] ?? []) eventIds.add(event.eventId);
  }
  return eventIds;
}

function compareExecutionMapEvents(left: ExecutionMapEvent, right: ExecutionMapEvent): number {
  return Number(left.persistence.eventSeq) - Number(right.persistence.eventSeq);
}
