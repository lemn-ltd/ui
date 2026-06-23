import type { Edge as FlowEdge, Node as FlowNode } from '@xyflow/react';
import type {
  ExecutionMapEdgeVisualState,
  ExecutionMapNodeVisualState,
} from './model/execution-map-model.js';
import type { ExecutionMapEdge, ExecutionMapEntity } from './types.js';

export interface RuntimeNodeData extends Record<string, unknown> {
  readonly entity: ExecutionMapEntity;
  readonly actorKey: string;
  readonly actorLabel: string;
  readonly laneId: string;
  readonly laneName: string;
  readonly icon: string;
  readonly title: string;
  readonly subtitle: string;
  readonly eventCount: number;
  readonly collapsed: boolean;
  readonly visualState: ExecutionMapNodeVisualState;
  readonly selected: boolean;
  readonly focus: boolean;
}

export interface LaneHeaderData extends Record<string, unknown> {
  readonly laneId: string;
  readonly name: string;
  readonly icon: string;
  readonly count: number;
  readonly activeCount: number;
  readonly issueCount: number;
  readonly active: boolean;
}

export interface LaneRowData extends Record<string, unknown> {
  readonly actorKey: string;
  readonly label: string;
  readonly subtitle: string;
  readonly height: number;
  readonly active: boolean;
  readonly count: number;
}

export interface TimelineCursorData extends Record<string, unknown> {
  readonly eventSeq: string;
  readonly eventType: string;
  readonly height: number;
}

export interface MapEdgeData extends Record<string, unknown> {
  readonly edge: ExecutionMapEdge;
  readonly visualState: ExecutionMapEdgeVisualState;
  readonly bundled: boolean;
  readonly bundleCount: number;
}

export type RuntimeMapNode = FlowNode<RuntimeNodeData, 'runtimeNode'>;
export type LaneHeaderMapNode = FlowNode<LaneHeaderData, 'laneHeader'>;
export type LaneRowMapNode = FlowNode<LaneRowData, 'laneRow'>;
export type TimelineCursorMapNode = FlowNode<TimelineCursorData, 'timelineCursor'>;
export type MapNode = RuntimeMapNode | LaneHeaderMapNode | LaneRowMapNode | TimelineCursorMapNode;
export type MapEdge = FlowEdge<MapEdgeData>;
