import type { BrandProject } from "@lemn-ltd/brand-contract";
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
		const body = (await response.json().catch(() => ({}))) as { detail?: string };
		throw new AdminApiError(response.status, body.detail ?? "The Admin request failed.");
	}
	return response.json() as Promise<T>;
}

export interface SimulatorContext {
	readonly projectId: string;
	readonly environmentId: string;
	readonly environmentKind: "development" | "staging" | "production";
	readonly brandId: string;
	readonly draftId?: string;
	readonly draftVersion?: number;
	readonly revisionId: string | null;
	readonly assignmentSequence: number;
}

export interface SimulatorPlan {
	readonly id: string;
	readonly expiresAt: string;
	readonly expectedAssignmentSequence: number;
	readonly draft: { readonly id: string; readonly version: number };
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
		return request("/api/proposals", { method: "POST", body: JSON.stringify(input) });
	},
	plan(context: SimulatorContext, draft: BrandProject): Promise<SimulatorPlan> {
		return request("/api/simulator/plan", {
			method: "POST",
			body: JSON.stringify({ context, draft }),
		});
	},
	apply(planId: string, idempotencyKey: string): Promise<{ readonly id?: string; readonly state: string }> {
		return request("/api/simulator/apply", {
			method: "POST",
			body: JSON.stringify({ planId, idempotencyKey }),
		});
	},
};
