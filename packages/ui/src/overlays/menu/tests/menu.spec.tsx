import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Menu, MenuItem } from '../menu.js';

function renderMenu() {
  return render(
    <Menu defaultOpen trigger={<button type="button">Open</button>}>
      <MenuItem icon="settings">Settings</MenuItem>
      <MenuItem icon="copy" shortcut="⌘C">
        Copy
      </MenuItem>
      <MenuItem checked icon="check">
        Selected
      </MenuItem>
      <MenuItem icon="trash-2" tone="danger">
        Delete
      </MenuItem>
    </Menu>,
  );
}

describe('Menu', () => {
  afterEach(() => cleanup());

  it('renders items with their tone', () => {
    renderMenu();
    const items = Array.from(document.querySelectorAll('.ui-menu__item'));
    expect(items).toHaveLength(4);
    expect(items[0]?.getAttribute('data-tone')).toBe('default');
    expect(items[3]?.getAttribute('data-tone')).toBe('danger');
  });

  it('collapses the trailing slot when there is no shortcut or check', () => {
    renderMenu();
    const items = Array.from(document.querySelectorAll('.ui-menu__item'));
    // Settings: no trailing content
    expect(items[0]?.querySelector('.ui-menu__trailing')).toBeNull();
    // Copy: shortcut fills the trailing slot
    expect(items[1]?.querySelector('.ui-menu__trailing')).not.toBeNull();
    // Selected: check fills the trailing slot
    expect(items[2]?.querySelector('.ui-menu__trailing')).not.toBeNull();
  });
});
