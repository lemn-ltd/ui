import type {
  ExecutionMapEdge,
  ExecutionMapEvent,
  ExecutionMapFocusMode,
  ExecutionMapGraph,
  ExecutionMapSelection,
} from '../types.js';
import { executionMapActorKeyForEntity } from './execution-map-actors.js';
import { executionMapEventTargetKey } from './execution-map-events.js';
import {
  executionMapEntityKey,
  executionMapLaneForEntity,
  executionMapRefKey,
  executionMapRenderedNodes,
} from './execution-map-identity.js';
import type {
  ExecutionMapEdgeVisualState,
  ExecutionMapFocusProjection,
  ExecutionMapNodeVisualState,
} from './execution-map-model-types.js';

export function createExecutionMapFocusProjection(
  graph: ExecutionMapGraph,
  selection: ExecutionMapSelection,
  mode: ExecutionMapFocusMode,
  events: readonly ExecutionMapEvent[],
): ExecutionMapFocusProjection {
  const context = focusProjectionContext(graph, selection, mode, events);
  if (mode === 'all') return allFocusProjection(context);
  if (context.selectedEdge) return selectedEdgeFocusProjection(context);
  if (!focusTargetIsRenderable(context)) return missingTargetFocusProjection(context);
  if (mode === 'lineage') return selectedNodeLineageFocusProjection(context);
  if (mode === 'causal') return selectedNodeCausalFocusProjection(context);
  return selectedNodeNeighborFocusProjection(context);
}

interface FocusProjectionContext {
  readonly graph: ExecutionMapGraph;
  readonly mode: ExecutionMapFocusMode;
  readonly renderedKeys: ReadonlySet<string>;
  readonly selectedEdge: ExecutionMapEdge | null;
  readonly selectedTargetKey: string | null;
}

function focusProjectionContext(
  graph: ExecutionMapGraph,
  selection: ExecutionMapSelection,
  mode: ExecutionMapFocusMode,
  events: readonly ExecutionMapEvent[],
): FocusProjectionContext {
  const selectedEdge = selectedEdgeForSelection(graph, selection);
  return {
    graph,
    mode,
    renderedKeys: renderedExecutionMapKeys(graph),
    selectedEdge,
    selectedTargetKey: selectedTargetKeyForSelection(graph, events, selection, selectedEdge),
  };
}

function renderedExecutionMapKeys(graph: ExecutionMapGraph): ReadonlySet<string> {
  return new Set(executionMapRenderedNodes(graph).map((node) => executionMapEntityKey(node)));
}

function selectedEdgeForSelection(
  graph: ExecutionMapGraph,
  selection: ExecutionMapSelection,
): ExecutionMapEdge | null {
  if (selection.kind !== 'edge') return null;
  return graph.edges.find((edge) => edge.edgeId === selection.key) ?? null;
}

function selectedTargetKeyForSelection(
  graph: ExecutionMapGraph,
  events: readonly ExecutionMapEvent[],
  selection: ExecutionMapSelection,
  selectedEdge: ExecutionMapEdge | null,
): string | null {
  if (selection.kind === 'event') return executionMapEventTargetKey(graph, events, selection.key);
  if (selection.kind === 'node') return selection.key;
  return selectedEdge ? executionMapRefKey(selectedEdge.to) : null;
}

function allFocusProjection(context: FocusProjectionContext): ExecutionMapFocusProjection {
  const allNodeKeys = new Set(context.renderedKeys);
  const allEdgeIds = new Set(context.graph.edges.map((edge) => edge.edgeId));
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    context.selectedTargetKey,
    context.selectedEdge?.edgeId ?? null,
    allNodeKeys,
    allNodeKeys,
    new Set(),
    allEdgeIds,
    new Set(),
  );
}

function selectedEdgeFocusProjection(context: FocusProjectionContext): ExecutionMapFocusProjection {
  const selectedEdge = context.selectedEdge;
  if (!selectedEdge) return missingTargetFocusProjection(context);
  if (context.mode === 'causal') return selectedEdgeCausalFocusProjection(context, selectedEdge);
  if (context.mode === 'lineage') return selectedEdgeLineageFocusProjection(context, selectedEdge);
  const edgeNodeKeys = selectedEdgeNodeKeys(selectedEdge, context.renderedKeys);
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    context.selectedTargetKey,
    selectedEdge.edgeId,
    edgeNodeKeys,
    edgeNodeKeys,
    new Set(),
    new Set([selectedEdge.edgeId]),
    new Set(),
  );
}

