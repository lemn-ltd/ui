import type { InputHTMLAttributes, ReactElement, Ref } from 'react';
import './input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
  readonly ref?: Ref<HTMLInputElement>;
}

export function Input({ invalid, className, ...rest }: InputProps): ReactElement {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={['ui-input', className].filter(Boolean).join(' ')}
      data-invalid={invalid ? 'true' : undefined}
      {...rest}
    />
  );
}
