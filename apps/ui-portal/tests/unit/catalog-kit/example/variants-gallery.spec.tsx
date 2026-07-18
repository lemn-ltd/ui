// @vitest-environment happy-dom

import { VariantsGallery, variantsFromEnum } from "@portal/catalog-kit";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

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

	it("preserves an explicit single column in the mobile layout contract", () => {
		const { container } = render(
			<VariantsGallery
				columns={1}
				items={[{ label: "empty", render: () => <span>Empty</span> }]}
			/>,
		);
		const gallery = container.querySelector<HTMLElement>(".portal-variants");

		expect(gallery?.style.getPropertyValue("--portal-variants-columns")).toBe(
			"1",
		);
		expect(
			gallery?.style.getPropertyValue("--portal-variants-mobile-columns"),
		).toBe("1");
	});
});
