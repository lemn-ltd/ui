import {
	getCompiledMode,
	getCompiledModeCriticalCss,
	getCompiledModeFontPreloads,
	serializeBrandingBootstrap,
	verifyCompiledBrandingObject,
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
	BrandingBootstrap,
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
			const envelope = parseRuntimeBrandingEnvelope(input);
			return await verifyAndProject(
				envelope,
				options.workspaceId,
				previewModeId,
				options.verifier,
				"preview",
				options.preview,
				now(),
				allowedAssetOrigins,
			);
		} catch (error) {
			if (error instanceof BrandingPreviewUnavailableError) throw error;
			throw new BrandingPreviewUnavailableError(
				"The exact branding preview is unavailable or expired",
				error,
			);
		}
	}

	let fallback: EmbeddedBrandingFallback;
	try {
		fallback = parseEmbeddedBrandingFallback(options.embeddedFallback);
		const selectedFallback = selectFallbackMode(fallback, options.modeId);
		await verifyAndProject(
			selectedFallback,
			options.workspaceId,
			selectedFallback.modeId,
			options.verifier,
			"embedded-fallback",
			undefined,
			now(),
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
		const envelope = parseRuntimeBrandingEnvelope(input);
		return await verifyAndProject(
			envelope,
			options.workspaceId,
			options.modeId,
			options.verifier,
			"active",
			undefined,
			now(),
			allowedAssetOrigins,
		);
	} catch (error) {
		const code = fallbackCode(error);
		emitFallback(options, {
			code,
			workspaceId: options.workspaceId,
			fallbackBrandingVersionId: fallback.brandingVersionId,
		});
		const selectedFallback = selectFallbackMode(fallback, options.modeId);
		return verifyAndProject(
			selectedFallback,
			options.workspaceId,
			selectedFallback.modeId,
			options.verifier,
			"embedded-fallback",
			undefined,
			now(),
			allowedAssetOrigins,
		);
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

async function verifyAndProject(
	envelope: RuntimeBrandingEnvelope,
	workspaceId: string,
	requestedModeId: string | undefined,
	verifier: ResolveBrandingOptions["verifier"],
	expectedSource: BrandingRuntimeSource,
	preview: ResolveBrandingOptions["preview"],
	now: Date,
	allowedAssetOrigins: ReadonlySet<string>,
): Promise<ResolvedBranding> {
	if (envelope.workspaceId !== workspaceId) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"Branding Runtime crossed the Workspace boundary",
		);
	}
	if (envelope.source !== expectedSource) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime returned an unexpected resolution source",
		);
	}
	verifyEnvelopeMetadata(envelope);
	verifyPreviewMetadata(envelope, preview, now);
	try {
		await verifyCompiledBrandingObject(envelope.compiledObject, verifier);
	} catch (error) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"The compiled branding object failed integrity verification",
			error,
		);
	}

	const artifact = envelope.compiledObject.artifact;
	const expectedModeId = requestedModeId ?? artifact.defaultModeId;
	if (envelope.modeId !== expectedModeId) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime did not resolve the requested mode",
		);
	}
	const mode = getCompiledMode(artifact, envelope.modeId);
	const bootstrap = parseBootstrap(
		serializeBrandingBootstrap(artifact, mode.modeId),
	);
	const resolved: ResolvedBranding = {
		workspaceId: envelope.workspaceId,
		brandingVersionId: envelope.brandingVersionId,
		version: envelope.version,
		modeId: mode.modeId,
		colorScheme: mode.colorScheme,
		allowedModeIds: artifact.allowedModeIds,
		definitionHash: artifact.definitionHash,
		compiledHash: artifact.compiledHash,
		byteHash: envelope.compiledObject.byteHash,
		schemaVersion: artifact.schemaVersion,
		compilerVersion: artifact.compilerVersion,
		source: envelope.source,
		criticalCss: getCompiledModeCriticalCss(artifact, mode.modeId),
		bootstrap,
		fontPreloads: getCompiledModeFontPreloads(artifact, mode.modeId),
		assetReferences: projectAssets(envelope, allowedAssetOrigins),
		signature: envelope.compiledObject.signature.value,
		signatureKeyId: envelope.compiledObject.signature.keyId,
		...(envelope.etag ? { etag: envelope.etag } : {}),
		...(envelope.source === "preview"
			? {
					previewSessionId: envelope.previewSessionId,
					expiresAt: envelope.expiresAt,
				}
			: {}),
	};
	return deepFreeze(resolved);
}

