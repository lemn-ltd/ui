import {
	type CompiledBrandingModeObject,
	verifyCompiledBrandingModeObject,
} from "@lemn-ltd/brand-contract";
import {
	BrandingPreviewUnavailableError,
	BrandingRuntimeError,
} from "./errors.js";
import {
	parseEmbeddedBrandingFallback,
	parseRuntimeBrandingEnvelope,
} from "./schema.js";
import type {
	BrandingAssetReference,
	BrandingFallbackEvent,
	BrandingRuntimeSource,
	EmbeddedBrandingFallback,
	ResolveBrandingOptions,
	ResolvedBranding,
	RuntimeBrandingEnvelope,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 2_000;
const MIN_TIMEOUT_MS = 25;
const MAX_TIMEOUT_MS = 5_000;

type VerifiedEmbeddedFallback = {
	readonly brandingVersionId: string;
	readonly defaultModeId: string;
	readonly allowedModeIds: readonly string[];
	readonly modes: ReadonlyMap<string, ResolvedBranding>;
};

export async function resolveBranding(
	options: ResolveBrandingOptions,
): Promise<ResolvedBranding> {
	const now = options.now ?? (() => new Date());
	const timeoutMs = validateTimeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
	const allowedAssetOrigins = parseAllowedAssetOrigins(
		options.allowedAssetOrigins ?? [],
	);
	if (options.workspaceId.trim().length === 0) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			"A Workspace is required for branding resolution",
		);
	}

	if (options.preview) {
		validatePreviewRequest(options.workspaceId, options.preview, now());
		const previewModeId = options.modeId ?? options.preview.initialModeId;
		try {
			const input = await resolveWithDeadline(
				options,
				timeoutMs,
				previewModeId,
			);
			const envelope = parseRuntimeResponse(input);
			return await verifyAndProjectEnvelope({
				envelope,
				workspaceId: options.workspaceId,
				requestedModeId: previewModeId,
				verifier: options.verifier,
				expectedSource: "preview",
				preview: options.preview,
				now: now(),
				allowedAssetOrigins,
			});
		} catch (error) {
			if (error instanceof BrandingPreviewUnavailableError) throw error;
			throw new BrandingPreviewUnavailableError(
				"The exact branding preview is unavailable or expired",
				error,
			);
		}
	}

	let fallback: VerifiedEmbeddedFallback;
	try {
		fallback = await verifyEmbeddedFallback(
			parseEmbeddedBrandingFallback(options.embeddedFallback),
			options.workspaceId,
			options.verifier,
			allowedAssetOrigins,
		);
	} catch (error) {
		throw new BrandingRuntimeError(
			"BRANDING_FALLBACK_INVALID",
			"The embedded branded fallback is invalid",
			error,
		);
	}

	try {
		const input = await resolveWithDeadline(options, timeoutMs, options.modeId);
		return await verifyAndProjectEnvelope({
			envelope: parseRuntimeResponse(input),
			workspaceId: options.workspaceId,
			requestedModeId: options.modeId,
			verifier: options.verifier,
			expectedSource: "active",
			now: now(),
			allowedAssetOrigins,
		});
	} catch (error) {
		emitFallback(options, {
			code: fallbackCode(error),
			workspaceId: options.workspaceId,
			fallbackBrandingVersionId: fallback.brandingVersionId,
		});
		return selectEmbeddedFallback(fallback, options.modeId);
	}
}

async function resolveWithDeadline(
	options: ResolveBrandingOptions,
	timeoutMs: number,
	modeId: string | undefined,
): Promise<unknown> {
	const controller = new AbortController();
	let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_resolve, reject) => {
		timeoutHandle = setTimeout(() => {
			controller.abort();
			reject(
				new BrandingRuntimeError(
					"BRANDING_RUNTIME_TIMEOUT",
					"Branding Runtime timed out",
				),
			);
		}, timeoutMs);
	});
	try {
		return await Promise.race([
			options.client.resolve(
				{
					workspaceId: options.workspaceId,
					...(modeId ? { modeId } : {}),
					...(options.preview ? { preview: options.preview } : {}),
				},
				{ signal: controller.signal },
			),
			timeout,
		]);
	} finally {
		if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
	}
}

