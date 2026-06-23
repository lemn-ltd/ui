import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Button, Menu, MenuItem, MenuLabel, MenuSeparator } from '@appranks/ui';
import type { ReactElement } from 'react';

function MenuPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The canonical dropdown menu. Items support a leading icon, a trailing shortcut or check, a danger tone, and a disabled state; sections and dividers organize the list. User and filter menus are instances of this primitive."
      title="Menu"
    >
      <ExampleBlock
        code={`<Menu trigger={<Button variant="secondary">Open menu</Button>}>
  <MenuLabel>Workspace</MenuLabel>
  <MenuItem icon="settings" shortcut="⌘,">
    Settings
  </MenuItem>
  <MenuItem icon="check" checked>
    Show hidden files
  </MenuItem>
  <MenuItem icon="copy" disabled>
    Duplicate
  </MenuItem>
  <MenuSeparator />
  <MenuItem icon="trash-2" tone="danger">
    Delete
  </MenuItem>
</Menu>`}
        render={() => (
          <Menu trigger={<Button variant="secondary">Open menu</Button>}>
            <MenuLabel>Workspace</MenuLabel>
            <MenuItem icon="settings" shortcut="⌘,">
              Settings
            </MenuItem>
            <MenuItem checked icon="check">
              Show hidden files
            </MenuItem>
            <MenuItem disabled icon="copy">
              Duplicate
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon="trash-2" tone="danger">
              Delete
            </MenuItem>
          </Menu>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'Menu.trigger',
            type: 'ReactNode',
            description: 'Element that opens the menu, rendered as the trigger child.',
          },
          {
            name: 'Menu.align',
            type: "'start' | 'center' | 'end'",
            defaultValue: "'start'",
            description: 'Alignment of the menu against its trigger.',
          },
          {
            name: 'Menu.open / defaultOpen',
            type: 'boolean',
            description: 'Controlled or initial open state.',
          },
          {
            name: 'Menu.onOpenChange',
            type: '(open: boolean) => void',
            description: 'Called when the open state changes.',
          },
          {
            name: 'MenuItem.icon',
            type: 'IconName',
            description: 'Leading glyph shorthand from the base icon set.',
          },
          {
            name: 'MenuItem.leading',
            type: 'ReactNode',
            description: 'Custom leading node; takes precedence over icon.',
          },
          {
            name: 'MenuItem.shortcut',
            type: 'ReactNode',
            description: 'Trailing keyboard hint, rendered in a Kbd. Ignored when checked.',
          },
          {
            name: 'MenuItem.checked',
            type: 'boolean',
            description: 'Shows a trailing check mark in place of a shortcut.',
          },
          {
            name: 'MenuItem.tone',
            type: "'default' | 'danger'",
            defaultValue: "'default'",
            description: 'Item tone, written to data-tone.',
          },
          {
            name: 'MenuItem.disabled',
            type: 'boolean',
            description: 'Disables selection of the item.',
          },
          {
            name: 'MenuItem.onSelect',
            type: '(event: Event) => void',
            description: 'Called when the item is selected.',
          },
          {
            name: 'MenuLabel / MenuSeparator',
            type: 'component',
            description: 'A non-interactive section heading and a divider between groups.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default MenuPage;
