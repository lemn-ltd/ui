import { Checkbox as RadixCheckbox } from 'radix-ui';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { Icon } from '../icon/icon.js';
import './checkbox.css';

export type CheckboxProps = ComponentPropsWithoutRef<typeof RadixCheckbox.Root>;

export function Checkbox({ className, ...rest }: CheckboxProps): ReactElement {
  const indeterminate = rest.checked === 'indeterminate';
  return (
    <RadixCheckbox.Root className={['ui-checkbox', className].filter(Boolean).join(' ')} {...rest}>
      <RadixCheckbox.Indicator className="ui-checkbox__indicator">
        <Icon name={indeterminate ? 'minus' : 'check'} size={12} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
