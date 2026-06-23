import { ChevronsUpDown } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Icon } from '../../primitives/index.js';

export type SortDirection = 'unsorted' | 'asc' | 'desc';

export type ColumnAlign = 'start' | 'center' | 'end';

export interface SortableHeaderCellProps {
  readonly children: ReactNode;
  readonly sort: SortDirection;
  readonly onSort: () => void;
  readonly align?: ColumnAlign;
}

/** A header cell whose trailing glyph reflects tri-state sort and cycles on click. */
export function SortableHeaderCell({
  children,
  sort,
  onSort,
  align = 'start',
}: SortableHeaderCellProps): ReactElement {
  return (
    <th className="ui-data-table__th ui-data-table__th--sortable" data-align={align} scope="col">
      <button className="ui-data-table__sort" data-sort={sort} onClick={onSort} type="button">
        <span className="ui-data-table__sort-label">{children}</span>
        {sort === 'asc' ? (
          <Icon className="ui-data-table__sort-icon" name="chevron-up" size={14} />
        ) : sort === 'desc' ? (
          <Icon className="ui-data-table__sort-icon" name="chevron-down" size={14} />
        ) : (
          <ChevronsUpDown
            aria-hidden="true"
            className="ui-icon ui-data-table__sort-icon"
            height={14}
            width={14}
          />
        )}
      </button>
    </th>
  );
}
