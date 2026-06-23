import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Button, Icon, IconButton } from '../../primitives/index.js';
import './filter-chip.css';

export interface FilterChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onRemove'> {
  readonly label: ReactNode;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
}

/** An applied filter pill in accent-soft tone with a trailing remove control. */
export function FilterChip({
  label,
  onRemove,
  removeLabel = 'Remove filter',
  className,
  ...rest
}: FilterChipProps): ReactElement {
  return (
    <span className={['ui-filter-chip', className].filter(Boolean).join(' ')} {...rest}>
      <span className="ui-filter-chip__label">{label}</span>
      {onRemove ? (
        <IconButton aria-label={removeLabel} className="ui-filter-chip__remove" onClick={onRemove}>
          <Icon name="x" size={14} />
        </IconButton>
      ) : null}
    </span>
  );
}

export interface ActiveFiltersRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly filters: readonly FilterChipProps[];
  readonly onClearAll?: () => void;
  readonly clearAllLabel?: ReactNode;
}

/** A wrapping row of applied `FilterChip`s with a trailing "Clear all" text control. */
export function ActiveFiltersRow({
  filters,
  onClearAll,
  clearAllLabel = 'Clear all',
  className,
  ...rest
}: ActiveFiltersRowProps): ReactElement {
  return (
    <div className={['ui-active-filters-row', className].filter(Boolean).join(' ')} {...rest}>
      {filters.map((filter, index) => (
        // Position keys a stable applied-filter ordinal row.
        <FilterChip key={index} {...filter} />
      ))}
      {filters.length > 0 && onClearAll ? (
        <Button className="ui-active-filters-row__clear" onClick={onClearAll} variant="ghost">
          {clearAllLabel}
        </Button>
      ) : null}
    </div>
  );
}
