import type { AnchorHTMLAttributes, HTMLAttributes, ReactElement } from "react";
import { Icon, type IconName } from "../../primitives/index.js";
import "./alert.css";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  readonly variant: AlertVariant;
  readonly title: string;
  readonly message: string;
  readonly showLink?: boolean;
  readonly linkHref?: AnchorHTMLAttributes<HTMLAnchorElement>["href"];
  readonly linkText?: string;
}

const VARIANT_ICONS = {
  success: "check",
  error: "alert",
  warning: "alert",
  info: "info",
} satisfies Record<AlertVariant, IconName>;

export function Alert({
  variant,
  title,
  message,
  showLink = false,
  linkHref = "#",
  linkText = "Learn more",
  className,
  ...rest
}: AlertProps): ReactElement {
  return (
    <div
      className={["ui-alert", className].filter(Boolean).join(" ")}
      data-variant={variant}
      role={variant === "error" ? "alert" : "status"}
      {...rest}
    >
      <Icon
        className="ui-alert__icon"
        name={VARIANT_ICONS[variant]}
        size={20}
      />
      <div className="ui-alert__body">
        <strong className="ui-alert__title">{title}</strong>
        <p className="ui-alert__message">{message}</p>
        {showLink ? (
          <a className="ui-alert__link" href={linkHref}>
            {linkText}
          </a>
        ) : null}
      </div>
    </div>
  );
}
