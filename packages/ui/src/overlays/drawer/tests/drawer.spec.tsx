import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Drawer } from '../drawer.js';

describe('Drawer', () => {
  afterEach(() => cleanup());

  it('renders the title, description and content when open without a visible close affordance', () => {
    render(
      <Drawer
        defaultOpen
        description="Live agent session."
        footer={<button type="button">Done</button>}
        title="Agent session"
      >
        <p>Conversation</p>
      </Drawer>,
    );

    expect(document.querySelector('.ui-drawer__title')?.textContent).toBe('Agent session');
    expect(document.querySelector('.ui-drawer__description')?.textContent).toBe(
      'Live agent session.',
    );
    expect(document.querySelector('.ui-drawer__content')?.textContent).toBe('Conversation');
    expect(document.querySelector('.ui-drawer__divider')).not.toBeNull();

    const close = document.querySelector('.ui-icon-button[aria-label="Close"]');
    expect(close).toBeNull();
  });

  it('defaults to the md width and reflects an explicit width on data-width', () => {
    const { rerender } = render(
      <Drawer defaultOpen title="Agent session">
        <p>Body</p>
      </Drawer>,
    );
    expect(document.querySelector('.ui-drawer')?.getAttribute('data-width')).toBe('md');

    rerender(
      <Drawer defaultOpen title="Agent session" width="lg">
        <p>Body</p>
      </Drawer>,
    );
    expect(document.querySelector('.ui-drawer')?.getAttribute('data-width')).toBe('lg');
  });

  it('omits the footer divider when no footer is provided', () => {
    render(
      <Drawer defaultOpen title="Agent session">
        <p>Body</p>
      </Drawer>,
    );
    expect(document.querySelector('.ui-drawer__divider')).toBeNull();
  });

  it('merges an extra className onto the panel', () => {
    render(
      <Drawer className="agent-launch-drawer" defaultOpen title="Agent session">
        <p>Body</p>
      </Drawer>,
    );
    const panel = document.querySelector('.ui-drawer');
    expect(panel?.classList.contains('agent-launch-drawer')).toBe(true);
  });
});
