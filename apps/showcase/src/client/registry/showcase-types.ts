import type { ShowcaseEntry as KitShowcaseEntry } from '@lemn-ltd/showcase-kit';

export type ShowcaseGroup =
  | 'Foundations'
  | 'Primitives'
  | 'Forms'
  | 'Overlays'
  | 'Navigation'
  | 'Data display'
  | 'Feedback'
  | 'Layout'
  | 'Agents'
  | 'Patterns';

/** Canonical nav order for the sidebar and the command palette groups. */
export const SHOWCASE_GROUPS: readonly ShowcaseGroup[] = [
  'Foundations',
  'Primitives',
  'Forms',
  'Overlays',
  'Navigation',
  'Data display',
  'Feedback',
  'Layout',
  'Agents',
  'Patterns',
];

export type ShowcaseEntry = KitShowcaseEntry<ShowcaseGroup>;
export type UiShowcaseEntry = ShowcaseEntry;
