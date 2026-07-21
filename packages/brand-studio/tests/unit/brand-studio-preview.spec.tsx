import type { BrandingDefinition } from "@lemn-ltd/brand-contract";
import { getSystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandStudioPreview } from "../../src/index.js";

const template = getSystemBrandingTemplate("aster-vault", 1);

function previewDefinition(): BrandingDefinition {
	return structuredClone(template.definition);
}

async function waitForCompiledPreview(container: HTMLElement): Promise<void> {
	await waitFor(() =>
		expect(container.querySelector("[data-lemn-brand-scope]")).not.toBeNull(),
	);
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("BrandStudioPreview", () => {
	it("moves from an accessible compiling state to a branded critical-CSS preview without network access", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		const view = render(
			<BrandStudioPreview
				className="host-preview"
				value={previewDefinition()}
			/>,
		);
		const preview = screen.getByRole("region", {
			name: "Live branding preview",
		});

		expect(preview.getAttribute("aria-busy")).toBe("true");
		expect(screen.getByRole("status").textContent).toContain(
			"Compiling preview",
		);
		expect(preview.classList.contains("host-preview")).toBe(true);

		await waitForCompiledPreview(view.container);

		expect(preview.getAttribute("aria-busy")).toBeNull();
		expect(screen.queryByText("Compiling preview")).toBeNull();
		const criticalCss = view.container.querySelector(
			"style[data-lemn-brand-critical='true']",
		);
		expect(criticalCss?.textContent).toContain("--lemn-color-accent");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("falls back to the definition default mode and updates on a controlled mode rerender", async () => {
		const definition = previewDefinition();
		const view = render(
			<BrandStudioPreview modeId="missing-mode" value={definition} />,
		);

		await waitForCompiledPreview(view.container);
		expect(
			view.container
				.querySelector("[data-lemn-brand-scope]")
				?.getAttribute("data-lemn-mode"),
		).toBe(definition.defaultModeId);

		view.rerender(<BrandStudioPreview modeId="dark" value={definition} />);

		await waitFor(() =>
			expect(
				view.container
					.querySelector("[data-lemn-brand-scope]")
					?.getAttribute("data-lemn-mode"),
			).toBe("dark"),
		);
	});

	it("exposes the complete clinic specimen through semantic landmarks and names", async () => {
		const view = render(<BrandStudioPreview value={previewDefinition()} />);
		await waitForCompiledPreview(view.container);

		expect(
			screen.getByRole("complementary", { name: "Clinic navigation" }),
		).toBeTruthy();
		expect(
			screen.getByRole("navigation", { name: "Preview sections" }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Good morning, Maya" }),
		).toBeTruthy();
		expect(screen.getByLabelText("Today at a glance")).toBeTruthy();
		expect(
			screen.getByRole("region", {
				name: "Bookings and completed visits",
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("region", { name: "Appointments by service" }),
		).toBeTruthy();
		expect(
			screen.getByRole("tablist", { name: "Appointment queues" }),
		).toBeTruthy();
		expect(screen.getByRole("table")).toBeTruthy();
		expect(
			screen.getByRole("img", { name: "Patient experience trend" }),
		).toBeTruthy();
		expect(screen.getByRole("textbox", { name: "Patient" })).toBeTruthy();
		expect(screen.getByRole("combobox", { name: "Service" })).toBeTruthy();
		expect(screen.getByRole("textbox", { name: "Note" })).toBeTruthy();
	});

	it("keeps chart range, search, reminders, and quick-booking interactions functional", async () => {
		const view = render(<BrandStudioPreview value={previewDefinition()} />);
		await waitForCompiledPreview(view.container);

		expect(
			screen.getByText(
				"7 data points across 2 area series: Bookings, Completed.",
			),
		).toBeTruthy();
		const monthRange = screen.getByText("Month").closest("button");
		expect(monthRange).not.toBeNull();
		fireEvent.click(monthRange as HTMLButtonElement);
		expect(
			screen.getByText(
				"4 data points across 2 area series: Bookings, Completed.",
			),
		).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Search patients" }));
		const search = screen.getByRole("searchbox", {
			name: "Search patients",
		}) as HTMLInputElement;
		fireEvent.change(search, { target: { value: "Amelia" } });
		expect(search.value).toBe("Amelia");

		const reminders = screen.getByRole("switch", {
			name: "Automatic reminders",
		});
		expect(reminders.getAttribute("aria-checked")).toBe("true");
		fireEvent.click(reminders);
		expect(reminders.getAttribute("aria-checked")).toBe("false");

		fireEvent.click(screen.getByRole("button", { name: "Create appointment" }));
		const success = screen
			.getByText("Booking prepared")
			.closest("[role=status]");
		expect(success?.textContent).toContain(
			"The draft appointment is ready for review.",
		);
	});
});
