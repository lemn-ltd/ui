import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AGENT_ACTIVITY_LINE_STATES,
  AgentActivityLine,
  type AgentActivityLineState,
} from '../agent-activity-line.js';

const DEFAULT_TEXT: Record<AgentActivityLineState, string> = {
  connecting: 'is connecting...',
  reconnecting: 'is reconnecting...',
  disconnected: 'is disconnected',
  idle: 'is idle',
  working: 'is working...',
  confirming: 'is waiting for confirmation',
  reactivating: 'is reactivating the sandbox...',
  cancelling: 'is cancelling run...',
  cancelled: 'cancelled run',
};

describe('AgentActivityLine', () => {
  afterEach(() => cleanup());

  it('renders the identity and action text with stable state hooks', () => {
    const { container } = render(
      <AgentActivityLine
        agentName="Researcher"
        pulse
        state="working"
        statusText="is running pnpm test"
        toolName="shell"
      />,
    );

    const line = container.querySelector('.ui-agent-activity-line');
    expect(line?.getAttribute('data-state')).toBe('working');
    expect(line?.getAttribute('data-tone')).toBe('muted');
    expect(line?.getAttribute('data-pulse')).toBe('true');
    expect(screen.getByText('Researcher')).toBeDefined();
    expect(screen.queryByText('orchestrator')).toBeNull();
    expect(screen.getByText('is running pnpm test')).toBeDefined();
    expect(screen.getByText('shell')).toBeDefined();
  });

  it('keeps the supported state set explicit', () => {
    expect(AGENT_ACTIVITY_LINE_STATES).toEqual([
      'connecting',
      'reconnecting',
      'disconnected',
      'idle',
      'working',
      'confirming',
      'reactivating',
      'cancelling',
      'cancelled',
    ]);
  });

  it('maps every supported state to a default phrase', () => {
    for (const state of AGENT_ACTIVITY_LINE_STATES) {
      const { unmount } = render(<AgentActivityLine agentName="Orchestrator" state={state} />);
      expect(screen.getByText(DEFAULT_TEXT[state])).toBeDefined();
      unmount();
    }
  });

  it('supports an icon-only identity when no agent name is passed', () => {
    const { container } = render(<AgentActivityLine state="idle" />);

    const line = container.querySelector('.ui-agent-activity-line');
    expect(line?.getAttribute('data-pulse')).toBe('false');
    expect(container.querySelector('.ui-agent-activity-line__name')).toBeNull();
    expect(screen.getByText('is idle')).toBeDefined();
  });

  it('allows a visual tone override without changing the state', () => {
    const { container } = render(
      <AgentActivityLine
        agentName="Planner"
        state="working"
        statusText="is compacting context..."
        tone="info"
      />,
    );

    const line = container.querySelector('.ui-agent-activity-line');
    expect(line?.getAttribute('data-state')).toBe('working');
    expect(line?.getAttribute('data-tone')).toBe('info');
  });
});
