import type { RefObject } from 'react';
import { useCallback, useEffect } from 'react';
import { EXECUTION_MAP_MAX_ZOOM } from './execution-map-state.js';
import {
  executionMapEventTargetKey,
  executionMapNodeWidth,
  executionMapRefKey,
} from './model/execution-map-model.js';
import type {
  ExecutionMapDensity,
  ExecutionMapEvent,
  ExecutionMapGraph,
  ExecutionMapSelection,
} from './types.js';

interface ExecutionMapLocalRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

interface ExecutionMapViewportBounds {
  readonly stageRect: ExecutionMapLocalRect | null;
  readonly inspectorRect: ExecutionMapLocalRect | null;
  readonly timelineRect: ExecutionMapLocalRect | null;
  readonly viewportControlsRect: ExecutionMapLocalRect | null;
  readonly minimapRect: ExecutionMapLocalRect | null;
  readonly overlayInset: number;
  readonly visibleMapViewport: ExecutionMapLocalRect | null;
}

interface ExecutionMapViewportNode {
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  readonly measured?: {
    readonly width?: number;
    readonly height?: number;
  };
}

interface ExecutionMapViewportController {
  getNode: (id: string) => ExecutionMapViewportNode | undefined;
  getZoom: () => number;
  setViewport: (
    viewport: { readonly x: number; readonly y: number; readonly zoom: number },
    options?: { readonly duration?: number },
  ) => Promise<boolean>;
}

const EMPTY_EXECUTION_MAP_VIEWPORT_BOUNDS: ExecutionMapViewportBounds = {
  inspectorRect: null,
  minimapRect: null,
  overlayInset: 0,
  stageRect: null,
  timelineRect: null,
  viewportControlsRect: null,
  visibleMapViewport: null,
};

export function useExecutionMapViewportReader({
  inspectorOpen,
  stageRef,
  timelineOpen,
}: {
  readonly inspectorOpen: boolean;
  readonly stageRef: RefObject<HTMLElement | null>;
  readonly timelineOpen: boolean;
}): () => ExecutionMapViewportBounds {
  return useCallback(
    () =>
      readExecutionMapViewportBounds({
        inspectorOpen,
        stage: stageRef.current,
        timelineOpen,
      }),
    [inspectorOpen, stageRef, timelineOpen],
  );
}

