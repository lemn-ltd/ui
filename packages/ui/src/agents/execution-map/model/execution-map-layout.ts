import type { ExecutionMapDensity, ExecutionMapEntity, ExecutionMapGraph } from '../types.js';
import {
  executionMapActorKeyForEntity,
  executionMapActorRowsForNodes,
} from './execution-map-actors.js';
import { executionMapEntityKey, executionMapLaneForEntity } from './execution-map-identity.js';
import {
  type ExecutionMapActorRowFrame,
  type ExecutionMapLaneLayout,
  executionMapLaneDefinitions,
} from './execution-map-model-types.js';

export function executionMapLayoutMetrics(density: ExecutionMapDensity) {
  return {
    firstRowY: 136,
    laneSpacing: density === 'compact' ? 280 : 340,
    minRowHeight: density === 'compact' ? 172 : 214,
    nodeWidth: executionMapNodeWidth(density),
    rowGap: density === 'compact' ? 28 : 36,
    rowTopPadding: density === 'compact' ? 112 : 132,
    stackStep: density === 'compact' ? 106 : 132,
  };
}

export function executionMapNodeWidth(density: ExecutionMapDensity): number {
  return density === 'compact' ? 216 : 250;
}

export function buildExecutionMapLaneLayout(
  graph: ExecutionMapGraph,
  nodes: readonly ExecutionMapEntity[],
  density: ExecutionMapDensity,
): ExecutionMapLaneLayout {
  const metrics = executionMapLayoutMetrics(density);
  const rowCounts = new Map<string, number>();
  const stackCounts = new Map<string, number>();
  for (const node of nodes) {
    const actorKey = executionMapActorKeyForEntity(graph, node);
    const lane = executionMapLaneForEntity(node);
    const stackKey = `${actorKey}:${lane.id}`;
    rowCounts.set(actorKey, (rowCounts.get(actorKey) ?? 0) + 1);
    stackCounts.set(stackKey, (stackCounts.get(stackKey) ?? 0) + 1);
  }

  const rowFrames: ExecutionMapActorRowFrame[] = [];
  let y = metrics.firstRowY;
  for (const actor of executionMapActorRowsForNodes(graph, nodes)) {
    const actorStackCounts = executionMapLaneDefinitions.map(
      (lane) => stackCounts.get(`${actor.actorKey}:${lane.id}`) ?? 0,
    );
    const maxStack = Math.max(1, ...actorStackCounts);
    const height = Math.max(
      metrics.minRowHeight,
      metrics.rowTopPadding + maxStack * metrics.stackStep,
    );
    rowFrames.push({
      actorKey: actor.actorKey,
      label: actor.label,
      subtitle: actor.subtitle,
      y,
      height,
      count: rowCounts.get(actor.actorKey) ?? 0,
    });
    y += height + metrics.rowGap;
  }

  const rowFrameByActor = new Map(rowFrames.map((row) => [row.actorKey, row]));
  const laneOffsets = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const actorKey = executionMapActorKeyForEntity(graph, node);
    const lane = executionMapLaneForEntity(node);
    const laneIndex = executionMapLaneDefinitions.findIndex(
      (definition) => definition.id === lane.id,
    );
    const stackKey = `${actorKey}:${lane.id}`;
    const index = laneOffsets.get(stackKey) ?? 0;
    const row = rowFrameByActor.get(actorKey) ?? rowFrames[0];
    laneOffsets.set(stackKey, index + 1);
    positions.set(executionMapEntityKey(node), {
      x: laneIndex * metrics.laneSpacing,
      y: (row?.y ?? metrics.firstRowY) + index * metrics.stackStep,
    });
  }

  return {
    positions,
    rowFrames,
    canvasWidth: (executionMapLaneDefinitions.length - 1) * metrics.laneSpacing + metrics.nodeWidth,
    canvasHeight: y,
  };
}
