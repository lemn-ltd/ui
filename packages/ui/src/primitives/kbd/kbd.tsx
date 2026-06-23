import type { HTMLAttributes, ReactElement } from 'react';
import './kbd.css';

export type KbdProps = HTMLAttributes<HTMLElement>;

export function Kbd({ className, children, ...rest }: KbdProps): ReactElement {
  return (
    <kbd className={['ui-kbd', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </kbd>
  );
}