function verifyEnvelopeMetadata(envelope: RuntimeBrandingEnvelope): void {
	const compiledObject = envelope.compiledObject;
	if (
		envelope.definitionHash !== compiledObject.artifact.definitionHash ||
		envelope.compiledHash !== compiledObject.compiledHash ||
		envelope.byteHash !== compiledObject.byteHash
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"Branding Runtime metadata does not match the signed object",
		);
	}
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
		envelope.definitionHash !== preview.definitionHash ||
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

function selectFallbackMode(
	fallback: EmbeddedBrandingFallback,
	requestedModeId: string | undefined,
): EmbeddedBrandingFallback {
	const artifact = fallback.compiledObject.artifact;
	const modeId =
		requestedModeId && artifact.allowedModeIds.includes(requestedModeId)
			? requestedModeId
			: artifact.defaultModeId;
	return modeId === fallback.modeId ? fallback : { ...fallback, modeId };
}

function projectAssets(
	envelope: RuntimeBrandingEnvelope,
	allowedAssetOrigins: ReadonlySet<string>,
): readonly BrandingAssetReference[] {
	const artifact = envelope.compiledObject.artifact;
	const manifestIds = Object.keys(artifact.assetManifest).sort();
	const deliveryIds = Object.keys(envelope.assetDeliveries).sort();
	if (manifestIds.join("\u0000") !== deliveryIds.join("\u0000")) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"Runtime asset delivery does not match the signed artifact manifest",
		);
	}
	const rolesByAsset = new Map<string, string[]>();
	for (const [role, assetId] of Object.entries(artifact.assetRoles)) {
		const roles = rolesByAsset.get(assetId) ?? [];
		roles.push(role);
		rolesByAsset.set(assetId, roles);
	}
	return manifestIds.map((id) => {
		const asset = artifact.assetManifest[id];
		const delivery = envelope.assetDeliveries[id];
		if (
			!asset ||
			!delivery ||
			!safeAssetHref(delivery.href, allowedAssetOrigins)
		) {
			throw new BrandingRuntimeError(
				"BRANDING_RUNTIME_INTEGRITY_FAILED",
				`Runtime asset '${id}' is invalid`,
			);
		}
		const expectedIntegrity = sha256Integrity(asset.sha256);
		if (delivery.integrity && delivery.integrity !== expectedIntegrity) {
			throw new BrandingRuntimeError(
				"BRANDING_RUNTIME_INTEGRITY_FAILED",
				`Runtime asset '${id}' has invalid integrity metadata`,
			);
		}
		return Object.freeze({
			id,
			roles: Object.freeze([...(rolesByAsset.get(id) ?? [])].sort()),
			href: delivery.href,
			sha256: asset.sha256,
			mediaType: asset.mediaType,
			integrity: expectedIntegrity,
			...(asset.width === undefined ? {} : { width: asset.width }),
			...(asset.height === undefined ? {} : { height: asset.height }),
			...(asset.accessibleLabel
				? { accessibleLabel: asset.accessibleLabel }
				: {}),
			...(asset.licenseId ? { licenseId: asset.licenseId } : {}),
		});
	});
}

function safeAssetHref(
	value: string,
	allowedAssetOrigins: ReadonlySet<string>,
): boolean {
	if (hasControlCharacters(value) || value.includes("\\")) return false;
	if (value.startsWith("/") && !value.startsWith("//")) return true;
	try {
		const url = new URL(value);
		return (
			url.protocol === "https:" &&
			!url.username &&
			!url.password &&
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

function sha256Integrity(hex: string): string {
	const bytes = new Uint8Array(
		hex.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? [],
	);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return `sha256-${btoa(binary)}`;
}

function parseBootstrap(serialized: string): BrandingBootstrap {
	const value = JSON.parse(serialized) as unknown;
	if (
		!isRecord(value) ||
		!isRecord(value.tokens) ||
		!isRecord(value.visualization) ||
		!isRecord(value.componentAppearance)
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"The branding bootstrap projection is invalid",
		);
	}
	const attributes = value.attributes;
	if (
		!isRecord(attributes) ||
		Object.values(attributes).some((entry) => typeof entry !== "string")
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"The branding bootstrap attributes are invalid",
		);
	}
	if (Object.values(value.tokens).some((entry) => typeof entry !== "string")) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"The branding bootstrap tokens are invalid",
		);
	}
	const requiredStrings = [
		"compilerVersion",
		"definitionHash",
		"compiledHash",
		"modeHash",
		"modeId",
		"colorScheme",
		"scopeId",
	] as const;
	if (
		typeof value.schemaVersion !== "number" ||
		requiredStrings.some((key) => typeof value[key] !== "string") ||
		(value.colorScheme !== "light" && value.colorScheme !== "dark")
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"The branding bootstrap identity is invalid",
		);
	}
	return value as BrandingBootstrap;
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const nested of Object.values(value as Record<string, unknown>))
			deepFreeze(nested);
	}
	return value;
}
