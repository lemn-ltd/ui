import { Command } from 'cmdk';
import { type ReactElement, useState } from 'react';
import { Popover } from '../../overlays/index.js';
import { Icon, Tag } from '../../primitives/index.js';
import './combobox.css';

export type ComboboxMode = 'single' | 'multi';

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  readonly keywords?: readonly string[];
  readonly disabled?: boolean;
}

interface ComboboxCommonProps {
  readonly options: readonly ComboboxOption[];

  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyMessage?: string;

  readonly disabled?: boolean;
  readonly invalid?: boolean;

  readonly id?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;
  readonly className?: string;
}

export interface ComboboxSingleProps extends ComboboxCommonProps {
  readonly mode?: 'single';
  readonly value?: string;
  readonly onValueChange?: (value: string) => void;
}

export interface ComboboxMultiProps extends ComboboxCommonProps {
  readonly mode: 'multi';
  readonly value?: readonly string[];
  readonly onValueChange?: (value: string[]) => void;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultiProps;

function labelFor(options: readonly ComboboxOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * Searchable select built on the canonical `Popover` plus a `cmdk` filter; its
 * option rows reuse the canonical menu-row anatomy rather than a second menu
 * surface. `single` closes on select and shows the chosen label; `multi` toggles
 * values, shows them as chips, and keeps the popover open.
 */
export function Combobox(props: ComboboxProps): ReactElement {
  const {
    options,
    placeholder = 'Select an option…',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No matches',
    disabled,
    invalid,
    id,
    'aria-label': ariaLabel,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedby,
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const multi = props.mode === 'multi';
  const selected = multi ? [...(props.value ?? [])] : props.value ? [props.value] : [];

  function toggle(next: string): void {
    if (multi) {
      const set = new Set(selected);
      if (set.has(next)) set.delete(next);
      else set.add(next);
      props.onValueChange?.([...set]);
      // Multi keeps the popover open so several values can be toggled in a row.
    } else {
      props.onValueChange?.(next);
      setOpen(false);
    }
  }

  const trigger = (
    <button
      aria-describedby={ariaDescribedby}
      aria-invalid={ariaInvalid || invalid || undefined}
      aria-label={ariaLabel}
      className={['ui-combobox', className].filter(Boolean).join(' ')}
      data-invalid={invalid ? 'true' : undefined}
      data-state={open ? 'open' : 'closed'}
      disabled={disabled}
      id={id}
      type="button"
    >
      <span className="ui-combobox__value">
        {selected.length === 0 ? (
          <span className="ui-combobox__placeholder">{placeholder}</span>
        ) : multi ? (
          selected.map((value) => (
            <Tag key={value} variant="muted">
              {labelFor(options, value)}
            </Tag>
          ))
        ) : (
          labelFor(options, selected[0] as string)
        )}
      </span>
      <Icon className="ui-combobox__chevron" name="chevron-down" size={16} />
    </button>
  );

  return (
    <Popover
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
      open={open}
      trigger={trigger}
    >
      <Command className="ui-combobox__command">
        <div className="ui-combobox__search">
          <Icon name="search" size={16} />
          <Command.Input
            className="ui-combobox__input"
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            value={query}
          />
        </div>
        <div className="ui-combobox__divider" />
        <Command.List className="ui-combobox__list">
          <Command.Empty className="ui-combobox__empty">{emptyMessage}</Command.Empty>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <Command.Item
                aria-selected={isSelected}
                className="ui-combobox__option"
                data-selected={isSelected ? 'true' : undefined}
                disabled={option.disabled}
                key={option.value}
                onSelect={() => toggle(option.value)}
                value={`${option.label} ${(option.keywords ?? []).join(' ')}`}
              >
                <span className="ui-combobox__option-label">{option.label}</span>
                {isSelected ? (
                  <Icon className="ui-combobox__option-check" name="check" size={14} />
                ) : null}
              </Command.Item>
            );
          })}
        </Command.List>
      </Command>
    </Popover>
  );
}
