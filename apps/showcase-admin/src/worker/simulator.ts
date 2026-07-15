import {
	safeParseBrandProject,
	type BrandProject,
} from "@lemn-ltd/brand-contract";
import { accessHeaders, type AccessIdentity } from "./access";
import { problem } from "./problem-details";

const INTERNAL_ORIGIN = "https://branding-simulator.internal";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): value is JsonRecord {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uuid(value: unknown, label: string): string {
	if (typeof value !== "string" || !UUID.test(value)) throw new Error(`${label} must be a UUID.`);
	return value;
}

function integer(value: unknown, label: string, minimum: number): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
		throw new Error(`${label} must be an integer greater than or equal to ${minimum}.`);
	}
	return value;
}

async function simulatorRequest(
	simulator: Fetcher,
	identity: AccessIdentity | undefined,
	path: string,
	method: "POST" | "PUT",
	body: unknown,
): Promise<Response> {
	return simulator.fetch(
		new Request(`${INTERNAL_ORIGIN}${path}`, {
			method,
			headers: accessHeaders(identity),
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(5_000),
		}),
	);
}

async function upstreamJson(response: Response): Promise<JsonRecord> {
	const value: unknown = await response.json().catch(() => undefined);
	if (!response.ok) {
		const detail = record(value) && typeof value.detail === "string"
			? value.detail
			: "The simulator rejected the request.";
		throw new Error(detail);
	}
	if (!record(value)) throw new Error("The simulator returned an invalid response.");
	return value;
}

interface PlanInput {
	readonly context: {
		readonly projectId: string;
		readonly environmentId: string;
		readonly environmentKind: "development" | "staging" | "production";
		readonly brandId: string;
		readonly draftId?: string;
		readonly draftVersion?: number;
		readonly revisionId: string | null;
		readonly assignmentSequence: number;
	};
	readonly draft: BrandProject;
}

function planInput(value: unknown): PlanInput {
	if (!record(value) || !record(value.context) || !record(value.draft)) {
		throw new Error("Plan body must include context and draft objects.");
	}
	const parsedBrand = safeParseBrandProject(value.draft);
	if (!parsedBrand.success) throw new Error("Draft is not a valid BrandProject.");
	const context = value.context;
	const environmentKind = context.environmentKind;
	if (environmentKind !== "development" && environmentKind !== "staging" && environmentKind !== "production") {
		throw new Error("Environment kind is invalid.");
	}
	const revisionId = context.revisionId;
	if (revisionId !== null && (typeof revisionId !== "string" || !UUID.test(revisionId))) {
		throw new Error("Revision ID must be a UUID or null.");
	}
	const draftId = context.draftId;
	const draftVersion = context.draftVersion;
	return {
		context: {
			projectId: uuid(context.projectId, "Project ID"),
			environmentId: uuid(context.environmentId, "Environment ID"),
			environmentKind,
			brandId: uuid(context.brandId, "Brand ID"),
			...(draftId === undefined ? {} : { draftId: uuid(draftId, "Draft ID") }),
			...(draftVersion === undefined ? {} : { draftVersion: integer(draftVersion, "Draft version", 1) }),
			revisionId,
			assignmentSequence: integer(context.assignmentSequence, "Assignment sequence", 0),
		},
		draft: parsedBrand.data,
	};
}

export async function planWithSimulator(
	simulator: Fetcher | undefined,
	identity: AccessIdentity | undefined,
	value: unknown,
): Promise<Response> {
	if (!simulator) {
		return problem({
			status: 503,
			title: "Simulator unavailable",
			detail: "The Admin Worker has no configured simulator binding.",
			code: "simulator-unavailable",
		});
	}
	try {
		const input = planInput(value);
		const saved = await upstreamJson(
			await simulatorRequest(simulator, identity, "/api/v1/brands/drafts", "PUT", {
				brandId: input.context.brandId,
				...(input.context.draftId ? { draftId: input.context.draftId } : {}),
				baseRevisionId: input.context.revisionId,
				...(input.context.draftVersion ? { expectedVersion: input.context.draftVersion } : {}),
				sourceContract: input.draft,
			}),
		);
		const draftId = uuid(saved.id, "Simulator draft ID");
		const draftVersion = integer(saved.version, "Simulator draft version", 1);
		const plan = await upstreamJson(
			await simulatorRequest(simulator, identity, "/api/v1/brands/publications/plan", "POST", {
				target: {
					projectId: input.context.projectId,
					environmentId: input.context.environmentId,
					slot: "primary",
					environmentKind: input.context.environmentKind,
				},
				draftId,
				expectedDraftVersion: draftVersion,
				expectedAssignmentSequence: input.context.assignmentSequence,
				defaultProfileId: input.draft.defaultProfileId,
				allowedProfileIds: Object.keys(input.draft.profiles),
			}),
		);
		return Response.json({ ...plan, draft: { id: draftId, version: draftVersion } });
	} catch (error) {
		return problem({
			status: 422,
			title: "Simulator plan failed",
			detail: error instanceof Error ? error.message : "The simulator plan failed.",
			code: "simulator-plan-failed",
		});
	}
}

export async function applyWithSimulator(
	simulator: Fetcher | undefined,
	identity: AccessIdentity | undefined,
	value: unknown,
): Promise<Response> {
	if (!simulator) {
		return problem({
			status: 503,
			title: "Simulator unavailable",
			detail: "The Admin Worker has no configured simulator binding.",
			code: "simulator-unavailable",
		});
	}
	try {
		if (!record(value)) throw new Error("Apply body must be an object.");
		const planId = uuid(value.planId, "Plan ID");
		if (typeof value.idempotencyKey !== "string" || value.idempotencyKey.length < 16 || value.idempotencyKey.length > 200) {
			throw new Error("Idempotency key must contain 16 to 200 characters.");
		}
		const result = await upstreamJson(
			await simulatorRequest(simulator, identity, "/api/v1/brands/plans/apply", "POST", {
				planId,
				idempotencyKey: value.idempotencyKey,
			}),
		);
		return Response.json(result, { status: 202 });
	} catch (error) {
		return problem({
			status: 422,
			title: "Simulator apply failed",
			detail: error instanceof Error ? error.message : "The simulator apply failed.",
			code: "simulator-apply-failed",
		});
	}
}
