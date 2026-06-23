import type { ReactElement, ReactNode } from 'react';
import { InputSearch } from '../../primitives/index.js';
import './list-filters-bar.css';

export interface ListFiltersBarProps {
  readonly pills?: ReactNode;
  readonly search?: string;
  readonly onSearchChange?: (next: string) => void;
  readonly searchPlaceholder?: string;
  readonly searchLabel?: string;
  readonly trailing?: ReactNode;
  readonly className?: string;
}

/**
 * Layout-only filter row: a left pills slot, an optional per-view searchable `InputSearch`, and
 * an optional trailing slot. The search placeholder is supplied per view.
 */
export function ListFiltersBar({
  pills,
  search,
  onSearchChange,
  searchPlaceholder,
  searchLabel = 'Search list',
  trailing,
  className,
}: ListFiltersBarProps): ReactElement {
  return (
    <div className={['ui-list-filters-bar', className].filter(Boolean).join(' ')}>
      <div className="ui-list-filters-bar__pills">{pills}</div>
      <div className="ui-list-filters-bar__end">
        {onSearchChange ? (
          <InputSearch
            aria-label={searchLabel}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            value={search ?? ''}
          />
        ) : null}
        {trailing ? <div className="ui-list-filters-bar__trailing">{trailing}</div> : null}
      </div>
    </div>
  );
}
