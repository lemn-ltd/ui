import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type PlannerState, PlannerStatus } from '../planner-status.js';

describe('PlannerStatus', () => {
  afterEach(() => cleanup());

  it('pulses only while planning or streaming', () => {
    const expectations: Record<PlannerState, string> = {
      idle: 'false',
      planning: 'true',
      streaming: 'true',
      compiled: 'false',
      failed: 'false',
    };
    for (const [state, pulse] of Object.entries(expectations) as [PlannerState, string][]) {
      const { container, unmount } = render(<PlannerStatus state={state} />);
      const chip = container.querySelector('.ui-planner-status');
      expect(chip?.getAttribute('data-planner-state')).toBe(state);
      expect(chip?.getAttribute('data-pulse')).toBe(pulse);
      unmount();
    }
  });
});
