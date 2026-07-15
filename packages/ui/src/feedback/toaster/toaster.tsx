import type { ReactElement } from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import type { ToastTone } from '../toast/toast.js';
import './toaster.css';

export type ToasterPosition = 'top-right' | 'bottom-right' | 'top-center';

export interface ToasterProps {
  readonly position?: ToasterPosition;
}

export interface NotifyOptions {
  readonly detail?: string;
  readonly duration?: number;
}

// The package owns sonner; consumers fire through `notify` instead of importing
// sonner directly, so the headless dependency never leaks past this boundary.
const TONE_TO_SONNER = {
  success: sonnerToast.success,
  info: sonnerToast.info,
  warn: sonnerToast.warning,
  danger: sonnerToast.error,
} satisfies Record<
  ToastTone,
  (message: string, data?: { description?: string; duration?: number }) => string | number
>;

/** Fire a toast onto the mounted `Toaster`, mapping the package tone to sonner. */
export function notify(tone: ToastTone, title: string, options?: NotifyOptions): string | number {
  return TONE_TO_SONNER[tone](title, {
    description: options?.detail,
    duration: options?.duration,
  });
}

/** Dismiss every visible toast, or a single one by id. */
export function dismissToasts(id?: string | number): void {
  sonnerToast.dismiss(id);
}

// Stack gap mirrors the semantic spacing scale; the host's compiled brand
// scope owns all tone colors, so Sonner never receives provider theme state.
const STACK_GAP = 12;

/** Toast stack region; sonner owns the viewport, auto-dismiss, swipe, and queue. */
export function Toaster({ position = 'top-right' }: ToasterProps): ReactElement {
  return (
    <SonnerToaster
      className="ui-toaster"
      gap={STACK_GAP}
      position={position}
      toastOptions={{
        classNames: {
          toast: 'ui-toast',
          title: 'ui-toast__title',
          description: 'ui-toast__detail',
          icon: 'ui-toast__icon',
          closeButton: 'ui-toast__dismiss',
        },
      }}
    />
  );
}
