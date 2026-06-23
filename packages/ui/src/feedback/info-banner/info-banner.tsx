import type { HTMLAttributes, ReactElement } from 'react';
import { Icon, type IconName } from '../../primitives/index.js';
import './info-banner.css';

export type InfoBannerVariant = 'info' | 'warn' | 'danger' | 'success';
export type InfoBannerDensity = 'default' | 'compact';

const VARIANT_ICONS = {
  info: 'info',
  warn: 'alert',
  danger: 'alert',
  success: 'check',
} satisfies Record<InfoBannerVariant, IconName>;

export interface InfoBannerProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: InfoBannerVariant;
  /** Compact density is for row-level or inline status details. */
  readonly density?: InfoBannerDensity;
  /** Sticks the banner to the bottom edge of the scrolling content region. */
  readonly floating?: boolean;
}

/** In-content tinted banner with a tone left border; not the page-level SystemBar. */
export function InfoBanner({
  variant = 'info',
  density = 'default',
  floating = false,
  className,
  children,
  ...rest
}: InfoBannerProps): ReactElement {
  return (
    <div
      className={['ui-info-banner', className].filter(Boolean).join(' ')}
      data-density={density}
      data-floating={floating ? 'true' : undefined}
      data-variant={variant}
      // A floating banner appears asynchronously, so it announces itself.
      role={floating ? (variant === 'danger' ? 'alert' : 'status') : undefined}
      {...rest}
    >
      <Icon
        className="ui-info-banner__icon"
        name={VARIANT_ICONS[variant]}
        size={density === 'compact' ? 12 : 18}
      />
      <div className="ui-info-banner__body">{children}</div>
    </div>
  );
}
