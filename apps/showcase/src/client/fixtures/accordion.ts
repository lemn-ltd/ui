import type { AccordionItemData } from '@lemn-ltd/ui';

/** 7 disclosure rows; the first is open by default via `accordionDefaultValue`. */
export const accordionItems: readonly AccordionItemData[] = [
  {
    value: 'general',
    label: 'General',
    caption: 'Basic configuration',
    content: 'Name, description, and visibility for the selected item.',
  },
  {
    value: 'access',
    label: 'Access',
    caption: 'Who can view and edit',
    content: 'Roles, invitations, and link sharing for this resource.',
  },
  {
    value: 'notifications',
    label: 'Notifications',
    caption: 'Delivery preferences',
    content: 'Choose which events send a notification and through which channel.',
  },
  {
    value: 'integrations',
    label: 'Integrations',
    caption: 'Connected services',
    content: 'Manage connections to external services and their permissions.',
  },
  {
    value: 'usage',
    label: 'Usage',
    caption: 'Limits and quotas',
    content: 'Current consumption against the configured limits for this period.',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    caption: 'Expert options',
    content: 'Low-level options that change how the item behaves at runtime.',
  },
  {
    value: 'danger',
    label: 'Danger zone',
    caption: 'Irreversible actions',
    content: 'Archive or permanently delete the item. These actions cannot be undone.',
    disabled: true,
  },
];

export const accordionDefaultValue = 'general';
