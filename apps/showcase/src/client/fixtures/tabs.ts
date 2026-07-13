import type { TabItem } from '@lemn-ltd/ui';

/** Default tab set: 5 tabs, one carrying a count badge. */
export const tabs: readonly TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity', count: 12 },
  { value: 'files', label: 'Files' },
  { value: 'members', label: 'Members' },
  { value: 'settings', label: 'Settings' },
];

export const defaultTabValue = 'overview';

/** Overflow tab set: 11 tabs that exceed the rail and demonstrate wrapping. */
export const overflowTabs: readonly TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity', count: 12 },
  { value: 'files', label: 'Files' },
  { value: 'members', label: 'Members' },
  { value: 'settings', label: 'Settings' },
  { value: 'access', label: 'Access' },
  { value: 'history', label: 'History' },
  { value: 'comments', label: 'Comments', count: 4 },
  { value: 'usage', label: 'Usage' },
  { value: 'billing', label: 'Billing' },
  { value: 'integrations', label: 'Integrations' },
];

export const overflowDefaultTabValue = 'overview';
