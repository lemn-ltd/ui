import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type AutomationStatus, AutomationStatusBadge } from '../automation-status-badge.js';

const STATUSES: readonly AutomationStatus[] = [
  'draft',
  'published',
  'archived',
  'queued',
  'scheduled',
  'due',
  'running',
  'waiting',
  'completed',
  'failed',
  'cancelled',
];

describe('AutomationStatusBadge', () => {
  afterEach(() => cleanup());

  it('maps each status onto a stable data attribute', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<AutomationStatusBadge status={status} />);
      expect(
        container
          .querySelector('.ui-automation-status-badge')
          ?.getAttribute('data-automation-status'),
      ).toBe(status);
      unmount();
    }
  });

  it('uses a soft dotted badge by default and humanizes the label', () => {
    const { container } = render(<AutomationStatusBadge status="published" />);
    const badge = container.querySelector('.ui-automation-status-badge');
    expect(badge?.getAttribute('data-variant')).toBe('soft');
    expect(badge?.getAttribute('data-dot')).toBe('on');
    expect(badge?.textContent).toBe('Published');
  });

  it('allows a caller-provided label and variant', () => {
    const { container } = render(
      <AutomationStatusBadge label="Live" status="running" variant="subtle" />,
    );
    const badge = container.querySelector('.ui-automation-status-badge');
    expect(badge?.getAttribute('data-variant')).toBe('subtle');
    expect(badge?.textContent).toBe('Live');
  });
});
