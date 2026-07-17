import type { AdminRegistryReadModel } from "../registry";

export class AdminApiError extends Error {
	public constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		...init,
		headers: { "content-type": "application/json", ...init?.headers },
	});
	if (!response.ok) {
		const body = (await response.json().catch(() => ({}))) as {
			detail?: string;
		};
		throw new AdminApiError(
			response.status,
			body.detail ?? "The Admin request failed.",
		);
	}
	return response.json() as Promise<T>;
}

export const adminApi = {
	registry(): Promise<AdminRegistryReadModel> {
		return request("/api/registry");
	},
	proposal(input: {
		capabilityId: string;
		maturity?: string;
		exactUpstreamReference?: string;
		rationale: string;
	}): Promise<Record<string, unknown>> {
		return request("/api/proposals", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},
};
