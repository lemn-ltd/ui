import { cleanup, render, screen } from "@testing-library/react";
import { lazy, type ReactElement } from "react";
import { Outlet, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ShowcaseEntry } from "../../registry/showcase-types.js";
import { buildShowcaseRouter } from "../build-showcase-router.js";

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

describe("buildShowcaseRouter", () => {
	afterEach(() => {
		cleanup();
		window.history.replaceState(null, "", "/");
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
