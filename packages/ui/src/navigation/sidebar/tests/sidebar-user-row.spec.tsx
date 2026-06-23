import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MenuItem } from '../../../overlays/index.js';
import { SidebarUserRow } from '../sidebar-user-row.js';

describe('SidebarUserRow', () => {
  afterEach(() => cleanup());

  it('renders the name and email when expanded', () => {
    const { container } = render(
      <SidebarUserRow email="ada@example.com" initials="AL" name="Ada Lovelace">
        <MenuItem>Sign out</MenuItem>
      </SidebarUserRow>,
    );
    expect(container.querySelector('.ui-sidebar-user-row__name')?.textContent).toBe('Ada Lovelace');
    expect(container.querySelector('.ui-sidebar-user-row__email')?.textContent).toBe(
      'ada@example.com',
    );
  });

  it('hides the name and email when collapsed, keeping only the avatar', () => {
    const { container } = render(
      <SidebarUserRow collapsed email="ada@example.com" initials="AL" name="Ada Lovelace">
        <MenuItem>Sign out</MenuItem>
      </SidebarUserRow>,
    );
    expect(container.querySelector('.ui-sidebar-user-row__name')).toBeNull();
    expect(container.querySelector('.ui-sidebar-user-row__email')).toBeNull();
    expect(container.querySelector('.ui-avatar')).not.toBeNull();
  });

  it('wraps a Menu whose trigger button is the user row', () => {
    const { container } = render(
      <SidebarUserRow initials="AL" name="Ada Lovelace">
        <MenuItem>Sign out</MenuItem>
      </SidebarUserRow>,
    );
    const trigger = container.querySelector('button.ui-sidebar-user-row');
    expect(trigger).not.toBeNull();
  });
});
