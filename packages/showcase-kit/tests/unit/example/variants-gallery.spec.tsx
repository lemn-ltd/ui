import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	VariantsGallery,
	variantsFromEnum,
} from "../../../src/example/variants-gallery.js";

describe("variantsFromEnum", () => {
	afterEach(cleanup);

	const Statuses = ["queued", "running", "completed"] as const;

	it("maps an enum to one VariantSpec per member with matching labels", () => {
		const variants = variantsFromEnum(Statuses, (value) => (
			<span>{value}</span>
		));

		expect(variants).toHaveLength(Statuses.length);
		expect(variants.map((variant) => variant.label)).toEqual([...Statuses]);
	});

	it("feeds VariantsGallery one cell per enum member", () => {
		render(
			<VariantsGallery
				items={variantsFromEnum(Statuses, (value) => <span>{value}</span>)}
			/>,
		);

		for (const status of Statuses) {
			expect(screen.getAllByText(status).length).toBeGreaterThan(0);
		}
	});
});
