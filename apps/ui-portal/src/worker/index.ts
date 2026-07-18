import { WorkerEntrypoint } from "cloudflare:workers";
import type { AccessVerifier } from "./access";
import { handleAdminBoundary, handleDeepHealth } from "./admin/routes";
import { publicAssetResponse } from "./assets";
import type { UiPortalEnv } from "./env";
import {
	publicHealthResponse,
	publicMachineResponse,
} from "./public/machine-routes";
import { brandingSchemaResponse } from "./public/schema";
import { isAdminBoundary } from "./security/boundary";
import { publicResponse, withHeaders } from "./security/headers";
import {
	type RequestCorrelation,
	requestCorrelation,
	requestProblem,
} from "./security/request-correlation";
import {
	uiPortalServiceDescriptor,
	validateUiPortalEnv,
} from "./service-descriptor";

const PORTAL_HOST = "portal.ui.le-mn.com";
const SCHEMA_HOST = "schemas.ui.le-mn.com";

function localAccessAllowed(env: UiPortalEnv): boolean {
	return (
		env.DEPLOYMENT_ENVIRONMENT === "local" ||
		env.DEPLOYMENT_ENVIRONMENT === "test"
	);
}

async function routeUiPortalRequest(
	request: Request,
	env: UiPortalEnv,
	correlation: RequestCorrelation,
	verifyAccess?: AccessVerifier,
): Promise<Response> {
	const url = new URL(request.url);
	const pathname = url.pathname;

	if (url.hostname === SCHEMA_HOST) {
		return brandingSchemaResponse(request, pathname, correlation);
	}
	if (url.hostname !== PORTAL_HOST && !localAccessAllowed(env)) {
		return publicResponse(
			requestProblem(correlation, {
				status: 404,
				title: "Portal host unavailable",
				detail: "The requested host does not serve the Lemn UI Portal.",
				code: "portal-host-unavailable",
			}),
		);
	}
	if (pathname === "/health") {
		return publicHealthResponse(request, correlation);
	}
	if (pathname === "/health/deep") {
		return handleDeepHealth(request, env, correlation, verifyAccess);
	}
	if (isAdminBoundary(pathname)) {
		return handleAdminBoundary(request, env, correlation, verifyAccess);
	}

	const machine = publicMachineResponse(request, env, pathname, correlation);
	if (machine) return machine;
	if (pathname === "/api" || pathname.startsWith("/api/")) {
		return publicResponse(
			requestProblem(correlation, {
				status: 404,
				title: "API route unavailable",
				detail: "The requested API route does not exist.",
				code: "api-route-unavailable",
			}),
		);
	}

	return publicAssetResponse(request, env, correlation);
}

export async function handleUiPortalRequest(
	request: Request,
	env: UiPortalEnv,
	verifyAccess?: AccessVerifier,
): Promise<Response> {
	const correlation = requestCorrelation(request);
	const response = await routeUiPortalRequest(
		request,
		env,
		correlation,
		verifyAccess,
	);
	return withHeaders(response, { "x-request-id": correlation.requestId });
}

export default class UiPortalWorker extends WorkerEntrypoint<UiPortalEnv> {
	override fetch(request: Request): Promise<Response> {
		return handleUiPortalRequest(request, this.env);
	}
}

export { uiPortalServiceDescriptor, validateUiPortalEnv };
