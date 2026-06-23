import type { ReactElement, ReactNode } from 'react';
import { Menu, MenuItem } from '../../overlays/index.js';
import { Button, Icon } from '../../primitives/index.js';

export interface ColumnToggleItem {
  readonly key: string;
  readonly label: ReactNode;
  readonly hidden: boolean;
}

export interface ColumnToggleProps {
  readonly columns: readonly ColumnToggleItem[];
  readonly onToggle: (key: string) => void;
}

/** The "Columns" menu: a checkable row per hideable column that toggles visibility. */
export function ColumnToggle({ columns, onToggle }: ColumnToggleProps): ReactElement {
  return (
    <Menu
      trigger={
        <Button className="ui-data-table__columns-trigger" variant="outline">
          Columns
          <Icon name="chevron-down" size={14} />
        </Button>
      }
    >
      {columns.map((column) => (
        <MenuItem
          checked={!column.hidden}
          key={column.key}
          onSelect={(event) => {
            // Keep the menu open while toggling several columns.
            event.preventDefault();
            onToggle(column.key);
          }}
        >
          {column.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
