import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Badge } from '../../primitives/index.js';
import './version-tag.css';

export interface VersionTagProps extends HTMLAttributes<HTMLDivElement> {
  readonly version: ReactNode;
  readonly env?: ReactNode;
  readonly collapsed?: boolean;
}

export function VersionTag({
  version,
  env,
  collapsed = false,
  className,
  ...rest
}: VersionTagProps): ReactElement {
  return (
    <div
      className={['ui-version-tag', className].filter(Boolean).join(' ')}
      data-collapsed={collapsed ? 'true' : 'false'}
      {...rest}
    >
      {collapsed ? <span aria-hidden="true" className="ui-version-tag__dot" /> : null}
      <span className="ui-version-tag__version">{version}</span>
      {env != null && !collapsed ? <Badge tone="dim">{env}</Badge> : null}
    </div>
  );
}
