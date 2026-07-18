/**
 * The component catalog: the single structured source of truth for what each
 * `@lemn-ltd/ui` component is. `apps/ui-portal` consumes it for nav titles,
 * summaries, and status, and `packages/ui/docs/components.md` is the human
 * "when to use" guide built on the same set. The drift guard in
 * `tests/catalog.spec.ts` keeps the catalog, the docs, and the component
 * taxonomy in lockstep.
 *
 * This is data only — no React, no styles — so it tree-shakes out of product
 * bundles that import components but never the catalog.
 */

import { primaryAgentComponentCatalogEntries } from "./catalog-agent-primary-entries.js";
import { automationComponentCatalogEntries } from "./catalog-automation-entries.js";
import {
	coreComponentCatalog,
	coreComponentExportsFromSlug,
} from "./catalog-core.js";
import type { ComponentCatalogEntry } from "./catalog-types.js";

export {
	coreComponentCatalog,
	coreComponentExportsFromSlug,
} from "./catalog-core.js";
export type {
	AgentComponentGroup,
	ComponentArea,
	ComponentCatalogEntry,
	CoreComponentGroup,
} from "./catalog-types.js";

export const componentCatalog: readonly ComponentCatalogEntry[] = [
	...coreComponentCatalog,
	...primaryAgentComponentCatalogEntries,
	...automationComponentCatalogEntries,
];

/**
 * Agent-only export exceptions. Core export decisions belong exclusively to
 * `catalog-core.ts` so the complete catalog cannot drift from the Core-only
 * public entrypoint.
 */
const AGENT_COMPONENT_EXPORT_EXCEPTIONS: Readonly<
	Record<string, readonly string[]>
> = {
	"automation-graph": ["GraphCanvas"],
	"wait-retry-chip": ["WaitChip", "RetryChip"],
};

/** Public value exports consumers use for a catalogued component. */
export function componentExportsFromSlug(slug: string): readonly string[] {
	const exception = AGENT_COMPONENT_EXPORT_EXCEPTIONS[slug];
	if (exception) return exception;

	return coreComponentExportsFromSlug(slug);
}
