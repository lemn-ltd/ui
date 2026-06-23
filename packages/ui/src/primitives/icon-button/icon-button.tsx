import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import './icon-button.css';

export type IconButtonVariant = 'ghost' | 'ghost-accent' | 'ghost-danger' | 'primary' | 'default';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: IconButtonVariant;
  readonly 'aria-label': string;
  readonly children: ReactNode;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  variant = 'ghost',
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps): ReactElement {
  return (
    <button
      className={['ui-icon-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
}
