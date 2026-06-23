/**
 * The component catalog: the single structured source of truth for what each
 * `@appranks/ui` component is. `apps/showcase` consumes it for nav titles,
 * summaries, and status, and `packages/ui/docs/components.md` is the human
 * "when to use" guide built on the same set. The drift guard in
 * `tests/catalog.spec.ts` keeps the catalog, the docs, and the component
 * taxonomy in lockstep.
 *
 * This is data only — no React, no styles — so it tree-shakes out of product
 * bundles that import components but never the catalog.
 */

import { automationComponentCatalogEntries } from './catalog-automation-entries.js';
import { primaryComponentCatalogEntries } from './catalog-primary-entries.js';
import { secondaryComponentCatalogEntries } from './catalog-secondary-entries.js';
import type { ComponentCatalogEntry } from './catalog-types.js';

export type { ComponentCatalogEntry, ComponentGroup } from './catalog-types.js';

export const componentCatalog: readonly ComponentCatalogEntry[] = [
  ...primaryComponentCatalogEntries,
  ...secondaryComponentCatalogEntries,
  ...automationComponentCatalogEntries,
];
