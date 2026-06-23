import type { ToastTone } from '@appranks/ui';

export interface ToastDescriptor {
  readonly id: string;
  readonly tone: ToastTone;
  readonly title: string;
  readonly detail?: string;
}

/** 8 queued toasts spanning every tone. */
export const toasts: readonly ToastDescriptor[] = [
  { id: 'toast-01', tone: 'success', title: 'Changes saved', detail: 'Your edits are now live.' },
  { id: 'toast-02', tone: 'info', title: 'Sync started', detail: 'Fetching the latest data.' },
  {
    id: 'toast-03',
    tone: 'warn',
    title: 'Approaching limit',
    detail: 'You have used 90% of your quota.',
  },
  {
    id: 'toast-04',
    tone: 'danger',
    title: 'Upload failed',
    detail: 'The file could not be processed.',
  },
  { id: 'toast-05', tone: 'success', title: 'Invitation sent' },
  {
    id: 'toast-06',
    tone: 'info',
    title: 'New activity',
    detail: '3 events since your last visit.',
  },
  { id: 'toast-07', tone: 'warn', title: 'Unsaved changes', detail: 'Leaving will discard them.' },
  {
    id: 'toast-08',
    tone: 'danger',
    title: 'Connection lost',
    detail: 'Retrying in a few seconds.',
  },
];

/** 3-tone subset for the stacked toaster demo. */
export const toastStack: readonly ToastDescriptor[] = [
  {
    id: 'stack-success',
    tone: 'success',
    title: 'Changes saved',
    detail: 'Your edits are now live.',
  },
  {
    id: 'stack-warn',
    tone: 'warn',
    title: 'Approaching limit',
    detail: 'You have used 90% of your quota.',
  },
  {
    id: 'stack-danger',
    tone: 'danger',
    title: 'Upload failed',
    detail: 'The file could not be processed.',
  },
];
