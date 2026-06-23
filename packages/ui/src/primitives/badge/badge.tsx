import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import "./badge.css";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "accent2"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "dim";

export type BadgeVariant = "subtle" | "soft" | "light" | "solid";

export type BadgeSize = "sm" | "md";

export type KnownBadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

export type BadgeColor = KnownBadgeColor | (string & {});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly variant?: BadgeVariant;
  readonly color?: BadgeColor;
  readonly size?: BadgeSize;
  readonly startIcon?: ReactNode;
  readonly endIcon?: ReactNode;
  readonly showDot?: boolean;
}

const COLOR_TO_TONE = {
  primary: "accent",
  success: "success",
  error: "danger",
  warning: "warn",
  info: "info",
  light: "neutral",
  dark: "dim",
} satisfies Record<KnownBadgeColor, BadgeTone>;

function badgeColorToTone(color: BadgeColor): BadgeTone {
  if (color in COLOR_TO_TONE) return COLOR_TO_TONE[color as KnownBadgeColor];
  return "neutral";
}

export function Badge({
  tone,
  variant = "subtle",
  color = "light",
  size = "md",
  startIcon,
  endIcon,
  showDot = false,
  className,
  children,
  ...rest
}: BadgeProps): ReactElement {
  const resolvedTone = tone ?? badgeColorToTone(color);

  return (
    <span
      className={["ui-badge", className].filter(Boolean).join(" ")}
      data-size={size}
      data-tone={resolvedTone}
      data-variant={variant}
      data-dot={showDot ? "on" : "off"}
      {...rest}
    >
      {startIcon ? <span className="ui-badge__icon">{startIcon}</span> : null}
      {children}
      {endIcon ? <span className="ui-badge__icon">{endIcon}</span> : null}
    </span>
  );
}
