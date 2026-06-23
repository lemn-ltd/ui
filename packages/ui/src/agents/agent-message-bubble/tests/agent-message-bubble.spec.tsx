import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentMessageBubble } from '../agent-message-bubble.js';

const NOW = Date.parse('2026-06-11T12:25:00.000Z');
const FOUR_MINUTES_AGO = '2026-06-11T12:21:00.000Z';

describe('AgentMessageBubble', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders transparent full-width agent markdown with footer metadata', () => {
    const { container } = render(
      <AgentMessageBubble content="Visible **answer**." createdAt={FOUR_MINUTES_AGO} now={NOW} />,
    );

    const bubble = container.querySelector('.ui-agent-message-bubble');
    expect(bubble?.getAttribute('data-message-role')).toBe('agent');
    expect(bubble?.querySelector('strong')?.textContent).toBe('answer');
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeDefined();
    expect(screen.getByText('4m ago')).toBeDefined();
  });

  it('copies the markdown source text', () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<AgentMessageBubble content="Visible **answer**." />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy message' }));

    expect(writeText).toHaveBeenCalledWith('Visible **answer**.');
    expect(screen.getByRole('button', { name: 'Copied message' })).toBeDefined();
  });
});
