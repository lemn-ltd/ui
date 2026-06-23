import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Icon, IconButton, type IconName } from '../../primitives/index.js';
import './toast.css';

export type ToastTone = 'success' | 'info' | 'warn' | 'danger';

const TONE_ICONS = {
  success: 'check',
  info: 'info',
  warn: 'alert',
  danger: 'alert',
} satisfies Record<ToastTone, IconName>;

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly tone?: ToastTone;
  readonly title: ReactNode;
  readonly detail?: ReactNode;
  readonly onDismiss?: () => void;
}

/** Presentational status row; stacking and auto-dismiss are owned by `Toaster`. */
export function Toast({
  tone = 'info',
  title,
  detail,
  onDismiss,
  className,
  ...rest
}: ToastProps): ReactElement {
  return (
    <div className={['ui-toast', className].filter(Boolean).join(' ')} data-tone={tone} {...rest}>
      <Icon className="ui-toast__icon" name={TONE_ICONS[tone]} size={20} />
      <div className="ui-toast__content">
        <span className="ui-toast__title">{title}</span>
        {detail ? <span className="ui-toast__detail">{detail}</span> : null}
      </div>
      {onDismiss ? (
        <IconButton aria-label="Dismiss" className="ui-toast__dismiss" onClick={onDismiss}>
          <Icon name="x" size={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
