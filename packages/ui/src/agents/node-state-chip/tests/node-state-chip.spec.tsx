import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type NodeState, NodeStateChip } from '../node-state-chip.js';

const STATES: readonly NodeState[] = [
  'idle',
  'running',
  'waiting',
  'completed',
  'failed',
  'skipped',
];

describe('NodeStateChip', () => {
  afterEach(() => cleanup());

  it('renders a dotted badge by default with a stable state hook', () => {
    for (const state of STATES) {
      const { container, unmount } = render(<NodeStateChip state={state} />);
      const chip = container.querySelector('.ui-node-state-chip');
      expect(chip?.getAttribute('data-node-state')).toBe(state);
      expect(chip?.getAttribute('data-appearance')).toBe('badge');
      expect(chip?.getAttribute('data-dot')).toBe('on');
      unmount();
    }
  });

  it('renders a bare dot + label for the inline appearance', () => {
    const { container } = render(<NodeStateChip appearance="inline" state="running" />);
    const chip = container.querySelector('.ui-node-state-chip');
    expect(chip?.getAttribute('data-appearance')).toBe('inline');
    expect(container.querySelector('.ui-node-state-chip__dot')).not.toBeNull();
    expect(chip?.textContent).toBe('running');
  });
});
