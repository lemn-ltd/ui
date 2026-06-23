import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserMessageBubble } from '../user-message-bubble.js';

const NOW = Date.parse('2026-06-11T12:25:00.000Z');
const FOUR_MINUTES_AGO = '2026-06-11T12:21:00.000Z';

describe('UserMessageBubble', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders a right-aligned user bubble with footer metadata', () => {
    const { container } = render(
      <UserMessageBubble content="Run the migration." createdAt={FOUR_MINUTES_AGO} now={NOW} />,
    );

    const bubble = container.querySelector('.ui-user-message-bubble');
    expect(bubble?.getAttribute('data-message-role')).toBe('user');
    expect(bubble?.textContent).toContain('Run the migration.');
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeDefined();
    expect(screen.getByText('4m ago')).toBeDefined();
  });

  it('copies the plain user message text', () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<UserMessageBubble content="Run the migration." />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy message' }));

    expect(writeText).toHaveBeenCalledWith('Run the migration.');
    expect(screen.getByRole('button', { name: 'Copied message' })).toBeDefined();
  });
});
