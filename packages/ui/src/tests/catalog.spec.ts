import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	type AgentComponentGroup,
	type ComponentCatalogEntry,
	type CoreComponentGroup,
	componentCatalog,
	componentExportsFromSlug,
} from "../catalog.js";
import {
	coreComponentExportsFromSlug,
	coreComponentCatalog as coreOnlyComponentCatalog,
} from "../catalog-core.js";
import * as publicUi from "../index.js";

const CORE_GROUPS: readonly CoreComponentGroup[] = [
	"Primitives",
	"Inputs",
	"Forms",
	"Visualizations",
	"Data display",
	"Feedback",
	"Overlays",
	"Navigation",
	"Layout",
];

const AGENT_GROUPS: readonly AgentComponentGroup[] = [
	"Conversation",
	"Governance",
	"Approvals",
	"Automation",
	"Runtime & evidence",
];

const CORE_GROUP_SET = new Set<string>(CORE_GROUPS);
const AGENT_GROUP_SET = new Set<string>(AGENT_GROUPS);

const EXPECTED_GROUP_COUNTS: Readonly<
	Record<CoreComponentGroup | AgentComponentGroup, number>
> = {
	Primitives: 9,
	Inputs: 17,
	Forms: 9,
	Visualizations: 14,
	"Data display": 18,
	Feedback: 6,
	Overlays: 10,
	Navigation: 10,
	Layout: 9,
	Conversation: 6,
	Governance: 6,
	Approvals: 3,
	Automation: 6,
	"Runtime & evidence": 8,
};

// Resolved from the package root (vitest cwd); happy-dom's import.meta.url is not a file: URL.
const COMPONENTS_DOC = resolve(process.cwd(), "docs/components.md");

function componentDocSection(
	doc: string,
	entry: ComponentCatalogEntry,
): string {
	const heading = `### ${entry.title}`;
	const headingMarker = `\n${heading}\n`;
	const markerStart = doc.indexOf(headingMarker);
	expect(
		markerStart,
		`docs/components.md is missing the ${entry.slug} section`,
	).toBeGreaterThanOrEqual(0);
	const start = markerStart + 1;
	const nextHeading = doc.indexOf("\n### ", start + heading.length);
	return doc.slice(start, nextHeading === -1 ? undefined : nextHeading);
}

function activePortalPath(entry: ComponentCatalogEntry): string | null {
	if (entry.area === "agents") return null;
	const section =
		entry.group === "Visualizations" ? "visualizations" : "components";
	return `/${section}/${entry.slug}`;
}

describe("component catalog", () => {
	it("exposes a Core-only catalog entrypoint", () => {
		expect(coreOnlyComponentCatalog).toHaveLength(102);
		expect(
			coreOnlyComponentCatalog.every((entry) => entry.area === "core"),
		).toBe(true);
	});

	it("keeps Core export mapping authoritative across public catalog entrypoints", () => {
		for (const entry of coreOnlyComponentCatalog) {
			expect(componentExportsFromSlug(entry.slug), entry.slug).toEqual(
				coreComponentExportsFromSlug(entry.slug),
			);
		}

		expect(coreComponentExportsFromSlug("radio")).toEqual([
			"RadioGroup",
			"RadioGroupItem",
		]);
		expect(coreComponentExportsFromSlug("search")).toEqual(["InputSearch"]);
		expect(coreComponentExportsFromSlug("select")).toEqual(["InputSelect"]);
		expect(publicUi.coreComponentCatalog).toBe(coreOnlyComponentCatalog);
		expect(publicUi.coreComponentExportsFromSlug).toBe(
			coreComponentExportsFromSlug,
		);
	});

	it("has unique slugs", () => {
		const slugs = componentCatalog.map((entry) => entry.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("every entry is well-formed", () => {
		for (const entry of componentCatalog) {
			expect(entry.slug).toMatch(/^[a-z][a-z0-9-]*$/);
			expect(entry.title.trim().length).toBeGreaterThan(0);
			if (entry.area === "core") {
				expect(CORE_GROUP_SET.has(entry.group)).toBe(true);
				expect(AGENT_GROUP_SET.has(entry.group)).toBe(false);
			} else {
				expect(AGENT_GROUP_SET.has(entry.group)).toBe(true);
				expect(CORE_GROUP_SET.has(entry.group)).toBe(false);
			}
			expect(["stable", "beta"]).toContain(entry.status);
			expect(entry.intent.trim().length).toBeGreaterThan(0);
		}
	});

	it("keeps the approved area and family inventory", () => {
		expect(componentCatalog).toHaveLength(131);
		expect(
			componentCatalog.filter((entry) => entry.area === "core"),
		).toHaveLength(102);
		expect(
			componentCatalog.filter((entry) => entry.area === "agents"),
		).toHaveLength(29);

		for (const [group, count] of Object.entries(EXPECTED_GROUP_COUNTS)) {
			expect(
				componentCatalog.filter((entry) => entry.group === group).length,
				group,
			).toBe(count);
		}
	});

	it("maps every catalog entry to real public value exports", () => {
		for (const entry of componentCatalog) {
			const exports = componentExportsFromSlug(entry.slug);
			expect(exports.length, entry.slug).toBeGreaterThan(0);
			for (const exportName of exports) {
				expect(exportName in publicUi, `${entry.slug} -> ${exportName}`).toBe(
					true,
				);
			}
		}
	});

	it("the when-to-use guide documents every component with its active Portal policy", () => {
		const doc = readFileSync(COMPONENTS_DOC, "utf8");
		for (const entry of componentCatalog) {
			const section = componentDocSection(doc, entry);
			const portalPath = activePortalPath(entry);

			if (portalPath) {
				expect(
					section,
					`${entry.slug} is missing its canonical Portal route`,
				).toContain(`\`${portalPath}\``);
				expect(section).not.toContain("no active UI Portal route");
				continue;
			}

			expect(
				section,
				`${entry.slug} must remain disabled in the Portal`,
			).toContain("no active UI Portal route");
			for (const routeFamily of ["components", "visualizations", "agents"]) {
				expect(
					section,
					`${entry.slug} must not publish an inactive Agent route`,
				).not.toContain(`/${routeFamily}/${entry.slug}`);
			}
		}
	});
});