function selectedEdgeNodeKeys(
  selectedEdge: ExecutionMapEdge,
  renderedKeys: ReadonlySet<string>,
): Set<string> {
  return new Set(
    [executionMapRefKey(selectedEdge.from), executionMapRefKey(selectedEdge.to)].filter((key) =>
      renderedKeys.has(key),
    ),
  );
}

function selectedEdgeCausalFocusProjection(
  context: FocusProjectionContext,
  selectedEdge: ExecutionMapEdge,
): ExecutionMapFocusProjection {
  const edgeNodeKeys = selectedEdgeNodeKeys(selectedEdge, context.renderedKeys);
  const path = causalPathTo(context.graph, executionMapRefKey(selectedEdge.to));
  edgeNodeKeys.forEach((key) => {
    path.nodeKeys.add(key);
  });
  path.edgeIds.add(selectedEdge.edgeId);
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    context.selectedTargetKey,
    selectedEdge.edgeId,
    path.nodeKeys,
    edgeNodeKeys,
    path.nodeKeys,
    path.edgeIds,
    path.edgeIds,
  );
}

function selectedEdgeLineageFocusProjection(
  context: FocusProjectionContext,
  selectedEdge: ExecutionMapEdge,
): ExecutionMapFocusProjection {
  const edgeNodeKeys = selectedEdgeNodeKeys(selectedEdge, context.renderedKeys);
  const lineage = lineageKeys(context.graph, edgeNodeKeys);
  const lineageEdges = edgeIdsWithinNodeSet(context.graph, lineage);
  lineageEdges.add(selectedEdge.edgeId);
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    context.selectedTargetKey,
    selectedEdge.edgeId,
    lineage,
    edgeNodeKeys,
    new Set(),
    lineageEdges,
    new Set(),
  );
}

function focusTargetIsRenderable(context: FocusProjectionContext): boolean {
  return Boolean(context.selectedTargetKey && context.renderedKeys.has(context.selectedTargetKey));
}

function missingTargetFocusProjection(
  context: FocusProjectionContext,
): ExecutionMapFocusProjection {
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    context.selectedTargetKey,
    null,
    new Set(context.renderedKeys),
    new Set(),
    new Set(),
    new Set(),
    new Set(),
  );
}

function selectedNodeLineageFocusProjection(
  context: FocusProjectionContext,
): ExecutionMapFocusProjection {
  const selectedTargetKey = context.selectedTargetKey;
  if (!selectedTargetKey) return missingTargetFocusProjection(context);
  const lineage = lineageKeys(context.graph, new Set([selectedTargetKey]));
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    selectedTargetKey,
    null,
    lineage,
    lineage,
    new Set(),
    edgeIdsWithinNodeSet(context.graph, lineage),
    new Set(),
  );
}

function selectedNodeCausalFocusProjection(
  context: FocusProjectionContext,
): ExecutionMapFocusProjection {
  const selectedTargetKey = context.selectedTargetKey;
  if (!selectedTargetKey) return missingTargetFocusProjection(context);
  const path = causalPathTo(context.graph, selectedTargetKey);
  if (path.nodeKeys.size === 0) path.nodeKeys.add(selectedTargetKey);
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    selectedTargetKey,
    null,
    path.nodeKeys,
    path.nodeKeys,
    path.nodeKeys,
    path.edgeIds,
    path.edgeIds,
  );
}

function selectedNodeNeighborFocusProjection(
  context: FocusProjectionContext,
): ExecutionMapFocusProjection {
  const selectedTargetKey = context.selectedTargetKey;
  if (!selectedTargetKey) return missingTargetFocusProjection(context);
  const { neighbors, directEdges } = directNeighborFocusSets(
    context.graph,
    selectedTargetKey,
    context.renderedKeys,
  );
  return focusProjectionFromSets(
    context.graph,
    context.mode,
    selectedTargetKey,
    null,
    neighbors,
    neighbors,
    new Set(),
    directEdges,
    new Set(),
  );
}

