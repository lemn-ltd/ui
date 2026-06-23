import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShellContextProvider } from '../../../layout/screen-shell/shell-context.js';
import { Sidebar, type SidebarNavGroup } from '../sidebar.js';

const SINGLE_GROUP: readonly SidebarNavGroup[] = [
  {
    items: [
      { id: 'home', label: 'Home', icon: 'layout-grid' },
      { id: 'sessions', label: 'Sessions', icon: 'list', active: true },
    ],
  },
];

const GROUPS_WITH_HEADERS: readonly SidebarNavGroup[] = [
  {
    header: 'Workspace',
    items: [{ id: 'home', label: 'Home', icon: 'layout-grid' }],
  },
  {
    header: 'Admin',
    items: [{ id: 'settings', label: 'Settings', icon: 'settings' }],
  },
];

describe('Sidebar', () => {
  afterEach(() => cleanup());

  it('maps every collapse mode to data-mode', () => {
    const modes = ['rail', 'expanded', 'hidden'] as const;
    for (const mode of modes) {
      const { container, unmount } = render(<Sidebar groups={SINGLE_GROUP} mode={mode} />);
      expect(container.querySelector('.ui-sidebar')?.getAttribute('data-mode')).toBe(mode);
      unmount();
    }
  });

  it('renders items without a group header when the group has none', () => {
    const { container } = render(<Sidebar groups={SINGLE_GROUP} mode="expanded" />);
    expect(container.querySelector('.ui-sidebar__group-header')).toBeNull();
    expect(container.querySelectorAll('.ui-sidebar__item')).toHaveLength(2);
  });

  it('renders a group header per group with a header in expanded mode', () => {
    const { container } = render(<Sidebar groups={GROUPS_WITH_HEADERS} mode="expanded" />);
    expect(container.querySelectorAll('.ui-sidebar__group-header')).toHaveLength(2);
  });

  it('marks the active item with data-active', () => {
    const { container } = render(<Sidebar groups={SINGLE_GROUP} mode="expanded" />);
    const active = container.querySelector('.ui-sidebar__item[data-active="true"]');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('Sessions');
  });

  it('renders the orgSwitcher, userRow and versionTag slot nodes', () => {
    const { getByTestId } = render(
      <Sidebar
        groups={SINGLE_GROUP}
        mode="expanded"
        orgSwitcher={<div data-testid="org" />}
        userRow={<div data-testid="user" />}
        versionTag={<div data-testid="version" />}
      />,
    );
    expect(getByTestId('org')).not.toBeNull();
    expect(getByTestId('user')).not.toBeNull();
    expect(getByTestId('version')).not.toBeNull();
  });

  it('hides item labels in rail mode', () => {
    const { container } = render(<Sidebar groups={SINGLE_GROUP} mode="rail" />);
    expect(container.querySelector('.ui-sidebar__item-label')).toBeNull();
  });

  it('follows the enclosing shell collapse mode when no explicit mode is set', () => {
    const { container } = render(
      <ShellContextProvider
        value={{
          isMobile: false,
          sidebar: { mode: 'hidden', collapse: 'expand-hide', setMode: () => {}, cycle: () => {} },
          dock: null,
        }}
      >
        <Sidebar groups={SINGLE_GROUP} variant="drill-in" />
      </ShellContextProvider>,
    );
    const aside = container.querySelector('.ui-sidebar');
    expect(aside?.getAttribute('data-mode')).toBe('hidden');
    expect(aside?.hasAttribute('inert')).toBe(true);
  });

  it('renders drill-in chrome with a back affordance and title', () => {
    const onBack = vi.fn();
    const { container, getByText } = render(
      <Sidebar
        back="Back"
        groups={SINGLE_GROUP}
        mode="expanded"
        onBack={onBack}
        title="Settings"
        variant="drill-in"
      />,
    );
    expect(container.querySelector('.ui-sidebar__drill')).not.toBeNull();
    expect(getByText('Settings')).not.toBeNull();
    getByText('Back').click();
    expect(onBack).toHaveBeenCalled();
  });
});
