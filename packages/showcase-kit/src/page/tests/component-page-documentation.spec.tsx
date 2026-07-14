import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExampleBlock } from "../../example/example-block.js";
import { PropsTable } from "../../example/props-table.js";
import { ShowcaseEntryProvider } from "../../registry/entry-context.js";
import { ComponentPage } from "../component-page.js";

function CatalogPage(): React.ReactElement {
	return (
		<ComponentPage summary="Triggers an action." title="Button">
			<ExampleBlock
				code={"<Button onClick={() => {}}>Save</Button>"}
				defaultView="code"
				render={() => <button type="button">Save</button>}
			/>
			<ExampleBlock
				code={"<Button disabled>Unavailable</Button>"}
				render={() => <button disabled>Unavailable</button>}
			/>
			<p>Variant guidance</p>
			<PropsTable
				rows={[
					{
						name: "disabled",
						type: "boolean",
						defaultValue: "false",
						description: "Prevents activation.",
					},
				]}
			/>
		</ComponentPage>
	);
}

describe("ComponentPage documentation contract", () => {
	afterEach(cleanup);

	it("adapts catalog pages to the common interactive reference layout", () => {
		const { container } = render(<CatalogPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Button" }),
		).toBeDefined();
		expect(screen.getByRole("heading", { name: "Installation" })).toBeDefined();
		expect(screen.getByText("pnpm add @lemn-ltd/ui")).toBeDefined();
		expect(container.querySelectorAll(".showcase-example")).toHaveLength(2);
		expect(container.textContent).toContain(
			"import { Button } from '@lemn-ltd/ui';",
		);
		const legacyPackage = `@${["app", "ranks"].join("")}/ui`;
		expect(container.textContent).not.toContain(legacyPackage);
		expect(screen.getByText("Variant guidance")).toBeDefined();
		expect(
			screen.getByRole("heading", { name: "API Reference: Button" }),
		).toBeDefined();

		const headers = within(screen.getByRole("table"))
			.getAllByRole("columnheader")
			.map((header) => header.textContent);
		expect(headers).toEqual(["Prop", "Type", "Default", "Description"]);
	});

	it("fails loudly when a page omits its API contract", () => {
		expect(() =>
			render(
				<ComponentPage summary="Missing API." title="Button">
					<ExampleBlock
						code="<Button />"
						render={() => <button type="button" />}
					/>
				</ComponentPage>,
			),
		).toThrow("must define a PropsTable");
	});

	it("keeps pattern pages on their original page chrome", () => {
		render(
			<ShowcaseEntryProvider
				entry={{
					area: "core",
					group: "Patterns",
					kind: "pattern",
					page: () => <div />,
					slug: "list-table",
					summary: "Pattern composition.",
					title: "List + table",
				}}
			>
				<ComponentPage summary="Pattern composition." title="List + table">
					<p>Pattern details</p>
				</ComponentPage>
			</ShowcaseEntryProvider>,
		);

		expect(screen.getByRole("heading", { name: "List + table" })).toBeDefined();
		expect(screen.getByText("Pattern details")).toBeDefined();
		expect(document.querySelector(".showcase-docs-page")).toBeNull();
	});
});
