import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  PanOnScrollMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { ExecutionMapCanvasCursor } from './execution-map-canvas-cursor.js';
import type { MapEdge, MapNode } from './execution-map-flow-types.js';
import { ExecutionMapHeader, ExecutionMapRefreshPanel } from './execution-map-header.js';
import { nodeTypes } from './execution-map-nodes.js';
import {
  EventVocabularyPanel,
  ExecutionLinksPanel,
  FloatingInspector,
  MapControlsPanel,
  SearchPanel,
  ViewportControls,
} from './execution-map-panels.js';
import {
  activateRuntimeNodeSelection,
  executionMapMiniMapNodeColor,
  executionMapProjection,
} from './execution-map-projection.js';
import {
  applyExecutionMapSelectionActivation,
  executionMapFocusProjection,
  executionMapSearchResults,
  executionMapSelectionActivation,
  executionMapSelectionActivationChanged,
  mergeEvents,
  notifyExecutionMapSelection,
  relatedExecutionMapTimelineEventIds,
  selectedExecutionMapEventId,
  selectedExecutionMapNode,
  selectedPayload,
  visibleExecutionMapTimelineEvents,
} from './execution-map-selection.js';
import {
  EXECUTION_MAP_MAX_ZOOM,
  type ExecutionMapBubble,
  type ExecutionMapDetailMode,
  type ExecutionMapTimelineBehavior,
  executionMapDetailSettings,
  executionMapTimelineScopeForNode,
  useExecutionMapFullscreen,
  useExecutionMapOverlayDismiss,
} from './execution-map-state.js';
import { FloatingTimeline } from './execution-map-timeline.js';
import {
  useExecutionMapSelectionFocus,
  useExecutionMapViewportReader,
} from './execution-map-viewport.js';
import {
  type ExecutionMapSearchResult,
  executionMapSelectionFromInputs,
} from './model/execution-map-model.js';
import type {
  ExecutionMapEdge,
  ExecutionMapFocusMode,
  ExecutionMapProps,
  ExecutionMapSelection,
} from './types.js';
import './execution-map.css';

const executionMapTimelineEventWidth = 190;
const executionMapTimelineEventGap = 10;
const executionMapTimelineHorizontalChrome = 36;

function executionMapTimelinePanelWidth(eventCount: number): number {
  const eventSlots = Math.max(1, eventCount);
  return (
    eventSlots * executionMapTimelineEventWidth +
    Math.max(0, eventSlots - 1) * executionMapTimelineEventGap +
    executionMapTimelineHorizontalChrome
  );
}

export function ExecutionMap(props: ExecutionMapProps) {
  return (
    <ReactFlowProvider>
      <ExecutionMapInner {...props} />
    </ReactFlowProvider>
  );
}

