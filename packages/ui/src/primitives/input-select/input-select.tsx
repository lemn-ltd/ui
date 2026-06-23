import { Select as RadixSelect } from 'radix-ui';
import type { ReactElement } from 'react';
import { Icon } from '../icon/icon.js';
import './input-select.css';

const EMPTY_VALUE_SENTINEL = '__ui_input_select_empty_value__';

export interface InputSelectOption {
  readonly value: string;
  readonly label: string;
  readonly hint?: string;
  readonly disabled?: boolean;
}

export interface InputSelectProps {
  readonly options: readonly InputSelectOption[];

  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;

  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly invalid?: boolean;

  readonly id?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;

  readonly className?: string;
}

/**
 * A select whose popup is owned by the design system: a Radix Select projected
 * onto the token surface so the open menu matches the rest of the catalog
 * instead of the browser's native control palette.
 */
export function InputSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  invalid,
  id,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  className,
}: InputSelectProps): ReactElement {
  const radixValue = value === undefined ? undefined : toRadixValue(value);
  const radixDefaultValue = defaultValue === undefined ? undefined : toRadixValue(defaultValue);

  return (
    <RadixSelect.Root
      defaultValue={radixDefaultValue}
      disabled={disabled}
      onValueChange={(nextValue) => onValueChange?.(fromRadixValue(nextValue))}
      value={radixValue}
    >
      <RadixSelect.Trigger
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        className={['ui-input-select', className].filter(Boolean).join(' ')}
        data-invalid={invalid ? 'true' : undefined}
        id={id}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="ui-input-select__chevron">
          <Icon name="chevron-down" size={16} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className="ui-input-select__content" position="popper" sideOffset={6}>
          <RadixSelect.Viewport className="ui-input-select__viewport">
            {options.map((option) => (
              <RadixSelect.Item
                className="ui-input-select__option"
                disabled={option.disabled}
                key={option.value}
                title={option.hint}
                value={toRadixValue(option.value)}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="ui-input-select__indicator">
                  <Icon name="check" size={16} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function toRadixValue(value: string): string {
  return value === '' ? EMPTY_VALUE_SENTINEL : value;
}

function fromRadixValue(value: string): string {
  return value === EMPTY_VALUE_SENTINEL ? '' : value;
}
