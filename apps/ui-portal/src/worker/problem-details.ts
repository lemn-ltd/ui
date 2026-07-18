export interface ProblemOptions {
	readonly status: number;
	readonly title: string;
	readonly detail: string;
	readonly code: string;
	readonly instance: string;
	readonly requestId: string;
}

export function problem(options: ProblemOptions): Response {
	return Response.json(
		{
			type: `https://portal.ui.le-mn.com/problems/${options.code}`,
			title: options.title,
			status: options.status,
			detail: options.detail,
			code: options.code,
			instance: options.instance,
			requestId: options.requestId,
		},
		{
			status: options.status,
			headers: {
				"content-type": "application/problem+json; charset=utf-8",
				"x-request-id": options.requestId,
			},
		},
	);
}
