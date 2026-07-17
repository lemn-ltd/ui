import type {
	CompiledBrandingObject,
	CompiledBrandingVerifier,
	CompiledFontPreload,
} from "@lemn-ltd/brand-contract";

export type BrandingRuntimeSource = "active" | "preview" | "embedded-fallback";

export type BrandingPreviewSelection = {
	readonly workspaceId: string;
	readonly sessionId: string;
	/** Server-only bearer recovered from the consumer's protected host session. */
	readonly sessionBearer: string;
	/** Human-readable draft title asserted by the preview authority. */
	readonly draftTitle: string;
	readonly definitionHash: string;
	readonly expiresAt: string;
	readonly initialModeId?: string;
};

export type BrandingPreviewExchangeRequest = {
	readonly expectedWorkspaceId: string;
	readonly sessionId: string;
	readonly code: string;
	readonly origin: string;
	readonly audience: string;
};

export type BrandingPreviewExchangeResult = BrandingPreviewSelection;

export type RuntimeAssetDelivery = {
	readonly href: string;
	readonly integrity?: string;
};

type RuntimeBrandingEnvelopeBase = {
	readonly workspaceId: string;
	readonly brandingVersionId: string;
	readonly modeId: string;
	readonly definitionHash: string;
	readonly compiledHash: string;
	readonly byteHash: string;
	readonly compiledObject: CompiledBrandingObject;
	readonly assetDeliveries: Readonly<Record<string, RuntimeAssetDelivery>>;
	readonly etag?: string;
};

export type RuntimeBrandingEnvelope =
	| (RuntimeBrandingEnvelopeBase & {
			readonly source: "active";
			readonly version: number;
	  })
	| (RuntimeBrandingEnvelopeBase & {
			readonly source: "preview";
			readonly version: null;
			readonly previewSessionId: string;
			readonly draftTitle: string;
			readonly expiresAt: string;
	  })
	| (RuntimeBrandingEnvelopeBase & {
			readonly source: "embedded-fallback";
			readonly version: number;
			readonly exportedAt: string;
	  });

export type EmbeddedBrandingFallback = Extract<
	RuntimeBrandingEnvelope,
	{ readonly source: "embedded-fallback" }
>;

export type BrandingAssetReference = {
	readonly id: string;
	readonly roles: readonly string[];
	readonly href: string;
	readonly sha256: string;
	readonly mediaType: string;
	readonly integrity?: string;
	readonly width?: number;
	readonly height?: number;
	readonly accessibleLabel?: string;
	readonly licenseId?: string;
};

export type BrandingBootstrap = {
	readonly schemaVersion: number;
	readonly compilerVersion: string;
	readonly definitionHash: string;
	readonly compiledHash: string;
	readonly modeHash: string;
	readonly modeId: string;
	readonly colorScheme: "light" | "dark";
	readonly scopeId: string;
	readonly attributes: Readonly<Record<string, string>>;
	readonly tokens: Readonly<Record<string, string>>;
	readonly visualization: Readonly<Record<string, unknown>>;
	readonly componentAppearance: Readonly<Record<string, unknown>>;
};

export type ResolvedBranding = {
	readonly workspaceId: string;
	readonly brandingVersionId: string;
	readonly version: number | null;
	readonly modeId: string;
	readonly colorScheme: "light" | "dark";
	readonly allowedModeIds: readonly string[];
	readonly definitionHash: string;
	readonly compiledHash: string;
	readonly byteHash: string;
	readonly schemaVersion: number;
	readonly compilerVersion: string;
	readonly source: BrandingRuntimeSource;
	readonly criticalCss: string;
	readonly bootstrap: BrandingBootstrap;
	readonly fontPreloads: readonly CompiledFontPreload[];
	/** Exact verified HTTPS origins required by selected-mode @font-face rules. */
	readonly fontResourceOrigins: readonly string[];
	readonly assetReferences: readonly BrandingAssetReference[];
	readonly signature: string;
	readonly signatureKeyId: string;
	readonly etag?: string;
	readonly previewSessionId?: string;
	readonly draftTitle?: string;
	readonly expiresAt?: string;
};

export type BrandingRuntimeResolveRequest = {
	readonly workspaceId: string;
	readonly modeId?: string;
	readonly preview?: BrandingPreviewSelection;
};

export interface BrandingRuntimeClient {
	resolve(
		request: BrandingRuntimeResolveRequest,
		options: { readonly signal: AbortSignal },
	): Promise<unknown>;
}

export interface BrandingPreviewExchangeClient {
	exchangePreview(
		request: BrandingPreviewExchangeRequest,
		options: { readonly signal: AbortSignal },
	): Promise<BrandingPreviewExchangeResult>;
}

export type BrandingFallbackEvent = {
	readonly code:
		| "RUNTIME_TIMEOUT"
		| "RUNTIME_UNAVAILABLE"
		| "RUNTIME_RESPONSE_INVALID"
		| "RUNTIME_INTEGRITY_FAILED";
	readonly workspaceId: string;
	readonly fallbackBrandingVersionId: string;
};

export type ResolveBrandingOptions = {
	readonly workspaceId: string;
	readonly modeId?: string;
	readonly preview?: BrandingPreviewSelection;
	readonly client: BrandingRuntimeClient;
	readonly verifier: CompiledBrandingVerifier;
	readonly embeddedFallback: unknown;
	readonly timeoutMs?: number;
	readonly allowedAssetOrigins?: readonly string[];
	readonly now?: () => Date;
	readonly onFallback?: (event: BrandingFallbackEvent) => void;
};

export type BrandingRuntimeRpcBinding = {
	resolveBranding(input: {
		readonly requestedModeId?: string;
	}): Promise<unknown>;
	exchangeBrandingPreview(input: {
		readonly sessionId: string;
		readonly code: string;
		readonly origin: string;
		readonly audience: string;
	}): Promise<unknown>;
	resolveBrandingPreview(input: {
		readonly sessionId: string;
		readonly sessionBearer: string;
		readonly requestedModeId?: string;
	}): Promise<unknown>;
};
