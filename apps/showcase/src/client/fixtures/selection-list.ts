import type { SelectionListGroup } from '@lemn-ltd/ui';

/** Categorized catalog with descriptions and tone badges, in the tool-picker shape. */
export const selectionListGroups: readonly SelectionListGroup[] = [
  {
    key: 'workspace',
    label: 'workspace',
    items: [
      {
        key: 'tool.workspace.read_file',
        label: 'Read file',
        description: 'tool.workspace.read_file',
        badge: { label: 'low', tone: 'dim' },
      },
      {
        key: 'tool.workspace.list_files',
        label: 'List files',
        description: 'tool.workspace.list_files',
        badge: { label: 'low', tone: 'dim' },
      },
      {
        key: 'tool.workspace.search_files',
        label: 'Search files',
        description: 'tool.workspace.search_files',
        badge: { label: 'low', tone: 'dim' },
      },
      {
        key: 'tool.workspace.write_file',
        label: 'Write file',
        description: 'tool.workspace.write_file',
        badge: { label: 'high', tone: 'danger' },
      },
      {
        key: 'tool.workspace.edit_file',
        label: 'Edit file',
        description: 'tool.workspace.edit_file',
        badge: { label: 'high', tone: 'danger' },
      },
    ],
  },
  {
    key: 'memory',
    label: 'memory',
    items: [
      {
        key: 'tool.memory.save',
        label: 'Save memory',
        description: 'tool.memory.save',
        badge: { label: 'low', tone: 'dim' },
      },
      {
        key: 'tool.memory.search',
        label: 'Search memory',
        description: 'tool.memory.search',
        badge: { label: 'low', tone: 'dim' },
      },
      {
        key: 'tool.memory.forget',
        label: 'Forget memory',
        description: 'tool.memory.forget',
        badge: { label: 'medium', tone: 'warn' },
      },
    ],
  },
  {
    key: 'web',
    label: 'web',
    items: [
      {
        key: 'tool.web.fetch',
        label: 'Fetch URL',
        description: 'tool.web.fetch',
        badge: { label: 'medium', tone: 'warn' },
      },
      {
        key: 'tool.browser.evaluate',
        label: 'Evaluate script in headless browser',
        description: 'tool.browser.evaluate',
        badge: { label: 'high', tone: 'danger' },
      },
    ],
  },
];

export const selectionListDefaultValue: readonly string[] = [
  'tool.workspace.read_file',
  'tool.workspace.edit_file',
  'tool.memory.save',
  'tool.memory.search',
  'tool.memory.forget',
];
