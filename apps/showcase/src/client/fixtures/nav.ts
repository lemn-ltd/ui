import type { OrgItem, SidebarNavGroup, SidebarNavItem } from '@appranks/ui';

/** Primary sidebar groups: 5 + 4 + 6 = 15 items, with one active item. */
export const navGroups: readonly SidebarNavGroup[] = [
  {
    header: 'Workspace',
    items: [
      { id: 'nav-overview', label: 'Overview', icon: 'layout-grid', active: true },
      { id: 'nav-list', label: 'List', icon: 'list' },
      { id: 'nav-files', label: 'Files', icon: 'file' },
      { id: 'nav-activity', label: 'Activity', icon: 'clock' },
      { id: 'nav-search', label: 'Search', icon: 'search' },
    ],
  },
  {
    header: 'Manage',
    items: [
      { id: 'nav-members', label: 'Members', icon: 'user-check' },
      { id: 'nav-settings', label: 'Settings', icon: 'settings' },
      { id: 'nav-access', label: 'Access', icon: 'lock' },
      { id: 'nav-refresh', label: 'Sync', icon: 'refresh' },
    ],
  },
  {
    header: 'More',
    items: [
      { id: 'nav-info', label: 'About', icon: 'info' },
      { id: 'nav-status', label: 'Status', icon: 'alert' },
      { id: 'nav-external', label: 'External link', icon: 'external-link' },
      { id: 'nav-edit', label: 'Editor', icon: 'square-pen' },
      { id: 'nav-grid', label: 'Gallery', icon: 'layout-grid' },
      { id: 'nav-sign-out', label: 'Sign out', icon: 'log-out' },
    ],
  },
];

/** Secondary drill-in nav: 5 items shown inside a section's detail rail. */
export const drillNavGroups: readonly SidebarNavGroup[] = [
  {
    items: [
      { id: 'drill-general', label: 'General', icon: 'settings', active: true },
      { id: 'drill-members', label: 'Members', icon: 'user-check' },
      { id: 'drill-access', label: 'Access', icon: 'lock' },
      { id: 'drill-activity', label: 'Activity', icon: 'clock' },
      { id: 'drill-files', label: 'Files', icon: 'file' },
    ] satisfies readonly SidebarNavItem[],
  },
];

/** Org switcher entries: 6 orgs, each with a short text mark. */
export const orgs: readonly OrgItem[] = [
  { id: 'org-01', name: 'Northwind', mark: 'NW' },
  { id: 'org-02', name: 'Helios Labs', mark: 'HL' },
  { id: 'org-03', name: 'Meridian', mark: 'ME' },
  { id: 'org-04', name: 'Atlas Group', mark: 'AG' },
  { id: 'org-05', name: 'Pinecone', mark: 'PC' },
  { id: 'org-06', name: 'Vantage', mark: 'VA' },
];

export const currentOrgId = 'org-01';