async function verifyAndProjectEnvelope(input: {
	readonly envelope: RuntimeBrandingEnvelope;
	readonly workspaceId: string;
	readonly requestedModeId?: string;
	readonly verifier: ResolveBrandingOptions["verifier"];
	readonly expectedSource: RuntimeBrandingEnvelope["source"];
	readonly preview?: ResolveBrandingOptions["preview"];
	readonly now: Date;
	readonly allowedAssetOrigins: ReadonlySet<string>;
}): Promise<ResolvedBranding> {
	if (input.envelope.source !== input.expectedSource) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime returned an unexpected resolution source",
		);
	}
	if (
		input.envelope.etag !== undefined &&
		input.envelope.etag !== `"${input.envelope.modeObject.projectionHash}"`
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime returned an ETag for another projection",
		);
	}
	verifyPreviewMetadata(input.envelope, input.preview, input.now);
	return verifyAndProjectModeObject({
		modeObject: input.envelope.modeObject,
		workspaceId: input.workspaceId,
		requestedModeId: input.requestedModeId,
		verifier: input.verifier,
		source: input.expectedSource,
		allowedAssetOrigins: input.allowedAssetOrigins,
		...(input.envelope.etag ? { etag: input.envelope.etag } : {}),
		...(input.envelope.source === "preview"
			? {
					previewSessionId: input.envelope.previewSessionId,
					draftTitle: input.envelope.draftTitle,
					expiresAt: input.envelope.expiresAt,
				}
			: {}),
	});
}

function parseRuntimeResponse(input: unknown): RuntimeBrandingEnvelope {
	try {
		return parseRuntimeBrandingEnvelope(input);
	} catch (error) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime returned an invalid response envelope",
			error,
		);
	}
}

async function verifyAndProjectModeObject(input: {
	readonly modeObject: CompiledBrandingModeObject;
	readonly workspaceId: string;
	readonly requestedModeId?: string;
	readonly verifier: ResolveBrandingOptions["verifier"];
	readonly source: BrandingRuntimeSource;
	readonly allowedAssetOrigins: ReadonlySet<string>;
	readonly etag?: string;
	readonly previewSessionId?: string;
	readonly draftTitle?: string;
	readonly expiresAt?: string;
}): Promise<ResolvedBranding> {
	try {
		await verifyCompiledBrandingModeObject(input.modeObject, input.verifier);
	} catch (error) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"The compiled branding mode projection failed integrity verification",
			error,
		);
	}
	const projection = input.modeObject.projection;
	if (projection.workspaceId !== input.workspaceId) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"Branding Runtime crossed the signed Workspace boundary",
		);
	}
	if (
		(input.source === "preview" && projection.version !== null) ||
		(input.source !== "preview" && projection.version === null)
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime returned an invalid version for its source",
		);
	}
	const expectedModeId =
		input.requestedModeId &&
		projection.allowedModeIds.includes(input.requestedModeId)
			? input.requestedModeId
			: projection.defaultModeId;
	if (projection.modeId !== expectedModeId) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime did not resolve the requested mode",
		);
	}
	const resolved: ResolvedBranding = {
		workspaceId: projection.workspaceId,
		brandingVersionId: projection.brandingVersionId,
		version: projection.version,
		modeId: projection.modeId,
		colorScheme: projection.colorScheme,
		allowedModeIds: projection.allowedModeIds,
		definitionHash: projection.definitionHash,
		compiledHash: projection.compiledHash,
		projectionHash: input.modeObject.projectionHash,
		schemaVersion: projection.schemaVersion,
		compilerVersion: projection.compilerVersion,
		source: input.source,
		criticalCss: projection.criticalCss,
		bootstrap: projection.bootstrap,
		fontPreloads: projection.fontPreloads,
		fontResourceOrigins: projection.fontResourceOrigins,
		assetReferences: validateAssetReferences(
			projection.assetReferences,
			input.allowedAssetOrigins,
		),
		signature: input.modeObject.signature.value,
		signatureKeyId: input.modeObject.signature.keyId,
		...(input.etag ? { etag: input.etag } : {}),
		...(input.previewSessionId
			? { previewSessionId: input.previewSessionId }
			: {}),
		...(input.draftTitle ? { draftTitle: input.draftTitle } : {}),
		...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
	};
	return deepFreeze(resolved);
}

