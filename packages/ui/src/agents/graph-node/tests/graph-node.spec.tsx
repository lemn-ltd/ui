import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GraphNode } from '../graph-node.js';

describe('GraphNode', () => {
  afterEach(() => cleanup());

  it('renders the kind label and name, and exposes state/selected hooks', () => {
    const { container } = render(
      <GraphNode kind="human_task" name="approve" selected state="waiting" />,
    );
    const node = container.querySelector('.ui-graph-node');
    expect(node?.getAttribute('data-state')).toBe('waiting');
    expect(node?.getAttribute('data-kind')).toBe('human_task');
    expect(node?.getAttribute('data-selected')).toBe('true');
    expect(node?.textContent).toContain('Human task');
    expect(node?.textContent).toContain('approve');
  });

  it('forwards clicks through the button', () => {
    const onClick = vi.fn();
    const { container } = render(<GraphNode kind="action" name="deploy" onClick={onClick} />);
    const node = container.querySelector('.ui-graph-node');
    if (node) fireEvent.click(node);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
