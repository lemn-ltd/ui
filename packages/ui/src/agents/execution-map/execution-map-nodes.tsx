import { Handle, type NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';
import type {
  LaneHeaderMapNode,
  LaneRowMapNode,
  RuntimeMapNode,
  TimelineCursorMapNode,
} from './execution-map-flow-types.js';
import { executionMapShortId } from './model/execution-map-model.js';

export const RuntimeNode = memo(function RuntimeNode({ data }: NodeProps<RuntimeMapNode>) {
  return (
    <article
      className="ui-execution-map__node"
      data-actor={data.actorKey}
      data-collapsed={data.collapsed ? 'true' : 'false'}
      data-focus={data.focus ? 'true' : 'false'}
      data-kind={data.entity.entityKind}
      data-lane={data.laneId}
      data-selected={data.selected ? 'true' : 'false'}
      data-visual={data.visualState}
    >
      <Handle className="ui-execution-map__node-handle" position={Position.Left} type="target" />
      <Handle className="ui-execution-map__node-handle" position={Position.Right} type="source" />
      <div className="ui-execution-map__node-top">
        <span className="ui-execution-map__node-kind">
          <span className="ui-execution-map__node-icon">{data.icon}</span>
          <span>{data.entity.entityKind}</span>
        </span>
        <strong>{data.entity.status}</strong>
      </div>
      <h3>{data.title}</h3>
      <p>{data.subtitle}</p>
      <footer>
        <span>{executionMapShortId(data.entity.entityId)}</span>
        <span>{data.eventCount} events</span>
      </footer>
    </article>
  );
});

export const LaneHeaderNode = memo(function LaneHeaderNode({ data }: NodeProps<LaneHeaderMapNode>) {
  return (
    <section className="ui-execution-map__lane-header" data-active={data.active ? 'true' : 'false'}>
      <div>
        <span>{data.icon}</span>
        <strong>{data.name}</strong>
      </div>
      <footer>
        <span>{data.count}</span>
        <span>
          {data.issueCount > 0 ? `${data.issueCount} issue` : `${data.activeCount} active`}
        </span>
      </footer>
    </section>
  );
});

export const LaneRowNode = memo(function LaneRowNode({ data }: NodeProps<LaneRowMapNode>) {
  return (
    <section
      className="ui-execution-map__lane-row"
      data-active={data.active ? 'true' : 'false'}
      style={{ height: data.height }}
    >
      <strong>{data.label}</strong>
      <span>{data.subtitle}</span>
      <small>{data.count} nodes</small>
    </section>
  );
});

export const TimelineCursorNode = memo(function TimelineCursorNode({
  data,
}: NodeProps<TimelineCursorMapNode>) {
  return (
    <section className="ui-execution-map__timeline-cursor" style={{ height: data.height }}>
      <span>{data.eventSeq}</span>
    </section>
  );
});

export const nodeTypes = {
  laneHeader: LaneHeaderNode,
  laneRow: LaneRowNode,
  runtimeNode: RuntimeNode,
  timelineCursor: TimelineCursorNode,
};
