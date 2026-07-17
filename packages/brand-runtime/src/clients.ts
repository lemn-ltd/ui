import { BrandingRuntimeError } from "./errors.js";
import { validateBrandingPreviewSelection } from "./preview.js";
import type {
	BrandingPreviewExchangeClient,
	BrandingPreviewExchangeRequest,
	BrandingPreviewExchangeResult,
	BrandingRuntimeClient,
	BrandingRuntimeResolveRequest,
	BrandingRuntimeRpcBinding,
} from "./types.js";

const MAX_RUNTIME_RESPONSE_BYTES = 2 * 1024 * 1024;

type RuntimeClientPaths = {
	readonly active?: string;
	readonly preview?: string;
	readonly previewExchange?: string;
};

export type BrandingRuntimeTransportClient = BrandingRuntimeClient &
	BrandingPreviewExchangeClient;

export type ServiceBindingBrandingRuntimeClientOptions = {
	readonly binding: BrandingRuntimeRpcBinding;
};

export type HttpsBrandingRuntimeClientOptions = {
	readonly baseUrl: string;
	readonly runtimeCredential: string;
	readonly fetch?: typeof globalThis.fetch;
	readonly paths?: RuntimeClientPaths;
};

export function createServiceBindingBrandingRuntimeClient(
	options: ServiceBindingBrandingRuntimeClientOptions,
): BrandingRuntimeTransportClient {
	return Object.freeze({
		async resolve(
			request: BrandingRuntimeResolveRequest,
			resolveOptions: { readonly signal: AbortSignal },
		): Promise<unknown> {
			const preview = request.preview;
			if (preview) {
				return runRpcWithAbort(resolveOptions.signal, () =>
					options.binding.resolveBrandingPreview({
						sessionId: preview.sessionId,
						sessionBearer: preview.sessionBearer,
						...(request.modeId ? { requestedModeId: request.modeId } : {}),
					}),
				);
			}
			return runRpcWithAbort(resolveOptions.signal, () =>
				options.binding.resolveBranding({
					...(request.modeId ? { requestedModeId: request.modeId } : {}),
				}),
			);
		},
		async exchangePreview(
			request: BrandingPreviewExchangeRequest,
			exchangeOptions: { readonly signal: AbortSignal },
		): Promise<BrandingPreviewExchangeResult> {
			const input = await runRpcWithAbort(exchangeOptions.signal, () =>
				options.binding.exchangeBrandingPreview({
					sessionId: request.sessionId,
					code: request.code,
					origin: request.origin,
					audience: request.audience,
				}),
			);
			return validateBrandingPreviewSelection(
				input,
				request.expectedWorkspaceId,
			);
		},
	});
}

export function createHttpsBrandingRuntimeClient(
	options: HttpsBrandingRuntimeClientOptions,
): BrandingRuntimeTransportClient {
	const baseUrl = parseRuntimeBaseUrl(options.baseUrl);
	if (
		!/^aob_runtime_[A-Za-z0-9_-]{8,32}\.[A-Za-z0-9_-]{32,}$/.test(
			options.runtimeCredential,
		)
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			"The Workspace runtime credential is invalid",
		);
	}
	return createHttpsClient({
		fetch: options.fetch ?? globalThis.fetch,
		origin: baseUrl.href,
		credential: options.runtimeCredential,
		paths: options.paths,
	});
}

