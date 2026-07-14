import { type HTMLAttributes, type ReactElement, type ReactNode, useId, useState } from 'react';
import { Icon, IconButton, type IconName } from '../../primitives/index.js';
import './info-banner.css';

export type InfoBannerVariant = 'info' | 'warn' | 'danger' | 'success';
export type InfoBannerDensity = 'default' | 'compact';

const VARIANT_ICONS = {
  info: 'info',
  warn: 'alert',
  danger: 'alert',
  success: 'check',
} satisfies Record<InfoBannerVariant, IconName>;

export interface InfoBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly variant?: InfoBannerVariant;
  /** Compact density is for row-level or inline status details. */
  readonly density?: InfoBannerDensity;
  /** Sticks the banner to the bottom edge of the scrolling content region. */
  readonly floating?: boolean;
  readonly title?: ReactNode;
  /** Override the system glyph, or pass false to omit it. */
  readonly icon?: ReactNode | false;
  readonly actions?: ReactNode;
  readonly dismissible?: boolean;
  readonly dismissLabel?: string;
  readonly onDismiss?: () => void;
  readonly urgency?: 'none' | 'polite' | 'assertive';
}

/** In-content tinted banner with a tone left border; not the page-level SystemBar. */
export function InfoBanner({
  variant = 'info',
  density = 'default',
  floating = false,
  title,
  icon,
  actions,
  dismissible = false,
  dismissLabel = 'Dismiss',
  onDismiss,
  urgency,
  className,
  children,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...rest
}: InfoBannerProps): ReactElement {
  const titleId = useId();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return <></>;

  const resolvedRole =
    role ??
    (urgency === 'assertive'
      ? 'alert'
      : urgency === 'polite'
        ? 'status'
        : urgency === 'none'
          ? title
            ? 'region'
            : undefined
          : floating
            ? variant === 'danger'
              ? 'alert'
              : 'status'
            : title
              ? 'region'
              : undefined);
  const resolvedIcon =
    icon === false ? null : icon === undefined ? (
      <Icon
        className="ui-info-banner__icon"
        name={VARIANT_ICONS[variant]}
        size={density === 'compact' ? 12 : 18}
      />
    ) : (
      <span aria-hidden="true" className="ui-info-banner__icon">
        {icon}
      </span>
    );

  return (
    <div
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby ?? (title && !ariaLabel ? titleId : undefined)}
      className={['ui-info-banner', className].filter(Boolean).join(' ')}
      data-density={density}
      data-floating={floating ? 'true' : undefined}
      data-variant={variant}
      role={resolvedRole}
      {...rest}
    >
      {resolvedIcon}
      <div className="ui-info-banner__body">
        {title ? (
          <div className="ui-info-banner__title" id={titleId}>
            {title}
          </div>
        ) : null}
        <div className="ui-info-banner__content">{children}</div>
        {actions ? <div className="ui-info-banner__actions">{actions}</div> : null}
      </div>
      {dismissible ? (
        <IconButton
          aria-label={dismissLabel}
          className="ui-info-banner__dismiss"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          variant="ghost"
        >
          <Icon name="x" size={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
