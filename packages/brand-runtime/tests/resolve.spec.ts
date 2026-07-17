import { describe, expect, it, vi } from "vitest";
import {
	BrandingPreviewUnavailableError,
	type BrandingRuntimeClient,
	type BrandingRuntimeError,
	resolveBranding,
} from "../src/index.js";
import {
	ACTIVE_VERSION_ID,
	envelope,
	envelopeWithAsset,
	FALLBACK_VERSION_ID,
	PREVIEW_SESSION_BEARER,
	PREVIEW_SESSION_ID,
	verifier,
	WORKSPACE_ID,
} from "./fixtures.js";

describe("resolveBranding", () => {
	it("verifies and projects one active mode into an immutable SSR payload", async () => {
		const active = await envelope("active", "dark");
		const fallback = await envelope("embedded-fallback");
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
			compiledHash: active.compiledHash,
			definitionHash: active.definitionHash,
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
		const fallback = await envelope("embedded-fallback");
		const event = vi.fn();
		const client: BrandingRuntimeClient = {
			resolve: () => new Promise(() => undefined),
		};

		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client,
			verifier,
			embeddedFallback: fallback,
			timeoutMs: 25,
			onFallback: event,
		});

		expect(resolved.source).toBe("embedded-fallback");
		expect(resolved.brandingVersionId).toBe(FALLBACK_VERSION_ID);
		expect(event).toHaveBeenCalledWith({
			code: "RUNTIME_TIMEOUT",
			workspaceId: WORKSPACE_ID,
			fallbackBrandingVersionId: FALLBACK_VERSION_ID,
		});
	});

	it("rejects an invalid embedded fallback before an active request can render", async () => {
		const fallback = await envelope("embedded-fallback");
		const tampered = structuredClone(fallback);
		tampered.compiledObject.artifact.definitionName = "Tampered";
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
		active.compiledObject.artifact.definitionName = "Tampered";
		const fallback = await envelope("embedded-fallback");

		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning(active),
			verifier,
			embeddedFallback: fallback,
		});

		expect(resolved.source).toBe("embedded-fallback");
	});

	it("never hides an unavailable exact preview behind active or fallback branding", async () => {
		const fallback = await envelope("embedded-fallback");
		const preview = await envelope("preview");
		const client = clientReturning({
			...preview,
			definitionHash: "0".repeat(64),
		});

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
					definitionHash: preview.definitionHash,
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
					definitionHash: preview.definitionHash,
					expiresAt: "2035-01-01T00:00:00.000Z",
				},
				now: () => new Date("2030-01-01T00:00:00.000Z"),
			}),
		).rejects.toBeInstanceOf(BrandingPreviewUnavailableError);
	});

	it("returns an exact draft preview without serializing its session bearer", async () => {
		const fallback = await envelope("embedded-fallback");
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
				definitionHash: preview.definitionHash,
				expiresAt: preview.expiresAt,
			},
			now: () => new Date("2030-01-01T00:00:00.000Z"),
		});

		expect(resolved.source).toBe("preview");
		expect(resolved.version).toBeNull();
		expect(resolved.previewSessionId).toBe(PREVIEW_SESSION_ID);
		expect(JSON.stringify(resolved)).not.toContain(PREVIEW_SESSION_BEARER);
	});

	it("rejects cross-Workspace runtime responses", async () => {
		const active = await envelope("active");
		const fallback = await envelope("embedded-fallback");
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning({ ...active, workspaceId: "workspace-other" }),
			verifier,
			embeddedFallback: fallback,
		});
		expect(resolved.source).toBe("embedded-fallback");
	});

	it("projects signed assets with exact roles and rejects unsafe delivery URLs", async () => {
		const fallback = await envelope("embedded-fallback");
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

		const unsafe = await envelopeWithAsset("javascript:alert(1)");
		const safeFallback = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: clientReturning(unsafe),
			verifier,
			embeddedFallback: fallback,
			allowedAssetOrigins: ["https://assets.example.test"],
		});
		expect(safeFallback.source).toBe("embedded-fallback");
	});
});

function clientReturning(value: unknown): BrandingRuntimeClient {
	return { resolve: async () => value };
}
