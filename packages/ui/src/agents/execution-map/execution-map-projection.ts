import { MarkerType, Position } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type {
  LaneHeaderMapNode,
  LaneRowMapNode,
  MapEdge,
  MapNode,
  RuntimeMapNode,
  RuntimeNodeData,
  TimelineCursorMapNode,
} from './execution-map-flow-types.js';
import {
  buildExecutionMapLaneLayout,
  type ExecutionMapEdgeVisualState,
  type ExecutionMapFocusProjection,
  executionMapActorKeyForEntity,
  executionMapActorLabelForEntity,
  executionMapEdgeBundleIndex,
  executionMapEdgeColor,
  executionMapEdgeLabel,
  executionMapEdgeLanePairKey,
  executionMapEdgeVisualState,
  executionMapEntityIcon,
  executionMapEntityKey,
  executionMapEntitySubtitle,
  executionMapEntityTitle,
  executionMapEventById,
  executionMapEventTargetKey,
  executionMapIsEvidenceEntity,
  executionMapLaneDefinitions,
  executionMapLaneForEntity,
  executionMapNodeColor,
  executionMapNodeVisualState,
  executionMapNodeWidth,
  executionMapRefKey,
  executionMapRenderedNodes,
} from './model/execution-map-model.js';
import type {
  ExecutionMapDensity,
  ExecutionMapEdge,
  ExecutionMapEntity,
  ExecutionMapEvent,
  ExecutionMapEvidenceMode,
  ExecutionMapGraph,
  ExecutionMapSelection,
} from './types.js';

interface ProjectedEdgeState {
  readonly color: string;
  readonly visualState: ExecutionMapEdgeVisualState;
  readonly selected: boolean;
  readonly kindHighlighted: boolean;
  readonly kindMuted: boolean;
  readonly active: boolean;
  readonly bundleCount: number;
  readonly bundled: boolean;
  readonly firstBundledEdge: boolean;
  readonly label?: string;
}

export function executionMapMiniMapNodeColor(node: { readonly data?: unknown }): string {
  const data = node.data as RuntimeNodeData | undefined;
  return data?.entity
    ? executionMapNodeColor(data.entity.entityKind)
    : 'var(--lemn-color-surface-muted)';
}

export function activateRuntimeNodeSelection(
  node: { readonly id: string; readonly type?: string },
  activateSelection: (selection: ExecutionMapSelection) => void,
): void {
  if (node.type !== 'runtimeNode') return;
  activateSelection({ kind: 'node', key: node.id });
}

export function executionMapProjection(input: {
  readonly allEvents: readonly ExecutionMapEvent[];
  readonly density: ExecutionMapDensity;
  readonly entityEvents: Readonly<Record<string, readonly ExecutionMapEvent[]>>;
  readonly evidenceMode: ExecutionMapEvidenceMode;
  readonly focus: ExecutionMapFocusProjection | null;
  readonly graph: ExecutionMapGraph | null;
  readonly selectedEdgeKind: ExecutionMapEdge['edgeKind'] | null;
  readonly selection: ExecutionMapSelection | null;
}): { readonly nodes: readonly MapNode[]; readonly edges: readonly MapEdge[] } {
  if (!input.graph || !input.selection || !input.focus) return emptyExecutionMapProjection();
  return projectGraph(
    input.graph,
    input.selection,
    input.focus,
    input.density,
    input.evidenceMode,
    input.selectedEdgeKind,
    input.entityEvents,
    input.allEvents,
  );
}

function emptyExecutionMapProjection(): {
  readonly nodes: readonly MapNode[];
  readonly edges: readonly MapEdge[];
} {
  return { nodes: [], edges: [] };
}

function projectGraph(
  graph: ExecutionMapGraph,
  selection: ExecutionMapSelection,
  focus: ExecutionMapFocusProjection,
  density: ExecutionMapDensity,
  evidenceMode: ExecutionMapEvidenceMode,
  selectedEdgeKind: ExecutionMapEdge['edgeKind'] | null,
  entityEvents: Readonly<Record<string, readonly ExecutionMapEvent[]>>,
  events: readonly ExecutionMapEvent[],
): { readonly nodes: readonly MapNode[]; readonly edges: readonly MapEdge[] } {
  const rendered = executionMapRenderedNodes(graph);
  const layout = buildExecutionMapLaneLayout(graph, rendered, density);
  const laneHeaders = createLaneHeaderNodes(rendered, density, focus);
  const laneRows = createLaneRowNodes(layout, focus);
  const cursorNode = createTimelineCursorNode(graph, selection, layout, events);
  const bundle = executionMapEdgeBundleIndex(graph.edges);

  return {
    nodes: [
      ...laneRows,
      ...laneHeaders,
      ...rendered.map((entity): RuntimeMapNode => {
        const key = executionMapEntityKey(entity);
        const lane = executionMapLaneForEntity(entity);
        return {
          id: key,
          type: 'runtimeNode',
          position: layout.positions.get(key) ?? { x: 0, y: 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            entity,
            actorKey: executionMapActorKeyForEntity(graph, entity),
            actorLabel: executionMapActorLabelForEntity(graph, entity),
            laneId: lane.id,
            laneName: lane.name,
            icon: executionMapEntityIcon(entity.entityKind),
            title: executionMapEntityTitle(entity),
            subtitle: executionMapEntitySubtitle(entity),
            eventCount: entityEvents[key]?.length ?? 0,
            collapsed: evidenceMode === 'collapsed' && executionMapIsEvidenceEntity(entity),
            visualState: executionMapNodeVisualState(key, focus),
            selected: selection.kind === 'node' && selection.key === key,
            focus: focus.selectedTargetKey === key,
          },
          draggable: false,
          selectable: true,
          zIndex: 5,
        };
      }),
      ...(cursorNode ? [cursorNode] : []),
    ],
    edges: createProjectedEdges(graph.edges, focus, selectedEdgeKind, bundle),
  };
}

