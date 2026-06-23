import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Toast, type ToastTone } from '../toast.js';

const TONE_GLYPH: Record<ToastTone, string> = {
  success: 'lucide-check',
  info: 'lucide-info',
  warn: 'lucide-circle-alert',
  danger: 'lucide-circle-alert',
};

describe('Toast', () => {
  afterEach(() => cleanup());

  it('defaults to the info tone', () => {
    const { container } = render(<Toast title="Saved" />);
    expect(container.querySelector('.ui-toast')?.getAttribute('data-tone')).toBe('info');
  });

  it('maps each tone to data-tone and its contract glyph', () => {
    for (const tone of Object.keys(TONE_GLYPH) as ToastTone[]) {
      const { container, unmount } = render(<Toast title="Title" tone={tone} />);
      const toast = container.querySelector('.ui-toast');
      expect(toast?.getAttribute('data-tone')).toBe(tone);
      expect(toast?.querySelector(`.ui-toast__icon.${TONE_GLYPH[tone]}`)).not.toBeNull();
      unmount();
    }
  });

  it('renders the title and collapses the detail when absent', () => {
    const { container } = render(<Toast title="Title only" />);
    expect(container.querySelector('.ui-toast__title')?.textContent).toBe('Title only');
    expect(container.querySelector('.ui-toast__detail')).toBeNull();
  });

  it('renders the detail when provided', () => {
    const { container } = render(<Toast detail="Extra context" title="Title" />);
    expect(container.querySelector('.ui-toast__detail')?.textContent).toBe('Extra context');
  });

  it('omits the dismiss control when no onDismiss is given', () => {
    const { container } = render(<Toast title="Title" />);
    expect(container.querySelector('.ui-toast__dismiss')).toBeNull();
  });

  it('invokes onDismiss when the dismiss control is clicked', () => {
    const onDismiss = vi.fn();
    const { container } = render(<Toast onDismiss={onDismiss} title="Title" />);
    const dismiss = container.querySelector<HTMLButtonElement>('.ui-toast__dismiss');
    expect(dismiss).not.toBeNull();
    dismiss?.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
