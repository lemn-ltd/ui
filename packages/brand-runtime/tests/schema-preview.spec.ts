import { describe, expect, it } from "vitest";
import {
	BrandingPreviewUnavailableError,
	parseRuntimeBrandingEnvelope,
	validateBrandingPreviewSelection,
} from "../src/index.js";
import {
	envelope,
	PREVIEW_SESSION_BEARER,
	PREVIEW_SESSION_ID,
	WORKSPACE_ID,
} from "./fixtures.js";

describe("untrusted runtime boundaries", () => {
	it("rejects non-JSON values before compiled object verification", async () => {
		const input = structuredClone(await envelope("active")) as Record<
			string,
			unknown
		>;
		const object = input.compiledObject as {
			artifact: Record<string, unknown>;
		};
		object.artifact.nonJson = new Date();
		expect(() => parseRuntimeBrandingEnvelope(input)).toThrow();
	});

	it("accepts only a live preview selection from the expected Workspace", () => {
		const selection = {
			workspaceId: WORKSPACE_ID,
			sessionId: PREVIEW_SESSION_ID,
			sessionBearer: PREVIEW_SESSION_BEARER,
			definitionHash: "a".repeat(64),
			expiresAt: "2035-01-01T00:00:00.000Z",
		};
		expect(
			validateBrandingPreviewSelection(
				selection,
				WORKSPACE_ID,
				new Date("2030-01-01T00:00:00.000Z"),
			),
		).toEqual(selection);
		expect(() =>
			validateBrandingPreviewSelection(
				selection,
				"workspace-other",
				new Date("2030-01-01T00:00:00.000Z"),
			),
		).toThrow(BrandingPreviewUnavailableError);
		expect(() =>
			validateBrandingPreviewSelection(
				selection,
				WORKSPACE_ID,
				new Date("2036-01-01T00:00:00.000Z"),
			),
		).toThrow(BrandingPreviewUnavailableError);
	});

	it("requires null version only for draft previews", async () => {
		const active = await envelope("active");
		const preview = await envelope("preview");
		expect(() =>
			parseRuntimeBrandingEnvelope({ ...active, version: null }),
		).toThrow();
		expect(() =>
			parseRuntimeBrandingEnvelope({ ...preview, version: 1 }),
		).toThrow();
	});
});
