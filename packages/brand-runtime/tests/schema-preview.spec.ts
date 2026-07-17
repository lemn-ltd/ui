import { describe, expect, it } from "vitest";
import {
	BrandingPreviewUnavailableError,
	parseRuntimeBrandingEnvelope,
	validateBrandingPreviewSelection,
} from "../src/index.js";
import {
	envelope,
	PREVIEW_DRAFT_TITLE,
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
		const object = input.modeObject as {
			projection: Record<string, unknown>;
		};
		object.projection.nonJson = new Date();
		expect(() => parseRuntimeBrandingEnvelope(input)).toThrow();
	});

	it("rejects legacy envelopes that expose full compiled artifacts", async () => {
		const input = {
			...(await envelope("active")),
			compiledObject: {
				artifact: {
					modes: { dark: { privateSentinel: "must-not-cross-runtime" } },
				},
			},
		};

		expect(() => parseRuntimeBrandingEnvelope(input)).toThrow();
	});

	it("accepts only a live preview selection from the expected Workspace", () => {
		const selection = {
			workspaceId: WORKSPACE_ID,
			sessionId: PREVIEW_SESSION_ID,
			sessionBearer: PREVIEW_SESSION_BEARER,
			draftTitle: PREVIEW_DRAFT_TITLE,
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
		const invalidActive = structuredClone(active);
		invalidActive.modeObject.projection.version = null;
		const invalidPreview = structuredClone(preview);
		invalidPreview.modeObject.projection.version = 1;
		expect(() => parseRuntimeBrandingEnvelope(invalidActive)).toThrow();
		expect(() => parseRuntimeBrandingEnvelope(invalidPreview)).toThrow();
	});

	it("rejects non-canonical signing key identifiers without trimming", async () => {
		for (const keyId of [" test-ed25519-1", "test-ed25519-1\nother"]) {
			const input = structuredClone(await envelope("active"));
			input.modeObject.signature.keyId = keyId;
			expect(() => parseRuntimeBrandingEnvelope(input)).toThrow();
		}
	});

	it("never normalizes whitespace inside a signed mode projection", async () => {
		const input = structuredClone(await envelope("active"));
		input.modeObject.projection.workspaceId = ` ${WORKSPACE_ID} `;

		expect(() => parseRuntimeBrandingEnvelope(input)).toThrow();
	});
});