function createHttpsClient(options: {
	readonly fetch: typeof globalThis.fetch;
	readonly origin: string;
	readonly credential: string;
	readonly paths?: RuntimeClientPaths;
}): BrandingRuntimeTransportClient {
	const activePath = validatePath(
		options.paths?.active ?? "/internal/v1/branding/resolve",
	);
	const previewPath = validatePath(
		options.paths?.preview ?? "/internal/v1/branding/previews/resolve",
	);
	const previewExchangePath = validatePath(
		options.paths?.previewExchange ?? "/internal/v1/branding/previews/exchange",
	);
	return Object.freeze({
		async resolve(
			request: BrandingRuntimeResolveRequest,
			resolveOptions: { readonly signal: AbortSignal },
		): Promise<unknown> {
			const preview = request.preview;
			const url = new URL(preview ? previewPath : activePath, options.origin);
			const credential = preview?.sessionBearer ?? options.credential;
			const response = await options.fetch(url, {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					...(credential ? { Authorization: `Bearer ${credential}` } : {}),
				},
				body: JSON.stringify(
					preview
						? {
								sessionId: preview.sessionId,
								...(request.modeId ? { requestedModeId: request.modeId } : {}),
							}
						: {
								...(request.modeId ? { requestedModeId: request.modeId } : {}),
							},
				),
				signal: resolveOptions.signal,
				redirect: "error",
			});
			return readRuntimeJson(response);
		},
		async exchangePreview(
			request: BrandingPreviewExchangeRequest,
			exchangeOptions: { readonly signal: AbortSignal },
		): Promise<BrandingPreviewExchangeResult> {
			const response = await options.fetch(
				new URL(previewExchangePath, options.origin),
				{
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						sessionId: request.sessionId,
						code: request.code,
						origin: request.origin,
						audience: request.audience,
					}),
					signal: exchangeOptions.signal,
					redirect: "error",
				},
			);
			const input = await readRuntimeJson(response);
			return validateBrandingPreviewSelection(
				input,
				request.expectedWorkspaceId,
			);
		},
	});
}

function assertNotAborted(signal: AbortSignal): void {
	if (signal.aborted) {
		throw abortedRuntimeRequest(signal);
	}
}

function runRpcWithAbort<T>(
	signal: AbortSignal,
	operation: () => Promise<T>,
): Promise<T> {
	assertNotAborted(signal);
	return new Promise<T>((resolve, reject) => {
		let settled = false;
		let onAbort: () => void;
		const cleanup = () => signal.removeEventListener("abort", onAbort);
		const resolveOnce = (value: T) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(value);
		};
		const rejectOnce = (error: unknown) => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(error);
		};
		onAbort = () => rejectOnce(abortedRuntimeRequest(signal));

		signal.addEventListener("abort", onAbort, { once: true });
		if (signal.aborted) {
			onAbort();
			return;
		}

		try {
			operation().then(resolveOnce, rejectOnce);
		} catch (error) {
			rejectOnce(error);
		}
	});
}

function abortedRuntimeRequest(signal: AbortSignal): BrandingRuntimeError {
	return new BrandingRuntimeError(
		"BRANDING_RUNTIME_UNAVAILABLE",
		"Branding Runtime request was aborted",
		signal.reason,
	);
}

async function readRuntimeJson(response: Response): Promise<unknown> {
	if (!response.ok) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_UNAVAILABLE",
			`Branding Runtime returned HTTP ${response.status}`,
		);
	}
	const declaredLength = Number(response.headers.get("Content-Length"));
	if (
		Number.isFinite(declaredLength) &&
		declaredLength > MAX_RUNTIME_RESPONSE_BYTES
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime response exceeds the maximum size",
		);
	}
	const text = await response.text();
	if (new TextEncoder().encode(text).byteLength > MAX_RUNTIME_RESPONSE_BYTES) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime response exceeds the maximum size",
		);
	}
	try {
		return JSON.parse(text) as unknown;
	} catch (error) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_RESPONSE_INVALID",
			"Branding Runtime did not return valid JSON",
			error,
		);
	}
}

function parseRuntimeBaseUrl(input: string): URL {
	let url: URL;
	try {
		url = new URL(input);
	} catch (error) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			"The Branding Runtime base URL is invalid",
			error,
		);
	}
	const local =
		url.hostname === "localhost" ||
		url.hostname === "127.0.0.1" ||
		url.hostname === "[::1]";
	if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			"The Branding Runtime base URL must use HTTPS",
		);
	}
	if (url.username || url.password || url.search || url.hash) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			"The Branding Runtime base URL cannot contain credentials, query, or fragment",
		);
	}
	return url;
}

function validatePath(input: string): string {
	if (
		!input.startsWith("/") ||
		input.startsWith("//") ||
		input.includes("\\") ||
		input.includes("?") ||
		input.includes("#") ||
		hasControlCharacters(input)
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			"The Branding Runtime path is invalid",
		);
	}
	return input;
}

function hasControlCharacters(value: string): boolean {
	for (const character of value) {
		const codePoint = character.codePointAt(0);
		if (codePoint !== undefined && codePoint < 32) return true;
	}
	return false;
}
