import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SystemBar, type SystemBarTone } from '../system-bar.js';

const TONE_GLYPH: Record<SystemBarTone, string> = {
  info: 'lucide-info',
  warn: 'lucide-circle-alert',
  danger: 'lucide-circle-alert',
};

describe('SystemBar', () => {
  afterEach(() => cleanup());

  it('defaults to the info tone', () => {
    const { container } = render(<SystemBar>Maintenance window</SystemBar>);
    expect(container.querySelector('.ui-system-bar')?.getAttribute('data-tone')).toBe('info');
  });

  it('maps each of the three tones to data-tone and its contract glyph', () => {
    for (const tone of Object.keys(TONE_GLYPH) as SystemBarTone[]) {
      const { container, unmount } = render(<SystemBar tone={tone}>Notice</SystemBar>);
      const bar = container.querySelector('.ui-system-bar');
      expect(bar?.getAttribute('data-tone')).toBe(tone);
      expect(bar?.querySelector(`.ui-system-bar__icon.${TONE_GLYPH[tone]}`)).not.toBeNull();
      unmount();
    }
  });

  it('renders the message slot', () => {
    const { container } = render(<SystemBar>Read-only mode</SystemBar>);
    expect(container.querySelector('.ui-system-bar__message')?.textContent).toBe('Read-only mode');
  });

  it('collapses the action slot when no action is provided', () => {
    const { container } = render(<SystemBar>Notice</SystemBar>);
    expect(container.querySelector('.ui-system-bar__action')).toBeNull();
  });

  it('renders the optional action slot when provided', () => {
    const { container } = render(
      <SystemBar action={<button type="button">Reload</button>}>Notice</SystemBar>,
    );
    expect(container.querySelector('.ui-system-bar__action')?.textContent).toBe('Reload');
  });

  it('omits the dismiss control without onDismiss and fires it when present', () => {
    const { container: withoutDismiss } = render(<SystemBar>Notice</SystemBar>);
    expect(withoutDismiss.querySelector('.ui-system-bar__dismiss')).toBeNull();

    const onDismiss = vi.fn();
    const { container } = render(<SystemBar onDismiss={onDismiss}>Notice</SystemBar>);
    container.querySelector<HTMLButtonElement>('.ui-system-bar__dismiss')?.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
