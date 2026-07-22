import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScreenShell } from "../screen-shell.js";
import { type SidebarMode, useShell } from "../shell-context.js";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "screen-shell.css"), "utf8");

const MOBILE_MATCH_MEDIA = (query: string) => ({
	matches: true,
	media: query,
	onchange: null,
	addEventListener: () => {},
	removeEventListener: () => {},
	addListener: () => {},
	removeListener: () => {},
	dispatchEvent: () => false,
});

// A matchMedia stub whose `matches` can be flipped at runtime to simulate a
// breakpoint change firing the 'change' listener.
function makeControllableMatchMedia(initial: boolean) {
	let matches = initial;
	let listener: ((event: { matches: boolean }) => void) | null = null;
	const matchMedia = (query: string) => ({
		get matches() {
			return matches;
		},
		media: query,
		onchange: null,
		addEventListener: (
			_type: string,
			handler: (event: { matches: boolean }) => void,
		) => {
			listener = handler;
		},
		removeEventListener: () => {
			listener = null;
		},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	});
	return {
		matchMedia,
		set(next: boolean) {
			matches = next;
			listener?.({ matches: next });
		},
	};
}

function ModeProbe(): ReactElement {
	const shell = useShell();
	return (
		<>
			<span data-testid="mode">{shell?.sidebar.mode ?? "none"}</span>
			<button
				data-testid="set-rail"
				onClick={() => shell?.sidebar.setMode("rail")}
				type="button"
			>
				rail
			</button>
		</>
	);
}

function pressCmdB(): void {
	act(() => {
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "b", metaKey: true }),
		);
	});
}