export function useExecutionMapSelectionFocus({
  density,
  events,
  flow,
  graph,
  readMapViewportBounds,
  selection,
}: {
  readonly density: ExecutionMapDensity;
  readonly events: readonly ExecutionMapEvent[];
  readonly flow: ExecutionMapViewportController;
  readonly graph: ExecutionMapGraph | null;
  readonly readMapViewportBounds: () => ExecutionMapViewportBounds;
  readonly selection: ExecutionMapSelection | null;
}): void {
  useEffect(() => {
    if (!graph || !selection) return;
    let measureFrame = 0;
    let focusFrame = 0;

    measureFrame = window.requestAnimationFrame(() => {
      focusFrame = window.requestAnimationFrame(() => {
        focusExecutionMapSelection({
          density,
          events,
          flow,
          graph,
          selection,
          viewportBounds: readMapViewportBounds(),
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(measureFrame);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [density, events, flow, graph, readMapViewportBounds, selection]);
}

function focusExecutionMapSelection({
  density,
  events,
  flow,
  graph,
  selection,
  viewportBounds,
}: {
  readonly density: ExecutionMapDensity;
  readonly events: readonly ExecutionMapEvent[];
  readonly flow: ExecutionMapViewportController;
  readonly graph: ExecutionMapGraph;
  readonly selection: ExecutionMapSelection;
  readonly viewportBounds: ExecutionMapViewportBounds;
}): void {
  const targetRect = executionMapFocusTargetRect({ density, events, flow, graph, selection });
  const visibleMapViewport = viewportBounds.visibleMapViewport;
  if (!targetRect || !visibleMapViewport) return;
  if (visibleMapViewport.width <= 0 || visibleMapViewport.height <= 0) return;

  const zoom = executionMapSelectionZoom(selection, flow);
  const viewportCenterX = visibleMapViewport.left + visibleMapViewport.width / 2;
  const viewportCenterY = visibleMapViewport.top + visibleMapViewport.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  void flow.setViewport(
    {
      x: Math.round(viewportCenterX - targetCenterX * zoom),
      y: Math.round(viewportCenterY - targetCenterY * zoom),
      zoom,
    },
    { duration: 360 },
  );
}

function executionMapSelectionZoom(
  selection: ExecutionMapSelection,
  flow: ExecutionMapViewportController,
): number {
  return selection.kind === 'node' ? EXECUTION_MAP_MAX_ZOOM : flow.getZoom();
}

function executionMapFocusTargetRect({
  density,
  events,
  flow,
  graph,
  selection,
}: {
  readonly density: ExecutionMapDensity;
  readonly events: readonly ExecutionMapEvent[];
  readonly flow: ExecutionMapViewportController;
  readonly graph: ExecutionMapGraph;
  readonly selection: ExecutionMapSelection;
}): ExecutionMapLocalRect | null {
  if (selection.kind === 'edge') {
    const edge = graph.edges.find((candidate) => candidate.edgeId === selection.key);
    if (!edge) return null;

    const fromRect = executionMapRenderedNodeRect(
      flow.getNode(executionMapRefKey(edge.from)),
      density,
    );
    const toRect = executionMapRenderedNodeRect(flow.getNode(executionMapRefKey(edge.to)), density);
    return executionMapUnionRects([fromRect, toRect]) ?? toRect ?? fromRect;
  }

  const targetKey =
    selection.kind === 'event'
      ? executionMapEventTargetKey(graph, events, selection.key)
      : selection.key;
  if (!targetKey) return null;
  return executionMapRenderedNodeRect(flow.getNode(targetKey), density);
}

function executionMapRenderedNodeRect(
  node: ExecutionMapViewportNode | undefined,
  density: ExecutionMapDensity,
): ExecutionMapLocalRect | null {
  if (!node) return null;
  const width = node.measured?.width ?? executionMapNodeWidth(density);
  const height = node.measured?.height ?? 112;
  return executionMapRectFromEdges({
    bottom: node.position.y + height,
    left: node.position.x,
    right: node.position.x + width,
    top: node.position.y,
  });
}

function executionMapUnionRects(
  rects: readonly (ExecutionMapLocalRect | null)[],
): ExecutionMapLocalRect | null {
  const available = rects.filter((rect): rect is ExecutionMapLocalRect => rect !== null);
  if (available.length === 0) return null;

  return executionMapRectFromEdges({
    bottom: Math.max(...available.map((rect) => rect.bottom)),
    left: Math.min(...available.map((rect) => rect.left)),
    right: Math.max(...available.map((rect) => rect.right)),
    top: Math.min(...available.map((rect) => rect.top)),
  });
}

function readExecutionMapViewportBounds({
  inspectorOpen,
  stage,
  timelineOpen,
}: {
  readonly inspectorOpen: boolean;
  readonly stage: HTMLElement | null;
  readonly timelineOpen: boolean;
}): ExecutionMapViewportBounds {
  if (!stage) return EMPTY_EXECUTION_MAP_VIEWPORT_BOUNDS;

  const stageDomRect = stage.getBoundingClientRect();
  const stageRect = executionMapRectFromEdges({
    bottom: stageDomRect.height,
    left: 0,
    right: stageDomRect.width,
    top: 0,
  });
  if (stageRect.width <= 0 || stageRect.height <= 0) {
    return { ...EMPTY_EXECUTION_MAP_VIEWPORT_BOUNDS, stageRect };
  }

  const overlayInset = executionMapCssPixelValue(stage, '--ui-execution-map-overlay-inset');
  const inspectorRect = inspectorOpen
    ? executionMapElementLocalRect(
        stageDomRect,
        stage.querySelector('.ui-execution-map__inspector-panel .ui-execution-map__inspector'),
      )
    : null;
  const timelineRect = timelineOpen
    ? executionMapElementLocalRect(
        stageDomRect,
        stage.querySelector('.ui-execution-map__timeline-panel--open .ui-execution-map__timeline'),
      )
    : null;
  const viewportControlsRect = executionMapElementLocalRect(
    stageDomRect,
    stage.querySelector('.ui-execution-map__viewport-controls'),
  );
  const minimapRect = executionMapElementLocalRect(
    stageDomRect,
    stage.querySelector('.react-flow__panel.ui-execution-map__minimap'),
  );
  const visibleMapViewport = getExecutionMapSafeRect({
    inspectorRect,
    minimapRect,
    overlayInset,
    stageRect,
    timelineRect,
    viewportControlsRect,
  });

  return {
    inspectorRect,
    minimapRect,
    overlayInset,
    stageRect,
    timelineRect,
    viewportControlsRect,
    visibleMapViewport,
  };
}

function getExecutionMapSafeRect({
  inspectorRect,
  minimapRect,
  overlayInset,
  stageRect,
  timelineRect,
  viewportControlsRect,
}: {
  readonly inspectorRect: ExecutionMapLocalRect | null;
  readonly minimapRect: ExecutionMapLocalRect | null;
  readonly overlayInset: number;
  readonly stageRect: ExecutionMapLocalRect;
  readonly timelineRect: ExecutionMapLocalRect | null;
  readonly viewportControlsRect: ExecutionMapLocalRect | null;
}): ExecutionMapLocalRect {
  let left = stageRect.left;
  let top = stageRect.top;
  let right = stageRect.right;
  let bottom = stageRect.bottom;

  for (const overlayRect of [inspectorRect, timelineRect, viewportControlsRect, minimapRect]) {
    ({ bottom, left, right, top } = subtractExecutionMapEdgeOverlay({
      edges: { bottom, left, right, top },
      overlayInset,
      overlayRect,
      stageRect,
    }));
  }

  return executionMapReadableRect({ bottom, left, right, top }, stageRect);
}

function subtractExecutionMapEdgeOverlay({
  edges,
  overlayInset,
  overlayRect,
  stageRect,
}: {
  readonly edges: Pick<ExecutionMapLocalRect, 'bottom' | 'left' | 'right' | 'top'>;
  readonly overlayInset: number;
  readonly overlayRect: ExecutionMapLocalRect | null;
  readonly stageRect: ExecutionMapLocalRect;
}): Pick<ExecutionMapLocalRect, 'bottom' | 'left' | 'right' | 'top'> {
  if (!overlayRect) return edges;
  const safeRect = executionMapRectFromEdges(edges);
  const horizontalOverlap =
    Math.min(safeRect.right, overlayRect.right) - Math.max(safeRect.left, overlayRect.left);
  const verticalOverlap =
    Math.min(safeRect.bottom, overlayRect.bottom) - Math.max(safeRect.top, overlayRect.top);
  if (horizontalOverlap <= 0 || verticalOverlap <= 0) return edges;

  return subtractTouchedExecutionMapEdges({
    edges,
    horizontalRatio: horizontalOverlap / safeRect.width,
    overlayInset,
    overlayRect,
    stageRect,
    verticalRatio: verticalOverlap / safeRect.height,
  });
}

function subtractTouchedExecutionMapEdges({
  edges,
  horizontalRatio,
  overlayInset,
  overlayRect,
  stageRect,
  verticalRatio,
}: {
  readonly edges: Pick<ExecutionMapLocalRect, 'bottom' | 'left' | 'right' | 'top'>;
  readonly horizontalRatio: number;
  readonly overlayInset: number;
  readonly overlayRect: ExecutionMapLocalRect;
  readonly stageRect: ExecutionMapLocalRect;
  readonly verticalRatio: number;
}): Pick<ExecutionMapLocalRect, 'bottom' | 'left' | 'right' | 'top'> {
  const edgeTolerance = Math.max(8, overlayInset + 2);
  const significantVertical = verticalRatio >= 0.32;
  const significantHorizontal = horizontalRatio >= 0.32;
  return {
    right:
      overlayRect.right >= stageRect.right - edgeTolerance && significantVertical
        ? Math.min(edges.right, overlayRect.left - overlayInset)
        : edges.right,
    left:
      overlayRect.left <= stageRect.left + edgeTolerance && significantVertical
        ? Math.max(edges.left, overlayRect.right + overlayInset)
        : edges.left,
    bottom:
      overlayRect.bottom >= stageRect.bottom - edgeTolerance && significantHorizontal
        ? Math.min(edges.bottom, overlayRect.top - overlayInset)
        : edges.bottom,
    top:
      overlayRect.top <= stageRect.top + edgeTolerance && significantHorizontal
        ? Math.max(edges.top, overlayRect.bottom + overlayInset)
        : edges.top,
  };
}

function executionMapReadableRect(
  edges: Pick<ExecutionMapLocalRect, 'bottom' | 'left' | 'right' | 'top'>,
  fallback: ExecutionMapLocalRect,
): ExecutionMapLocalRect {
  const minimumWidth = Math.min(280, fallback.width);
  const minimumHeight = Math.min(220, fallback.height);
  const width = edges.right - edges.left;
  const height = edges.bottom - edges.top;

  return executionMapRectFromEdges({
    bottom: height >= minimumHeight ? edges.bottom : fallback.bottom,
    left: width >= minimumWidth ? edges.left : fallback.left,
    right: width >= minimumWidth ? edges.right : fallback.right,
    top: height >= minimumHeight ? edges.top : fallback.top,
  });
}

function executionMapElementLocalRect(
  stageDomRect: DOMRect,
  element: Element | null,
): ExecutionMapLocalRect | null {
  if (!element) return null;
  const elementRect = element.getBoundingClientRect();
  const left = Math.max(stageDomRect.left, elementRect.left) - stageDomRect.left;
  const top = Math.max(stageDomRect.top, elementRect.top) - stageDomRect.top;
  const right = Math.min(stageDomRect.right, elementRect.right) - stageDomRect.left;
  const bottom = Math.min(stageDomRect.bottom, elementRect.bottom) - stageDomRect.top;
  if (right <= left || bottom <= top) return null;
  return executionMapRectFromEdges({ bottom, left, right, top });
}

function executionMapRectFromEdges(
  edges: Pick<ExecutionMapLocalRect, 'bottom' | 'left' | 'right' | 'top'>,
): ExecutionMapLocalRect {
  return {
    bottom: edges.bottom,
    height: edges.bottom - edges.top,
    left: edges.left,
    right: edges.right,
    top: edges.top,
    width: edges.right - edges.left,
  };
}

function executionMapCssPixelValue(element: Element, propertyName: string): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(propertyName));
  return Number.isFinite(value) ? value : 0;
}