function ExecutionMapInner({
  graph,
  events,
  entityEvents = {},
  selectedEntityRef,
  selectedEdgeId,
  selectedEventId,
  title = 'Execution Map',
  subtitle,
  className,
  refreshLabel = 'Refresh graph',
  refreshing = false,
  onRefresh,
  onSelectEntity,
  onSelectEdge,
  onSelectEvent,
}: ExecutionMapProps) {
  const flow = useReactFlow<MapNode, MapEdge>();
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const [focusMode, setFocusMode] = useState<ExecutionMapFocusMode>('focus');
  const [detailMode, setDetailMode] = useState<ExecutionMapDetailMode>('overview');
  const [timelineBehavior, setTimelineBehavior] = useState<ExecutionMapTimelineBehavior>('manual');
  const [activeBubble, setActiveBubble] = useState<ExecutionMapBubble | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEdgeKind, setSelectedEdgeKind] = useState<ExecutionMapEdge['edgeKind'] | null>(
    null,
  );
  const [selection, setSelection] = useState<ExecutionMapSelection | null>(() =>
    executionMapSelectionFromInputs({ graph, selectedEntityRef, selectedEdgeId, selectedEventId }),
  );
  const readMapViewportBounds = useExecutionMapViewportReader({
    inspectorOpen: activeBubble === 'inspector',
    stageRef,
    timelineOpen,
  });
  const allEvents = useMemo(
    () => mergeEvents(events ?? graph?.latestEvents ?? [], graph?.latestEvents ?? []),
    [events, graph],
  );

  useEffect(() => {
    const nextSelection = executionMapSelectionFromInputs({
      graph,
      selectedEntityRef,
      selectedEdgeId,
      selectedEventId,
    });
    if (!nextSelection) return;
    setSelection((current) =>
      current?.kind === nextSelection.kind && current.key === nextSelection.key
        ? current
        : nextSelection,
    );
  }, [graph, selectedEdgeId, selectedEntityRef, selectedEventId]);

  useExecutionMapOverlayDismiss({
    enabled: activeBubble !== null || timelineOpen,
    rootRef,
    setActiveBubble,
    setTimelineOpen,
  });
  useExecutionMapFullscreen({ flow, fullscreen, setFullscreen });

  const selectedNode = useMemo(
    () => selectedExecutionMapNode(graph, allEvents, selection),
    [allEvents, graph, selection],
  );
  const { density, evidenceMode } = useMemo(
    () => executionMapDetailSettings(detailMode),
    [detailMode],
  );
  const timelineScope = executionMapTimelineScopeForNode(selectedNode);
  const focus = useMemo(
    () => executionMapFocusProjection(graph, selection, focusMode, allEvents),
    [allEvents, focusMode, graph, selection],
  );
  const projection = useMemo(
    () =>
      executionMapProjection({
        allEvents,
        density,
        entityEvents,
        evidenceMode,
        focus,
        graph,
        selectedEdgeKind,
        selection,
      }),
    [allEvents, density, entityEvents, evidenceMode, focus, graph, selectedEdgeKind, selection],
  );
  const timelineEvents = useMemo(
    () =>
      visibleExecutionMapTimelineEvents({
        allEvents,
        entityEvents,
        focus,
        selection,
        timelineScope,
      }),
    [allEvents, entityEvents, focus, selection, timelineScope],
  );
  const relatedEventIds = useMemo(
    () => relatedExecutionMapTimelineEventIds(focus, entityEvents),
    [entityEvents, focus],
  );
  const timelinePanelStyle = useMemo(
    () =>
      ({
        '--ui-execution-map-timeline-event-width': `${executionMapTimelineEventWidth}px`,
        '--ui-execution-map-timeline-event-gap': `${executionMapTimelineEventGap}px`,
        '--ui-execution-map-timeline-panel-width': `${executionMapTimelinePanelWidth(
          timelineEvents.length,
        )}px`,
      }) as CSSProperties,
    [timelineEvents.length],
  );
  const searchResults = useMemo(
    () => executionMapSearchResults(graph, allEvents, searchQuery),
    [allEvents, graph, searchQuery],
  );

  useExecutionMapSelectionFocus({
    density,
    events: allEvents,
    flow,
    graph,
    readMapViewportBounds,
    selection,
  });

  if (!graph) {
    return (
      <section className={['ui-execution-map', className].filter(Boolean).join(' ')}>
        <div className="ui-execution-map__empty">Execution graph is not available.</div>
      </section>
    );
  }

  const selectedObject = selection ? selectedPayload(graph, allEvents, selection) : null;

  const activateSelection = (
    nextSelection: ExecutionMapSelection,
    nextActiveBubble: ExecutionMapBubble | null = 'inspector',
  ) => {
    const activation = executionMapSelectionActivation({
      activeBubble,
      nextActiveBubble,
      nextSelection,
      selection,
      timelineBehavior,
      timelineOpen,
    });
    if (!executionMapSelectionActivationChanged(activation)) return;

    applyExecutionMapSelectionActivation(activation, {
      setActiveBubble,
      setSelection,
      setTimelineOpen,
    });
    notifyExecutionMapSelection(activation, {
      graph,
      onSelectEdge,
      onSelectEntity,
      onSelectEvent,
    });
  };

  const activateSearchResult = (result: ExecutionMapSearchResult) => {
    activateSelection(
      { kind: result.kind, key: result.key },
      result.kind === 'node' ? 'inspector' : 'search',
    );
  };

  return (
    <section
      className={['ui-execution-map', className].filter(Boolean).join(' ')}
      data-density={density}
      data-fullscreen={fullscreen ? 'true' : 'false'}
      data-inspector-open={activeBubble === 'inspector' ? 'true' : 'false'}
      data-timeline-open={timelineOpen ? 'true' : 'false'}
      ref={rootRef}
    >
      <ExecutionMapHeader subtitle={subtitle} title={title} />

      <section className="ui-execution-map__stage" aria-label="Execution map canvas" ref={stageRef}>
        <ReactFlow
          colorMode="dark"
          edges={[...projection.edges]}
          fitView
          maxZoom={EXECUTION_MAP_MAX_ZOOM}
          minZoom={0.2}
          nodes={[...projection.nodes]}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          onEdgeClick={(_event, edge) => activateSelection({ kind: 'edge', key: edge.id }, null)}
          onNodeClick={(_event, node) => activateRuntimeNodeSelection(node, activateSelection)}
          panOnScroll
          panOnScrollMode={PanOnScrollMode.Free}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="var(--ui-execution-map-grid)"
            gap={28}
            variant={BackgroundVariant.Lines}
          />
          <MiniMap
            className="ui-execution-map__minimap"
            pannable
            zoomable
            nodeColor={executionMapMiniMapNodeColor}
            position="bottom-right"
            style={{ width: 160, height: 192 }}
          />
          <ExecutionMapRefreshPanel
            onRefresh={onRefresh}
            refreshLabel={refreshLabel}
            refreshing={refreshing}
          />
          <Panel className="ui-execution-map__viewport-panel" position="bottom-right">
            <ViewportControls
              fullscreen={fullscreen}
              onFit={() => void flow.fitView({ duration: 220, padding: 0.12 })}
              onToggleFullscreen={() => setFullscreen((current) => !current)}
              onZoomIn={() => void flow.zoomIn({ duration: 160 })}
              onZoomOut={() => void flow.zoomOut({ duration: 160 })}
            />
          </Panel>
          <Panel className="ui-execution-map__bubble-stack" position="top-left">
            <SearchPanel
              open={activeBubble === 'search'}
              query={searchQuery}
              results={searchResults}
              onQueryChange={setSearchQuery}
              onSelectResult={activateSearchResult}
              onOpen={() => setActiveBubble('search')}
            />
            <ExecutionLinksPanel
              edges={graph.edges}
              open={activeBubble === 'links'}
              selectedKind={selectedEdgeKind}
              onSelectKind={(kind) =>
                setSelectedEdgeKind((current) => (current === kind ? null : kind))
              }
              onOpen={() => setActiveBubble('links')}
            />
            <MapControlsPanel
              detailMode={detailMode}
              focusMode={focusMode}
              open={activeBubble === 'controls'}
              timelineBehavior={timelineBehavior}
              onDetailModeChange={setDetailMode}
              onFocusModeChange={setFocusMode}
              onOpen={() => setActiveBubble('controls')}
              onTimelineBehaviorChange={setTimelineBehavior}
            />
            <EventVocabularyPanel
              open={activeBubble === 'vocabulary'}
              onOpen={() => setActiveBubble('vocabulary')}
            />
          </Panel>
          <Panel className="ui-execution-map__inspector-panel" position="top-right">
            <FloatingInspector
              open={activeBubble === 'inspector'}
              selectedObject={selectedObject}
            />
          </Panel>
          <Panel
            className={[
              'ui-execution-map__timeline-panel',
              timelineOpen ? 'ui-execution-map__timeline-panel--open' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            position="bottom-left"
            style={timelinePanelStyle}
          >
            <FloatingTimeline
              events={timelineEvents}
              open={timelineOpen}
              relatedEventIds={relatedEventIds}
              selectedEventId={selectedExecutionMapEventId(selection)}
              onOpen={() => setTimelineOpen(true)}
              onSelect={(event) => activateSelection({ kind: 'event', key: event.eventId }, null)}
            />
          </Panel>
        </ReactFlow>
        <ExecutionMapCanvasCursor stageRef={stageRef} />
      </section>
    </section>
  );
}
