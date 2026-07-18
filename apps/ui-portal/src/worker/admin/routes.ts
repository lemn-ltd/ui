import {
	ADMIN_REGISTRY_READ_MODEL,
	PROVIDER_MANIFEST,
} from "../../catalog/admin-registry";
import {
	type AccessIdentity,
	type AccessPurpose,
	type AccessVerifier,
	accessIdentity,
	localAdminIdentity,
} from "../access";
import { adminAssetResponse } from "../assets";
import {
	LOCAL_ADMIN_TEST_IDENTITY_HEADER,
	LOCAL_ADMIN_TEST_IDENTITY_VALUE,
	type UiPortalEnv,
} from "../env";
import {
	adminResponse,
	headAware,
	methodNotAllowed,
} from "../security/headers";
import {
	type RequestCorrelation,
	requestProblem,
} from "../security/request-correlation";
import { buildStatusReport } from "../service-descriptor";
import { buildProposalBundle, InvalidRegistryProposalError } from "./proposal";
import {
	conformanceReadModel,
	releaseReadModel,
	settingsReadModel,
} from "./read-models";

const MAX_BODY_BYTES = 1_000_000;

async function readJsonBody(request: Request): Promise<unknown> {
	const contentType = request.headers.get("content-type")?.toLowerCase();
	if (!contentType?.includes("application/json")) {
		throw new InvalidRegistryProposalError(
			"Content-Type must be application/json.",
		);
	}
	const declaredLength = Number(request.headers.get("content-length") ?? 0);
	if (!Number.isFinite(declaredLength) || declaredLength > MAX_BODY_BYTES) {
		throw new InvalidRegistryProposalError("Request body is too large.");
	}
	const body = await request.text();
	if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
		throw new InvalidRegistryProposalError("Request body is too large.");
	}
	try {
		return JSON.parse(body) as unknown;
	} catch {
		throw new InvalidRegistryProposalError(
			"Request body must contain valid JSON.",
		);
	}
}

async function authorizedIdentity(
	request: Request,
	env: UiPortalEnv,
	purpose: AccessPurpose,
	verifyAccess?: AccessVerifier,
): Promise<AccessIdentity | undefined> {
	const identity = await accessIdentity(request, env, purpose, verifyAccess);
	if (identity) return identity;
	if (env.DEPLOYMENT_ENVIRONMENT === "local") return localAdminIdentity();
	if (
		env.DEPLOYMENT_ENVIRONMENT === "test" &&
		request.headers.get(LOCAL_ADMIN_TEST_IDENTITY_HEADER) ===
			LOCAL_ADMIN_TEST_IDENTITY_VALUE
	) {
		return localAdminIdentity();
	}
	return undefined;
}

function accessRequired(correlation: RequestCorrelation): Response {
	return adminResponse(
		requestProblem(correlation, {
			status: 401,
			title: "Cloudflare Access required",
			detail: "A valid Cloudflare Access assertion is required.",
			code: "access-required",
		}),
	);
}

function accessInvalid(correlation: RequestCorrelation): Response {
	return adminResponse(
		requestProblem(correlation, {
			status: 401,
			title: "Cloudflare Access required",
			detail:
				"The Cloudflare Access assertion is missing, invalid, or expired.",
			code: "access-invalid",
		}),
	);
}

function serviceCapabilityDenied(correlation: RequestCorrelation): Response {
	return adminResponse(
		requestProblem(correlation, {
			status: 403,
			title: "Service capability denied",
			detail:
				"The service identity may only verify protected operational health.",
			code: "service-health-only",
		}),
	);
}

function serviceIdentityRequired(correlation: RequestCorrelation): Response {
	return adminResponse(
		requestProblem(correlation, {
			status: 403,
			title: "Service identity required",
			detail:
				"Protected operational health is available only to the dedicated service identity.",
			code: "service-health-required",
		}),
	);
}

