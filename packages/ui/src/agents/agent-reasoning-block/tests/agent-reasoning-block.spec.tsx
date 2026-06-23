import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentReasoningBlock } from '../agent-reasoning-block.js';

describe('AgentReasoningBlock', () => {
  afterEach(cleanup);

  it('opens streaming reasoning by default', () => {
    render(
      <AgentReasoningBlock
        entries={[
          {
            id: 'reasoning-1',
            state: 'streaming',
            text: 'Checking the current runtime contract.',
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Thinking' })).toBeDefined();
    expect(screen.getByText('Checking the current runtime contract.')).toBeDefined();
  });

  it('labels completed reasoning with seconds when duration is known', () => {
    render(
      <AgentReasoningBlock
        durationMs={8_400}
        entries={[
          {
            id: 'reasoning-1',
            state: 'done',
            text: 'Resolved the contract.',
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Thought for 8s' })).toBeDefined();
  });

  it('labels completed reasoning with minutes and seconds', () => {
    render(
      <AgentReasoningBlock
        durationMs={85_000}
        entries={[
          {
            id: 'reasoning-1',
            state: 'done',
            text: 'Resolved the contract.',
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Thought for 1m 25s' })).toBeDefined();
  });

  it('does not fabricate duration for already completed reasoning', () => {
    render(
      <AgentReasoningBlock
        entries={[
          {
            id: 'reasoning-1',
            state: 'done',
            text: 'Resolved the contract.',
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Thought' })).toBeDefined();
    expect(screen.queryByText(/Thought for/u)).toBeNull();
  });

  it('does not render empty reasoning entries', () => {
    const { container } = render(<AgentReasoningBlock entries={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
