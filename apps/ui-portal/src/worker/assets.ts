import type { UiPortalEnv } from "./env";
import { adminResponse, publicResponse } from "./security/headers";
import {
	type RequestCorrelation,
	requestProblem,
} from "./security/request-correlation";

const ASSET_REQUEST_HEADERS = [
	"accept",
	"accept-encoding",
	"accept-language",
	"cache-control",
	"if-match",
	"if-modified-since",
	"if-none-match",
	"if-range",
	"if-unmodified-since",
	"pragma",
	"range",
	"user-agent",
] as const;

function assetBindingRequest(
	request: Request,
	correlation: RequestCorrelation,
): Request {
	const headers = new Headers();
	for (const name of ASSET_REQUEST_HEADERS) {
		const value = request.headers.get(name);
		if (value !== null) headers.set(name, value);
	}
	headers.set("x-request-id", correlation.requestId);
	return new Request(request.url, { headers, method: request.method });
}

export async function adminAssetResponse(
	request: Request,
	env: UiPortalEnv,
	correlation: RequestCorrelation,
): Promise<Response> {
	if (!env.ASSETS) {
		return adminResponse(
			requestProblem(correlation, {
				status: 503,
				title: "Admin assets unavailable",
				detail: "The protected Admin assets are unavailable.",
				code: "admin-assets-unavailable",
			}),
		);
	}
	try {
		return adminResponse(
			await env.ASSETS.fetch(assetBindingRequest(request, correlation)),
		);
	} catch {
		return adminResponse(
			requestProblem(correlation, {
				status: 503,
				title: "Admin assets unavailable",
				detail: "The protected Admin assets could not be loaded.",
				code: "admin-assets-unavailable",
			}),
		);
	}
}

export async function publicAssetResponse(
	request: Request,
	env: UiPortalEnv,
	correlation: RequestCorrelation,
): Promise<Response> {
	if (!env.ASSETS) {
		return publicResponse(
			requestProblem(correlation, {
				status: 503,
				title: "Portal unavailable",
				detail: "The public portal assets are unavailable.",
				code: "portal-assets-unavailable",
			}),
		);
	}
	try {
		return publicResponse(
			await env.ASSETS.fetch(assetBindingRequest(request, correlation)),
		);
	} catch {
		return publicResponse(
			requestProblem(correlation, {
				status: 503,
				title: "Portal unavailable",
				detail: "The public portal assets could not be loaded.",
				code: "portal-assets-unavailable",
			}),
		);
	}
}
