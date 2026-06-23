import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ApprovalPanel } from '../approval-panel.js';

function approveButton(container: HTMLElement): HTMLButtonElement | undefined {
  return [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Approve',
  );
}

describe('ApprovalPanel', () => {
  afterEach(() => cleanup());

  it('enables approval for a clean pending request', () => {
    const { container } = render(<ApprovalPanel status="pending" title="Approve · deploy" />);
    expect(approveButton(container)?.disabled).toBe(false);
    expect(container.querySelector('[data-status="pending"]')).not.toBeNull();
  });

  it('blocks approval and shows a warning when a conflict is present', () => {
    const { container } = render(
      <ApprovalPanel
        conflict={{
          kind: 'graph-hash',
          title: 'Graph-hash conflict',
          description: 'Re-validate before approving.',
        }}
        status="pending"
        title="Approve · deploy"
      />,
    );
    expect(approveButton(container)?.disabled).toBe(true);
    expect(container.querySelector('.ui-info-banner[data-variant="warn"]')).not.toBeNull();
    expect(container.textContent).toContain('Graph-hash conflict');
  });
});
