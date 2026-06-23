import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog } from '../dialog.js';

describe('Dialog', () => {
  afterEach(() => cleanup());

  it('renders the title, description, body and a close affordance when open', () => {
    render(
      <Dialog
        defaultOpen
        description="Review the details below."
        footer={<button type="button">Done</button>}
        title="Settings"
      >
        <p>Body content</p>
      </Dialog>,
    );

    expect(document.querySelector('.ui-dialog__title')?.textContent).toBe('Settings');
    expect(document.querySelector('.ui-dialog__description')?.textContent).toBe(
      'Review the details below.',
    );
    expect(document.querySelector('.ui-dialog__body')?.textContent).toBe('Body content');
    expect(document.querySelector('.ui-dialog__divider')).not.toBeNull();

    const close = document.querySelector('.ui-icon-button[aria-label="Close"]');
    expect(close).not.toBeNull();
  });

  it('defaults to the sm size and reflects an explicit size on data-size', () => {
    const { rerender } = render(
      <Dialog defaultOpen title="Settings">
        <p>Body</p>
      </Dialog>,
    );
    expect(document.querySelector('.ui-dialog')?.getAttribute('data-size')).toBe('sm');

    rerender(
      <Dialog defaultOpen size="lg" title="Settings">
        <p>Body</p>
      </Dialog>,
    );
    expect(document.querySelector('.ui-dialog')?.getAttribute('data-size')).toBe('lg');
  });

  it('omits the footer divider when no footer is provided', () => {
    render(
      <Dialog defaultOpen title="Settings">
        <p>Body</p>
      </Dialog>,
    );
    expect(document.querySelector('.ui-dialog__divider')).toBeNull();
  });

  it('shows a back control in place of the title and keeps the title for assistive tech', () => {
    const onBack = vi.fn();
    render(
      <Dialog defaultOpen onBack={onBack} title="Google">
        <p>Body</p>
      </Dialog>,
    );

    const back = document.querySelector('.ui-dialog__back');
    expect(back?.textContent).toContain('Back');
    // The visible title is replaced; the accessible title is preserved off-screen.
    expect(document.querySelector('.ui-dialog__title')).toBeNull();
    expect(document.querySelector('.ui-dialog__sr-only')?.textContent).toBe('Google');

    fireEvent.click(back as Element);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
