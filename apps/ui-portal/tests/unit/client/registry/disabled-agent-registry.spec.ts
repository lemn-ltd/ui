import { componentCatalog } from "@lemn-ltd/ui/catalog";
import { describe, expect, it } from "vitest";
import { DISABLED_AGENT_SOURCE_DESCRIPTOR } from "../../../../src/client/registry/disabled-agent-entry.js";
import { agentPatternsEntries } from "../../../../src/client/registry/entries/agent-patterns.js";
import { agentsEntries } from "../../../../src/client/registry/entries/agents.js";

describe("dormant Agent catalog composition", () => {
	it("retains a complete source-only adapter without enabling the area", () => {
		const catalogSlugs = componentCatalog
			.filter((entry) => entry.area === "agents")
			.map((entry) => entry.slug)
			.sort();
		const bindingSlugs = agentsEntries.map((entry) => entry.slug).sort();

		expect(DISABLED_AGENT_SOURCE_DESCRIPTOR).toMatchObject({
			area: "agents",
			enabled: false,
		});
		expect(bindingSlugs).toEqual(catalogSlugs);
		expect(new Set(bindingSlugs).size).toBe(bindingSlugs.length);
		expect(agentPatternsEntries.map((entry) => entry.slug)).toEqual([
			"agent-session",
			"automation-builder",
			"run-monitor",
		]);
		expect(
			[...agentsEntries, ...agentPatternsEntries].every(
				(entry) => entry.area === "agents" && typeof entry.page === "function",
			),
		).toBe(true);
	});
});
