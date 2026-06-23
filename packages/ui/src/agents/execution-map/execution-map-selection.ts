import {
  type ExecutionMapBubble,
  type ExecutionMapTimelineBehavior,
  executionMapNodeForSelection,
  executionMapSelectionsEqual,
  type executionMapTimelineScopeForNode,
} from './execution-map-state.js';
import {
  createExecutionMapFocusProjection,
  type ExecutionMapFocusProjection,
  type ExecutionMapSearchResult,
  executionMapNodeByKey,
  executionMapRelatedTimelineEventIds,
  executionMapTimelineEventsForFocus,
  searchExecutionMap,
} from './model/execution-map-model.js';
import type {
  ExecutionMapEntity,
  ExecutionMapEvent,
  ExecutionMapFocusMode,
  ExecutionMapGraph,
  ExecutionMapProps,
  ExecutionMapSelection,
} from './types.js';

interface ExecutionMapSelectionActivation {
  readonly nextSelection: ExecutionMapSelection;
  readonly nextActiveBubble: ExecutionMapBubble | null;
  readonly selectionChanged: boolean;
  readonly bubbleChanged: boolean;
  readonly timelineChanged: boolean;
}

export function selectedExecutionMapEventId(
  selection: ExecutionMapSelection | null,
): string | null {
  return selection?.kind === 'event' ? selection.key : null;
}

export function selectedExecutionMapNode(
  graph: ExecutionMapGraph | null,
  allEvents: readonly ExecutionMapEvent[],
  selection: ExecutionMapSelection | null,
): ExecutionMapEntity | null {
  if (!graph || !selection) return null;
  return executionMapNodeForSelection(graph, allEvents, selection);
}

export function executionMapFocusProjection(
  graph: ExecutionMapGraph | null,
  selection: ExecutionMapSelection | null,
  focusMode: ExecutionMapFocusMode,
  allEvents: readonly ExecutionMapEvent[],
): ExecutionMapFocusProjection | null {
  if (!graph || !selection) return null;
  return createExecutionMapFocusProjection(graph, selection, focusMode, allEvents);
}

export function visibleExecutionMapTimelineEvents(input: {
  readonly allEvents: readonly ExecutionMapEvent[];
  readonly entityEvents: Readonly<Record<string, readonly ExecutionMapEvent[]>>;
  readonly focus: ExecutionMapFocusProjection | null;
  readonly selection: ExecutionMapSelection | null;
  readonly timelineScope: ReturnType<typeof executionMapTimelineScopeForNode>;
}): readonly ExecutionMapEvent[] {
  if (!input.selection || !input.focus) return input.allEvents;
  return executionMapTimelineEventsForFocus(
    input.focus,
    input.timelineScope,
    input.allEvents,
    input.entityEvents,
  );
}

export function relatedExecutionMapTimelineEventIds(
  focus: ExecutionMapFocusProjection | null,
  entityEvents: Readonly<Record<string, readonly ExecutionMapEvent[]>>,
): ReadonlySet<string> {
  return focus ? executionMapRelatedTimelineEventIds(focus, entityEvents) : new Set<string>();
}

export function executionMapSearchResults(
  graph: ExecutionMapGraph | null,
  allEvents: readonly ExecutionMapEvent[],
  searchQuery: string,
): readonly ExecutionMapSearchResult[] {
  return graph ? searchExecutionMap(graph, allEvents, searchQuery) : [];
}

export function executionMapSelectionActivation(input: {
  readonly activeBubble: ExecutionMapBubble | null;
  readonly nextActiveBubble: ExecutionMapBubble | null;
  readonly nextSelection: ExecutionMapSelection;
  readonly selection: ExecutionMapSelection | null;
  readonly timelineBehavior: ExecutionMapTimelineBehavior;
  readonly timelineOpen: boolean;
}): ExecutionMapSelectionActivation {
  const selectionChanged = !executionMapSelectionsEqual(input.selection, input.nextSelection);
  const shouldOpenTimeline =
    input.nextSelection.kind === 'node' && input.timelineBehavior === 'node-click';
  return {
    nextSelection: input.nextSelection,
    nextActiveBubble: input.nextActiveBubble,
    selectionChanged,
    bubbleChanged: input.activeBubble !== input.nextActiveBubble,
    timelineChanged: shouldOpenTimeline && !input.timelineOpen,
  };
}

