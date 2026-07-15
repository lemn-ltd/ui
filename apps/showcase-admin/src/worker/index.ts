import { WorkerEntrypoint } from "cloudflare:workers";
import { ADMIN_REGISTRY_READ_MODEL } from "../registry";
import { accessIdentity, type AccessIdentity } from "./access";
import type { ShowcaseAdminEnv } from "./env";
import { problem } from "./problem-details";
import { buildProposalBundle } from "./proposal";
import { applyWithSimulator, planWithSimulator } from "./simulator";

const MAX_BODY_BYTES = 1_000_000;

async function jsonBody(request: Request): Promise<unknown> {
	const declaredLength = Number(request.headers.get("content-length") ?? 0);
	if (declaredLength > MAX_BODY_BYTES) throw new Error("Request body is too large.");
	if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
		throw new Error("Content-Type must be application/json.");
	}
	const body = await request.text();
	if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
		throw new Error("Request body is too large.");
	}
	return JSON.parse(body) as unknown;
}

function secure(response: Response): Response {
	const headers = new Headers(response.headers);
	headers.set("cache-control", "no-store");
	headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
	headers.set("referrer-policy", "no-referrer");
	headers.set("x-content-type-options", "nosniff");
	headers.set("x-frame-options", "DENY");
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function handleShowcaseAdminRequest(
	request: Request,
	env: ShowcaseAdminEnv,
): Promise<Response> {
	let identity: AccessIdentity | undefined;
	try {
		identity = await accessIdentity(request, env);
	} catch {
		return secure(problem({
			status: 401,
			title: "Cloudflare Access required",
			detail: "The Cloudflare Access assertion is missing, invalid, or expired.",
			code: "access-invalid",
		}));
	}
	if (env.DEPLOYMENT_ENVIRONMENT === "production" && !identity) {
		return secure(problem({
			status: 401,
			title: "Cloudflare Access required",
			detail: "The production Admin requires authenticated Cloudflare Access headers.",
			code: "access-required",
		}));
	}

	const url = new URL(request.url);
	try {
		if (url.pathname === "/health" && request.method === "GET") {
			return secure(Response.json({
				ok: true,
				service: "ui-showcase-admin",
				environment: env.DEPLOYMENT_ENVIRONMENT ?? "development",
				simulatorConfigured: Boolean(env.SIMULATOR),
			}));
		}
		if (url.pathname === "/api/registry" && request.method === "GET") {
			return secure(Response.json(ADMIN_REGISTRY_READ_MODEL));
		}
		if (url.pathname === "/api/proposals" && request.method === "POST") {
			const bundle = await buildProposalBundle(
				await jsonBody(request),
				identity?.email ?? "local-development",
			);
			return secure(Response.json(bundle, { status: 201 }));
		}
		if (url.pathname === "/api/simulator/plan" && request.method === "POST") {
			return secure(await planWithSimulator(env.SIMULATOR, identity, await jsonBody(request)));
		}
		if (url.pathname === "/api/simulator/apply" && request.method === "POST") {
			return secure(await applyWithSimulator(env.SIMULATOR, identity, await jsonBody(request)));
		}
		if (url.pathname.startsWith("/api/")) {
			return secure(problem({
				status: 404,
				title: "API route unavailable",
				detail: "The requested Admin API route does not exist.",
				code: "route-unavailable",
			}));
		}
		if (env.ASSETS) return secure(await env.ASSETS.fetch(request));
		return secure(problem({
			status: 503,
			title: "Admin assets unavailable",
			detail: "The Admin Worker has no configured assets binding.",
			code: "assets-unavailable",
		}));
	} catch (error) {
		return secure(problem({
			status: 400,
			title: "Invalid Admin request",
			detail: error instanceof Error ? error.message : "The request is invalid.",
			code: "invalid-request",
		}));
	}
}

export default class ShowcaseAdminWorker extends WorkerEntrypoint<ShowcaseAdminEnv> {
	override fetch(request: Request): Promise<Response> {
		return handleShowcaseAdminRequest(request, this.env);
	}
}
