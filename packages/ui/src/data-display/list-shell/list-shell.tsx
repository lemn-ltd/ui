import type { HTMLAttributes, ReactElement } from 'react';
import './list-shell.css';

export type ListShellProps = HTMLAttributes<HTMLDivElement>;

/** Outer content section giving every list or grid the same padding and vertical rhythm. */
export function ListShell({ className, children, ...rest }: ListShellProps): ReactElement {
  return (
    <div className={['ui-list-shell', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
