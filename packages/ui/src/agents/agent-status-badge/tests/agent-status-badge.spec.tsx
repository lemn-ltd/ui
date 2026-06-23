import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentStatusBadge, type AgentStatusBadgeStatus } from '../agent-status-badge.js';

const STATUSES: readonly AgentStatusBadgeStatus[] = [
  'idle',
  'queued',
  'running',
  'waiting',
  'completed',
  'failed',
  'cancelled',
];

describe('AgentStatusBadge', () => {
  afterEach(() => cleanup());

  it('maps each status onto a stable data attribute', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<AgentStatusBadge status={status} />);
      expect(
        container.querySelector('.ui-agent-status-badge')?.getAttribute('data-agent-status'),
      ).toBe(status);
      unmount();
    }
  });

  it('uses a soft dotted badge by default', () => {
    const { container } = render(<AgentStatusBadge status="running" />);
    const badge = container.querySelector('.ui-agent-status-badge');
    expect(badge?.getAttribute('data-variant')).toBe('soft');
    expect(badge?.getAttribute('data-dot')).toBe('on');
    expect(badge?.textContent).toBe('Running');
  });

  it('allows a caller-provided label and badge variant', () => {
    const { container } = render(
      <AgentStatusBadge label="Streaming" status="running" variant="subtle" />,
    );
    const badge = container.querySelector('.ui-agent-status-badge');
    expect(badge?.getAttribute('data-variant')).toBe('subtle');
    expect(badge?.textContent).toBe('Streaming');
  });
});
