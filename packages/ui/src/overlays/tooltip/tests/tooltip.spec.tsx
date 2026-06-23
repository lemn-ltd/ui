import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Tooltip } from '../tooltip.js';

describe('Tooltip', () => {
  afterEach(() => cleanup());

  it('renders the trigger child', () => {
    render(
      <Tooltip content="Hint">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    expect(screen.getByRole('button', { name: 'Trigger' })).not.toBeNull();
  });

  it('maps the placement to the Radix side on the open content', async () => {
    render(
      <Tooltip content="Hint" delayDuration={0} placement="right">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      const content = document.querySelector('.ui-tooltip');
      expect(content).not.toBeNull();
      expect(content?.getAttribute('data-side')).toBe('right');
    });
  });

  it('defaults to the neutral tone', async () => {
    render(
      <Tooltip content="Hint" delayDuration={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      expect(document.querySelector('.ui-tooltip')?.getAttribute('data-tone')).toBe('neutral');
    });
  });

  it('projects the tone onto the open content', async () => {
    render(
      <Tooltip content="Hint" delayDuration={0} tone="warn">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      expect(document.querySelector('.ui-tooltip')?.getAttribute('data-tone')).toBe('warn');
    });
  });
});