function createProjectedEdges(
  edges: readonly ExecutionMapEdge[],
  focus: ExecutionMapFocusProjection,
  selectedEdgeKind: ExecutionMapEdge['edgeKind'] | null,
  bundle: ReturnType<typeof executionMapEdgeBundleIndex>,
): readonly MapEdge[] {
  return edges
    .filter(executionMapEdgeIsRenderable)
    .map((edge) => projectExecutionMapEdge(edge, focus, selectedEdgeKind, bundle));
}

function executionMapEdgeIsRenderable(edge: ExecutionMapEdge): boolean {
  return edge.from.entityKind !== 'runtime_session' && edge.to.entityKind !== 'runtime_session';
}

function projectExecutionMapEdge(
  edge: ExecutionMapEdge,
  focus: ExecutionMapFocusProjection,
  selectedEdgeKind: ExecutionMapEdge['edgeKind'] | null,
  bundle: ReturnType<typeof executionMapEdgeBundleIndex>,
): MapEdge {
  const state = projectedEdgeState(edge, focus, selectedEdgeKind, bundle);
  return {
    id: edge.edgeId,
    type: 'smoothstep',
    source: executionMapRefKey(edge.from),
    target: executionMapRefKey(edge.to),
    label: state.label,
    markerEnd: { type: MarkerType.ArrowClosed, color: state.color, width: 18, height: 18 },
    animated: executionMapEdgeAnimated(state),
    className: executionMapEdgeClassName(state),
    data: {
      edge,
      visualState: state.visualState,
      bundled: state.bundled,
      bundleCount: state.bundleCount,
    },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 6,
    labelBgStyle: executionMapEdgeLabelBackgroundStyle(state),
    labelStyle: executionMapEdgeLabelStyle(state),
    style: executionMapEdgeStyle(state),
  };
}

function projectedEdgeState(
  edge: ExecutionMapEdge,
  focus: ExecutionMapFocusProjection,
  selectedEdgeKind: ExecutionMapEdge['edgeKind'] | null,
  bundle: ReturnType<typeof executionMapEdgeBundleIndex>,
): ProjectedEdgeState {
  const visualState = executionMapEdgeVisualState(edge.edgeId, focus);
  const kindHighlighted = selectedEdgeKind === edge.edgeKind;
  const active = executionMapEdgeIsActive(visualState, kindHighlighted);
  const bundleKey = executionMapEdgeLanePairKey(edge);
  const bundleCount = bundle.counts.get(bundleKey) ?? 1;
  const firstBundledEdge = bundle.firstEdgeIds.get(bundleKey) === edge.edgeId;
  return {
    color: executionMapEdgeColor(edge.edgeKind),
    visualState,
    selected: visualState === 'selected',
    kindHighlighted,
    kindMuted: selectedEdgeKind !== null && selectedEdgeKind !== edge.edgeKind,
    active,
    bundleCount,
    bundled: bundleCount > 1 && !active,
    firstBundledEdge,
    label: executionMapEdgeLabel(edge, bundleCount, firstBundledEdge, active),
  };
}

function executionMapEdgeIsActive(
  visualState: ExecutionMapEdgeVisualState,
  kindHighlighted: boolean,
): boolean {
  return (
    visualState === 'selected' ||
    visualState === 'path' ||
    visualState === 'related' ||
    kindHighlighted
  );
}

function executionMapEdgeAnimated(state: ProjectedEdgeState): boolean {
  return state.visualState === 'selected' || state.visualState === 'path' || state.kindHighlighted;
}

