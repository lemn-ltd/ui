import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FloatingWindow } from '../floating-window.js';

describe('FloatingWindow', () => {
  afterEach(() => cleanup());

  it('renders title and children when open', () => {
    render(
      <FloatingWindow onOpenChange={() => {}} open title="Run evidence">
        <div className="ui-floating-window__body">Body</div>
      </FloatingWindow>,
    );

    expect(screen.getByRole('dialog', { name: 'Run evidence' })).toBeDefined();
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('renders nothing when closed', () => {
    render(
      <FloatingWindow onOpenChange={() => {}} open={false} title="Closed">
        <div>Body</div>
      </FloatingWindow>,
    );

    expect(document.querySelector('.ui-floating-window')).toBeNull();
  });

  it('is non-modal and renders no scrim', () => {
    render(
      <FloatingWindow onOpenChange={() => {}} open title="No scrim">
        <div>Body</div>
      </FloatingWindow>,
    );

    expect(document.querySelector('.ui-floating-window')).not.toBeNull();
    expect(document.querySelector('[data-radix-dialog-overlay]')).toBeNull();
  });

  it('routes close through onOpenChange', () => {
    const onOpenChange = vi.fn();
    render(
      <FloatingWindow onOpenChange={onOpenChange} open title="Closable">
        <div>Body</div>
      </FloatingWindow>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('toggles expanded state from the header control', () => {
    render(
      <FloatingWindow onOpenChange={() => {}} open title="Expandable">
        <div>Body</div>
      </FloatingWindow>,
    );
    const root = document.querySelector('.ui-floating-window');

    expect(root?.getAttribute('data-expanded')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Expand to full screen' }));
    expect(root?.getAttribute('data-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Restore size' }));
    expect(root?.getAttribute('data-expanded')).toBe('false');
  });
});
