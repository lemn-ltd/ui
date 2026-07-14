import type {
  ChangeEvent,
  ReactElement,
  Ref,
  SelectHTMLAttributes,
} from 'react';
import { Icon } from '../icon/icon.js';
import './select-native.css';

export interface SelectNativeOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

export interface SelectNativeOptionGroup {
  readonly label: string;
  readonly options: readonly SelectNativeOption[];
  readonly disabled?: boolean;
}

export type SelectNativeItem = SelectNativeOption | SelectNativeOptionGroup;

export interface SelectNativeProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'onChange'> {
  readonly options: readonly SelectNativeItem[];
  readonly placeholder?: string;
  readonly invalid?: boolean;
  readonly onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  readonly onValueChange?: (value: string) => void;
  readonly ref?: Ref<HTMLSelectElement>;
}

function isGroup(item: SelectNativeItem): item is SelectNativeOptionGroup {
  return 'options' in item;
}

function renderOption(option: SelectNativeOption): ReactElement {
  return (
    <option disabled={option.disabled} key={option.value} value={option.value}>
      {option.label}
    </option>
  );
}

/** Native select for forms that benefit from platform UI and progressive enhancement. */
export function SelectNative({
  options,
  placeholder,
  invalid,
  className,
  onChange,
  onValueChange,
  'aria-invalid': ariaInvalid,
  ...rest
}: SelectNativeProps): ReactElement {
  return (
    <span className={['ui-select-native', className].filter(Boolean).join(' ')}>
      <select
        aria-invalid={ariaInvalid ?? (invalid || undefined)}
        className="ui-select-native__control"
        data-invalid={invalid ? 'true' : undefined}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.currentTarget.value);
        }}
        {...rest}
      >
        {placeholder ? (
          <option disabled value="">
            {placeholder}
          </option>
        ) : null}
        {options.map((item) =>
          isGroup(item) ? (
            <optgroup disabled={item.disabled} key={item.label} label={item.label}>
              {item.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(item)
          ),
        )}
      </select>
      <Icon className="ui-select-native__chevron" name="chevron-down" size={16} />
    </span>
  );
}
