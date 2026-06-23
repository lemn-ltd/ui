import type { HTMLAttributes, ReactElement } from 'react';
import './content-layout.css';

export interface ContentLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly bleed?: boolean;
}

export function ContentLayout({
  bleed = false,
  className,
  children,
  ...rest
}: ContentLayoutProps): ReactElement {
  return (
    <div
      className={['ui-content-layout', className].filter(Boolean).join(' ')}
      data-bleed={bleed ? 'true' : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
