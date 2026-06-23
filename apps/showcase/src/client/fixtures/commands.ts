import type { CommandPaletteGroup } from '@appranks/ui';

/**
 * Command palette groups (Recent / Pages / Actions / Help). Every item icon is
 * drawn from the brand-neutral base glyph set. Items total 42 across 4 groups.
 */
export const commandGroups: readonly CommandPaletteGroup[] = [
  {
    label: 'Recent',
    items: [
      { id: 'recent-overview', label: 'Overview', icon: 'layout-grid' },
      { id: 'recent-list', label: 'List view', icon: 'list' },
      { id: 'recent-settings', label: 'Settings', icon: 'settings' },
      { id: 'recent-search', label: 'Search results', icon: 'search' },
      { id: 'recent-file', label: 'Latest document', icon: 'file' },
      { id: 'recent-history', label: 'Activity history', icon: 'clock' },
      { id: 'recent-grid', label: 'Grid view', icon: 'layout-grid' },
      { id: 'recent-edit', label: 'Recent edit', icon: 'pencil' },
    ],
  },
  {
    label: 'Pages',
    items: [
      { id: 'page-overview', label: 'Overview', icon: 'layout-grid', shortcut: 'g o' },
      { id: 'page-list', label: 'List', icon: 'list', shortcut: 'g l' },
      { id: 'page-files', label: 'Files', icon: 'file', shortcut: 'g f' },
      { id: 'page-activity', label: 'Activity', icon: 'clock', shortcut: 'g a' },
      { id: 'page-settings', label: 'Settings', icon: 'settings', shortcut: 'g s' },
      { id: 'page-members', label: 'Members', icon: 'user-check', shortcut: 'g m' },
      { id: 'page-search', label: 'Search', icon: 'search', shortcut: 'g /' },
      { id: 'page-info', label: 'About', icon: 'info' },
      { id: 'page-locked', label: 'Restricted', icon: 'lock' },
      { id: 'page-external', label: 'External link', icon: 'external-link' },
      { id: 'page-grid', label: 'Gallery', icon: 'layout-grid' },
      { id: 'page-detail', label: 'Detail', icon: 'square-pen' },
    ],
  },
  {
    label: 'Actions',
    items: [
      {
        id: 'action-create',
        label: 'Create item',
        icon: 'plus',
        shortcut: 'c',
        keywords: ['new', 'add'],
      },
      { id: 'action-edit', label: 'Edit item', icon: 'pencil', shortcut: 'e' },
      { id: 'action-rename', label: 'Rename', icon: 'square-pen' },
      { id: 'action-duplicate', label: 'Duplicate', icon: 'copy', shortcut: 'd' },
      {
        id: 'action-delete',
        label: 'Delete item',
        icon: 'trash-2',
        keywords: ['remove'],
      },
      { id: 'action-run', label: 'Run', icon: 'play', shortcut: 'r' },
      { id: 'action-refresh', label: 'Refresh', icon: 'refresh', shortcut: 'shift r' },
      { id: 'action-reset', label: 'Reset', icon: 'rotate-ccw' },
      { id: 'action-expand', label: 'Expand panel', icon: 'maximize' },
      { id: 'action-collapse', label: 'Collapse panel', icon: 'minimize' },
      { id: 'action-open-rail', label: 'Open sidebar', icon: 'panel-left-open' },
      { id: 'action-close-rail', label: 'Close sidebar', icon: 'panel-left-close' },
      { id: 'action-copy-link', label: 'Copy link', icon: 'copy', keywords: ['share'] },
      { id: 'action-sign-out', label: 'Sign out', icon: 'log-out' },
    ],
  },
  {
    label: 'Help',
    items: [
      { id: 'help-docs', label: 'Documentation', icon: 'file' },
      { id: 'help-shortcuts', label: 'Keyboard shortcuts', icon: 'info', shortcut: '?' },
      { id: 'help-about', label: 'About', icon: 'info' },
      { id: 'help-status', label: 'Status', icon: 'alert' },
      { id: 'help-support', label: 'Contact support', icon: 'external-link' },
      { id: 'help-feedback', label: 'Send feedback', icon: 'external-link' },
      { id: 'help-zoom-in', label: 'Zoom in', icon: 'zoom-in' },
      { id: 'help-zoom-out', label: 'Zoom out', icon: 'zoom-out' },
    ],
  },
];
