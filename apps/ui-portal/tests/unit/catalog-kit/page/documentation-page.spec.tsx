// @vitest-environment happy-dom

import {
	CatalogRenderModeProvider,
	DocumentationFooter,
	DocumentationPage,
	DocumentationSection,
	DocumentationSteps,
	ExampleBlock,
	MAX_DOCUMENTATION_EXAMPLES,
} from "@portal/catalog-kit";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

function ReferencePage(): React.ReactElement {
	return (
		<DocumentationPage
			category="Inputs"
			resources={[{ href: "https://example.com/docs", label: "Official Docs" }]}
			summary="Choose one option."
			title="Checkbox"
		>
			<ExampleBlock
				code="<Checkbox />"
				presentation="documentation"
				render={() => <button type="button">Interactive checkbox</button>}
			/>
			<DocumentationSection title="Installation">
				<DocumentationSteps
					steps={[
						{ title: "Install package", content: <code>pnpm add ui</code> },
					]}
				/>
			</DocumentationSection>
			<DocumentationFooter
				apiHref="https://example.com/api"
				apiLabel="Primitive API"
				apiRows={[
					{
						prop: "checked",
						type: "boolean",
						defaultValue: "false",
						description: "Current checked state.",
					},
				]}
				componentName="Checkbox"
				copyright="2026 Example. All rights reserved."
				issueHref="https://example.com/issues/new"
			/>
		</DocumentationPage>
	);
}

describe("DocumentationPage", () => {
	afterEach(cleanup);

	it("renders the reusable reference-page hierarchy and privacy-safe external links", () => {
		render(<ReferencePage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Checkbox" }),
		).toBeDefined();
		expect(
			screen.getByRole("heading", { level: 2, name: "Installation" }),
		).toBeDefined();
		expect(screen.getByText("Install package")).toBeDefined();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "API Reference: Checkbox",
			}),
		).toBeDefined();
		expect(
			screen.getByText("© 2026 Example. All rights reserved."),
		).toBeDefined();
		expect(screen.getByRole("table")).toBeDefined();
		expect(screen.getByRole("rowheader", { name: "checked" })).toBeDefined();
		expect(screen.getByText("Current checked state.")).toBeDefined();

		const docsLink = screen.getByRole("link", {
			name: "Official Docs (opens in a new tab)",
		});
		expect(docsLink.getAttribute("target")).toBe("_blank");
		expect(docsLink.getAttribute("rel")).toBe("noreferrer noopener");
		expect(docsLink.getAttribute("referrerpolicy")).toBe("no-referrer");
	});

	it("preserves the canonical live-preview contract", () => {
		render(
			<CatalogRenderModeProvider mode="card">
				<ReferencePage />
			</CatalogRenderModeProvider>,
		);

		expect(
			screen.getByRole("button", { name: "Interactive checkbox" }),
		).toBeDefined();
		expect(screen.queryByRole("heading", { name: "Checkbox" })).toBeNull();
		expect(screen.queryByText("Installation")).toBeNull();
	});

	it("enforces the documentation-wide example limit", () => {
		const examples = Array.from(
			{ length: MAX_DOCUMENTATION_EXAMPLES + 1 },
			(_, index) => (
				<ExampleBlock
					code={`example ${index}`}
					key={index}
					render={() => <span>Example {index}</span>}
				/>
			),
		);

		expect(() =>
			render(
				<DocumentationPage
					category="Inputs"
					summary="Too many examples."
					title="Overflow"
				>
					{examples}
				</DocumentationPage>,
			),
		).toThrow(`support at most ${MAX_DOCUMENTATION_EXAMPLES}`);
	});
});
