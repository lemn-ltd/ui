import { describe, expect, it } from "vitest";
import {
	findMissingHomeFeatureSlugs,
	HOME_FEATURES,
	type HomeFeature,
} from "../../../../src/client/shell/home-features.js";
import { SHOWCASE_REGISTRY } from "../../../../src/client/registry/showcase-registry.js";

describe("HOME_FEATURES", () => {
	it("keeps the homepage intentionally curated and uniquely keyed", () => {
		expect(HOME_FEATURES.length).toBeGreaterThanOrEqual(6);
		expect(HOME_FEATURES.length).toBeLessThanOrEqual(8);
		expect(new Set(HOME_FEATURES.map((feature) => feature.id)).size).toBe(
			HOME_FEATURES.length,
		);
		expect(HOME_FEATURES.length).toBeLessThan(SHOWCASE_REGISTRY.length);
	});

	it("references only entries that exist in the complete showcase registry", () => {
		expect(findMissingHomeFeatureSlugs()).toEqual([]);
	});

	it("reports the owning feature when a component slug drifts", () => {
		const brokenFeatures: readonly Pick<
			HomeFeature,
			"id" | "componentSlugs"
		>[] = [{ id: "reporting", componentSlugs: ["removed-component"] }];

		expect(
			findMissingHomeFeatureSlugs(brokenFeatures, [{ slug: "data-table" }]),
		).toEqual(["reporting:removed-component"]);
	});

	it("preserves the required reporting, filter, and agent compositions", () => {
		const byId = new Map(
			HOME_FEATURES.map((feature) => [feature.id, feature.componentSlugs]),
		);

		expect(byId.get("reporting")).toEqual([
			"stats-strip",
			"stat-card",
			"sparkline",
			"data-table",
		]);
		expect(byId.get("filters")).toEqual([
			"input",
			"search",
			"select",
			"checkbox",
			"calendar",
			"filter-chip",
		]);
		expect(byId.get("agent-operations")).toEqual([
			"automation-status-badge",
			"planner-status",
			"run-timeline",
		]);
	});
});
