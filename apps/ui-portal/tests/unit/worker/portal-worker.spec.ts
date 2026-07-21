import { beforeEach, describe, expect, it, vi } from "vitest";
import { CATALOG_MANIFEST } from "../../../src/catalog/catalog-manifest";
import type { AccessVerifier } from "../../../src/worker/access";
import {
	LOCAL_ADMIN_TEST_IDENTITY_HEADER,
	LOCAL_ADMIN_TEST_IDENTITY_VALUE,
	type UiPortalEnv,
} from "../../../src/worker/env";
import UiPortalWorker, {
	handleUiPortalRequest,
} from "../../../src/worker/index";

const PRODUCTION_ENV: UiPortalEnv = {
	ACCESS_AUDIENCE: `${"a".repeat(64)},${"b".repeat(64)}`,
	ACCESS_HEALTH_AUDIENCE: "c".repeat(64),
	ACCESS_ISSUER: "https://lemn-dev.cloudflareaccess.com",
	BUILD_GIT_SHA: "d".repeat(40),
	BUILD_TIME: "2026-07-18T00:00:00Z",
	BUILD_VERSION: "1.2.3",
	DEPLOYMENT_ENVIRONMENT: "production",
};

function assetsFetcher(body = '<div id="root"></div>'): Fetcher {
	return {
		fetch: vi.fn(async () => new Response(body, { status: 200 })),
	} as unknown as Fetcher;
}

function createWorker(overrides: Partial<UiPortalEnv> = {}) {
	const env: UiPortalEnv = {
		ASSETS: assetsFetcher(),
		DEPLOYMENT_ENVIRONMENT: "test",
		...overrides,
	};
	return new UiPortalWorker({} as ExecutionContext, env);
}

function request(pathname: string, init?: RequestInit): Request {
	return new Request(`https://portal.ui.le-mn.com${pathname}`, init);
}

function humanRequest(pathname: string, init?: RequestInit): Request {
	const headers = new Headers(init?.headers);
	headers.set("cf-access-authenticated-user-email", "OWNER@LEMN.TEST");
	headers.set("cf-access-jwt-assertion", "signed-human-assertion");
	return request(pathname, { ...init, headers });
}

function serviceRequest(pathname: string, init?: RequestInit): Request {
	const headers = new Headers(init?.headers);
	headers.set("cf-access-jwt-assertion", "signed-service-assertion");
	return request(pathname, { ...init, headers });
}

function humanVerifier(): AccessVerifier {
	return vi.fn<AccessVerifier>().mockResolvedValue({
		iss: PRODUCTION_ENV.ACCESS_ISSUER,
		aud: "a".repeat(64),
		sub: "access-user-subject",
		email: "owner@lemn.test",
		iat: 1,
		exp: 2,
		type: "app",
	});
}

function serviceVerifier(): AccessVerifier {
	return vi.fn<AccessVerifier>().mockResolvedValue({
		iss: PRODUCTION_ENV.ACCESS_ISSUER,
		aud: PRODUCTION_ENV.ACCESS_HEALTH_AUDIENCE,
		sub: "",
		common_name: "88BF3B6D86161464F6509F7219099E57.access",
		iat: 1,
		exp: 2,
		type: "app",
	});
}

