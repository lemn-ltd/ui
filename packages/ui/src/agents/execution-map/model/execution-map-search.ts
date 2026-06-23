import type {
  ExecutionMapEdge,
  ExecutionMapEntity,
  ExecutionMapEvent,
  ExecutionMapGraph,
} from '../types.js';
import { executionMapActorLabelForEntity } from './execution-map-actors.js';
import {
  executionMapEntityIcon,
  executionMapEntitySubtitle,
  executionMapEntityTitle,
  executionMapEventDisplay,
} from './execution-map-display.js';
import {
  executionMapEntityKey,
  executionMapRefKey,
  executionMapShortId,
} from './execution-map-identity.js';
import type { ExecutionMapSearchResult } from './execution-map-model-types.js';

type ExecutionMapSearchPrefix = 'agent' | 'edge' | 'event' | 'kind' | 'status';

interface ExecutionMapSearchQuery {
  readonly prefix: ExecutionMapSearchPrefix | null;
  readonly value: string;
}

export function searchExecutionMap(
  graph: ExecutionMapGraph,
  events: readonly ExecutionMapEvent[],
  query: string,
): readonly ExecutionMapSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const search = parseSearchQuery(normalizedQuery);
  return [
    ...searchExecutionMapEntities(graph, search),
    ...searchExecutionMapEdges(graph.edges, search),
    ...searchExecutionMapEvents(events, search),
  ].slice(0, 12);
}

function searchExecutionMapEntities(
  graph: ExecutionMapGraph,
  search: ExecutionMapSearchQuery,
): readonly ExecutionMapSearchResult[] {
  return graph.nodes.flatMap((entity) => searchExecutionMapEntity(graph, entity, search));
}

function searchExecutionMapEntity(
  graph: ExecutionMapGraph,
  entity: ExecutionMapEntity,
  search: ExecutionMapSearchQuery,
): readonly ExecutionMapSearchResult[] {
  if (entity.entityKind === 'runtime_session') return [];
  if (!executionMapEntityMatchesSearch(graph, entity, search)) return [];
  return [
    {
      kind: 'node',
      key: executionMapEntityKey(entity),
      title: executionMapEntityTitle(entity),
      subtitle: `${entity.entityKind} · ${entity.status} · ${executionMapShortId(entity.entityId)}`,
      badge: executionMapEntityIcon(entity.entityKind),
    },
  ];
}

function executionMapEntityMatchesSearch(
  graph: ExecutionMapGraph,
  entity: ExecutionMapEntity,
  search: ExecutionMapSearchQuery,
): boolean {
  switch (search.prefix) {
    case 'status':
      return entity.status.toLowerCase().includes(search.value);
    case 'kind':
      return entity.entityKind.toLowerCase().includes(search.value);
    case 'agent':
      return executionMapEntityAgentHaystack(graph, entity).includes(search.value);
    case null:
      return executionMapEntityHaystack(entity).includes(search.value);
    default:
      return false;
  }
}

function executionMapEntityAgentHaystack(
  graph: ExecutionMapGraph,
  entity: ExecutionMapEntity,
): string {
  return [executionMapActorLabelForEntity(graph, entity), entity.agentInstanceId ?? '']
    .join(' ')
    .toLowerCase();
}

function executionMapEntityHaystack(entity: ExecutionMapEntity): string {
  return [
    entity.entityKind,
    entity.entityId,
    entity.status,
    executionMapEntityTitle(entity),
    executionMapEntitySubtitle(entity),
    entity.agentInstanceId ?? '',
    entity.attemptId ?? '',
    JSON.stringify(entity.summary),
  ]
    .join(' ')
    .toLowerCase();
}

function searchExecutionMapEdges(
  edges: readonly ExecutionMapEdge[],
  search: ExecutionMapSearchQuery,
): readonly ExecutionMapSearchResult[] {
  return edges.flatMap((edge) => searchExecutionMapEdge(edge, search));
}

function searchExecutionMapEdge(
  edge: ExecutionMapEdge,
  search: ExecutionMapSearchQuery,
): readonly ExecutionMapSearchResult[] {
  if (!executionMapEdgeMatchesSearch(edge, search)) return [];
  return [
    {
      kind: 'edge',
      key: edge.edgeId,
      title: edge.edgeKind,
      subtitle: `${edge.from.entityKind} -> ${edge.to.entityKind}`,
      badge: 'LINK',
    },
  ];
}

function executionMapEdgeMatchesSearch(
  edge: ExecutionMapEdge,
  search: ExecutionMapSearchQuery,
): boolean {
  if (search.prefix === 'edge') return edge.edgeKind.toLowerCase().includes(search.value);
  return search.prefix === null && executionMapEdgeHaystack(edge).includes(search.value);
}

function executionMapEdgeHaystack(edge: ExecutionMapEdge): string {
  return [
    edge.edgeKind,
    edge.edgeId,
    executionMapRefKey(edge.from),
    executionMapRefKey(edge.to),
    JSON.stringify(edge.metadata),
  ]
    .join(' ')
    .toLowerCase();
}

function searchExecutionMapEvents(
  events: readonly ExecutionMapEvent[],
  search: ExecutionMapSearchQuery,
): readonly ExecutionMapSearchResult[] {
  return events.flatMap((event) => searchExecutionMapEvent(event, search));
}

function searchExecutionMapEvent(
  event: ExecutionMapEvent,
  search: ExecutionMapSearchQuery,
): readonly ExecutionMapSearchResult[] {
  if (!executionMapEventMatchesSearch(event, search)) return [];
  return [
    {
      kind: 'event',
      key: event.eventId,
      title: event.eventType,
      subtitle: executionMapEventSearchSubtitle(event),
      badge: executionMapEventDisplay(event).code,
    },
  ];
}

function executionMapEventMatchesSearch(
  event: ExecutionMapEvent,
  search: ExecutionMapSearchQuery,
): boolean {
  if (search.prefix === 'event') {
    return (
      event.eventType.toLowerCase().includes(search.value) ||
      event.eventFamily.toLowerCase().includes(search.value)
    );
  }
  return search.prefix === null && executionMapEventHaystack(event).includes(search.value);
}

function executionMapEventHaystack(event: ExecutionMapEvent): string {
  return [
    event.eventId,
    event.eventFamily,
    event.eventType,
    event.persistence.eventSeq,
    event.scope.agentInstanceId ?? '',
    event.scope.attemptId ?? '',
    JSON.stringify(event.payload),
  ]
    .join(' ')
    .toLowerCase();
}

function executionMapEventSearchSubtitle(event: ExecutionMapEvent): string {
  const scope = event.scope.attemptId ? executionMapShortId(event.scope.attemptId) : 'session';
  return `event ${event.persistence.eventSeq} · ${scope}`;
}

function parseSearchQuery(query: string): ExecutionMapSearchQuery {
  const separatorIndex = query.indexOf(':');
  if (separatorIndex <= 0) return { prefix: null, value: query };
  const prefix = query.slice(0, separatorIndex);
  const value = query.slice(separatorIndex + 1);
  if (!executionMapSearchPrefixIsKnown(prefix)) return { prefix: null, value: query };
  return { prefix, value };
}

function executionMapSearchPrefixIsKnown(prefix: string): prefix is ExecutionMapSearchPrefix {
  return ['agent', 'edge', 'event', 'kind', 'status'].includes(prefix);
}
