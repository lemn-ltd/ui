import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProgressBar, type ProgressBarVariant } from "../progress-bar.js";

const VARIANTS: ProgressBarVariant[] = [
	"determinate",
	"indeterminate",
	"route",
];

describe("ProgressBar", () => {
	afterEach(() => cleanup());

	it("defaults to the determinate variant", () => {
		const { container } = render(<ProgressBar />);
		expect(
			container.querySelector(".ui-progress-bar")?.getAttribute("data-variant"),
		).toBe("determinate");
	});

	it("maps each variant to data-variant", () => {
		for (const variant of VARIANTS) {
			const { container, unmount } = render(<ProgressBar variant={variant} />);
			expect(
				container
					.querySelector(".ui-progress-bar")
					?.getAttribute("data-variant"),
			).toBe(variant);
			unmount();
		}
	});

	it("exposes progressbar ARIA on the determinate variant", () => {
		const { container } = render(
			<ProgressBar value={60} variant="determinate" />,
		);
		const bar = container.querySelector(".ui-progress-bar");
		expect(bar?.getAttribute("role")).toBe("progressbar");
		expect(bar?.getAttribute("aria-valuenow")).toBe("60");
		expect(bar?.getAttribute("aria-valuemin")).toBe("0");
		expect(bar?.getAttribute("aria-valuemax")).toBe("100");
	});

	it("binds the determinate fill width to the clamped value", () => {
		const { container } = render(
			<ProgressBar value={60} variant="determinate" />,
		);
		const fill = container.querySelector<HTMLElement>(".ui-progress-bar__fill");
		expect(fill?.style.getPropertyValue("--ui-progress-value")).toBe("60%");
	});

	it("clamps out-of-range values", () => {
		const { container } = render(
			<ProgressBar value={150} variant="determinate" />,
		);
		expect(
			container
				.querySelector(".ui-progress-bar")
				?.getAttribute("aria-valuenow"),
		).toBe("100");
	});

	it("omits progressbar ARIA on the indeterminate and route variants", () => {
		for (const variant of ["indeterminate", "route"] as ProgressBarVariant[]) {
			const { container, unmount } = render(<ProgressBar variant={variant} />);
			expect(
				container.querySelector(".ui-progress-bar")?.getAttribute("role"),
			).toBeNull();
			unmount();
		}
	});

	it("renders the percent label only when showLabel is set on determinate", () => {
		const { container: withLabel } = render(
			<ProgressBar showLabel value={42} variant="determinate" />,
		);
		expect(
			withLabel.querySelector(".ui-progress-bar__label")?.textContent,
		).toBe("42%");

		const { container: withoutLabel } = render(
			<ProgressBar value={42} variant="determinate" />,
		);
		expect(withoutLabel.querySelector(".ui-progress-bar__label")).toBeNull();
	});

	it("supports arbitrary maxima, semantic tones, labels, and motion policy", () => {
		const { container, getByRole, getByText } = render(
			<ProgressBar
				animation="none"
				label="36 of 48"
				max={48}
				tone="success"
				value={36}
			/>,
		);
		const progress = getByRole("progressbar");
		expect(progress.getAttribute("aria-valuemax")).toBe("48");
		expect(progress.getAttribute("aria-valuenow")).toBe("36");
		expect(progress.getAttribute("data-tone")).toBe("success");
		expect(progress.getAttribute("data-animation")).toBe("none");
		expect(
			container
				.querySelector<HTMLElement>(".ui-progress-bar__fill")
				?.style.getPropertyValue("--ui-progress-value"),
		).toBe("75%");
		expect(getByText("36 of 48")).toBeTruthy();
	});
});
