import {
	type CompiledBrandingObject,
	type CompiledBrandingVerifier,
	compileBrandingDefinition,
	createCompiledBrandingObject,
	sha256,
} from "@lemn-ltd/brand-contract";
import { getSystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";
import type { RuntimeBrandingEnvelope } from "../src/types.js";

export const WORKSPACE_ID = "workspace-lunaria-care";
export const ACTIVE_VERSION_ID = "branding-version-active";
export const FALLBACK_VERSION_ID = "branding-version-fallback";
export const PREVIEW_SESSION_ID = "preview-session-0123456789abcdef";
export const PREVIEW_SESSION_BEARER =
	"preview_session_bearer_test_only_0123456789abcdef";
const SIGNING_SECRET = "test-only-signing-secret";

export const verifier: CompiledBrandingVerifier = async (payload, signature) =>
	signature.algorithm === "Ed25519" &&
	signature.keyId === "test-ed25519-1" &&
	signature.value === (await sha256(`${payload}:${SIGNING_SECRET}`));

export async function compiledObject(): Promise<CompiledBrandingObject> {
	const template = getSystemBrandingTemplate("aster-vault", 1);
	return signDefinition(template.definition);
}

export async function compiledObjectWithAsset(): Promise<CompiledBrandingObject> {
	const template = getSystemBrandingTemplate("aster-vault", 1);
	const definition = {
		...structuredClone(template.definition),
		assets: {
			"primary-logo": {
				id: "primary-logo",
				kind: "logo",
				storageKey: "assets/primary-logo.svg",
				sha256: "a".repeat(64),
				mediaType: "image/svg+xml",
				width: 240,
				height: 80,
				accessibleLabel: "Lunaria Care",
				licenseId: "LEMN-Original-1.0",
			},
		},
		assetRoles: { primaryLogo: "primary-logo" },
	};
	return signDefinition(definition);
}

async function signDefinition(input: unknown): Promise<CompiledBrandingObject> {
	const result = await compileBrandingDefinition(input);
	if (!result.ok) throw new Error("System branding fixture must compile");
	return createCompiledBrandingObject(result.artifact, async (payload) => ({
		algorithm: "Ed25519",
		keyId: "test-ed25519-1",
		value: await sha256(`${payload}:${SIGNING_SECRET}`),
	}));
}

export async function envelope(
	source: RuntimeBrandingEnvelope["source"] = "active",
	modeId = "light",
): Promise<RuntimeBrandingEnvelope> {
	const object = await compiledObject();
	return {
		workspaceId: WORKSPACE_ID,
		brandingVersionId:
			source === "embedded-fallback" ? FALLBACK_VERSION_ID : ACTIVE_VERSION_ID,
		version:
			source === "preview" ? null : source === "embedded-fallback" ? 1 : 2,
		modeId,
		definitionHash: object.artifact.definitionHash,
		compiledHash: object.compiledHash,
		byteHash: object.byteHash,
		source,
		compiledObject: object,
		assetDeliveries: {},
		etag: `"${object.compiledHash}"`,
		...(source === "preview"
			? {
					previewSessionId: PREVIEW_SESSION_ID,
					expiresAt: "2035-01-01T00:00:00.000Z",
				}
			: {}),
		...(source === "embedded-fallback"
			? { exportedAt: "2026-07-17T00:00:00.000Z" }
			: {}),
	};
}

export async function envelopeWithAsset(
	href: string,
): Promise<RuntimeBrandingEnvelope> {
	const base = await envelope("active");
	const object = await compiledObjectWithAsset();
	return {
		...base,
		definitionHash: object.artifact.definitionHash,
		compiledHash: object.compiledHash,
		byteHash: object.byteHash,
		compiledObject: object,
		assetDeliveries: {
			"primary-logo": { href },
		},
	};
}
