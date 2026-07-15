import { act, cleanup, render } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dismissToasts, notify, Toaster, type ToasterPosition } from '../toaster.js';

const POSITION_AXES: Record<ToasterPosition, [string, string]> = {
  'top-right': ['top', 'right'],
  'bottom-right': ['bottom', 'right'],
  'top-center': ['top', 'center'],
};

async function flush(): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(30);
    await Promise.resolve();
  });
}

async function dismissAndDrainToasts(): Promise<void> {
  await act(async () => {
    dismissToasts();
    vi.runOnlyPendingTimers();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(async () => {
  await dismissAndDrainToasts();
  cleanup();
  vi.useRealTimers();
});

describe('Toaster', () => {
  it('defaults to the top-right position', async () => {
    const { container } = render(<Toaster />);
    toast.info('Heads up');
    await flush();
    const viewport = container.querySelector('[data-sonner-toaster]');
    expect(viewport?.getAttribute('data-y-position')).toBe('top');
    expect(viewport?.getAttribute('data-x-position')).toBe('right');
  });

  it('maps each position prop onto the sonner viewport', async () => {
    for (const position of Object.keys(POSITION_AXES) as ToasterPosition[]) {
      const { container, unmount } = render(<Toaster position={position} />);
      toast.info('Heads up');
      await flush();
      const viewport = container.querySelector('[data-sonner-toaster]');
      expect(viewport?.getAttribute('data-y-position')).toBe(POSITION_AXES[position][0]);
      expect(viewport?.getAttribute('data-x-position')).toBe(POSITION_AXES[position][1]);
      await dismissAndDrainToasts();
      unmount();
    }
  });

  it('lets the theme follow the package default rather than a pinned override', async () => {
    const { container } = render(<Toaster />);
    toast.info('Heads up');
    await flush();
    // sonner only reflects an explicit theme prop; the package never passes one,
    // so tone colors remain owned by the surrounding compiled brand scope.
    expect(
      container.querySelector('[data-sonner-toaster]')?.getAttribute('data-sonner-theme'),
    ).toBe('light');
  });

  it('renders fired toasts onto the canonical Toast tone surface', async () => {
    const { container } = render(<Toaster />);
    toast.success('Saved');
    toast.error('Failed');
    await flush();
    const toasts = container.querySelectorAll('[data-sonner-toast]');
    expect(toasts.length).toBe(2);
    for (const node of toasts) {
      expect(node.classList.contains('ui-toast')).toBe(true);
    }
    const types = Array.from(toasts, (node) => node.getAttribute('data-type'));
    expect(types).toContain('success');
    expect(types).toContain('error');
  });
});

describe('notify', () => {
  it('maps each package tone onto its sonner type', async () => {
    const { container } = render(<Toaster />);
    notify('success', 'Saved');
    notify('info', 'Heads up');
    notify('warn', 'Careful');
    notify('danger', 'Failed');
    await flush();
    const types = Array.from(container.querySelectorAll('[data-sonner-toast]'), (node) =>
      node.getAttribute('data-type'),
    );
    expect(types).toContain('success');
    expect(types).toContain('info');
    expect(types).toContain('warning');
    expect(types).toContain('error');
  });

  it('renders the detail as the toast description', async () => {
    const { container } = render(<Toaster />);
    notify('info', 'Sync started', { detail: 'Fetching the latest data.' });
    await flush();
    expect(container.querySelector('.ui-toast__detail')?.textContent).toBe(
      'Fetching the latest data.',
    );
  });
});