beforeEach(() => {
	vi.spyOn(console, "warn").mockImplementation(() => undefined);
	vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("Lemn UI Portal Worker public contracts", () => {
	it("keeps anonymous health minimal even when exact build identity exists", async () => {
		const worker = createWorker({
			BUILD_GIT_SHA: "sensitive-release-sha",
			BUILD_TIME: "2026-07-18T00:00:00Z",
			BUILD_VERSION: "1.2.3",
		});
		const response = await worker.fetch(request("/health"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, service: "ui-portal" });
		expect(response.headers.get("cache-control")).toBe("no-store");
	});

	it("publishes a non-cacheable immutable release receipt", async () => {
		const worker = createWorker({
			BUILD_GIT_SHA: "a".repeat(40),
			BUILD_TIME: "2026-07-21T00:00:00Z",
			BUILD_VERSION: "1.2.3",
		});
		const response = await worker.fetch(request("/release.json"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			package: "@lemn-ltd/ui",
			version: "1.2.3",
			gitSha: "a".repeat(40),
			buildTime: "2026-07-21T00:00:00Z",
		});
		expect(response.headers.get("cache-control")).toBe("no-store");
	});

	it("publishes the exact Core-only catalog authority and no Agent surface", async () => {
		const worker = createWorker({ BUILD_VERSION: "1.2.3" });
		const response = await worker.fetch(request("/catalog.json"));
		const body = await response.json<{
			components: readonly { area: string; path: string }[];
			entries: readonly { area: string; path: string }[];
			enabledAreas: readonly string[];
			package: string;
			version: string;
		}>();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			package: "@lemn-ltd/ui",
			version: "1.2.3",
			enabledAreas: ["core"],
		});
		expect(body.entries).toEqual(CATALOG_MANIFEST);
		expect(body.components.length).toBeGreaterThan(90);
		expect(body.entries.every((entry) => entry.area === "core")).toBe(true);
		const retiredAgentPrefix = ["", "agents"].join("/");
		expect(
			body.entries.some((entry) => entry.path.startsWith(retiredAgentPrefix)),
		).toBe(false);
		expect(
			body.entries.some((entry) =>
				["approval-card", "agent-status-badge", "automation-graph"].includes(
					entry.path.split("/").at(-1) ?? "",
				),
			),
		).toBe(false);
	});

	it("projects provider and block feeds through the enabled Core catalog", async () => {
		const worker = createWorker();
		const providers = await (
			await worker.fetch(request("/provider-registry.json"))
		).json<{
			capabilities: readonly { group?: string; publicExport: string }[];
		}>();
		const blocks = await (await worker.fetch(request("/blocks.json"))).json<{
			blocks: readonly { slug: string }[];
		}>();

		expect(providers.capabilities.length).toBeGreaterThan(0);
		expect(JSON.stringify(providers)).not.toContain("ApprovalCard");
		expect(blocks.blocks.map((entry) => entry.slug)).toEqual([
			"dashboard-overview",
			"appointment-schedule",
		]);
	});

	it("derives LLM discovery from the same Core manifest", async () => {
		const worker = createWorker();
		const summary = await (await worker.fetch(request("/llms.txt"))).text();
		const full = await (await worker.fetch(request("/llms-full.txt"))).text();

		expect(summary).toContain("# Lemn UI");
		expect(summary).toContain("https://portal.ui.le-mn.com/catalog.json");
		expect(full).toContain("from '@lemn-ltd/ui';");
		expect(full).toContain("https://portal.ui.le-mn.com/components/button");
		expect(full).not.toMatch(/\/agents|GraphCanvas|ApprovalCard/iu);
		expect(full).not.toContain("@latest");
	});

	it.each([
		["/catalog.json", "application/json"],
		["/provider-registry.json", "application/json"],
		["/blocks.json", "application/json"],
		["/llms.txt", "text/plain"],
		["/llms-full.txt", "text/plain"],
	])("serves the exact machine contract %s with GET and HEAD", async (path, type) => {
		const worker = createWorker();
		const response = await worker.fetch(request(path));
		const head = await worker.fetch(request(path, { method: "HEAD" }));

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain(type);
		expect(response.headers.get("cache-control")).toContain("max-age=300");
		expect(head.status).toBe(200);
		expect(head.headers.get("content-type")).toContain(type);
		expect(await head.text()).toBe("");
	});

	it("returns Problem Details and an Allow contract for invalid machine methods", async () => {
		const worker = createWorker();
		const response = await worker.fetch(
			request("/catalog.json", { method: "POST" }),
		);

		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("GET, HEAD");
		expect(response.headers.get("content-type")).toContain(
			"application/problem+json",
		);
		expect(await response.json()).toMatchObject({
			code: "method-not-allowed",
			status: 405,
		});
	});

	it("serves only the canonical immutable schema contract on the schema host", async () => {
		const assets = assetsFetcher();
		const worker = createWorker({ ASSETS: assets });
		const schema = await worker.fetch(
			new Request("https://schemas.ui.le-mn.com/branding/v1.json"),
		);
		expect(schema.status).toBe(200);
		expect(schema.headers.get("content-type")).toContain(
			"application/schema+json",
		);
		expect(schema.headers.get("cache-control")).toContain("immutable");
		expect(schema.headers.get("access-control-allow-origin")).toBe("*");
		expect(await schema.json()).toMatchObject({
			$id: "https://schemas.ui.le-mn.com/branding/v1.json",
		});

		const missing = await worker.fetch(
			new Request("https://schemas.ui.le-mn.com/unknown.json"),
		);
		expect(missing.status).toBe(404);
		expect(missing.headers.get("content-type")).toContain(
			"application/problem+json",
		);
		expect(assets.fetch).not.toHaveBeenCalled();
	});

	it("serves the production Portal only on its canonical host", async () => {
		const assets = assetsFetcher();
		const response = await handleUiPortalRequest(
			new Request("https://unexpected.ui.le-mn.com/components/button"),
			{ ...PRODUCTION_ENV, ASSETS: assets },
		);

		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toContain(
			"application/problem+json",
		);
		expect(await response.json()).toMatchObject({
			code: "portal-host-unavailable",
		});
		expect(assets.fetch).not.toHaveBeenCalled();
	});

	it("returns safe Problem Details for unknown APIs instead of the SPA", async () => {
		const assets = assetsFetcher();
		const worker = createWorker({ ASSETS: assets });
		const response = await worker.fetch(request("/api/anything"));

		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toContain(
			"application/problem+json",
		);
		expect(await response.json()).toMatchObject({
			code: "api-route-unavailable",
		});
		expect(assets.fetch).not.toHaveBeenCalled();
	});

	it("serves public application routes through ASSETS with stable security headers", async () => {
		const assets = assetsFetcher();
		const worker = createWorker({ ASSETS: assets });
		const response = await worker.fetch(
			request("/components/button", {
				headers: {
					accept: "text/html",
					authorization: "Bearer must-not-reach-assets",
					cookie: "CF_Authorization=must-not-reach-assets",
					"cf-access-client-secret": "must-not-reach-assets",
					"if-none-match": '"public-etag"',
					origin: "https://untrusted.example",
					range: "bytes=0-10",
					"x-untrusted": "must-not-reach-assets",
				},
			}),
		);

		expect(response.status).toBe(200);
		expect(assets.fetch).toHaveBeenCalledTimes(1);
		const forwardedRequest = vi.mocked(assets.fetch).mock
			.calls[0]?.[0] as Request;
		expect(forwardedRequest).not.toBeUndefined();
		expect(forwardedRequest.headers.get("accept")).toBe("text/html");
		expect(forwardedRequest.headers.get("if-none-match")).toBe('"public-etag"');
		expect(forwardedRequest.headers.get("range")).toBe("bytes=0-10");
		expect(forwardedRequest.headers.get("x-request-id")).toMatch(
			/^[0-9a-f-]{36}$/u,
		);
		for (const deniedHeader of [
			"authorization",
			"cookie",
			"cf-access-client-secret",
			"origin",
			"x-untrusted",
		]) {
			expect(forwardedRequest.headers.has(deniedHeader)).toBe(false);
		}
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
	});

	it("fails safely without exposing missing binding or configuration names", async () => {
		const worker = createWorker({ ASSETS: undefined });
		const response = await worker.fetch(request("/components/button"));
		const body = await response.text();

		expect(response.status).toBe(503);
		expect(body).toContain("portal-assets-unavailable");
		expect(body).not.toContain("ASSETS");
		expect(body).not.toContain("ACCESS_AUDIENCE");
	});
});

