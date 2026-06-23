import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { NodeAttempt } from '../node-attempts-table.js';
import { NodeAttemptsTable } from '../node-attempts-table.js';

const ATTEMPTS: readonly NodeAttempt[] = [
  { node: 'fetch', type: 'action', attempt: 1, state: 'completed', duration: '0.8s' },
  {
    node: 'deploy',
    type: 'action',
    attempt: 3,
    state: 'failed',
    duration: '2.4s',
    error: 'timeout',
  },
];

describe('NodeAttemptsTable', () => {
  afterEach(() => cleanup());

  it('renders a data table with a row per attempt', () => {
    const { container } = render(<NodeAttemptsTable attempts={ATTEMPTS} />);
    expect(container.querySelector('.ui-data-table')).not.toBeNull();
    expect(container.querySelectorAll('.ui-node-state-chip')).toHaveLength(2);
    expect(container.textContent).toContain('fetch');
    expect(container.textContent).toContain('timeout');
  });

  it('falls back to an empty state with no table when there are no attempts', () => {
    const { container } = render(<NodeAttemptsTable attempts={[]} />);
    expect(container.querySelector('.ui-data-table')).toBeNull();
    expect(container.querySelector('.ui-empty-state')).not.toBeNull();
  });
});
