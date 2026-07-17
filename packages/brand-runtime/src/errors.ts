export type BrandingRuntimeErrorCode =
	| "BRANDING_RUNTIME_CONFIGURATION_INVALID"
	| "BRANDING_RUNTIME_RESPONSE_INVALID"
	| "BRANDING_RUNTIME_INTEGRITY_FAILED"
	| "BRANDING_RUNTIME_UNAVAILABLE"
	| "BRANDING_RUNTIME_TIMEOUT"
	| "BRANDING_PREVIEW_UNAVAILABLE"
	| "BRANDING_FALLBACK_INVALID";

export class BrandingRuntimeError extends Error {
	readonly code: BrandingRuntimeErrorCode;
	override readonly cause?: unknown;

	constructor(
		code: BrandingRuntimeErrorCode,
		message: string,
		cause?: unknown,
	) {
		super(message);
		this.name = "BrandingRuntimeError";
		this.code = code;
		this.cause = cause;
	}
}

export class BrandingPreviewUnavailableError extends BrandingRuntimeError {
	constructor(
		message = "The branding preview is unavailable or expired",
		cause?: unknown,
	) {
		super("BRANDING_PREVIEW_UNAVAILABLE", message, cause);
		this.name = "BrandingPreviewUnavailableError";
	}
}