describe("ScreenShell", () => {
	afterEach(() => cleanup());

	it("renders the sidebar, topbar and content slot nodes in their regions", () => {
		const { container } = render(
			<ScreenShell
				sidebar={<div data-testid="sidebar" />}
				topBar={<div data-testid="topbar" />}
			>
				<div data-testid="content" />
			</ScreenShell>,
		);
		expect(
			container.querySelector(
				'.ui-screen-shell__sidebar [data-testid="sidebar"]',
			),
		).not.toBeNull();
		expect(
			container.querySelector(
				'.ui-screen-shell__topbar [data-testid="topbar"]',
			),
		).not.toBeNull();
		expect(
			container.querySelector(
				'.ui-screen-shell__content [data-testid="content"]',
			),
		).not.toBeNull();
	});

	it("tracks the dynamic viewport while retaining the legacy viewport fallback", () => {
		const rule = css.match(/\.ui-screen-shell\s*{([^}]*)}/)?.[1];
		expect(rule).toBeTruthy();
		expect(rule).toMatch(/height:\s*100vh\s*;/u);
		expect(css).toMatch(
			/@supports\s*\(height:\s*100dvh\)[\s\S]*height:\s*100dvh\s*;/u,
		);
	});

	it("omits the topbar region when no topBar is provided", () => {
		const { container } = render(
			<ScreenShell sidebar={<div data-testid="sidebar" />}>
				<div data-testid="content" />
			</ScreenShell>,
		);
		expect(container.querySelector(".ui-screen-shell__topbar")).toBeNull();
	});

	it("cycles the sidebar expanded → rail → hidden → expanded on repeated Cmd+B", () => {
		const { getByTestId } = render(
			<ScreenShell collapseBehavior="cycle" sidebar={<ModeProbe />}>
				<div />
			</ScreenShell>,
		);
		expect(getByTestId("mode").textContent).toBe("expanded");
		pressCmdB();
		expect(getByTestId("mode").textContent).toBe("rail");
		pressCmdB();
		expect(getByTestId("mode").textContent).toBe("hidden");
		pressCmdB();
		expect(getByTestId("mode").textContent).toBe("expanded");
	});

	it('honors collapseBehavior="expand-hide" (expanded ↔ hidden, no rail)', () => {
		const { getByTestId } = render(
			<ScreenShell collapseBehavior="expand-hide" sidebar={<ModeProbe />}>
				<div />
			</ScreenShell>,
		);
		pressCmdB();
		expect(getByTestId("mode").textContent).toBe("hidden");
		pressCmdB();
		expect(getByTestId("mode").textContent).toBe("expanded");
	});

	it('honors collapseBehavior="expand-rail" (expanded ↔ rail, no hidden)', () => {
		const { getByTestId } = render(
			<ScreenShell collapseBehavior="expand-rail" sidebar={<ModeProbe />}>
				<div />
			</ScreenShell>,
		);
		pressCmdB();
		expect(getByTestId("mode").textContent).toBe("rail");
		pressCmdB();
		expect(getByTestId("mode").textContent).toBe("expanded");
	});

	it("coerces rail to hidden on mobile (rail is desktop-only)", () => {
		vi.stubGlobal("matchMedia", MOBILE_MATCH_MEDIA);
		const { getByTestId } = render(
			<ScreenShell collapseBehavior="cycle" sidebar={<ModeProbe />}>
				<div />
			</ScreenShell>,
		);
		expect(getByTestId("mode").textContent).toBe("hidden");
		fireEvent.click(getByTestId("set-rail"));
		expect(getByTestId("mode").textContent).toBe("hidden");
		vi.unstubAllGlobals();
	});

	it("restores the desktop mode after a mobile round-trip", () => {
		const media = makeControllableMatchMedia(false);
		vi.stubGlobal("matchMedia", media.matchMedia);
		const { getByTestId } = render(
			<ScreenShell collapseBehavior="cycle" sidebar={<ModeProbe />}>
				<div />
			</ScreenShell>,
		);
		pressCmdB(); // expanded → rail (remembered as the desktop mode)
		expect(getByTestId("mode").textContent).toBe("rail");
		act(() => media.set(true)); // enter mobile → drawer closed
		expect(getByTestId("mode").textContent).toBe("hidden");
		act(() => media.set(false)); // back to desktop → rail restored
		expect(getByTestId("mode").textContent).toBe("rail");
		vi.unstubAllGlobals();
	});

	it("reports mode changes through onSidebarModeChange", () => {
		const changes: SidebarMode[] = [];
		render(
			<ScreenShell
				collapseBehavior="cycle"
				onSidebarModeChange={(mode) => changes.push(mode)}
				sidebar={<div />}
			>
				<div />
			</ScreenShell>,
		);
		act(() => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
			);
		});
		expect(changes).toEqual(["rail"]);
	});

	it("opens a dismiss backdrop on the mobile drawer and closes it when tapped", () => {
		vi.stubGlobal("matchMedia", MOBILE_MATCH_MEDIA);

		const { container } = render(
			<ScreenShell sidebar={<div />}>
				<div />
			</ScreenShell>,
		);
		pressCmdB(); // mobile starts closed; open it
		const backdrop = container.querySelector(".ui-screen-shell__backdrop");
		expect(backdrop).not.toBeNull();
		if (backdrop) fireEvent.click(backdrop);
		expect(container.querySelector(".ui-screen-shell__backdrop")).toBeNull();

		vi.unstubAllGlobals();
	});

	it("makes the main region inert while the mobile drawer is open", () => {
		vi.stubGlobal("matchMedia", MOBILE_MATCH_MEDIA);
		const { container } = render(
			<ScreenShell sidebar={<div />} topBar={<div />}>
				<div />
			</ScreenShell>,
		);
		const main = container.querySelector(".ui-screen-shell__main");
		expect(main?.hasAttribute("inert")).toBe(false);
		pressCmdB(); // open the drawer
		expect(main?.hasAttribute("inert")).toBe(true);
		vi.unstubAllGlobals();
	});

	it("closes the open mobile drawer on Escape", () => {
		vi.stubGlobal("matchMedia", MOBILE_MATCH_MEDIA);

		const { container } = render(
			<ScreenShell sidebar={<div />}>
				<div />
			</ScreenShell>,
		);
		pressCmdB();
		expect(
			container.querySelector(".ui-screen-shell__backdrop"),
		).not.toBeNull();
		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		});
		expect(container.querySelector(".ui-screen-shell__backdrop")).toBeNull();

		vi.unstubAllGlobals();
	});

	it("exposes a dock and cycles it on Cmd+J when a right panel is set", () => {
		function Probe(): ReactElement {
			const dock = useShell()?.dock;
			return <span data-testid="dock">{dock ? dock.mode : "none"}</span>;
		}
		const { getByTestId } = render(
			<ScreenShell rightPanel={<div />} sidebar={<Probe />}>
				<div />
			</ScreenShell>,
		);
		expect(getByTestId("dock").textContent).toBe("hidden");
		act(() => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", { key: "j", metaKey: true }),
			);
		});
		expect(getByTestId("dock").textContent).toBe("maximized");
	});
});
