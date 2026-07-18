import { componentCatalog } from "@lemn-ltd/ui/catalog";
import type { ReactElement } from "react";
import type { CatalogArea } from "../../catalog/catalog-manifest.js";

export interface DisabledCatalogAreaSourceDescriptor {
	readonly area: CatalogArea;
	readonly componentBindingsModule: string;
	readonly enabled: false;
	readonly pageSourceRoot: string;
	readonly patternBindingsModule: string;
}

/**
 * Source-only composition receipt. Strings document the dormant adapter
 * without importing its React bindings into the active Core graph.
 */
export const DISABLED_AGENT_SOURCE_DESCRIPTOR = {
	area: "agents",
	componentBindingsModule: "client/registry/entries/agents.tsx",
	enabled: false,
	pageSourceRoot: "client/pages/agents",
	patternBindingsModule: "client/registry/entries/agent-patterns.tsx",
} as const satisfies DisabledCatalogAreaSourceDescriptor;

export interface DisabledAgentSourceEntry {
	readonly area: "agents";
	readonly group: string;
	readonly kind: "component" | "pattern";
	readonly page: () => ReactElement;
	readonly slug: string;
	readonly status: "stable" | "beta";
	readonly summary: string;
	readonly title: string;
}

const AGENT_CATALOG_BY_SLUG = new Map(
	componentCatalog
		.filter((entry) => entry.area === "agents")
		.map((entry) => [entry.slug, entry]),
);

/** Source-only adapter. This module must never enter the active Core registry. */
export function disabledAgentEntry(
	slug: string,
	page: () => ReactElement,
): DisabledAgentSourceEntry {
	const meta = AGENT_CATALOG_BY_SLUG.get(slug);
	if (!meta) throw new Error(`No Agent catalog metadata for "${slug}"`);
	return {
		area: "agents",
		group: meta.group,
		kind: "component",
		page,
		slug: meta.slug,
		status: meta.status,
		summary: meta.intent,
		title: meta.title,
	};
}
