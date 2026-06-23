import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WaitChip, type WaitState } from '../wait-chip.js';

const STATES: readonly WaitState[] = ['pending', 'active', 'completed', 'cancelled'];

describe('WaitChip', () => {
  afterEach(() => cleanup());

  it('exposes the wait state and renders the label', () => {
    for (const state of STATES) {
      const { container, unmount } = render(<WaitChip label="30s" state={state} />);
      const chip = container.querySelector('.ui-wait-chip');
      expect(chip?.getAttribute('data-wait-state')).toBe(state);
      expect(chip?.textContent).toContain('30s');
      unmount();
    }
  });
});
