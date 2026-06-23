import {
  Children,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import "./avatar.css";

export type AvatarSize = 24 | 32;

export type AvatarImageSize =
  | "xsmall"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "xxlarge";

export type AvatarColor = "teal" | "purple" | "amber" | "blue" | "pink" | "red";

export type AvatarStatus = "online" | "offline" | "busy" | "none";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  readonly size?: AvatarSize | AvatarImageSize;
  readonly color?: AvatarColor;
  readonly src?: string;
  readonly alt?: string;
  readonly status?: AvatarStatus;
}

export function Avatar({
  size = 32,
  color = "teal",
  src,
  alt = "User avatar",
  status = "none",
  className,
  children,
  ...rest
}: AvatarProps): ReactElement {
  return (
    <span
      className={["ui-avatar", className].filter(Boolean).join(" ")}
      data-color={color}
      data-size={size}
      data-status={status}
      {...rest}
    >
      {src ? (
        <img alt={alt} className="ui-avatar__image" src={src} />
      ) : (
        children
      )}
      {status !== "none" ? (
        <span aria-hidden="true" className="ui-avatar__status" />
      ) : null}
    </span>
  );
}

export interface AvatarGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  readonly max?: number;
  readonly children: ReactNode;
}

export function AvatarGroup({
  max = 5,
  className,
  children,
  ...rest
}: AvatarGroupProps): ReactElement {
  const items = Children.toArray(children);
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <div
      className={["ui-avatar-group", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {visible}
      {overflow > 0 ? (
        <span className="ui-avatar-group__overflow">+{overflow}</span>
      ) : null}
    </div>
  );
}
