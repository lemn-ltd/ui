import type { BrandingDefinition } from "@lemn-ltd/brand-contract";
import {
	getSystemBrandingTemplate,
	systemBrandingTemplates,
} from "@lemn-ltd/brand-contract/system-brandings";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandStudio } from "../../src/brand-studio.js";
import type {
	BrandStudioDraftContext,
	BrandStudioIntent,
} from "../../src/types.js";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

const template = getSystemBrandingTemplate("aster-vault", 1);
const draft: BrandStudioDraftContext = {
	brandingVersionId: "branding-version-1",
	title: "Primary visual direction",
	definitionHash: template.definitionHash,
	state: "draft",
	archived: false,
};

function initialDefinition(): BrandingDefinition {
	return structuredClone(template.definition);
}

describe("BrandStudio", () => {
	it("renders a controlled interactive preview without network or persistence ownership", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		function Harness() {
			const [value, setValue] = useState(initialDefinition);
			return <BrandStudio draft={draft} onChange={setValue} value={value} />;
		}
		const view = render(<Harness />);

		await waitFor(() =>
			expect(
				view.container.querySelector("[data-lemn-brand-scope]"),
			).not.toBeNull(),
		);
		expect(
			screen.getByRole("heading", { name: "Primary visual direction" }),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Typography specimen").querySelector("code")
				?.textContent,
		).toContain("appointment.status");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("edits branding-level governed typography shared by every mode", async () => {
		let observed = initialDefinition();
		function Harness() {
			const [value, setValue] = useState(observed);
			return (
				<BrandStudio
					draft={draft}
					onChange={(next) => {
						observed = next;
						setValue(next);
					}}
					value={value}
				/>
			);
		}
		const view = render(<Harness />);
		fireEvent.click(screen.getByRole("button", { name: /Typography/ }));
		fireEvent.change(screen.getByLabelText("Body font"), {
			target: { value: "managed.inter" },
		});

		await waitFor(() =>
			expect(observed.typography.body).toMatchObject({
				source: "managed",
				ref: "managed.inter",
				fidelity: "preferred",
				emergencyFallbackRef: "system.ui",
			}),
		);
		fireEvent.change(screen.getByLabelText("Body fidelity"), {
			target: { value: "required" },
		});
		await waitFor(() =>
			expect(observed.typography.body).toMatchObject({ fidelity: "required" }),
		);
		await waitFor(() =>
			expect(
				view.container.querySelector("style[data-lemn-brand-critical='true']")
					?.textContent,
			).toContain("font-display: block"),
		);
		expect(observed.modes.light).not.toHaveProperty("typography");
		expect(observed.modes.dark).not.toHaveProperty("typography");
	});

	it("receives the immutable catalog from its host and emits an exact selection intent", async () => {
		const intents: BrandStudioIntent[] = [];
		render(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				onIntent={(intent) => {
					intents.push(intent);
				}}
				systemBrandings={systemBrandingTemplates}
				value={initialDefinition()}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /System brandings/ }));
		fireEvent.click(
			screen.getByRole("button", { name: /Verdant Ledger · v1/ }),
		);
		expect(intents).toContainEqual({
			type: "select-system-branding",
			templateId: "verdant-ledger",
			templateVersion: 1,
			definitionHash: getSystemBrandingTemplate("verdant-ledger", 1)
				.definitionHash,
		});
	});

	it("only enables draft title editing when the host supplies persistence ownership", () => {
		const view = render(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				value={initialDefinition()}
			/>,
		);
		expect(
			(screen.getByLabelText("Draft title") as HTMLInputElement).disabled,
		).toBe(true);

		const onDraftTitleChange = vi.fn();
		view.rerender(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				onDraftTitleChange={onDraftTitleChange}
				value={initialDefinition()}
			/>,
		);
		const titleInput = screen.getByLabelText("Draft title") as HTMLInputElement;
		expect(titleInput.disabled).toBe(false);
		fireEvent.change(titleInput, { target: { value: "Editorial direction" } });
		fireEvent.blur(titleInput);
		expect(onDraftTitleChange).toHaveBeenCalledWith("Editorial direction");
	});

	it("emits save, compare, preview, publication and archive host intents without executing them", async () => {
		const intents: BrandStudioIntent[] = [];
		function Harness() {
			const [value, setValue] = useState(initialDefinition);
			return (
				<BrandStudio
					draft={draft}
					onChange={setValue}
					onIntent={(intent) => {
						intents.push(intent);
					}}
					previewTargets={[
						{
							id: "lunaria",
							name: "Lunaria",
							origin: "https://lunaria.example.test",
							status: "active",
						},
					]}
					value={value}
				/>
			);
		}
		render(<Harness />);
		fireEvent.click(screen.getByRole("button", { name: /Colors/ }));
		fireEvent.change(screen.getByLabelText("Accent color"), {
			target: { value: "#2244aa" },
		});
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "Save draft" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
		fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
		fireEvent.click(screen.getByRole("button", { name: "Compare" }));
		fireEvent.click(screen.getByRole("button", { name: "Open preview" }));
		expect(intents.map((intent) => intent.type)).toEqual([
			"save-draft",
			"compare-draft",
			"create-preview",
		]);
		expect(intents[0]).toMatchObject({
			brandingVersionId: "branding-version-1",
			expectedDefinitionHash: template.definitionHash,
			definition: { modes: { light: { colors: { accent: "#2244aa" } } } },
		});

		cleanup();
		const cleanIntents: BrandStudioIntent[] = [];
		render(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				onIntent={(intent) => {
					cleanIntents.push(intent);
				}}
				value={initialDefinition()}
			/>,
		);
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "Publish" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
		fireEvent.click(screen.getByRole("button", { name: "Publish" }));
		fireEvent.click(screen.getByRole("button", { name: "Archive" }));
		expect(cleanIntents.map((intent) => intent.type)).toEqual([
			"publish-draft",
			"archive-draft",
		]);
	});

	it("selects the first active preview target when the host catalog arrives asynchronously", async () => {
		const intents: BrandStudioIntent[] = [];
		const view = render(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				onIntent={(intent) => {
					intents.push(intent);
				}}
				previewTargets={[]}
				value={initialDefinition()}
			/>,
		);
		const targetSelect = screen.getByLabelText(
			"Preview target",
		) as HTMLSelectElement;
		expect(targetSelect.value).toBe("");
		expect(targetSelect.disabled).toBe(true);

		view.rerender(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				onIntent={(intent) => {
					intents.push(intent);
				}}
				previewTargets={[
					{
						id: "lunaria",
						name: "Lunaria",
						origin: "https://lunaria.example.test",
						status: "active",
					},
				]}
				value={initialDefinition()}
			/>,
		);

		await waitFor(() => expect(targetSelect.value).toBe("lunaria"));
		expect(targetSelect.disabled).toBe(false);
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "Open preview" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
		fireEvent.click(screen.getByRole("button", { name: "Open preview" }));
		expect(intents.at(-1)).toMatchObject({
			type: "create-preview",
			targetId: "lunaria",
		});
	});

	it("preserves a valid preview target selection when the host catalog changes", async () => {
		const firstTargets = [
			{
				id: "lunaria",
				name: "Lunaria",
				origin: "https://lunaria.example.test",
				status: "active" as const,
			},
			{
				id: "lunaria-preview",
				name: "Lunaria preview",
				origin: "https://lunaria-preview.example.test",
				status: "active" as const,
			},
		];
		const view = render(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				previewTargets={firstTargets}
				value={initialDefinition()}
			/>,
		);
		const targetSelect = screen.getByLabelText(
			"Preview target",
		) as HTMLSelectElement;
		fireEvent.change(targetSelect, {
			target: { value: "lunaria-preview" },
		});
		expect(targetSelect.value).toBe("lunaria-preview");

		view.rerender(
			<BrandStudio
				draft={draft}
				onChange={() => undefined}
				previewTargets={[
					...firstTargets,
					{
						id: "lunaria-local",
						name: "Lunaria local",
						origin: "http://localhost:3000",
						status: "active",
					},
				]}
				value={initialDefinition()}
			/>,
		);

		await waitFor(() =>
			expect(targetSelect.value).toBe("lunaria-preview"),
		);
	});

	it("renders archived and publishing drafts read-only", async () => {
		const archivedDraft = { ...draft, archived: true };
		const view = render(
			<BrandStudio
				draft={archivedDraft}
				onChange={() => undefined}
				value={initialDefinition()}
			/>,
		);
		expect(screen.getByText("Archived")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Restore" }).hasAttribute("disabled"),
		).toBe(false);
		fireEvent.click(screen.getByRole("button", { name: /Colors/ }));
		expect(
			(screen.getByLabelText("Accent color") as HTMLInputElement).disabled,
		).toBe(true);

		cleanup();
		render(
			<BrandStudio
				draft={{ ...draft, state: "publishing" }}
				hostStatus={{
					state: "publishing",
					message: "Materializing immutable artifact",
				}}
				onChange={() => undefined}
				value={initialDefinition()}
			/>,
		);
		expect(screen.getByText("Materializing immutable artifact")).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "Save draft" })
				.hasAttribute("disabled"),
		).toBe(true);
		expect(view.baseElement).toBeTruthy();
	});
});