function executionMapEdgeClassName(state: ProjectedEdgeState): string {
  return [
    'ui-execution-map__edge',
    `ui-execution-map__edge--${state.visualState}`,
    state.bundled ? 'ui-execution-map__edge--bundled' : '',
    state.kindHighlighted ? 'ui-execution-map__edge--kind-highlighted' : '',
    state.kindMuted ? 'ui-execution-map__edge--kind-muted' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function executionMapEdgeLabelBackgroundStyle(state: ProjectedEdgeState): CSSProperties {
  return {
    fill: 'var(--ui-execution-map-surface)',
    fillOpacity: state.visualState === 'dim' ? 0.35 : 0.92,
  };
}

function executionMapEdgeLabelStyle(state: ProjectedEdgeState): CSSProperties {
  return {
    fill: executionMapEdgeLabelFill(state),
    fontSize: 11,
    fontWeight: 700,
    opacity: state.bundled && !state.firstBundledEdge ? 0 : 1,
  };
}

function executionMapEdgeLabelFill(state: ProjectedEdgeState): string {
  if (state.selected) return 'var(--ui-execution-map-text)';
  return state.active
    ? 'var(--lemn-chart-selection)'
    : 'var(--lemn-color-text-muted)';
}

function executionMapEdgeStyle(state: ProjectedEdgeState): CSSProperties {
  return {
    stroke: state.selected ? 'var(--ui-execution-map-text)' : state.color,
    strokeWidth: executionMapEdgeStrokeWidth(state),
    opacity: executionMapEdgeOpacity(state),
  };
}

function executionMapEdgeStrokeWidth(state: ProjectedEdgeState): number {
  if (state.visualState === 'selected') return 3.2;
  if (state.visualState === 'path') return 3;
  return state.active ? 2.5 : 1.4;
}

function executionMapEdgeOpacity(state: ProjectedEdgeState): number {
  if (state.kindMuted) return 0.06;
  if (state.kindHighlighted) return 0.95;
  if (state.visualState === 'dim') return 0.12;
  return state.bundled ? 0.28 : 0.88;
}

function createLaneHeaderNodes(
  nodes: readonly ExecutionMapEntity[],
  density: ExecutionMapDensity,
  focus: ExecutionMapFocusProjection,
): readonly LaneHeaderMapNode[] {
  const nodeWidth = executionMapNodeWidth(density);
  return executionMapLaneDefinitions.map((lane, laneIndex) => {
    const laneNodes = nodes.filter((node) => lane.id === executionMapLaneForEntity(node).id);
    const activeCount = laneNodes.filter((node) =>
      focus.activeNodeKeys.has(executionMapEntityKey(node)),
    ).length;
    const issueCount = laneNodes.filter((node) =>
      ['blocked', 'failed', 'cancelled'].includes(node.status),
    ).length;
    return {
      id: `lane-header:${lane.id}`,
      type: 'laneHeader',
      position: { x: laneIndex * (density === 'compact' ? 280 : 340), y: 20 },
      data: {
        laneId: lane.id,
        name: lane.name,
        icon: lane.icon,
        count: laneNodes.length,
        activeCount,
        issueCount,
        active: focus.activeLaneIds.has(lane.id) || focus.mode === 'all',
      },
      draggable: false,
      selectable: false,
      style: { width: nodeWidth },
      zIndex: 3,
    };
  });
}

function createLaneRowNodes(
  layout: ReturnType<typeof buildExecutionMapLaneLayout>,
  focus: ExecutionMapFocusProjection,
): readonly LaneRowMapNode[] {
  return layout.rowFrames.map((row) => ({
    id: `lane-row:${row.actorKey}`,
    type: 'laneRow',
    position: { x: -190, y: row.y - 30 },
    data: {
      actorKey: row.actorKey,
      label: row.label,
      subtitle: row.subtitle,
      height: row.height + 38,
      active: focus.activeActorKeys.has(row.actorKey) || focus.mode === 'all',
      count: row.count,
    },
    draggable: false,
    selectable: false,
    style: { width: layout.canvasWidth + 290, height: row.height + 38 },
    zIndex: 0,
  }));
}

function createTimelineCursorNode(
  graph: ExecutionMapGraph,
  selection: ExecutionMapSelection,
  layout: ReturnType<typeof buildExecutionMapLaneLayout>,
  events: readonly ExecutionMapEvent[],
): TimelineCursorMapNode | null {
  if (selection.kind !== 'event') return null;
  const targetKey = executionMapEventTargetKey(graph, events, selection.key);
  if (!targetKey) return null;
  const targetPosition = layout.positions.get(targetKey);
  if (!targetPosition) return null;
  const event = executionMapEventById(events, selection.key);
  if (!event) return null;

  return {
    id: `timeline-cursor:${selection.key}`,
    type: 'timelineCursor',
    position: { x: targetPosition.x + 126, y: 80 },
    data: {
      eventSeq: String(event.persistence.eventSeq),
      eventType: event.eventType,
      height: Math.max(280, layout.canvasHeight - 92),
    },
    draggable: false,
    selectable: false,
    zIndex: 4,
  };
}
