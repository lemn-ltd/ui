import type { BreadcrumbItem } from '@lemn-ltd/ui';

/** Short 2-item trail. */
export const shortTrail: readonly BreadcrumbItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Overview' },
];

/** Long 6-item trail for deep navigation. */
export const longTrail: readonly BreadcrumbItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Workspace', href: '#' },
  { label: 'Files', href: '#' },
  { label: 'Documents', href: '#' },
  { label: 'Reports', href: '#' },
  { label: 'Summary' },
];
