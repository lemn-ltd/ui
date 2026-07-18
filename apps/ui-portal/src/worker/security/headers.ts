import { type RequestCorrelation, requestProblem } from "./request-correlation";

const MACHINE_CACHE = "public, max-age=300, stale-while-revalidate=3600";

export function withHeaders(
	response: Response,
	entries: HeadersInit,
): Response {
	const headers = new Headers(response.headers);
	const additions = new Headers(entries);
	for (const [name, value] of additions) headers.set(name, value);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function publicResponse(response: Response): Response {
	return withHeaders(response, {
		"permissions-policy": "camera=(), microphone=(), geolocation=()",
		"referrer-policy": "strict-origin-when-cross-origin",
		"x-content-type-options": "nosniff",
		"x-frame-options": "DENY",
	});
}

export function adminResponse(response: Response): Response {
	return withHeaders(response, {
		"cache-control": "no-store",
		"content-security-policy":
			"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
		"permissions-policy": "camera=(), microphone=(), geolocation=()",
		"referrer-policy": "no-referrer",
		"x-content-type-options": "nosniff",
		"x-frame-options": "DENY",
	});
}

export function headAware(request: Request, response: Response): Response {
	if (request.method !== "HEAD") return response;
	return new Response(null, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
}

export function methodNotAllowed(
	allowed: readonly string[],
	correlation: RequestCorrelation,
): Response {
	return withHeaders(
		requestProblem(correlation, {
			status: 405,
			title: "Method not allowed",
			detail: "The requested method is not available for this resource.",
			code: "method-not-allowed",
		}),
		{ allow: allowed.join(", ") },
	);
}

export function cachedJson(value: unknown): Response {
	return withHeaders(Response.json(value), { "cache-control": MACHINE_CACHE });
}

export function cachedText(value: string): Response {
	return new Response(value, {
		headers: {
			"cache-control": MACHINE_CACHE,
			"content-type": "text/plain; charset=utf-8",
		},
	});
}
