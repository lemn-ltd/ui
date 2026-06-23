import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ConfirmDialog } from '../confirm-dialog.js';

describe('ConfirmDialog', () => {
  afterEach(() => cleanup());

  it('renders a secondary cancel and a primary confirm by default', () => {
    render(<ConfirmDialog defaultOpen description="This cannot be undone." title="Delete?" />);
    const buttons = Array.from(document.querySelectorAll('.ui-button'));
    const variants = buttons.map((b) => b.getAttribute('data-variant'));
    expect(variants).toContain('secondary');
    expect(variants).toContain('primary');
    expect(variants).not.toContain('danger');
  });

  it('drives the confirm button to danger for the danger variant', () => {
    render(
      <ConfirmDialog
        defaultOpen
        description="This permanently deletes the record."
        title="Delete?"
        variant="danger"
      />,
    );
    const variants = Array.from(document.querySelectorAll('.ui-button')).map((b) =>
      b.getAttribute('data-variant'),
    );
    expect(variants).toContain('secondary');
    expect(variants).toContain('danger');
    expect(variants).not.toContain('primary');
  });

  it('passes button props and disabled state to the actions', () => {
    render(
      <ConfirmDialog
        cancelDisabled
        confirmDisabled
        cancelTestId="cancel-action"
        confirmTestId="confirm-action"
        defaultOpen
        description="The action cannot continue while disabled."
        title="Delete?"
      />,
    );

    expect(
      document.querySelector<HTMLButtonElement>('[data-testid="cancel-action"]')?.disabled,
    ).toBe(true);
    expect(
      document.querySelector<HTMLButtonElement>('[data-testid="confirm-action"]')?.disabled,
    ).toBe(true);
  });
});
