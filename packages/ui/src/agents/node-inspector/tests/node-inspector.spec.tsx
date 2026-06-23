import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NodeInspector } from '../node-inspector.js';

describe('NodeInspector', () => {
  afterEach(() => cleanup());

  it('shows an empty state with no node selected', () => {
    const { container } = render(<NodeInspector />);
    expect(container.querySelector('.ui-empty-state')).not.toBeNull();
    expect(container.querySelector('.ui-node-inspector__header')).toBeNull();
  });

  it('renders the node name, a kind pill, and field rows', () => {
    const { container } = render(
      <NodeInspector
        fields={[{ label: 'Agent ref', value: 'support-classifier@v4', mono: true }]}
        kind="agent"
        nodeName="classify"
      />,
    );
    expect(container.querySelector('.ui-node-inspector__title')?.textContent).toBe('classify');
    expect(container.textContent).toContain('agent node');
    const value = container.querySelector('.ui-node-inspector__field-value');
    expect(value?.getAttribute('data-mono')).toBe('true');
    expect(value?.textContent).toBe('support-classifier@v4');
  });
});
