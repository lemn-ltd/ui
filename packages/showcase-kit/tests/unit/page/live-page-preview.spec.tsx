import { cleanup, render, screen } from "@testing-library/react";
import { lazy, type ReactElement } from "react";
import { Outlet, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExampleBlock } from "../../../src/example/example-block.js";
import { ComponentPage } from "../../../src/page/component-page.js";
import { FoundationPage } from "../../../src/page/foundation-page.js";
import { ShowcaseRenderModeProvider } from "../../../src/preview/render-mode.js";
import type { ShowcaseEntry } from "../../../src/registry/showcase-types.js";
import { buildShowcaseRouter } from "../../../src/router/build-showcase-router.js";

afterEach(() => {
	cleanup();
	window.history.replaceState(null, "", "/");
});

describe("live page previews", () => {
	it("selects the first canonical ExampleBlock from a component page", () => {
		render(
			<ShowcaseRenderModeProvider mode="playground">
				<ComponentPage summary="Summary" title="Button">
					<p>Supporting documentation</p>
					<ExampleBlock
						code="<button>Canonical</button>"
						render={() => <button type="button">Canonical</button>}
					/>
					<ExampleBlock
						code="<button>Secondary</button>"
						render={() => <button type="button">Secondary</button>}
					/>
				</ComponentPage>
			</ShowcaseRenderModeProvider>,
		);

		expect(screen.getByRole("button", { name: "Canonical" })).toBeDefined();
		expect(screen.queryByRole("button", { name: "Secondary" })).toBeNull();
		expect(screen.queryByText("Supporting documentation")).toBeNull();
		expect(screen.queryByRole("heading", { name: "Button" })).toBeNull();
	});

	it("selects the first token group from a foundation page", () => {
		render(
			<ShowcaseRenderModeProvider mode="card">
				<FoundationPage caption="Token reference" title="Colors">
					<div>Canonical color group</div>
					<div>Secondary color group</div>
				</FoundationPage>
			</ShowcaseRenderModeProvider>,
		);

		expect(screen.getByText("Canonical color group")).toBeDefined();
		expect(screen.queryByText("Secondary color group")).toBeNull();
		expect(screen.queryByRole("heading", { name: "Colors" })).toBeNull();
	});
});

function Shell(): ReactElement {
	return <Outlet />;
}

function FixturePage(): ReactElement {
	return <div>Fixture page</div>;
}

function fixtureEntry(page: () => ReactElement): ShowcaseEntry<"Inputs"> {
	return {
		area: "core",
		group: "Inputs",
		kind: "component",
		page,
		slug: "fixture",
		status: "stable",
		summary: "Fixture route",
		title: "Fixture",
	};
}

function renderFixtureRoute(page: () => ReactElement): void {
	window.history.replaceState(null, "", "/core/components/fixture");
	const router = buildShowcaseRouter({
		notFound: FixturePage,
		overview: FixturePage,
		registry: [fixtureEntry(page)],
		shell: Shell,
	});
	render(<RouterProvider router={router} />);
}

describe("showcase router lifecycle", () => {
	it("renders an explicit loading state while a lazy route is pending", () => {
		const PendingPage = lazy(
			() =>
				new Promise<{ default: () => ReactElement }>(() => {
					// Deliberately unresolved to exercise the operational loading surface.
				}),
		);

		renderFixtureRoute(() => <PendingPage />);

		const status = screen.getByRole("status");
		expect(status.textContent).toContain("Loading...");
		expect(status.getAttribute("data-showcase-route-state")).toBe("loading");
	});

	it("renders a recoverable route error when a lazy import rejects", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const FailedPage = lazy(async () => {
			throw new Error("fixture lazy import failed");
		});

		renderFixtureRoute(() => <FailedPage />);

		expect(
			await screen.findByRole("heading", { name: "Page unavailable" }),
		).toBeDefined();
		expect(screen.getByRole("alert").textContent).toContain(
			"fixture lazy import failed",
		);
		expect(screen.getByRole("button", { name: "Reload page" })).toBeDefined();
	});
});