export async function handleDeepHealth(
	request: Request,
	env: UiPortalEnv,
	correlation: RequestCorrelation,
	verifyAccess?: AccessVerifier,
): Promise<Response> {
	let identity: AccessIdentity | undefined;
	try {
		identity = await authorizedIdentity(request, env, "health", verifyAccess);
	} catch {
		return accessInvalid(correlation);
	}
	if (!identity) return accessRequired(correlation);
	if (identity.kind !== "service") return serviceIdentityRequired(correlation);
	if (request.method !== "GET" && request.method !== "HEAD") {
		return adminResponse(methodNotAllowed(["GET", "HEAD"], correlation));
	}
	const report = buildStatusReport(env);
	const response = adminResponse(
		Response.json(report, { status: report.ok ? 200 : 503 }),
	);
	return headAware(request, response);
}

async function handleAdminApi(
	request: Request,
	env: UiPortalEnv,
	identity: Extract<AccessIdentity, { kind: "human" }>,
	correlation: RequestCorrelation,
): Promise<Response> {
	const pathname = new URL(request.url).pathname;
	if (pathname === "/api/admin/session" && request.method === "GET") {
		return Response.json({
			identity: {
				kind: "human",
				email: identity.email,
				role: identity.role,
			},
			capabilities: ["portal-admin"],
			requestId: correlation.requestId,
		});
	}
	if (pathname === "/api/admin/registry" && request.method === "GET") {
		return Response.json({
			...ADMIN_REGISTRY_READ_MODEL,
			sourceOfTruth: PROVIDER_MANIFEST.sourceOfTruth,
		});
	}
	if (pathname === "/api/admin/conformance" && request.method === "GET") {
		return Response.json(conformanceReadModel(env));
	}
	if (
		pathname === "/api/admin/registry/proposals" &&
		request.method === "POST"
	) {
		try {
			const bundle = await buildProposalBundle(
				await readJsonBody(request),
				identity.email,
			);
			return Response.json(bundle, { status: 201 });
		} catch (error) {
			if (!(error instanceof InvalidRegistryProposalError)) {
				return requestProblem(correlation, {
					status: 500,
					title: "Registry proposal unavailable",
					detail: "The registry proposal could not be generated.",
					code: "registry-proposal-unavailable",
				});
			}
			if (error.kind === "conflict") {
				return requestProblem(correlation, {
					status: 409,
					title: "Registry proposal conflict",
					detail: error.message,
					code: "registry-proposal-no-change",
				});
			}
			return requestProblem(correlation, {
				status: 400,
				title: "Invalid registry proposal",
				detail: error.message,
				code: "invalid-registry-proposal",
			});
		}
	}
	if (pathname === "/api/admin/releases/current" && request.method === "GET") {
		return Response.json(releaseReadModel(env));
	}
	if (pathname === "/api/admin/settings" && request.method === "GET") {
		return Response.json(settingsReadModel(env));
	}

	const knownPath = [
		"/api/admin/session",
		"/api/admin/registry",
		"/api/admin/conformance",
		"/api/admin/registry/proposals",
		"/api/admin/releases/current",
		"/api/admin/settings",
	].includes(pathname);
	if (knownPath)
		return methodNotAllowed(
			pathname.endsWith("/proposals") ? ["POST"] : ["GET"],
			correlation,
		);
	return requestProblem(correlation, {
		status: 404,
		title: "Admin API route unavailable",
		detail: "The requested Admin API route does not exist.",
		code: "admin-api-route-unavailable",
	});
}

export async function handleAdminBoundary(
	request: Request,
	env: UiPortalEnv,
	correlation: RequestCorrelation,
	verifyAccess?: AccessVerifier,
): Promise<Response> {
	let identity: AccessIdentity | undefined;
	try {
		identity = await authorizedIdentity(request, env, "admin", verifyAccess);
	} catch {
		return accessInvalid(correlation);
	}
	if (!identity) return accessRequired(correlation);
	if (identity.kind === "service") return serviceCapabilityDenied(correlation);

	const pathname = new URL(request.url).pathname;
	if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
		return adminResponse(
			await handleAdminApi(request, env, identity, correlation),
		);
	}
	if (request.method !== "GET" && request.method !== "HEAD") {
		return adminResponse(methodNotAllowed(["GET", "HEAD"], correlation));
	}
	return adminAssetResponse(request, env, correlation);
}
