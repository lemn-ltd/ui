// @vitest-environment happy-dom

import { CatalogRenderModeProvider, ExampleBlock } from "@portal/catalog-kit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

describe("ExampleBlock", () => {
	afterEach(cleanup);

	it("switches between rendered preview and code", () => {
		render(
			<ExampleBlock
				code="<Button>Save</Button>"
				render={() => <button type="button">Save</button>}
			/>,
		);

		expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
		fireEvent.mouseDown(screen.getByRole("tab", { name: "Code" }), {
			button: 0,
		});

		expect(screen.getByText("<Button>Save</Button>")).toBeDefined();
	});

	it("renders only the canonical content in a live preview mode", () => {
		const { container } = render(
			<CatalogRenderModeProvider mode="card">
				<ExampleBlock
					code="<Button>Save</Button>"
					render={() => <button type="button">Save</button>}
				/>
			</CatalogRenderModeProvider>,
		);

		expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
		expect(screen.queryByRole("tab", { name: "Code" })).toBeNull();
		expect(screen.queryByText("<Button>Save</Button>")).toBeNull();
		expect(
			container
				.querySelector("[data-portal-preview-content]")
				?.getAttribute("data-portal-render-mode"),
		).toBe("card");
	});

	it("renders the documentation presentation with syntax and copy controls", () => {
		const { container } = render(
			<ExampleBlock
				code="import { Checkbox } from '@lemn-ltd/ui';"
				presentation="documentation"
				render={() => <button type="button">Checkbox preview</button>}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Switch to dark theme" }),
		).toBeNull();
		expect(
			container
				.querySelector(".portal-example")
				?.getAttribute("data-presentation"),
		).toBe("documentation");

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Code" }), {
			button: 0,
		});
		expect(
			screen.getByText("import { Checkbox } from '@lemn-ltd/ui';"),
		).toBeDefined();
		expect(screen.getByRole("button", { name: "Copy code" })).toBeDefined();
	});
});
