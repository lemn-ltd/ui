import { type ProblemOptions, problem } from "../problem-details";

const REQUEST_ID =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export interface RequestCorrelation {
	readonly instance: string;
	readonly requestId: string;
}

export function requestCorrelation(request: Request): RequestCorrelation {
	const candidate = request.headers.get("x-request-id")?.trim();
	return {
		instance: new URL(request.url).pathname,
		requestId:
			candidate && REQUEST_ID.test(candidate)
				? candidate.toLowerCase()
				: crypto.randomUUID(),
	};
}

export function requestProblem(
	correlation: RequestCorrelation,
	options: Omit<ProblemOptions, "instance" | "requestId">,
): Response {
	const event = {
		requestId: correlation.requestId,
		operation: "ui_portal_request",
		status: options.status,
		code: options.code,
	};
	if (options.status >= 500) {
		console.error("ui_portal_problem", event);
	} else {
		console.warn("ui_portal_problem", event);
	}
	return problem({ ...options, ...correlation });
}
