import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import "./button.css";

export type ButtonSize = "sm" | "md";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "ghost-danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly startIcon?: ReactNode;
  readonly endIcon?: ReactNode;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  startIcon,
  endIcon,
  children,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button
      className={["ui-button", className].filter(Boolean).join(" ")}
      data-size={size}
      data-variant={variant}
      type={type}
      {...rest}
    >
      {startIcon ? <span className="ui-button__icon">{startIcon}</span> : null}
      {children}
      {endIcon ? <span className="ui-button__icon">{endIcon}</span> : null}
    </button>
  );
}
