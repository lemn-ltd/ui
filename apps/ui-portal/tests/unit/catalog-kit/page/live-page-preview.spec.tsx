// @vitest-environment happy-dom

import {
	CatalogRenderModeProvider,
	ComponentPage,
	ExampleBlock,
	FoundationPage,
} from "@portal/catalog-kit";
import { cleanup, render, screen } from "@testing-library/react";
import { lazy, type ReactElement, Suspense } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	CATALOG_MANIFEST,
	CATALOG_SECTION_MANIFEST,
} from "../../../../src/catalog/catalog-manifest.js";
import {
	PortalPageFallback,
	PortalRouteError,
	portalRouter,
} from "../../../../src/client/router/router.js";

afterEach(() => {
	cleanup();
	window.history.replaceState(null, "", "/");
});

describe("live page previews", () => {
	it("selects the first canonical ExampleBlock from a component page", () => {
		render(
			<CatalogRenderModeProvider mode="playground">
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
			</CatalogRenderModeProvider>,
		);

		expect(screen.getByRole("button", { name: "Canonical" })).toBeDefined();
		expect(screen.queryByRole("button", { name: "Secondary" })).toBeNull();
		expect(screen.queryByText("Supporting documentation")).toBeNull();
		expect(screen.queryByRole("heading", { name: "Button" })).toBeNull();
	});

	it("selects the first token group from a foundation page", () => {
		render(
			<CatalogRenderModeProvider mode="card">
				<FoundationPage caption="Token reference" title="Colors">
					<div>Canonical color group</div>
					<div>Secondary color group</div>
				</FoundationPage>
			</CatalogRenderModeProvider>,
		);

		expect(screen.getByText("Canonical color group")).toBeDefined();
		expect(screen.queryByText("Secondary color group")).toBeNull();
		expect(screen.queryByRole("heading", { name: "Colors" })).toBeNull();
	});

	it("gives a full foundation route one canonical level-one heading", () => {
		render(
			<CatalogRenderModeProvider mode="page">
				<FoundationPage caption="Token reference" title="Colors">
					<div>Canonical color group</div>
				</FoundationPage>
			</CatalogRenderModeProvider>,
		);

		expect(
			screen.getByRole("heading", { level: 1, name: "Colors" }),
		).toBeDefined();
		expect(
			screen.queryByRole("heading", { level: 2, name: "Colors" }),
		).toBeNull();
	});
});

function renderFixtureRoute(page: () => ReactElement): void {
	const router = createMemoryRouter([
		{
			path: "/",
			errorElement: <PortalRouteError />,
			element: <Suspense fallback={<PortalPageFallback />}>{page()}</Suspense>,
		},
	]);
	render(<RouterProvider router={router} />);
}

describe("portal router lifecycle", () => {
	it("projects every public route from the React-free manifests", () => {
		const shellRoute = portalRouter.routes.find((route) => route.path === "/");
		expect(shellRoute).toBeDefined();
		const children = shellRoute?.children ?? [];
		expect(children.filter((route) => route.index)).toHaveLength(1);
		expect(
			children
				.map((route) => route.path)
				.filter((path): path is string => path !== undefined && path !== "*"),
		).toEqual([
			...CATALOG_SECTION_MANIFEST.map((section) => section.path.slice(1)),
			...CATALOG_MANIFEST.map((entry) => entry.path.slice(1)),
		]);
	});

	it("renders an explicit loading state while a lazy route is pending", () => {
		const PendingPage = lazy(
			() =>
				new Promise<{ default: () => ReactElement }>(() => {
					// Deliberately unresolved to exercise the operational loading surface.
				}),
		);

		renderFixtureRoute(() => <PendingPage />);

		const status = screen.getByRole("status");
		expect(status.textContent).toContain("Loading…");
		expect(status.getAttribute("data-portal-route-state")).toBe("loading");
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
