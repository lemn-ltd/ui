import {
	buildNavGroups,
	type CatalogEntry,
	entryFromMeta,
} from "@portal/catalog-kit";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

type Group = "Atoms" | "Molecules" | "Organisms";

const registry = [
	entryFromMeta(
		{
			area: "core",
			group: "Molecules",
			kind: "component",
			slug: "composer",
			summary: "Input surface",
			title: "Composer",
		},
		() => createElement("div"),
	),
	entryFromMeta(
		{
			group: "Atoms",
			kind: "foundation",
			slug: "colors",
			summary: "Token color set",
			title: "Colors",
		},
		() => createElement("div"),
	),
] as const satisfies readonly CatalogEntry<Group>[];

describe("portal registry helpers", () => {
	it("builds nav groups in caller order and drops empty groups", () => {
		expect(
			buildNavGroups(registry, ["Atoms", "Molecules", "Organisms"]),
		).toEqual([
			{ group: "Atoms", entries: [registry[1]] },
			{ group: "Molecules", entries: [registry[0]] },
		]);
	});
});
