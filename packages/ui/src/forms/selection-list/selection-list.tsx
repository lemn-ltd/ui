import { type ReactElement, useId, useMemo, useState } from 'react';
import { Badge, type BadgeTone, Button, Checkbox, Icon } from '../../primitives/index.js';
import './selection-list.css';

export interface SelectionListItemBadge {
  readonly label: string;
  readonly tone?: BadgeTone;
}

export interface SelectionListItem {
  readonly key: string;
  readonly label: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly badge?: SelectionListItemBadge;
  readonly disabled?: boolean;
}

export interface SelectionListGroup {
  readonly key: string;
  readonly label: string;
  readonly items: readonly SelectionListItem[];
}

export interface SelectionListProps {
  readonly groups: readonly SelectionListGroup[];

  readonly value?: readonly string[];
  readonly onValueChange?: (value: string[]) => void;

  readonly searchPlaceholder?: string;
  readonly allLabel?: string;
  readonly emptyMessage?: string;
  readonly emptyHint?: string;

  readonly disabled?: boolean;

  readonly id?: string;
  readonly 'aria-label'?: string;
  readonly className?: string;
}

function itemMatches(item: SelectionListItem, query: string): boolean {
  if (query === '') return true;
  const q = query.toLowerCase();
  return (
    item.label.toLowerCase().includes(q) ||
    (item.description?.toLowerCase().includes(q) ?? false) ||
    (item.keywords?.some((keyword) => keyword.toLowerCase().includes(q)) ?? false)
  );
}

/**
 * Searchable multi-select over a one-level hierarchy: category group headers
 * (with a select-all checkbox that supports the indeterminate state) above
 * indented item rows. Category pills with counts narrow the list to one group;
 * the search query filters across all of them, and the toolbar can select or
 * clear the full selectable set. Selection state is controlled via
 * `value`/`onValueChange` with item keys.
 */
