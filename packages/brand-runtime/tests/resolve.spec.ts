import { describe, expect, it, vi } from "vitest";
import {
	BrandingPreviewUnavailableError,
	type BrandingRuntimeClient,
	type BrandingRuntimeError,
	resolveBranding,
} from "../src/index.js";
import {
	ACTIVE_VERSION_ID,
	embeddedFallback,
	envelope,
	envelopeWithAsset,
	envelopeWithSingleAllowedMode,
	FALLBACK_VERSION_ID,
	PREVIEW_DRAFT_TITLE,
	PREVIEW_SESSION_BEARER,
	PREVIEW_SESSION_ID,
	verifier,
	WORKSPACE_ID,
} from "./fixtures.js";

describe("resolveBranding", () => {
	it("verifies and projects one active mode into an immutable SSR payload", async () => {
		const active = await envelope("active", "dark");
		const fallback = await embeddedFallback();
		const client = clientReturning(active);

		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			modeId: "dark",
			client,
			verifier,
			embeddedFallback: fallback,
		});

		expect(resolved).toMatchObject({
			workspaceId: WORKSPACE_ID,
			brandingVersionId: ACTIVE_VERSION_ID,
			version: 2,
			modeId: "dark",
			source: "active",
			compiledHash: active.modeObject.projection.compiledHash,
			definitionHash: active.modeObject.projection.definitionHash,
			signatureKeyId: "test-ed25519-1",
		});
		expect(resolved.bootstrap.tokens["--lemn-color-canvas"]).toBeTypeOf(
			"string",
		);
		expect(resolved.bootstrap.visualization).toHaveProperty("recharts");
		expect(resolved.colorScheme).toBe("dark");
		expect(resolved.bootstrap.colorScheme).toBe("dark");
		expect(resolved.criticalCss).toContain("color-scheme: dark");
		expect(Object.isFrozen(resolved)).toBe(true);
		expect(Object.isFrozen(resolved.bootstrap.tokens)).toBe(true);
	});

	it("uses the verified embedded branding on timeout and emits only sanitized evidence", async () => {
		const fallback = await embeddedFallback();
		const event = vi.fn();
		const client: BrandingRuntimeClient = {
			resolve: () => new Promise(() => undefined),
		};

		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			modeId: "dark",
			client,
			verifier,
			embeddedFallback: fallback,
			timeoutMs: 25,
			onFallback: event,
		});

		expect(resolved.source).toBe("embedded-fallback");
		expect(resolved.brandingVersionId).toBe(FALLBACK_VERSION_ID);
		expect(resolved.modeId).toBe("dark");
		expect(event).toHaveBeenCalledWith({
			code: "RUNTIME_TIMEOUT",
			workspaceId: WORKSPACE_ID,
			fallbackBrandingVersionId: FALLBACK_VERSION_ID,
		});
	});

	it("revalidates a stale requested mode against the current signed policy", async () => {
		const current = await envelopeWithSingleAllowedMode();
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			modeId: "dark",
			client: clientReturning(current),
			verifier,
			embeddedFallback: await embeddedFallback(),
		});

		expect(resolved.source).toBe("active");
		expect(resolved.version).toBe(3);
		expect(resolved.modeId).toBe(current.modeObject.projection.defaultModeId);
		expect(resolved.allowedModeIds).toEqual([
			current.modeObject.projection.defaultModeId,
		]);
	});

	it("classifies a malformed active envelope as an invalid provider response", async () => {
		const fallback = await embeddedFallback();
		const event = vi.fn();
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: {
				resolve: async () => ({ source: "active", modeObject: {} }),
			},
			verifier,
			embeddedFallback: fallback,
			onFallback: event,
		});

		expect(resolved.source).toBe("embedded-fallback");
		expect(event).toHaveBeenCalledWith({
			code: "RUNTIME_RESPONSE_INVALID",
			workspaceId: WORKSPACE_ID,
			fallbackBrandingVersionId: FALLBACK_VERSION_ID,
		});
	});

	it("rejects an invalid embedded fallback before an active request can render", async () => {
		const fallback = await embeddedFallback();
		const tampered = structuredClone(fallback);
		const light = tampered.modes.light;
		if (!light) throw new Error("fallback fixture must contain light");
		(light.projection.bootstrap.tokens as Record<string, string>)[
			"--lemn-color-accent"
		] = "#ffffff";
		const client = clientReturning(await envelope("active"));

		await expect(
			resolveBranding({
				workspaceId: WORKSPACE_ID,
				client,
				verifier,
				embeddedFallback: tampered,
			}),
		).rejects.toMatchObject<Partial<BrandingRuntimeError>>({
			code: "BRANDING_FALLBACK_INVALID",
		});
	});

	it("falls back when the live object is tampered without trusting its declared type", async () => {
		const active = structuredClone(await envelope("active"));
		(active.modeObject.projection.bootstrap.tokens as Record<string, string>)[
			"--lemn-color-accent"
		] = "#ffffff";
		const fallback = await embeddedFallback();

		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning(active),
			verifier,
			embeddedFallback: fallback,
		});

		expect(resolved.source).toBe("embedded-fallback");
	});

	it("never hides an unavailable exact preview behind active or fallback branding", async () => {
		const fallback = await embeddedFallback();
		const preview = await envelope("preview");
		const mismatchedPreview = structuredClone(preview);
		mismatchedPreview.modeObject.projection.definitionHash = "0".repeat(64);
		const client = clientReturning(mismatchedPreview);

		await expect(
			resolveBranding({
				workspaceId: WORKSPACE_ID,
				client,
				verifier,
				embeddedFallback: fallback,
				preview: {
					workspaceId: WORKSPACE_ID,
					sessionId: PREVIEW_SESSION_ID,
					sessionBearer: PREVIEW_SESSION_BEARER,
					draftTitle: PREVIEW_DRAFT_TITLE,
					definitionHash: preview.modeObject.projection.definitionHash,
					expiresAt: "2035-01-01T00:00:00.000Z",
				},
				now: () => new Date("2030-01-01T00:00:00.000Z"),
			}),
		).rejects.toBeInstanceOf(BrandingPreviewUnavailableError);

		await expect(
			resolveBranding({
				workspaceId: WORKSPACE_ID,
				client: clientReturning({
					...preview,
					expiresAt: "2034-01-01T00:00:00.000Z",
				}),
				verifier,
				embeddedFallback: fallback,
				preview: {
					workspaceId: WORKSPACE_ID,
					sessionId: PREVIEW_SESSION_ID,
					sessionBearer: PREVIEW_SESSION_BEARER,
					draftTitle: PREVIEW_DRAFT_TITLE,
					definitionHash: preview.modeObject.projection.definitionHash,
					expiresAt: "2035-01-01T00:00:00.000Z",
				},
				now: () => new Date("2030-01-01T00:00:00.000Z"),
			}),
		).rejects.toBeInstanceOf(BrandingPreviewUnavailableError);
	});

	it("returns an exact draft preview without serializing its session bearer", async () => {
		const fallback = await embeddedFallback();
		const preview = await envelope("preview");
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning(preview),
			verifier,
			embeddedFallback: fallback,
			preview: {
				workspaceId: WORKSPACE_ID,
				sessionId: PREVIEW_SESSION_ID,
				sessionBearer: PREVIEW_SESSION_BEARER,
				draftTitle: PREVIEW_DRAFT_TITLE,
				definitionHash: preview.modeObject.projection.definitionHash,
				expiresAt: preview.expiresAt,
			},
			now: () => new Date("2030-01-01T00:00:00.000Z"),
		});

		expect(resolved.source).toBe("preview");
		expect(resolved.version).toBeNull();
		expect(resolved.previewSessionId).toBe(PREVIEW_SESSION_ID);
		expect(resolved.draftTitle).toBe(PREVIEW_DRAFT_TITLE);
		expect(JSON.stringify(resolved)).not.toContain(PREVIEW_SESSION_BEARER);
	});

	it("rejects cross-Workspace runtime responses", async () => {
		const active = await envelope("active");
		const fallback = await embeddedFallback();
		const crossed = structuredClone(active);
		crossed.modeObject.projection.workspaceId = "workspace-other";
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning(crossed),
			verifier,
			embeddedFallback: fallback,
		});
		expect(resolved.source).toBe("embedded-fallback");
	});

	it("projects signed assets with exact roles and rejects unsafe delivery URLs", async () => {
		const fallback = await embeddedFallback();
		const active = await envelopeWithAsset(
			"https://assets.example.test/workspace/logo.svg",
		);
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning(active),
			verifier,
			embeddedFallback: fallback,
			allowedAssetOrigins: ["https://assets.example.test"],
		});
		expect(resolved.assetReferences).toEqual([
			expect.objectContaining({
				id: "primary-logo",
				roles: ["primaryLogo"],
				href: "https://assets.example.test/workspace/logo.svg",
				integrity: expect.stringMatching(/^sha256-/),
			}),
		]);

		const safeFallback = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning(active),
			verifier,
			embeddedFallback: fallback,
			allowedAssetOrigins: [],
		});
		expect(safeFallback.source).toBe("embedded-fallback");
	});

	it("rejects a fallback whose signed modes do not share one publication identity", async () => {
		const fallback = structuredClone(await embeddedFallback());
		const unrelated = await envelope("active", "dark");
		fallback.modes.dark = unrelated.modeObject;

		await expect(
			resolveBranding({
				workspaceId: WORKSPACE_ID,
				client: clientReturning(await envelope("active")),
				verifier,
				embeddedFallback: fallback,
			}),
		).rejects.toMatchObject<Partial<BrandingRuntimeError>>({
			code: "BRANDING_FALLBACK_INVALID",
		});
	});
});

function clientReturning(value: unknown): BrandingRuntimeClient {
	return { resolve: async () => value };
}
