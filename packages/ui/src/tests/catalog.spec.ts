import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as publicUi from "../index.js";
import {
	type AgentComponentGroup,
	type CoreComponentGroup,
	componentCatalog,
	componentExportsFromSlug,
} from "../catalog.js";

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

const EXPECTED_GROUP_COUNTS: Readonly<Record<CoreComponentGroup | AgentComponentGroup, number>> = {
	Primitives: 9,
	Inputs: 11,
	Forms: 9,
	Visualizations: 3,
	"Data display": 18,
	Feedback: 6,
	Overlays: 10,
	Navigation: 9,
	Layout: 8,
	Conversation: 6,
	Governance: 6,
	Approvals: 3,
	Automation: 6,
	"Runtime & evidence": 8,
};

// Resolved from the package root (vitest cwd); happy-dom's import.meta.url is not a file: URL.
const COMPONENTS_DOC = resolve(process.cwd(), "docs/components.md");

describe("component catalog", () => {
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
		expect(componentCatalog).toHaveLength(112);
		expect(componentCatalog.filter((entry) => entry.area === "core")).toHaveLength(83);
		expect(componentCatalog.filter((entry) => entry.area === "agents")).toHaveLength(29);

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

	it("the when-to-use guide documents every catalogued component", () => {
		const doc = readFileSync(COMPONENTS_DOC, "utf8");
		const missing = componentCatalog
			.map((entry) => entry.slug)
			.filter((slug) => !doc.includes(`components/${slug}`));
		expect(
			missing,
			`docs/components.md is missing showcase links for: ${missing.join(", ")}`,
		).toEqual([]);
	});
});
