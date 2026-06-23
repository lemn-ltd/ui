import type { FilterOption, FilterSelect } from '@appranks/ui';

export interface FilterDescriptor {
  readonly id: string;
  readonly label: string;
  readonly select: FilterSelect;
  readonly options: readonly FilterOption[];
  readonly selected: readonly string[];
}

/** 5 filters; 3 carry applied selections that feed the active-filters bar. */
export const filters: readonly FilterDescriptor[] = [
  {
    id: 'filter-status',
    label: 'Status',
    select: 'multi',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'paused', label: 'Paused' },
      { value: 'archived', label: 'Archived' },
    ],
    selected: ['active', 'pending'],
  },
  {
    id: 'filter-owner',
    label: 'Owner',
    select: 'single',
    options: [
      { value: 'anyone', label: 'Anyone' },
      { value: 'me', label: 'Me' },
      { value: 'unassigned', label: 'Unassigned' },
    ],
    selected: ['me'],
  },
  {
    id: 'filter-updated',
    label: 'Updated',
    select: 'single',
    options: [
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This week' },
      { value: 'month', label: 'This month' },
      { value: 'quarter', label: 'This quarter' },
    ],
    selected: ['week'],
  },
  {
    id: 'filter-visibility',
    label: 'Visibility',
    select: 'single',
    options: [
      { value: 'private', label: 'Private' },
      { value: 'team', label: 'Team' },
      { value: 'public', label: 'Public' },
    ],
    selected: [],
  },
  {
    id: 'filter-tag',
    label: 'Tag',
    select: 'multi',
    options: [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
      { value: 'gamma', label: 'Gamma' },
    ],
    selected: [],
  },
];
