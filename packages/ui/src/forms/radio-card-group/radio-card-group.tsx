import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import './radio-card-group.css';

export interface RadioCardOption {
  readonly value: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
}

export interface RadioCardGroupProps {
  readonly options: readonly RadioCardOption[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly name?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly className?: string;
}

/** Single-choice cards built on the same RadioGroup keyboard and form semantics. */
export function RadioCardGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  disabled,
  orientation = 'vertical',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
}: RadioCardGroupProps): ReactElement {
  return (
    <RadixRadioGroup.Root
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={['ui-radio-card-group', className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      onValueChange={onValueChange}
      orientation={orientation}
      required={required}
      value={value}
    >
      {options.map((option) => (
        <RadixRadioGroup.Item
          className="ui-radio-card-group__item"
          disabled={option.disabled}
          key={option.value}
          value={option.value}
        >
          <span aria-hidden="true" className="ui-radio-card-group__marker">
            <RadixRadioGroup.Indicator className="ui-radio-card-group__indicator" />
          </span>
          {option.icon ? (
            <span aria-hidden="true" className="ui-radio-card-group__icon">
              {option.icon}
            </span>
          ) : null}
          <span className="ui-radio-card-group__copy">
            <span className="ui-radio-card-group__label">{option.label}</span>
            {option.description ? (
              <span className="ui-radio-card-group__description">{option.description}</span>
            ) : null}
          </span>
        </RadixRadioGroup.Item>
      ))}
    </RadixRadioGroup.Root>
  );
}