export function SelectionList({
  groups,
  value,
  onValueChange,
  searchPlaceholder = 'Search…',
  allLabel = 'All',
  emptyMessage = 'No items match',
  emptyHint = 'Clear the search or pick another category',
  disabled,
  id,
  'aria-label': ariaLabel,
  className,
}: SelectionListProps): ReactElement {
  const baseId = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const selected = useMemo(() => new Set(value ?? []), [value]);

  const totalCount = groups.reduce((count, group) => count + group.items.length, 0);
  const selectedCount = groups.reduce(
    (count, group) => count + group.items.filter((item) => selected.has(item.key)).length,
    0,
  );
  const selectableKeys = groups.flatMap((group) =>
    group.items.filter((item) => !item.disabled).map((item) => item.key),
  );
  const allSelectableSelected =
    selectableKeys.length > 0 && selectableKeys.every((key) => selected.has(key));

  const visibleGroups = groups
    .filter((group) => category === null || group.key === category)
    .map((group) => ({ group, items: group.items.filter((item) => itemMatches(item, query)) }))
    .filter((entry) => entry.items.length > 0);

  function emit(next: Set<string>): void {
    onValueChange?.([...next]);
  }

  function toggleItem(key: string, checked: boolean): void {
    const next = new Set(selected);
    if (checked) next.add(key);
    else next.delete(key);
    emit(next);
  }

  function toggleGroup(items: readonly SelectionListItem[], allSelected: boolean): void {
    const next = new Set(selected);
    for (const item of items) {
      if (item.disabled) continue;
      if (allSelected) next.delete(item.key);
      else next.add(item.key);
    }
    emit(next);
  }

  function selectAll(): void {
    const next = new Set(selected);
    for (const key of selectableKeys) {
      next.add(key);
    }
    emit(next);
  }

  function toggleCollapsed(key: string): void {
    const next = new Set(collapsed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setCollapsed(next);
  }

  return (
    <fieldset
      aria-label={ariaLabel}
      className={['ui-selection-list', className].filter(Boolean).join(' ')}
      id={id}
    >
      <div className="ui-selection-list__toolbar">
        <div className="ui-selection-list__search">
          <Icon name="search" size={16} />
          <input
            aria-label={searchPlaceholder}
            className="ui-selection-list__search-input"
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            type="text"
            value={query}
          />
          {query !== '' ? (
            <button
              aria-label="Clear search"
              className="ui-selection-list__search-clear"
              onClick={() => setQuery('')}
              type="button"
            >
              <Icon name="x" size={16} />
            </button>
          ) : null}
        </div>
        <span aria-live="polite" className="ui-selection-list__counter">
          {selectedCount} of {totalCount} selected
        </span>
        <div className="ui-selection-list__actions">
          <Button
            className="ui-selection-list__action ui-selection-list__select-all"
            disabled={disabled || allSelectableSelected || selectableKeys.length === 0}
            onClick={selectAll}
            variant="secondary"
          >
            Select all
          </Button>
          <Button
            className="ui-selection-list__action ui-selection-list__clear"
            disabled={disabled || selectedCount === 0}
            onClick={() => emit(new Set())}
            variant="secondary"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="ui-selection-list__pills" role="tablist">
        <button
          aria-selected={category === null}
          className="ui-selection-list__pill"
          data-active={category === null ? 'true' : undefined}
          disabled={disabled}
          onClick={() => setCategory(null)}
          role="tab"
          type="button"
        >
          {allLabel} {totalCount}
        </button>
        {groups.map((group) => (
          <button
            aria-selected={category === group.key}
            className="ui-selection-list__pill"
            data-active={category === group.key ? 'true' : undefined}
            disabled={disabled}
            key={group.key}
            onClick={() => setCategory(category === group.key ? null : group.key)}
            role="tab"
            type="button"
          >
            {group.label} {group.items.length}
          </button>
        ))}
      </div>

      <div className="ui-selection-list__panel">
        {visibleGroups.length === 0 ? (
          <div className="ui-selection-list__empty">
            <span className="ui-selection-list__empty-title">{emptyMessage}</span>
            <span className="ui-selection-list__empty-hint">{emptyHint}</span>
          </div>
        ) : null}
        {visibleGroups.map(({ group, items }, index) => {
          const selectable = items.filter((item) => !item.disabled);
          const selectedInGroup = items.filter((item) => selected.has(item.key)).length;
          const allSelected =
            selectable.length > 0 && selectable.every((item) => selected.has(item.key));
          const someSelected = selectedInGroup > 0;
          // An active search always expands its matches; collapse only applies while browsing.
          const expanded = query !== '' || !collapsed.has(group.key);
          const regionId = `${baseId}-group-${group.key}`;
          return (
            <div className="ui-selection-list__group" key={group.key}>
              {index > 0 ? <div className="ui-selection-list__divider" /> : null}
              <div className="ui-selection-list__group-header">
                <Checkbox
                  aria-label={`Select all ${group.label}`}
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  disabled={disabled || selectable.length === 0}
                  onCheckedChange={() => toggleGroup(items, allSelected)}
                />
                <button
                  aria-controls={regionId}
                  aria-expanded={expanded}
                  className="ui-selection-list__group-toggle"
                  disabled={disabled}
                  onClick={() => toggleCollapsed(group.key)}
                  type="button"
                >
                  <span className="ui-selection-list__group-label">{group.label}</span>
                  <span className="ui-selection-list__group-count">
                    {selectedInGroup}/{items.length}
                  </span>
                  <Icon
                    className="ui-selection-list__group-chevron"
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                  />
                </button>
              </div>
              {expanded ? (
                <div id={regionId}>
                  {items.map((item) => (
                    <label
                      className="ui-selection-list__item"
                      htmlFor={`${baseId}-item-${item.key}`}
                      key={item.key}
                    >
                      <Checkbox
                        checked={selected.has(item.key)}
                        disabled={disabled || item.disabled}
                        id={`${baseId}-item-${item.key}`}
                        onCheckedChange={(checked) => toggleItem(item.key, checked === true)}
                      />
                      <span className="ui-selection-list__item-label">{item.label}</span>
                      {item.description ? (
                        <span className="ui-selection-list__item-description">
                          {item.description}
                        </span>
                      ) : null}
                      {item.badge ? (
                        <Badge
                          className="ui-selection-list__item-badge"
                          showDot
                          tone={item.badge.tone ?? 'dim'}
                        >
                          {item.badge.label}
                        </Badge>
                      ) : null}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
