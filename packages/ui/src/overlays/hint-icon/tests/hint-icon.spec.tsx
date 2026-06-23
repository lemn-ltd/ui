import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HintIcon } from '../hint-icon.js';

describe('HintIcon', () => {
  afterEach(() => cleanup());

  it('exposes the label as the trigger accessible name', () => {
    render(<HintIcon icon="lock" label="Service-owned definitions are read-only." />);

    expect(
      screen.getByRole('button', { name: 'Service-owned definitions are read-only.' }),
    ).not.toBeNull();
  });

  it('reveals the label in a toned tooltip on focus', async () => {
    render(<HintIcon icon="triangle-alert" label="Read-only" tone="warn" />);

    fireEvent.focus(screen.getByRole('button', { name: 'Read-only' }));

    await waitFor(() => {
      const tooltip = document.querySelector('.ui-tooltip');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.getAttribute('data-tone')).toBe('warn');
      expect(tooltip?.textContent).toContain('Read-only');
    });
  });

  it('reflects the tone on the trigger', () => {
    render(<HintIcon icon="triangle-alert" label="Read-only" tone="warn" />);

    expect(screen.getByRole('button', { name: 'Read-only' }).getAttribute('data-tone')).toBe(
      'warn',
    );
  });

  it('defaults to the neutral tone', () => {
    render(<HintIcon icon="info" label="More info" />);

    expect(screen.getByRole('button', { name: 'More info' }).getAttribute('data-tone')).toBe(
      'neutral',
    );
  });
});
