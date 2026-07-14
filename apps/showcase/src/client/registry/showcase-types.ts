import type { ShowcaseEntry as KitShowcaseEntry } from '@lemn-ltd/showcase-kit';

export type ShowcaseGroup =
  | 'Foundations'
  | 'Primitives'
  | 'Inputs'
  | 'Forms'
  | 'Visualizations'
  | 'Overlays'
  | 'Navigation'
  | 'Data display'
  | 'Feedback'
  | 'Layout'
  | 'Conversation'
  | 'Governance'
  | 'Approvals'
  | 'Automation'
  | 'Runtime & evidence'
  | 'Patterns';

/** Canonical nav order for the sidebar and the command palette groups. */
export const SHOWCASE_GROUPS: readonly ShowcaseGroup[] = [
  'Foundations',
  'Primitives',
  'Inputs',
  'Forms',
  'Visualizations',
  'Overlays',
  'Navigation',
  'Data display',
  'Feedback',
  'Layout',
  'Conversation',
  'Governance',
  'Approvals',
  'Automation',
  'Runtime & evidence',
  'Patterns',
];

export type ShowcaseEntry = KitShowcaseEntry<ShowcaseGroup>;
export type UiShowcaseEntry = ShowcaseEntry;