async function verifyEmbeddedFallback(
	fallback: EmbeddedBrandingFallback,
	workspaceId: string,
	verifier: ResolveBrandingOptions["verifier"],
	allowedAssetOrigins: ReadonlySet<string>,
): Promise<VerifiedEmbeddedFallback> {
	const modeEntries = Object.entries(fallback.modes).sort(([left], [right]) =>
		left.localeCompare(right),
	);
	const resolvedModes = new Map<string, ResolvedBranding>();
	let identity:
		| (Pick<
				ResolvedBranding,
				| "workspaceId"
				| "brandingVersionId"
				| "version"
				| "definitionHash"
				| "compiledHash"
				| "schemaVersion"
				| "compilerVersion"
				| "allowedModeIds"
		  > & { readonly defaultModeId: string })
		| undefined;

	for (const [modeId, modeObject] of modeEntries) {
		if (modeObject.projection.modeId !== modeId) {
			throw new Error(
				"Embedded fallback mode key does not match its signed mode",
			);
		}
		const resolved = await verifyAndProjectModeObject({
			modeObject,
			workspaceId,
			requestedModeId: modeId,
			verifier,
			source: "embedded-fallback",
			allowedAssetOrigins,
		});
		const candidate = {
			workspaceId: resolved.workspaceId,
			brandingVersionId: resolved.brandingVersionId,
			version: resolved.version,
			definitionHash: resolved.definitionHash,
			compiledHash: resolved.compiledHash,
			schemaVersion: resolved.schemaVersion,
			compilerVersion: resolved.compilerVersion,
			defaultModeId: modeObject.projection.defaultModeId,
			allowedModeIds: resolved.allowedModeIds,
		};
		if (identity && !sameFallbackIdentity(identity, candidate)) {
			throw new Error(
				"Embedded fallback signed modes do not share one identity",
			);
		}
		identity ??= candidate;
		resolvedModes.set(modeId, resolved);
	}

	if (!identity || identity.version === null) {
		throw new Error(
			"Embedded fallback must contain a published BrandingVersion",
		);
	}
	const modeIds = [...resolvedModes.keys()];
	if (!sameStrings(modeIds, identity.allowedModeIds)) {
		throw new Error("Embedded fallback must contain every allowed signed mode");
	}
	return Object.freeze({
		brandingVersionId: identity.brandingVersionId,
		defaultModeId: identity.defaultModeId,
		allowedModeIds: identity.allowedModeIds,
		modes: resolvedModes,
	});
}

function sameFallbackIdentity(
	left: {
		readonly workspaceId: string;
		readonly brandingVersionId: string;
		readonly version: number | null;
		readonly definitionHash: string;
		readonly compiledHash: string;
		readonly schemaVersion: number;
		readonly compilerVersion: string;
		readonly defaultModeId: string;
		readonly allowedModeIds: readonly string[];
	},
	right: {
		readonly workspaceId: string;
		readonly brandingVersionId: string;
		readonly version: number | null;
		readonly definitionHash: string;
		readonly compiledHash: string;
		readonly schemaVersion: number;
		readonly compilerVersion: string;
		readonly defaultModeId: string;
		readonly allowedModeIds: readonly string[];
	},
): boolean {
	return (
		left.workspaceId === right.workspaceId &&
		left.brandingVersionId === right.brandingVersionId &&
		left.version === right.version &&
		left.definitionHash === right.definitionHash &&
		left.compiledHash === right.compiledHash &&
		left.schemaVersion === right.schemaVersion &&
		left.compilerVersion === right.compilerVersion &&
		left.defaultModeId === right.defaultModeId &&
		sameStrings(left.allowedModeIds, right.allowedModeIds)
	);
}

function selectEmbeddedFallback(
	fallback: VerifiedEmbeddedFallback,
	requestedModeId: string | undefined,
): ResolvedBranding {
	const modeId =
		requestedModeId && fallback.allowedModeIds.includes(requestedModeId)
			? requestedModeId
			: fallback.defaultModeId;
	const resolved = fallback.modes.get(modeId);
	if (!resolved) {
		throw new BrandingRuntimeError(
			"BRANDING_FALLBACK_INVALID",
			"The embedded branded fallback does not contain its selected mode",
		);
	}
	return resolved;
}

function verifyPreviewMetadata(
	envelope: RuntimeBrandingEnvelope,
	preview: ResolveBrandingOptions["preview"],
	now: Date,
): void {
	if (!preview) return;
	if (
		envelope.source !== "preview" ||
		envelope.previewSessionId !== preview.sessionId ||
		envelope.draftTitle !== preview.draftTitle ||
		envelope.modeObject.projection.workspaceId !== preview.workspaceId ||
		envelope.modeObject.projection.definitionHash !== preview.definitionHash ||
		envelope.expiresAt !== preview.expiresAt ||
		new Date(envelope.expiresAt).getTime() <= now.getTime()
	) {
		throw new BrandingPreviewUnavailableError(
			"The exact branding preview is unavailable or expired",
		);
	}
}

