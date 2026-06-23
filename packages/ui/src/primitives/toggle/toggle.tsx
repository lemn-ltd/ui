import { Switch as RadixSwitch } from 'radix-ui';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import './toggle.css';

export type ToggleProps = ComponentPropsWithoutRef<typeof RadixSwitch.Root>;

export function Toggle({ className, ...rest }: ToggleProps): ReactElement {
  return (
    <RadixSwitch.Root className={['ui-toggle', className].filter(Boolean).join(' ')} {...rest}>
      <RadixSwitch.Thumb className="ui-toggle__thumb" />
    </RadixSwitch.Root>
  );
}
