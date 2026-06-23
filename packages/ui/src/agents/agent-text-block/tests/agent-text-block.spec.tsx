import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentTextBlock } from '../agent-text-block.js';

describe('AgentTextBlock', () => {
  afterEach(cleanup);

  it('renders text entries through Markdown', () => {
    render(
      <AgentTextBlock entries={[{ id: 'text-1', state: 'done', text: 'Final **answer**.' }]} />,
    );

    expect(screen.getByText('answer').tagName).toBe('STRONG');
    expect(screen.getByText(/Final/)).toBeDefined();
  });

  it('does not render while hidden', () => {
    const { container } = render(
      <AgentTextBlock
        entries={[{ id: 'text-1', state: 'streaming', text: 'Draft answer.' }]}
        visible={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
