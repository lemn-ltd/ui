import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type TabItem, Tabs } from '../tabs.js';

const ITEMS: readonly TabItem[] = [
  { value: 'overview', label: 'Overview', content: <p>Overview panel</p> },
  { value: 'issues', label: 'Issues', count: 7, content: <p>Issues panel</p> },
  { value: 'settings', label: 'Settings', content: <p>Settings panel</p> },
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

  it('renders real labelled panels with stable trigger relationships', () => {
    const { getByRole } = render(
      <Tabs aria-label="Project views" id="project" items={ITEMS} value="issues" />,
    );
    const tab = getByRole('tab', { name: /Issues/ });
    const panel = getByRole('tabpanel');
    expect(tab.getAttribute('aria-controls')).toBe('project-panel-1');
    expect(panel.id).toBe('project-panel-1');
    expect(panel.getAttribute('aria-labelledby')).toBe('project-tab-1');
    expect(panel.textContent).toContain('Issues panel');
  });

  it('supports uncontrolled selection and keeps inactive panels mounted by default', () => {
    const { getByRole, container } = render(
      <Tabs defaultValue="overview" items={ITEMS} onValueChange={vi.fn()} />,
    );
    fireEvent.mouseDown(getByRole('tab', { name: /Settings/ }), { button: 0 });
    expect(getByRole('tabpanel').textContent).toContain('Settings panel');
    expect(container.querySelectorAll('.ui-tabs__panel')).toHaveLength(3);
  });

  it('lazy mounts panels only when requested', () => {
    const { container } = render(
      <Tabs items={ITEMS} mountStrategy="lazy" value="overview" />,
    );
    expect(container.querySelectorAll('.ui-tabs__panel')).toHaveLength(1);
  });
});
