import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { GraphCanvasEdge, GraphCanvasNode } from '../graph-canvas.js';
import { GraphCanvas } from '../graph-canvas.js';

const NODES: readonly GraphCanvasNode[] = [
  { id: 'a', kind: 'trigger', name: 'schedule', state: 'completed', x: 0, y: 0 },
  { id: 'b', kind: 'agent', name: 'classify', state: 'running', x: 0, y: 120 },
];

const EDGES: readonly GraphCanvasEdge[] = [{ from: 'a', to: 'b' }];

describe('GraphCanvas', () => {
  afterEach(() => cleanup());

  it('renders one node card and one edge path', () => {
    const { container } = render(<GraphCanvas edges={EDGES} nodes={NODES} />);
    expect(container.querySelectorAll('.ui-graph-node')).toHaveLength(2);
    expect(container.querySelectorAll('.ui-graph-canvas__edge')).toHaveLength(1);
  });

  it('drops edges that reference an unknown node', () => {
    const { container } = render(
      <GraphCanvas edges={[{ from: 'a', to: 'missing' }]} nodes={NODES} />,
    );
    expect(container.querySelectorAll('.ui-graph-canvas__edge')).toHaveLength(0);
  });

  it('shows an empty state and no legend when there are no nodes', () => {
    const { container } = render(<GraphCanvas nodes={[]} />);
    expect(container.querySelector('.ui-empty-state')).not.toBeNull();
    expect(container.querySelector('.ui-graph-canvas__legend')).toBeNull();
  });
});
