import type { ExecutionMapEntity, ExecutionMapGraph } from '../types.js';
import { executionMapEntityTitle } from './execution-map-display.js';
import { executionMapShortId } from './execution-map-identity.js';

export function executionMapActorKeyForEntity(
  graph: ExecutionMapGraph,
  entity: ExecutionMapEntity,
): string {
  if (entity.agentInstanceId) return entity.agentInstanceId;
  if (entity.entityKind === 'agent_instance') return entity.entityId;
  return graph.summary?.rootAgentInstanceId ?? 'system';
}

export function executionMapActorLabelForEntity(
  graph: ExecutionMapGraph,
  entity: ExecutionMapEntity,
): string {
  const actorKey = executionMapActorKeyForEntity(graph, entity);
  const actor = graph.nodes.find(
    (node) => node.entityKind === 'agent_instance' && node.entityId === actorKey,
  );
  if (actor) return executionMapEntityTitle(actor);
  if (actorKey === 'system') return 'System';
  return executionMapShortId(actorKey);
}

export function executionMapActorRowsForNodes(
  graph: ExecutionMapGraph,
  nodes: readonly ExecutionMapEntity[],
): readonly { readonly actorKey: string; readonly label: string; readonly subtitle: string }[] {
  const rows = new Map<string, { actorKey: string; label: string; subtitle: string }>();
  for (const node of nodes) {
    const actorKey = executionMapActorKeyForEntity(graph, node);
    if (rows.has(actorKey)) continue;
    rows.set(actorKey, {
      actorKey,
      label: executionMapActorLabelForEntity(graph, node),
      subtitle: executionMapActorSubtitleForKey(graph, actorKey),
    });
  }
  return [...rows.values()].sort(
    (left, right) =>
      executionMapActorSortValue(graph, left.actorKey) -
      executionMapActorSortValue(graph, right.actorKey),
  );
}

function executionMapActorSubtitleForKey(graph: ExecutionMapGraph, actorKey: string): string {
  if (actorKey === graph.summary?.rootAgentInstanceId) return 'root actor';
  if (actorKey === 'system') return 'session evidence';
  return 'delegated actor';
}

function executionMapActorSortValue(graph: ExecutionMapGraph, actorKey: string): number {
  if (actorKey === graph.summary?.rootAgentInstanceId) return 0;
  if (actorKey === 'system') return 9_999;
  const actor = graph.nodes.find(
    (node) => node.entityKind === 'agent_instance' && node.entityId === actorKey,
  );
  const depth = actor?.summary.depth;
  if (typeof depth === 'number') return depth + 1;
  return 10;
}
