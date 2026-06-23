import type { StatCardProps } from '@appranks/ui';

export interface SectionCard {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly footer: string;
}

/** 11 cards for the section grid. */
export const sectionCards: readonly SectionCard[] = [
  {
    id: 'card-01',
    title: 'Getting started',
    body: 'A short walkthrough of the core surfaces and how they fit together.',
    footer: 'Updated 2 days ago',
  },
  {
    id: 'card-02',
    title: 'Recent activity',
    body: 'The latest changes across the workspace, newest first.',
    footer: '12 events today',
  },
  {
    id: 'card-03',
    title: 'Shared files',
    body: 'Documents and assets that members have shared with the team.',
    footer: '48 files',
  },
  {
    id: 'card-04',
    title: 'Members',
    body: 'People with access to this workspace and their current roles.',
    footer: '9 members',
  },
  {
    id: 'card-05',
    title: 'Saved views',
    body: 'Reusable filters and column layouts for the list surface.',
    footer: '6 views',
  },
  {
    id: 'card-06',
    title: 'Notifications',
    body: 'Control which events reach you and through which channel.',
    footer: 'All channels on',
  },
  {
    id: 'card-07',
    title: 'Integrations',
    body: 'Connect external services to extend what the workspace can do.',
    footer: '3 connected',
  },
  {
    id: 'card-08',
    title: 'Usage',
    body: 'Track consumption against the configured limits for this period.',
    footer: '64% of quota',
  },
  {
    id: 'card-09',
    title: 'Access policy',
    body: 'Rules that govern who can view and edit each resource.',
    footer: 'Reviewed weekly',
  },
  {
    id: 'card-10',
    title: 'Audit trail',
    body: 'An immutable record of every change for compliance review.',
    footer: 'Retained 90 days',
  },
  {
    id: 'card-11',
    title: 'Support',
    body: 'Reach the team or browse the documentation for common questions.',
    footer: 'Replies within a day',
  },
];

/** 4 metric tiles for the stats strip. */
export const stats: readonly StatCardProps[] = [
  { label: 'Total items', value: '1,284', delta: { direction: 'up', label: '+8.2%' } },
  { label: 'Active', value: '342', delta: { direction: 'up', label: '+3.1%' } },
  { label: 'Pending', value: '57', delta: { direction: 'down', label: '-12.4%' } },
  { label: 'Archived', value: '903', delta: { direction: 'flat', label: '0.0%' } },
];