describe("Lemn UI Portal Worker protected contracts", () => {
	function productionEnv(overrides: Partial<UiPortalEnv> = {}): UiPortalEnv {
		return { ...PRODUCTION_ENV, ASSETS: assetsFetcher(), ...overrides };
	}

	it.each([
		"/admin",
		"/admin/registry",
		"/api/admin/session",
		"/admin-assets/admin-test.js",
		"/%61dmin%2Fregistry",
		"/api%252Fadmin%252Fsession",
		"/admin-assets%2Fadmin-test.js",
	])("denies %s at the origin without an Access assertion", async (path) => {
		const response = await handleUiPortalRequest(
			request(path),
			productionEnv(),
		);
		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ code: "access-required" });
		expect(response.headers.get("cache-control")).toBe(
			"no-store, no-transform",
		);
	});

	it("does not leak whether an Admin API route exists before authorization", async () => {
		const known = await handleUiPortalRequest(
			request("/api/admin/session"),
			productionEnv(),
		);
		const unknown = await handleUiPortalRequest(
			request("/api/admin/unknown"),
			productionEnv(),
		);
		expect(known.status).toBe(401);
		expect(unknown.status).toBe(401);
		const {
			instance: knownInstance,
			requestId: knownRequestId,
			...knownProblem
		} = await known.json<
			Record<string, unknown> & { instance: string; requestId: string }
		>();
		const {
			instance: unknownInstance,
			requestId: unknownRequestId,
			...unknownProblem
		} = await unknown.json<
			Record<string, unknown> & { instance: string; requestId: string }
		>();
		expect(knownProblem).toEqual(unknownProblem);
		expect(knownInstance).toBe("/api/admin/session");
		expect(unknownInstance).toBe("/api/admin/unknown");
		expect(knownRequestId).toMatch(/^[0-9a-f-]{36}$/u);
		expect(unknownRequestId).toMatch(/^[0-9a-f-]{36}$/u);
	});

	it("returns only the normalized human session and never the assertion", async () => {
		const response = await handleUiPortalRequest(
			humanRequest("/api/admin/session"),
			productionEnv(),
			humanVerifier(),
		);
		const body = await response.json<{
			capabilities: readonly string[];
			identity: { email: string; kind: string; role: string };
			operationalAccess: { label: string; state: string };
			requestId: string;
		}>();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			identity: {
				kind: "human",
				email: "owner@lemn.test",
				role: "portal-admin",
			},
			capabilities: ["portal-admin"],
			operationalAccess: {
				label: "Cloudflare Access protected",
				state: "cloudflare-access",
			},
		});
		expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/u);
		expect(response.headers.get("x-request-id")).toBe(body.requestId);
		expect(JSON.stringify(body)).not.toContain("signed-human-assertion");
		expect(JSON.stringify(body)).not.toContain("access-user-subject");
	});

	it("correlates normalized request IDs across success and Problem Details without reflecting invalid values", async () => {
		const warning = vi.mocked(console.warn);
		const supplied = "A3E66EA4-EB20-4A3B-8F61-8F46A023FC90";
		const success = await handleUiPortalRequest(
			humanRequest("/api/admin/session", {
				headers: { "x-request-id": supplied },
			}),
			productionEnv(),
			humanVerifier(),
		);
		const successBody = await success.json<{ requestId: string }>();
		const normalized = supplied.toLowerCase();
		expect(success.headers.get("x-request-id")).toBe(normalized);
		expect(successBody.requestId).toBe(normalized);

		const denied = await handleUiPortalRequest(
			request("/api/admin/session", {
				headers: { "x-request-id": "secret bearer material" },
			}),
			productionEnv(),
		);
		const deniedBody = await denied.json<{
			instance: string;
			requestId: string;
		}>();
		expect(deniedBody.instance).toBe("/api/admin/session");
		expect(deniedBody.requestId).toMatch(/^[0-9a-f-]{36}$/u);
		expect(denied.headers.get("x-request-id")).toBe(deniedBody.requestId);
		expect(JSON.stringify(deniedBody)).not.toContain("secret bearer material");
		expect(warning).toHaveBeenCalledWith("ui_portal_problem", {
			requestId: deniedBody.requestId,
			operation: "ui_portal_request",
			status: 401,
			code: "access-required",
		});
	});

	it("serves Admin HTML and exclusive chunks only after human authorization", async () => {
		const assets = assetsFetcher("protected-admin-asset");
		const env = productionEnv({ ASSETS: assets });
		const response = await handleUiPortalRequest(
			humanRequest("/admin-assets/admin-test.js", {
				headers: {
					authorization: "Bearer access-cookie",
					cookie: "CF_Authorization=access-cookie; preference=dark",
					"cf-access-client-id": "release.access",
					"cf-access-client-secret": "release-secret",
					"cf-access-token": "access-cookie",
					[LOCAL_ADMIN_TEST_IDENTITY_HEADER]: LOCAL_ADMIN_TEST_IDENTITY_VALUE,
					"proxy-authorization": "Bearer proxy-access-cookie",
				},
			}),
			env,
			humanVerifier(),
		);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("protected-admin-asset");
		expect(assets.fetch).toHaveBeenCalledTimes(1);
		const forwardedRequest = vi.mocked(assets.fetch).mock
			.calls[0]?.[0] as Request;
		expect(forwardedRequest.headers.has("cf-access-jwt-assertion")).toBe(false);
		expect(
			forwardedRequest.headers.has("cf-access-authenticated-user-email"),
		).toBe(false);
		for (const credentialHeader of [
			"authorization",
			"cookie",
			"cf-access-client-id",
			"cf-access-client-secret",
			"cf-access-token",
			LOCAL_ADMIN_TEST_IDENTITY_HEADER,
			"proxy-authorization",
		]) {
			expect(forwardedRequest.headers.has(credentialHeader)).toBe(false);
		}
		expect(response.headers.get("cache-control")).toBe(
			"no-store, no-transform",
		);
		expect(response.headers.get("content-security-policy")).toContain(
			"frame-ancestors 'none'",
		);
	});

	it("returns Git-authoritative Registry, immutable Conformance, exact Release, and masked Settings", async () => {
		const env = productionEnv();
		const verify = humanVerifier();
		const registry = await handleUiPortalRequest(
			humanRequest("/api/admin/registry"),
			env,
			verify,
		);
		const conformance = await handleUiPortalRequest(
			humanRequest("/api/admin/conformance"),
			env,
			verify,
		);
		const release = await handleUiPortalRequest(
			humanRequest("/api/admin/releases/current"),
			env,
			verify,
		);
		const settings = await handleUiPortalRequest(
			humanRequest("/api/admin/settings"),
			env,
			verify,
		);

		expect(await registry.json()).toMatchObject({
			sourceOfTruth: { kind: "git_manifest" },
		});
		const conformanceBody = await conformance.json<{
			receipts: readonly {
				path: string;
				verification: { state: string; immutableUrl: string };
			}[];
		}>();
		expect(conformanceBody.receipts.length).toBeGreaterThan(0);
		expect(conformanceBody.receipts[0]).toMatchObject({
			verification: {
				state: "commit-pinned",
			},
		});
		expect(conformanceBody.receipts[0]?.verification.immutableUrl).toContain(
			`/blob/${"d".repeat(40)}/`,
		);
		expect(await release.json()).toMatchObject({
			app: "@lemn-ltd/ui-portal",
			worker: "lemn-ui-portal",
			version: "1.2.3",
			gitSha: "d".repeat(40),
			buildTime: "2026-07-18T00:00:00Z",
			uiPackage: { name: "@lemn-ltd/ui", version: "1.2.3" },
			catalog: {
				version: "1.2.3",
			},
			receipts: [
				{ id: "source-commit", availability: "available" },
				{ id: "provider-registry-manifest", availability: "available" },
				{ id: "ui-package-manifest", availability: "available" },
			],
		});
		expect(await settings.json()).toMatchObject({
			displayName: "Lemn UI",
			enabledAreas: ["core"],
			studioPersistence: "none",
			security: {
				adminOriginAuthorization: "cloudflare-access-jwt",
				serviceCapability: "health-only",
			},
			operationalConfiguration: {
				assets: { state: "configured", maskedValue: "ASSETS binding" },
				accessIssuer: {
					state: "configured",
					maskedValue: "https://••••.cloudflareaccess.com",
				},
				adminAudiences: {
					state: "configured",
					count: 2,
				},
				healthAudience: {
					state: "configured",
					count: 1,
				},
			},
		});
	});

	it("generates a real hashed Registry proposal without mutating the manifest", async () => {
		const registryResponse = await handleUiPortalRequest(
			humanRequest("/api/admin/registry"),
			productionEnv(),
			humanVerifier(),
		);
		const registry = await registryResponse.json<{
			capabilities: readonly { capabilityId: string; maturity: string }[];
		}>();
		const target = registry.capabilities.find(
			(entry) => entry.maturity !== "deprecated",
		);
		expect(target).toBeDefined();
		const requestBody = {
			capabilityId: target?.capabilityId,
			maturity: "deprecated",
			rationale: "Verify a reviewable immutable proposal bundle.",
		};
		const response = await handleUiPortalRequest(
			humanRequest("/api/admin/registry/proposals", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(requestBody),
			}),
			productionEnv(),
			humanVerifier(),
		);
		const body = await response.json<{
			digest: string;
			proposalId: string;
			governance: { activeManifestMutated: boolean };
		}>();

		expect(response.status).toBe(201);
		expect(body.digest).toMatch(/^[0-9a-f]{64}$/u);
		expect(body.proposalId).toMatch(/^registry-proposal-[0-9a-f]{16}$/u);
		expect(body.governance.activeManifestMutated).toBe(false);
	});

	it("maps malformed proposal input to safe Problem Details", async () => {
		const response = await handleUiPortalRequest(
			humanRequest("/api/admin/registry/proposals", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: "{invalid",
			}),
			productionEnv(),
			humanVerifier(),
		);

		expect(response.status).toBe(400);
		expect(response.headers.get("content-type")).toContain(
			"application/problem+json",
		);
		const body = await response.json<{
			code: string;
			detail: string;
			requestId: string;
			status: number;
		}>();
		expect(body).toMatchObject({
			code: "invalid-registry-proposal",
			detail: "Request body must contain valid JSON.",
			status: 400,
		});
		expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/u);
		expect(response.headers.get("x-request-id")).toBe(body.requestId);
	});

	it("returns an explicit conflict when a proposal changes nothing", async () => {
		const registry = await (
			await handleUiPortalRequest(
				humanRequest("/api/admin/registry"),
				productionEnv(),
				humanVerifier(),
			)
		).json<{
			capabilities: readonly { capabilityId: string; maturity: string }[];
		}>();
		const target = registry.capabilities[0];
		expect(target).toBeDefined();

		const response = await handleUiPortalRequest(
			humanRequest("/api/admin/registry/proposals", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					capabilityId: target?.capabilityId,
					maturity: target?.maturity,
					rationale: "Verify the explicit conflict state.",
				}),
			}),
			productionEnv(),
			humanVerifier(),
		);

		expect(response.status).toBe(409);
		expect(await response.json()).toMatchObject({
			code: "registry-proposal-no-change",
			status: 409,
		});
	});

	it("requires an explicit local test marker and never accepts it in production", async () => {
		const headers = new Headers({
			[LOCAL_ADMIN_TEST_IDENTITY_HEADER]: LOCAL_ADMIN_TEST_IDENTITY_VALUE,
		});
		const local = await handleUiPortalRequest(
			request("/api/admin/session", { headers }),
			{ ASSETS: assetsFetcher(), DEPLOYMENT_ENVIRONMENT: "test" },
		);
		const localSettings = await handleUiPortalRequest(
			request("/api/admin/settings", { headers }),
			{ ASSETS: assetsFetcher(), DEPLOYMENT_ENVIRONMENT: "test" },
		);
		const unmarked = await handleUiPortalRequest(
			request("/api/admin/session"),
			{ ASSETS: assetsFetcher(), DEPLOYMENT_ENVIRONMENT: "test" },
		);
		const production = await handleUiPortalRequest(
			request("/api/admin/session", { headers }),
			productionEnv(),
		);

		expect(local.status).toBe(200);
		expect(await local.json()).toMatchObject({
			identity: {
				email: "local-development@ui.le-mn.com",
				role: "portal-admin",
			},
			operationalAccess: {
				label: "Access disabled · test origin gate",
				state: "test-origin-gate",
			},
		});
		expect(unmarked.status).toBe(401);
		expect(production.status).toBe(401);
		expect(localSettings.status).toBe(200);
		expect(await localSettings.json()).toMatchObject({
			security: { adminOriginAuthorization: "test-origin-gate" },
		});
	});

	it("allows only the service identity on protected deep health and denies it on Admin", async () => {
		const env = productionEnv();
		const deep = await handleUiPortalRequest(
			serviceRequest("/health/deep"),
			env,
			serviceVerifier(),
		);
		const admin = await handleUiPortalRequest(
			serviceRequest("/api/admin/registry"),
			env,
			serviceVerifier(),
		);
		const humanDeep = await handleUiPortalRequest(
			humanRequest("/health/deep"),
			env,
			humanVerifier(),
		);

		expect(deep.status).toBe(200);
		expect(await deep.json()).toMatchObject({
			ok: true,
			service: "ui-portal",
			environment: "production",
			build: {
				version: "1.2.3",
				gitSha: "d".repeat(40),
				time: "2026-07-18T00:00:00Z",
			},
			validation: { ready: true },
		});
		expect(admin.status).toBe(403);
		expect(await admin.json()).toMatchObject({ code: "service-health-only" });
		expect(humanDeep.status).toBe(403);
		expect(await humanDeep.json()).toMatchObject({
			code: "service-health-required",
		});
	});

	it("fails closed when an asserted request has incomplete Access configuration", async () => {
		const response = await handleUiPortalRequest(
			humanRequest("/api/admin/session"),
			productionEnv({ ACCESS_AUDIENCE: undefined }),
			humanVerifier(),
		);
		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ code: "access-invalid" });
	});
});
