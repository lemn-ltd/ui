import { buildNavGroups, pathFor } from '@lemn-ltd/showcase-kit';
import { agentsEntries } from './entries/agents.js';
import { agentPatternsEntries } from './entries/agent-patterns.js';
import { dataDisplayEntries } from './entries/data-display.js';
import { feedbackEntries } from './entries/feedback.js';
import { formsEntries } from './entries/forms.js';
import { foundationsEntries } from './entries/foundations.js';
import { layoutEntries } from './entries/layout.js';
import { navigationEntries } from './entries/navigation.js';
import { overlaysEntries } from './entries/overlays.js';
import { patternsEntries } from './entries/patterns.js';
import { primitivesEntries } from './entries/primitives.js';
import { SHOWCASE_GROUPS, type ShowcaseGroup, type UiShowcaseEntry } from './showcase-types.js';

export { SHOWCASE_GROUPS, type ShowcaseEntry, type ShowcaseGroup } from './showcase-types.js';
export { pathFor };

/**
 * THE single source of truth: it drives the sidebar nav, the route map, and the
 * command palette with zero duplication. Entries are authored alongside their
 * pages, then aggregated here in canonical group order. The entry modules import
 * only the types module, so this aggregation stays acyclic.
 */
export const SHOWCASE_REGISTRY: UiShowcaseEntry[] = [
  ...foundationsEntries,
  ...primitivesEntries,
  ...formsEntries,
  ...overlaysEntries,
  ...navigationEntries,
  ...dataDisplayEntries,
  ...feedbackEntries,
  ...layoutEntries,
  ...agentsEntries,
  ...patternsEntries,
  ...agentPatternsEntries,
];

/** Registry grouped into the canonical nav order, dropping empty groups. */
export function navGroups(
  registry: readonly UiShowcaseEntry[] = SHOWCASE_REGISTRY,
): { group: ShowcaseGroup; entries: UiShowcaseEntry[] }[] {
  return buildNavGroups(registry, SHOWCASE_GROUPS);
}
