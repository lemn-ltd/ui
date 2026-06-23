import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type TabItem, Tabs } from '../tabs.js';

const ITEMS: readonly TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'issues', label: 'Issues', count: 7 },
  { value: 'settings', label: 'Settings' },
];

describe('Tabs', () => {
  afterEach(() => cleanup());

  it('marks the active trigger with data-state active', () => {
    const { container } = render(<Tabs items={ITEMS} onValueChange={vi.fn()} value="issues" />);
    const triggers = Array.from(container.querySelectorAll('.ui-tabs__tab'));
    const active = triggers.find((tab) => tab.getAttribute('data-state') === 'active');
    expect(active?.textContent).toContain('Issues');
  });

  it('renders the count badge with its number', () => {
    const { container } = render(<Tabs items={ITEMS} onValueChange={vi.fn()} value="overview" />);
    const count = container.querySelector('.ui-tabs__count');
    expect(count).not.toBeNull();
    expect(count?.textContent).toBe('7');
  });

  it('calls onValueChange with the clicked tab value', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs items={ITEMS} onValueChange={onValueChange} value="overview" />,
    );
    const triggers = Array.from(container.querySelectorAll('.ui-tabs__tab'));
    const settings = triggers.find((tab) => tab.textContent?.includes('Settings'));
    // Radix Tabs activates the value on mousedown (primary button), not click.
    fireEvent.mouseDown(settings as Element, { button: 0 });
    expect(onValueChange).toHaveBeenCalledWith('settings');
  });

  it('defaults to horizontal orientation', () => {
    const { container } = render(<Tabs items={ITEMS} onValueChange={vi.fn()} value="overview" />);
    const tab = container.querySelector('.ui-tabs__tab');
    expect(tab?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('marks every trigger vertical when orientation is vertical', () => {
    const { container } = render(
      <Tabs items={ITEMS} onValueChange={vi.fn()} orientation="vertical" value="overview" />,
    );
    const triggers = Array.from(container.querySelectorAll('.ui-tabs__tab'));
    expect(triggers).toHaveLength(3);
    expect(triggers.every((tab) => tab.getAttribute('data-orientation') === 'vertical')).toBe(true);
  });
});
