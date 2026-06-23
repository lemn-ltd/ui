import type { RefObject } from 'react';
import { useEffect } from 'react';
import {
  executionMapEventTargetKey,
  executionMapNodeByKey,
  executionMapRefKey,
} from './model/execution-map-model.js';
import type {
  ExecutionMapDensity,
  ExecutionMapEntity,
  ExecutionMapEvent,
  ExecutionMapEvidenceMode,
  ExecutionMapGraph,
  ExecutionMapSelection,
  ExecutionMapTimelineScope,
} from './types.js';

export type ExecutionMapBubble = 'search' | 'links' | 'vocabulary' | 'controls' | 'inspector';
export type ExecutionMapDetailMode = 'overview' | 'balanced' | 'detailed';
export type ExecutionMapTimelineBehavior = 'manual' | 'node-click';

export const EXECUTION_MAP_MAX_ZOOM = 1.4;

export function executionMapDetailSettings(detailMode: ExecutionMapDetailMode): {
  readonly density: ExecutionMapDensity;
  readonly evidenceMode: ExecutionMapEvidenceMode;
} {
  if (detailMode === 'overview') return { density: 'compact', evidenceMode: 'collapsed' };
  if (detailMode === 'balanced') return { density: 'comfortable', evidenceMode: 'collapsed' };
  return { density: 'comfortable', evidenceMode: 'expanded' };
}

export function executionMapNodeForSelection(
  graph: ExecutionMapGraph,
  events: readonly ExecutionMapEvent[],
  selection: ExecutionMapSelection,
): ExecutionMapEntity | null {
  if (selection.kind === 'node') return executionMapNodeByKey(graph, selection.key);
  if (selection.kind === 'event') {
    const targetKey = executionMapEventTargetKey(graph, events, selection.key);
    return targetKey ? executionMapNodeByKey(graph, targetKey) : null;
  }
  const edge = graph.edges.find((candidate) => candidate.edgeId === selection.key);
  return edge ? executionMapNodeByKey(graph, executionMapRefKey(edge.to)) : null;
}

export function executionMapTimelineScopeForNode(
  selectedNode: ExecutionMapEntity | null,
): ExecutionMapTimelineScope {
  return selectedNode ? 'focus' : 'all';
}

export function executionMapSelectionsEqual(
  left: ExecutionMapSelection | null,
  right: ExecutionMapSelection,
): boolean {
  return left?.kind === right.kind && left.key === right.key;
}

export function useExecutionMapOverlayDismiss({
  enabled,
  rootRef,
  setActiveBubble,
  setTimelineOpen,
}: {
  readonly enabled: boolean;
  readonly rootRef: RefObject<HTMLElement | null>;
  readonly setActiveBubble: (bubble: ExecutionMapBubble | null) => void;
  readonly setTimelineOpen: (open: boolean) => void;
}): void {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const root = rootRef.current;
      const clickedWithinRoot = root?.contains(target) === true;
      const clickedInsideOwnedBubble =
        clickedWithinRoot && target.closest('.ui-execution-map__floating-bubble') !== null;
      const clickedGraphSelectionTarget =
        clickedWithinRoot && isExecutionMapGraphSelectionTarget(target);

      if (!clickedInsideOwnedBubble && !clickedGraphSelectionTarget) {
        setActiveBubble(null);
        setTimelineOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [enabled, rootRef, setActiveBubble, setTimelineOpen]);
}

export function useExecutionMapFullscreen({
  flow,
  fullscreen,
  setFullscreen,
}: {
  readonly flow: ExecutionMapFitViewController;
  readonly fullscreen: boolean;
  readonly setFullscreen: (fullscreen: boolean) => void;
}): void {
  useEffect(() => {
    if (!fullscreen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreen, setFullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    window.setTimeout(() => void flow.fitView({ duration: 220, padding: 0.12 }), 0);
  }, [flow, fullscreen]);
}

interface ExecutionMapFitViewController {
  fitView: (options?: {
    readonly duration?: number;
    readonly padding?: number;
  }) => Promise<boolean>;
}

function isExecutionMapGraphSelectionTarget(target: Element): boolean {
  return (
    target.closest('.ui-execution-map__node, .react-flow__edge, .react-flow__edge-path') !== null
  );
}
