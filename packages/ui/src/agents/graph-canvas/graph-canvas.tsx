import type { CSSProperties, HTMLAttributes, ReactElement } from 'react';
import { EmptyState } from '../../data-display/index.js';
import { GraphNode, type GraphNodeKind } from '../graph-node/graph-node.js';
import { type NodeState, NodeStateChip } from '../node-state-chip/node-state-chip.js';
import './graph-canvas.css';

export interface GraphCanvasNode {
  readonly id: string;
  readonly kind: GraphNodeKind;
  readonly name: string;
  readonly state?: NodeState;

  /** Absolute position within the canvas, in pixels from its top-left. */
  readonly x: number;
  readonly y: number;
  readonly width?: number;
}

export interface GraphCanvasEdge {
  readonly from: string;
  readonly to: string;
}

export interface GraphCanvasProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  readonly nodes: readonly GraphCanvasNode[];
  readonly edges?: readonly GraphCanvasEdge[];
  readonly selectedNodeId?: string;
  readonly onSelectNode?: (id: string) => void;
  readonly height?: number;
  readonly showLegend?: boolean;
  readonly legendStates?: readonly NodeState[];
  readonly emptyHint?: string;
}

const DEFAULT_NODE_WIDTH = 210;
const NODE_HEIGHT = 44;
const DEFAULT_HEIGHT = 460;
const DEFAULT_LEGEND_STATES: readonly NodeState[] = [
  'completed',
  'running',
  'waiting',
  'failed',
  'skipped',
  'idle',
];

interface Anchor {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

function anchorFor(node: GraphCanvasNode): Anchor {
  return { x: node.x, y: node.y, w: node.width ?? DEFAULT_NODE_WIDTH, h: NODE_HEIGHT };
}

/** An orthogonal elbow between two node boxes, routed down or across by dominant axis. */
function edgePath(source: Anchor, target: Anchor): string {
  const scx = source.x + source.w / 2;
  const scy = source.y + source.h / 2;
  const tcx = target.x + target.w / 2;
  const tcy = target.y + target.h / 2;

  const dx = tcx - scx;
  const dy = tcy - scy;

  if (Math.abs(dy) >= Math.abs(dx)) {
    const startY = dy >= 0 ? source.y + source.h : source.y;
    const endY = dy >= 0 ? target.y : target.y + target.h;
    const midY = (startY + endY) / 2;
    return `M ${scx} ${startY} V ${midY} H ${tcx} V ${endY}`;
  }

  const startX = dx >= 0 ? source.x + source.w : source.x;
  const endX = dx >= 0 ? target.x : target.x + target.w;
  const midX = (startX + endX) / 2;
  return `M ${startX} ${scy} H ${midX} V ${tcy} H ${endX}`;
}

/**
 * A read-only, presentational automation graph: typed nodes positioned on an
 * absolute canvas, connected by orthogonal edges, with an optional state legend.
 * It renders the authored topology and per-node execution state — it is not an
 * interactive editor. Node selection is delegated to the host through
 * `onSelectNode`; an empty topology falls back to a first-run empty state.
 */
export function GraphCanvas({
  nodes,
  edges = [],
  selectedNodeId,
  onSelectNode,
  height = DEFAULT_HEIGHT,
  showLegend = true,
  legendStates = DEFAULT_LEGEND_STATES,
  emptyHint = 'Add a trigger and nodes to see the run graph.',
  className,
  ...rest
}: GraphCanvasProps): ReactElement {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const isEmpty = nodes.length === 0;

  return (
    <div className={['ui-graph-canvas', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ui-graph-canvas__surface" style={{ height: `${height}px` }}>
        {isEmpty ? (
          <EmptyState description={emptyHint} icon="layout-grid" title="No graph yet" />
        ) : (
          <>
            <svg aria-hidden="true" className="ui-graph-canvas__edges" preserveAspectRatio="none">
              <title>Automation graph edges</title>
              {edges.map((edge) => {
                const source = byId.get(edge.from);
                const target = byId.get(edge.to);
                if (!source || !target) return null;
                return (
                  <path
                    className="ui-graph-canvas__edge"
                    d={edgePath(anchorFor(source), anchorFor(target))}
                    fill="none"
                    key={`${edge.from}->${edge.to}`}
                  />
                );
              })}
            </svg>

            {nodes.map((node) => {
              const style: CSSProperties = {
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width ?? DEFAULT_NODE_WIDTH}px`,
              };
              return (
                <div className="ui-graph-canvas__node" key={node.id} style={style}>
                  <GraphNode
                    kind={node.kind}
                    name={node.name}
                    onClick={onSelectNode ? () => onSelectNode(node.id) : undefined}
                    selected={node.id === selectedNodeId}
                    state={node.state}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {showLegend && !isEmpty ? (
        <div className="ui-graph-canvas__legend">
          {legendStates.map((state) => (
            <NodeStateChip appearance="inline" key={state} state={state} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
