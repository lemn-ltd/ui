import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ProposalNode } from '../proposal-preview.js';
import { ProposalPreview } from '../proposal-preview.js';

const NODES: readonly ProposalNode[] = [
  { kind: 'trigger', label: 'pull_request' },
  { kind: 'agent', label: 'classify_urgency' },
];

function acceptButton(container: HTMLElement): HTMLButtonElement | undefined {
  return [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Accept proposal',
  );
}

describe('ProposalPreview', () => {
  afterEach(() => cleanup());

  it('unlocks accept only on a clean compile', () => {
    const { container, rerender } = render(
      <ProposalPreview compile={{ status: 'error', message: 'failed' }} nodes={NODES} />,
    );
    expect(acceptButton(container)?.disabled).toBe(true);

    rerender(<ProposalPreview compile={{ status: 'success', message: 'ok' }} nodes={NODES} />);
    expect(acceptButton(container)?.disabled).toBe(false);
  });

  it('renders an empty state instead of actions with no proposal', () => {
    const { container } = render(<ProposalPreview nodes={[]} />);
    expect(container.querySelector('.ui-empty-state')).not.toBeNull();
    expect(acceptButton(container)).toBeUndefined();
  });
});