export function executionMapSelectionActivationChanged(
  activation: ExecutionMapSelectionActivation,
): boolean {
  return activation.selectionChanged || activation.bubbleChanged || activation.timelineChanged;
}

export function applyExecutionMapSelectionActivation(
  activation: ExecutionMapSelectionActivation,
  setters: {
    readonly setSelection: (selection: ExecutionMapSelection) => void;
    readonly setActiveBubble: (bubble: ExecutionMapBubble | null) => void;
    readonly setTimelineOpen: (open: boolean) => void;
  },
): void {
  if (activation.selectionChanged) setters.setSelection(activation.nextSelection);
  if (activation.bubbleChanged) setters.setActiveBubble(activation.nextActiveBubble);
  if (activation.timelineChanged) setters.setTimelineOpen(true);
}

export function notifyExecutionMapSelection(
  activation: ExecutionMapSelectionActivation,
  input: {
    readonly graph: ExecutionMapGraph;
    readonly onSelectEntity?: ExecutionMapProps['onSelectEntity'];
    readonly onSelectEdge?: ExecutionMapProps['onSelectEdge'];
    readonly onSelectEvent?: ExecutionMapProps['onSelectEvent'];
  },
): void {
  if (!activation.selectionChanged) return;
  notifyExecutionMapSelectionByKind(activation.nextSelection, input);
}

function notifyExecutionMapSelectionByKind(
  selection: ExecutionMapSelection,
  input: {
    readonly graph: ExecutionMapGraph;
    readonly onSelectEntity?: ExecutionMapProps['onSelectEntity'];
    readonly onSelectEdge?: ExecutionMapProps['onSelectEdge'];
    readonly onSelectEvent?: ExecutionMapProps['onSelectEvent'];
  },
): void {
  if (selection.kind === 'node') {
    notifyExecutionMapNodeSelection(selection.key, input.graph, input.onSelectEntity);
    return;
  }
  if (selection.kind === 'edge') {
    notifyExecutionMapEdgeSelection(selection.key, input.graph, input.onSelectEdge);
    return;
  }
  input.onSelectEvent?.(selection.key);
}

function notifyExecutionMapNodeSelection(
  key: string,
  graph: ExecutionMapGraph,
  onSelectEntity?: ExecutionMapProps['onSelectEntity'],
): void {
  const entity = executionMapNodeByKey(graph, key);
  if (entity) onSelectEntity?.({ entityKind: entity.entityKind, entityId: entity.entityId });
}

function notifyExecutionMapEdgeSelection(
  key: string,
  graph: ExecutionMapGraph,
  onSelectEdge?: ExecutionMapProps['onSelectEdge'],
): void {
  const edge = graph.edges.find((candidate) => candidate.edgeId === key);
  if (edge) onSelectEdge?.(edge);
}

export function selectedPayload(
  graph: ExecutionMapGraph,
  events: readonly ExecutionMapEvent[],
  selection: ExecutionMapSelection,
) {
  if (selection.kind === 'node') return executionMapNodeByKey(graph, selection.key);
  if (selection.kind === 'edge')
    return graph.edges.find((edge) => edge.edgeId === selection.key) ?? null;
  return events.find((event) => event.eventId === selection.key) ?? null;
}

export function mergeEvents(
  primaryEvents: readonly ExecutionMapEvent[],
  fallbackEvents: readonly ExecutionMapEvent[],
): readonly ExecutionMapEvent[] {
  const eventsById = new Map<string, ExecutionMapEvent>();
  for (const event of fallbackEvents) eventsById.set(event.eventId, event);
  for (const event of primaryEvents) eventsById.set(event.eventId, event);
  return [...eventsById.values()].sort(
    (left, right) => Number(left.persistence.eventSeq) - Number(right.persistence.eventSeq),
  );
}