function directNeighborFocusSets(
  graph: ExecutionMapGraph,
  selectedTargetKey: string,
  renderedKeys: ReadonlySet<string>,
): { readonly neighbors: Set<string>; readonly directEdges: Set<string> } {
  const neighbors = new Set([selectedTargetKey]);
  const directEdges = new Set<string>();
  for (const edge of graph.edges) {
    addDirectNeighborEdge(edge, selectedTargetKey, renderedKeys, neighbors, directEdges);
  }
  return { neighbors, directEdges };
}

function addDirectNeighborEdge(
  edge: ExecutionMapEdge,
  selectedTargetKey: string,
  renderedKeys: ReadonlySet<string>,
  neighbors: Set<string>,
  directEdges: Set<string>,
): void {
  const from = executionMapRefKey(edge.from);
  const to = executionMapRefKey(edge.to);
  if (from !== selectedTargetKey && to !== selectedTargetKey) return;
  if (renderedKeys.has(from)) neighbors.add(from);
  if (renderedKeys.has(to)) neighbors.add(to);
  directEdges.add(edge.edgeId);
}

export function executionMapNodeVisualState(
  key: string,
  focus: ExecutionMapFocusProjection,
): ExecutionMapNodeVisualState {
  if (focus.selectedTargetKey === key) return 'selected';
  if (focus.mode === 'all') return 'neutral';
  if (focus.pathNodeKeys.has(key)) return 'path';
  if (focus.relatedNodeKeys.has(key)) return 'related';
  if (focus.activeNodeKeys.has(key)) return 'neutral';
  return 'dim';
}

export function executionMapEdgeVisualState(
  edgeId: string,
  focus: ExecutionMapFocusProjection,
): ExecutionMapEdgeVisualState {
  if (focus.selectedEdgeId === edgeId) return 'selected';
  if (focus.mode === 'all') return 'neutral';
  if (focus.pathEdgeIds.has(edgeId)) return 'path';
  if (focus.activeEdgeIds.has(edgeId)) return 'related';
  return 'dim';
}

function focusProjectionFromSets(
  graph: ExecutionMapGraph,
  mode: ExecutionMapFocusMode,
  selectedTargetKey: string | null,
  selectedEdgeId: string | null,
  activeNodeKeys: Set<string>,
  relatedNodeKeys: Set<string>,
  pathNodeKeys: Set<string>,
  activeEdgeIds: Set<string>,
  pathEdgeIds: Set<string>,
): ExecutionMapFocusProjection {
  const activeActorKeys = new Set<string>();
  const activeLaneIds = new Set<string>();
  for (const node of graph.nodes) {
    const key = executionMapEntityKey(node);
    if (!activeNodeKeys.has(key)) continue;
    activeActorKeys.add(executionMapActorKeyForEntity(graph, node));
    activeLaneIds.add(executionMapLaneForEntity(node).id);
  }

  return {
    mode,
    selectedTargetKey,
    selectedEdgeId,
    activeNodeKeys,
    relatedNodeKeys,
    pathNodeKeys,
    activeEdgeIds,
    pathEdgeIds,
    activeActorKeys,
    activeLaneIds,
  };
}

function lineageKeys(graph: ExecutionMapGraph, targets: ReadonlySet<string>): Set<string> {
  const byKey = new Map(graph.nodes.map((node) => [executionMapEntityKey(node), node]));
  const children = new Map<string, string[]>();
  for (const node of graph.nodes) {
    if (!node.parentEntityRef) continue;
    const parentKey = executionMapRefKey(node.parentEntityRef);
    const list = children.get(parentKey) ?? [];
    list.push(executionMapEntityKey(node));
    children.set(parentKey, list);
  }

  const keys = new Set<string>();
  const addAncestors = (key: string) => {
    const node = byKey.get(key);
    if (!node || node.entityKind === 'runtime_session' || keys.has(key)) return;
    keys.add(key);
    if (node.parentEntityRef) addAncestors(executionMapRefKey(node.parentEntityRef));
  };
  const addDescendants = (key: string) => {
    for (const childKey of children.get(key) ?? []) {
      const child = byKey.get(childKey);
      if (!child || child.entityKind === 'runtime_session' || keys.has(childKey)) continue;
      keys.add(childKey);
      addDescendants(childKey);
    }
  };

  for (const target of targets) {
    addAncestors(target);
    addDescendants(target);
  }
  return keys;
}

