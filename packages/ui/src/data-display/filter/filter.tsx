import type { ReactElement } from 'react';
import { SegmentedControl } from '../../forms/index.js';
import { Menu, MenuItem, Popover } from '../../overlays/index.js';
import { FilterPill, Input } from '../../primitives/index.js';
import './filter.css';

export type FilterSelect = 'single' | 'multi';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

export interface NumberRange {
  readonly min?: number;
  readonly max?: number;
}

export interface DateRange {
  readonly from?: string;
  readonly to?: string;
}

interface BaseFilterProps {
  readonly label: string;
  readonly className?: string;
}

export interface EnumFilterProps extends BaseFilterProps {
  readonly type?: 'enum';
  readonly options: readonly FilterOption[];
  readonly selected: readonly string[];
  readonly onSelect: (value: string) => void;
  readonly select?: FilterSelect;
  readonly placeholder?: string;
}

export interface TextFilterProps extends BaseFilterProps {
  readonly type: 'text';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export interface NumberRangeFilterProps extends BaseFilterProps {
  readonly type: 'number-range';
  readonly value: NumberRange;
  readonly onChange: (value: NumberRange) => void;
}

export interface DateRangeFilterProps extends BaseFilterProps {
  readonly type: 'date-range';
  readonly value: DateRange;
  readonly onChange: (value: DateRange) => void;
}

export interface BooleanFilterProps extends BaseFilterProps {
  readonly type: 'boolean';
  readonly value: boolean | null;
  readonly onChange: (value: boolean | null) => void;
}

export type FilterProps =
  | EnumFilterProps
  | TextFilterProps
  | NumberRangeFilterProps
  | DateRangeFilterProps
  | BooleanFilterProps;

function summarizeEnum(
  options: readonly FilterOption[],
  selected: readonly string[],
  placeholder: string,
): string {
  if (selected.length === 0) return placeholder;
  const first = options.find((option) => option.value === selected[0]);
  const firstLabel = first?.label ?? selected[0] ?? placeholder;
  return selected.length > 1 ? `${firstLabel} +${selected.length - 1}` : firstLabel;
}

function parseNumber(raw: string): number | undefined {
  if (raw === '') return undefined;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * The one canonical column filter. `enum` (the default) is a checkable Menu for single/multi
 * selection; `text`, `number-range`, `date-range` and `boolean` open a Popover with the matching
 * inputs. Every variant shares the same `FilterPill` trigger, active when a value is applied.
 */
export function Filter(props: FilterProps): ReactElement {
  if (props.type === 'text') {
    return <TextFilter props={props} />;
  }

  if (props.type === 'number-range') {
    return <NumberRangeFilter props={props} />;
  }

  if (props.type === 'date-range') {
    return <DateRangeFilter props={props} />;
  }

  if (props.type === 'boolean') {
    return <BooleanFilter props={props} />;
  }

  return <EnumFilter props={props} />;
}

function FilterRoot({
  active,
  children,
  className,
  select,
  type,
}: {
  readonly active: boolean;
  readonly children: ReactElement;
  readonly className?: string;
  readonly select?: FilterSelect;
  readonly type: string;
}): ReactElement {
  return (
    <span
      className={['ui-filter', className].filter(Boolean).join(' ')}
      data-active={active ? 'true' : 'false'}
      data-select={select}
      data-type={type}
    >
      {children}
    </span>
  );
}

function TextFilter({ props }: { readonly props: TextFilterProps }): ReactElement {
  const active = props.value.trim() !== '';
  return (
    <FilterRoot active={active} className={props.className} type="text">
      <Popover
        trigger={
          <FilterPill active={active}>
            {props.label}
            {active ? `: ${props.value}` : ''}
          </FilterPill>
        }
      >
        <div className="ui-filter__body">
          <Input
            aria-label={props.label}
            onChange={(event) => props.onChange(event.target.value)}
            placeholder={props.placeholder ?? 'Contains…'}
            value={props.value}
          />
        </div>
      </Popover>
    </FilterRoot>
  );
}

function NumberRangeFilter({ props }: { readonly props: NumberRangeFilterProps }): ReactElement {
  const { min, max } = props.value;
  const active = min !== undefined || max !== undefined;
  return (
    <FilterRoot active={active} className={props.className} type="number-range">
      <Popover
        trigger={
          <FilterPill active={active}>
            {props.label}
            {active ? `: ${min ?? '−'}–${max ?? '−'}` : ''}
          </FilterPill>
        }
      >
        <div className="ui-filter__body ui-filter__range">
          <Input
            aria-label={`${props.label} minimum`}
            onChange={(event) => props.onChange({ max, min: parseNumber(event.target.value) })}
            placeholder="Min"
            type="number"
            value={min ?? ''}
          />
          <span className="ui-filter__range-sep">–</span>
          <Input
            aria-label={`${props.label} maximum`}
            onChange={(event) => props.onChange({ max: parseNumber(event.target.value), min })}
            placeholder="Max"
            type="number"
            value={max ?? ''}
          />
        </div>
      </Popover>
    </FilterRoot>
  );
}

function DateRangeFilter({ props }: { readonly props: DateRangeFilterProps }): ReactElement {
  const { from, to } = props.value;
  const active = Boolean(from) || Boolean(to);
  return (
    <FilterRoot active={active} className={props.className} type="date-range">
      <Popover
        trigger={
          <FilterPill active={active}>
            {props.label}
            {active ? `: ${from ?? '…'} → ${to ?? '…'}` : ''}
          </FilterPill>
        }
      >
        <div className="ui-filter__body ui-filter__range">
          <Input
            aria-label={`${props.label} from`}
            onChange={(event) => props.onChange({ from: event.target.value || undefined, to })}
            type="date"
            value={from ?? ''}
          />
          <span className="ui-filter__range-sep">→</span>
          <Input
            aria-label={`${props.label} to`}
            onChange={(event) => props.onChange({ from, to: event.target.value || undefined })}
            type="date"
            value={to ?? ''}
          />
        </div>
      </Popover>
    </FilterRoot>
  );
}

function BooleanFilter({ props }: { readonly props: BooleanFilterProps }): ReactElement {
  const active = props.value !== null;
  const current = props.value === null ? 'any' : props.value ? 'true' : 'false';
  return (
    <FilterRoot active={active} className={props.className} type="boolean">
      <Popover
        trigger={
          <FilterPill active={active}>
            {props.label}
            {active ? `: ${props.value ? 'Yes' : 'No'}` : ''}
          </FilterPill>
        }
      >
        <div className="ui-filter__body">
          <SegmentedControl
            aria-label={props.label}
            onValueChange={(value) => props.onChange(value === 'any' ? null : value === 'true')}
            segments={[
              { value: 'any', label: 'Any' },
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            value={current}
          />
        </div>
      </Popover>
    </FilterRoot>
  );
}

function EnumFilter({ props }: { readonly props: EnumFilterProps }): ReactElement {
  const { options, selected, onSelect, select = 'single', placeholder = 'Any' } = props;
  const value = summarizeEnum(options, selected, placeholder);
  return (
    <FilterRoot
      active={selected.length > 0}
      className={props.className}
      select={select}
      type="enum"
    >
      <Menu
        trigger={
          <FilterPill active={selected.length > 0}>
            {props.label}: {value}
          </FilterPill>
        }
      >
        {options.map((option) => (
          <MenuItem
            checked={selected.includes(option.value)}
            key={option.value}
            onSelect={(event) => {
              // Keep a multi-select menu open while the user toggles several options.
              if (select === 'multi') event.preventDefault();
              onSelect(option.value);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </FilterRoot>
  );
}