function validatePreviewRequest(
	workspaceId: string,
	preview: NonNullable<ResolveBrandingOptions["preview"]>,
	now: Date,
): void {
	const expiresAt = new Date(preview.expiresAt).getTime();
	if (
		preview.workspaceId !== workspaceId ||
		preview.draftTitle.trim().length === 0 ||
		preview.draftTitle.length > 160 ||
		!/^[a-f0-9]{64}$/.test(preview.definitionHash) ||
		preview.sessionId.length < 16 ||
		!/^[A-Za-z0-9_-]{32,512}$/.test(preview.sessionBearer) ||
		!Number.isFinite(expiresAt) ||
		expiresAt <= now.getTime()
	) {
		throw new BrandingPreviewUnavailableError(
			"The branding preview selection is invalid or expired",
		);
	}
}

function validateAssetReferences(
	references: readonly BrandingAssetReference[],
	allowedAssetOrigins: ReadonlySet<string>,
): readonly BrandingAssetReference[] {
	for (const reference of references) {
		if (!safeAssetHref(reference.href, allowedAssetOrigins)) {
			throw new BrandingRuntimeError(
				"BRANDING_RUNTIME_INTEGRITY_FAILED",
				`Signed branding asset '${reference.id}' has an unsafe delivery URL`,
			);
		}
	}
	return references;
}

function safeAssetHref(
	value: string,
	allowedAssetOrigins: ReadonlySet<string>,
): boolean {
	if (
		hasControlCharacters(value) ||
		value.includes("\\") ||
		value.includes("?") ||
		value.includes("#")
	) {
		return false;
	}
	if (value.startsWith("/") && !value.startsWith("//")) return true;
	try {
		const url = new URL(value);
		return (
			url.protocol === "https:" &&
			!url.username &&
			!url.password &&
			url.href === value &&
			allowedAssetOrigins.has(url.origin)
		);
	} catch {
		return false;
	}
}

function parseAllowedAssetOrigins(
	values: readonly string[],
): ReadonlySet<string> {
	const origins = new Set<string>();
	for (const value of values) {
		let url: URL;
		try {
			url = new URL(value);
		} catch (error) {
			throw new BrandingRuntimeError(
				"BRANDING_RUNTIME_CONFIGURATION_INVALID",
				"A branding asset origin is invalid",
				error,
			);
		}
		if (
			url.protocol !== "https:" ||
			url.origin !== value ||
			url.username ||
			url.password
		) {
			throw new BrandingRuntimeError(
				"BRANDING_RUNTIME_CONFIGURATION_INVALID",
				"Branding asset origins must be exact HTTPS origins",
			);
		}
		origins.add(url.origin);
	}
	return origins;
}

function hasControlCharacters(value: string): boolean {
	for (const character of value) {
		const codePoint = character.codePointAt(0);
		if (codePoint !== undefined && codePoint < 32) return true;
	}
	return false;
}

function sameStrings(
	left: readonly string[],
	right: readonly string[],
): boolean {
	return (
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}

function validateTimeout(value: number): number {
	if (
		!Number.isInteger(value) ||
		value < MIN_TIMEOUT_MS ||
		value > MAX_TIMEOUT_MS
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			`Branding Runtime timeout must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS} milliseconds`,
		);
	}
	return value;
}

function fallbackCode(error: unknown): BrandingFallbackEvent["code"] {
	if (error instanceof BrandingRuntimeError) {
		if (error.code === "BRANDING_RUNTIME_TIMEOUT") return "RUNTIME_TIMEOUT";
		if (error.code === "BRANDING_RUNTIME_INTEGRITY_FAILED")
			return "RUNTIME_INTEGRITY_FAILED";
		if (error.code === "BRANDING_RUNTIME_RESPONSE_INVALID")
			return "RUNTIME_RESPONSE_INVALID";
	}
	return "RUNTIME_UNAVAILABLE";
}

function emitFallback(
	options: ResolveBrandingOptions,
	event: BrandingFallbackEvent,
): void {
	try {
		options.onFallback?.(Object.freeze(event));
	} catch {
		// Operational reporting must never suppress an already verified branded fallback.
	}
}

function deepFreeze<T>(value: T): T {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const nested of Object.values(value as Record<string, unknown>))
			deepFreeze(nested);
	}
	return value;
}