function causalPathTo(
  graph: ExecutionMapGraph,
  targetKey: string,
): { readonly nodeKeys: Set<string>; readonly edgeIds: Set<string> } {
  const adjacency = executionMapEdgeAdjacency(graph.edges);
  for (const startKey of causalPathStartKeys(graph)) {
    const path = causalPathFromStart(startKey, targetKey, adjacency);
    if (path) return path;
  }
  return emptyCausalPath();
}

interface CausalPathQueueItem {
  readonly nodeKey: string;
  readonly nodePath: readonly string[];
  readonly edgePath: readonly string[];
}

function causalPathStartKeys(graph: ExecutionMapGraph): readonly string[] {
  return [
    ...graph.nodes
      .filter((node) => node.entityKind === 'runtime_input')
      .map((node) => executionMapEntityKey(node)),
    ...rootAgentStartKey(graph),
  ];
}

function rootAgentStartKey(graph: ExecutionMapGraph): readonly string[] {
  const rootAgentId = graph.summary?.rootAgentInstanceId ?? null;
  return rootAgentId
    ? [executionMapRefKey({ entityKind: 'agent_instance', entityId: rootAgentId })]
    : [];
}

function executionMapEdgeAdjacency(
  edges: readonly ExecutionMapEdge[],
): Map<string, ExecutionMapEdge[]> {
  const adjacency = new Map<string, ExecutionMapEdge[]>();
  for (const edge of edges) addExecutionMapAdjacencyEdge(adjacency, edge);
  return adjacency;
}

function addExecutionMapAdjacencyEdge(
  adjacency: Map<string, ExecutionMapEdge[]>,
  edge: ExecutionMapEdge,
): void {
  const from = executionMapRefKey(edge.from);
  const list = adjacency.get(from) ?? [];
  list.push(edge);
  adjacency.set(from, list);
}

function causalPathFromStart(
  startKey: string,
  targetKey: string,
  adjacency: ReadonlyMap<string, readonly ExecutionMapEdge[]>,
): { readonly nodeKeys: Set<string>; readonly edgeIds: Set<string> } | null {
  const queue: CausalPathQueueItem[] = [{ nodeKey: startKey, nodePath: [startKey], edgePath: [] }];
  const visited = new Set<string>([startKey]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.nodeKey === targetKey) return causalPathFromQueueItem(current);
    enqueueCausalPathChildren(current, adjacency, visited, queue);
  }
  return null;
}

function causalPathFromQueueItem(current: CausalPathQueueItem): {
  readonly nodeKeys: Set<string>;
  readonly edgeIds: Set<string>;
} {
  return {
    nodeKeys: new Set(current.nodePath.filter((key) => !key.startsWith('runtime_session:'))),
    edgeIds: new Set(current.edgePath),
  };
}

function enqueueCausalPathChildren(
  current: CausalPathQueueItem,
  adjacency: ReadonlyMap<string, readonly ExecutionMapEdge[]>,
  visited: Set<string>,
  queue: CausalPathQueueItem[],
): void {
  for (const edge of adjacency.get(current.nodeKey) ?? []) {
    enqueueCausalPathEdge(current, edge, visited, queue);
  }
}

function enqueueCausalPathEdge(
  current: CausalPathQueueItem,
  edge: ExecutionMapEdge,
  visited: Set<string>,
  queue: CausalPathQueueItem[],
): void {
  const nextKey = executionMapRefKey(edge.to);
  if (visited.has(nextKey)) return;
  visited.add(nextKey);
  queue.push({
    nodeKey: nextKey,
    nodePath: [...current.nodePath, nextKey],
    edgePath: [...current.edgePath, edge.edgeId],
  });
}

function emptyCausalPath(): { readonly nodeKeys: Set<string>; readonly edgeIds: Set<string> } {
  return { nodeKeys: new Set(), edgeIds: new Set() };
}

function edgeIdsWithinNodeSet(
  graph: ExecutionMapGraph,
  nodeKeys: ReadonlySet<string>,
): Set<string> {
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (nodeKeys.has(executionMapRefKey(edge.from)) && nodeKeys.has(executionMapRefKey(edge.to))) {
      edgeIds.add(edge.edgeId);
    }
  }
  return edgeIds;
}
