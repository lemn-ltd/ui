import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	CHART_ANIMATION_MARK_LIMIT,
	shouldAnimateChart,
	useChartAnimation,
} from "../chart-animation.js";

function AnimationProbe(): React.JSX.Element {
	const active = useChartAnimation("auto", 24);
	return <span data-active={String(active)} />;
}

describe("chart animation policy", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("animates representative data only when motion is allowed", () => {
		expect(shouldAnimateChart("auto", 24, false)).toBe(true);
		expect(shouldAnimateChart("auto", 24, true)).toBe(false);
		expect(shouldAnimateChart("none", 24, false)).toBe(false);
	});

	it("disables automatic animation for dense rendered mark counts", () => {
		expect(shouldAnimateChart("auto", CHART_ANIMATION_MARK_LIMIT, false)).toBe(
			true,
		);
		expect(
			shouldAnimateChart("auto", CHART_ANIMATION_MARK_LIMIT + 1, false),
		).toBe(false);
	});

	it.each([
		{ reduced: false, expected: "true" },
		{ reduced: true, expected: "false" },
	])("reads reduced-motion=$reduced from the runtime media query", ({
		reduced,
		expected,
	}) => {
		vi.stubGlobal("matchMedia", () => ({
			matches: reduced,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));

		const { container } = render(<AnimationProbe />);
		expect(container.querySelector("span")?.getAttribute("data-active")).toBe(
			expected,
		);
	});
});
