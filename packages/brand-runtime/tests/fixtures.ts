import {
	type CompiledBrandingArtifact,
	type CompiledBrandingModeObject,
	type CompiledBrandingVerifier,
	compileBrandingDefinition,
	createCompiledBrandingModeObject,
	sha256,
} from "@lemn-ltd/brand-contract";
import { getSystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";
import type {
	EmbeddedBrandingFallback,
	RuntimeBrandingEnvelope,
} from "../src/types.js";

export const WORKSPACE_ID = "workspace-lunaria-care";
export const ACTIVE_VERSION_ID = "branding-version-active";
export const FALLBACK_VERSION_ID = "branding-version-fallback";
export const PREVIEW_SESSION_ID = "preview-session-0123456789abcdef";
export const PREVIEW_SESSION_BEARER =
	"preview_session_bearer_test_only_0123456789abcdef";
export const PREVIEW_DRAFT_TITLE = "Calm operations";
const SIGNING_SECRET = "test-only-signing-secret";

export const verifier: CompiledBrandingVerifier = async (payload, signature) =>
	signature.algorithm === "Ed25519" &&
	signature.keyId === "test-ed25519-1" &&
	signature.value === (await sha256(`${payload}:${SIGNING_SECRET}`));

const signer = async (payload: string) => ({
	algorithm: "Ed25519" as const,
	keyId: "test-ed25519-1",
	value: await sha256(`${payload}:${SIGNING_SECRET}`),
});

export async function compiledArtifact(): Promise<CompiledBrandingArtifact> {
	const template = getSystemBrandingTemplate("aster-vault", 1);
	return compileDefinition(template.definition);
}

export async function compiledArtifactWithAsset(): Promise<CompiledBrandingArtifact> {
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
	return compileDefinition(definition);
}

export async function compiledArtifactWithManagedFont(
	fidelity: "preferred" | "required",
): Promise<CompiledBrandingArtifact> {
	const template = getSystemBrandingTemplate("aster-vault", 1);
	const definition = structuredClone(template.definition);
	definition.typography.body = {
		source: "managed",
		ref: "managed.inter",
		fidelity,
		emergencyFallbackRef: "system.ui",
		weights: [400, 500, 600],
		styles: ["normal"],
	};
	return compileDefinition(definition);
}

export async function envelope(
	source: RuntimeBrandingEnvelope["source"] = "active",
	modeId = "light",
): Promise<RuntimeBrandingEnvelope> {
	const artifact = await compiledArtifact();
	const modeObject = await signedModeObject({
		artifact,
		brandingVersionId: ACTIVE_VERSION_ID,
		version: source === "preview" ? null : 2,
		modeId,
	});
	return {
		source,
		modeObject,
		etag: `"${modeObject.projectionHash}"`,
		...(source === "preview"
			? {
					previewSessionId: PREVIEW_SESSION_ID,
					draftTitle: PREVIEW_DRAFT_TITLE,
					expiresAt: "2035-01-01T00:00:00.000Z",
				}
			: {}),
	};
}

export async function embeddedFallback(): Promise<EmbeddedBrandingFallback> {
	const artifact = await compiledArtifact();
	const modes = Object.fromEntries(
		await Promise.all(
			artifact.allowedModeIds.map(
				async (modeId) =>
					[
						modeId,
						await signedModeObject({
							artifact,
							brandingVersionId: FALLBACK_VERSION_ID,
							version: 1,
							modeId,
						}),
					] as const,
			),
		),
	);
	return {
		format: "lemn.embedded-branding-fallback",
		formatVersion: 1,
		exportedAt: "2026-07-17T00:00:00.000Z",
		modes,
	};
}

export async function envelopeWithAsset(
	href: string,
): Promise<RuntimeBrandingEnvelope> {
	const artifact = await compiledArtifactWithAsset();
	const modeObject = await signedModeObject({
		artifact,
		brandingVersionId: ACTIVE_VERSION_ID,
		version: 2,
		modeId: "light",
		assetDeliveries: { "primary-logo": { href } },
	});
	return {
		source: "active",
		modeObject,
		etag: `"${modeObject.projectionHash}"`,
	};
}

export async function envelopeWithManagedFont(
	fidelity: "preferred" | "required",
): Promise<RuntimeBrandingEnvelope> {
	const artifact = await compiledArtifactWithManagedFont(fidelity);
	const modeObject = await signedModeObject({
		artifact,
		brandingVersionId: ACTIVE_VERSION_ID,
		version: 2,
		modeId: "light",
	});
	return {
		source: "active",
		modeObject,
		etag: `"${modeObject.projectionHash}"`,
	};
}

export async function envelopeWithSingleAllowedMode(): Promise<RuntimeBrandingEnvelope> {
	const template = getSystemBrandingTemplate("aster-vault", 1);
	const definition = structuredClone(template.definition);
	definition.runtimeSelection = { selectable: false };
	const artifact = await compileDefinition(definition);
	const modeObject = await signedModeObject({
		artifact,
		brandingVersionId: ACTIVE_VERSION_ID,
		version: 3,
		modeId: artifact.defaultModeId,
	});
	return {
		source: "active",
		modeObject,
		etag: `"${modeObject.projectionHash}"`,
	};
}

async function signedModeObject(input: {
	readonly artifact: CompiledBrandingArtifact;
	readonly brandingVersionId: string;
	readonly version: number | null;
	readonly modeId: string;
	readonly assetDeliveries?: Readonly<
		Record<string, { readonly href: string }>
	>;
}): Promise<CompiledBrandingModeObject> {
	return createCompiledBrandingModeObject(
		{
			...input,
			workspaceId: WORKSPACE_ID,
			assetDeliveries: input.assetDeliveries ?? {},
		},
		signer,
	);
}

async function compileDefinition(
	input: unknown,
): Promise<CompiledBrandingArtifact> {
	const result = await compileBrandingDefinition(input);
	if (!result.ok) throw new Error("System branding fixture must compile");
	return result.artifact;
}
