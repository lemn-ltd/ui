import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import './radio.css';

export type RadioGroupProps = ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>;

export type RadioGroupItemProps = ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>;

export function RadioGroup({ className, ...rest }: RadioGroupProps): ReactElement {
  return (
    <RadixRadioGroup.Root
      className={['ui-radio-group', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export function RadioGroupItem({ className, ...rest }: RadioGroupItemProps): ReactElement {
  return (
    <RadixRadioGroup.Item className={['ui-radio', className].filter(Boolean).join(' ')} {...rest}>
      <RadixRadioGroup.Indicator className="ui-radio__indicator" />
    </RadixRadioGroup.Item>
  );
}
