import type { ReactElement, Ref, TextareaHTMLAttributes } from 'react';
import './textarea.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly invalid?: boolean;
  readonly ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ invalid, rows = 3, className, ...rest }: TextareaProps): ReactElement {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={['ui-textarea', className].filter(Boolean).join(' ')}
      data-invalid={invalid ? 'true' : undefined}
      rows={rows}
      {...rest}
    />
  );
}
