import { describe, expect, it } from "vitest";
import {
	findMissingHomeFeatureSlugs,
	HOME_FEATURES,
	type HomeFeature,
} from "../../../../src/client/shell/home-features.js";
import { CATALOG_REGISTRY } from "../../../../src/client/registry/catalog-registry.js";

describe("HOME_FEATURES", () => {
	it("keeps the homepage intentionally curated and uniquely keyed", () => {
		expect(HOME_FEATURES).toHaveLength(5);
		expect(new Set(HOME_FEATURES.map((feature) => feature.id)).size).toBe(
			HOME_FEATURES.length,
		);
		expect(HOME_FEATURES.length).toBeLessThan(CATALOG_REGISTRY.length);
	});

	it("references only entries that exist in the complete portal registry", () => {
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

	it("preserves the required reporting and filter compositions", () => {
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
		expect(byId.has("agent-operations")).toBe(false);
		expect([...byId.keys()]).toEqual([
			"reporting",
			"filters",
			"data-display",
			"feedback",
			"overlays",
		]);
	});
});
