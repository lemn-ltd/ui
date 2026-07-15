export interface ProblemOptions {
	readonly status: number;
	readonly title: string;
	readonly detail: string;
	readonly code: string;
}

export function problem(options: ProblemOptions): Response {
	return Response.json(
		{
			type: `https://admin.showcase.ui.le-mn.com/problems/${options.code}`,
			title: options.title,
			status: options.status,
			detail: options.detail,
			code: options.code,
		},
		{
			status: options.status,
			headers: { "content-type": "application/problem+json; charset=utf-8" },
		},
	);
}
