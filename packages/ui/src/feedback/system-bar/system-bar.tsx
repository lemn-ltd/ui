import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Icon, IconButton, type IconName } from '../../primitives/index.js';
import './system-bar.css';

export type SystemBarTone = 'info' | 'warn' | 'danger';

const TONE_ICONS = {
  info: 'info',
  warn: 'alert',
  danger: 'alert',
} satisfies Record<SystemBarTone, IconName>;

export interface SystemBarProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: SystemBarTone;
  readonly action?: ReactNode;
  readonly onDismiss?: () => void;
}

/** Full-width page-level notice that sits above the top bar. */
export function SystemBar({
  tone = 'info',
  action,
  onDismiss,
  className,
  children,
  ...rest
}: SystemBarProps): ReactElement {
  return (
    <div
      className={['ui-system-bar', className].filter(Boolean).join(' ')}
      data-tone={tone}
      {...rest}
    >
      <Icon className="ui-system-bar__icon" name={TONE_ICONS[tone]} size={16} />
      <div className="ui-system-bar__message">{children}</div>
      {action ? <div className="ui-system-bar__action">{action}</div> : null}
      {onDismiss ? (
        <IconButton aria-label="Dismiss" className="ui-system-bar__dismiss" onClick={onDismiss}>
          <Icon name="x" size={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
