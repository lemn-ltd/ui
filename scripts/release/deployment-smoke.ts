#!/usr/bin/env node

import { setTimeout as delay } from "node:timers/promises";
import { productionPortalEdgeAccessEnabled } from "./zero-trust-posture.ts";

const DOCS_ORIGIN = "https://ui.le-mn.com";
const PORTAL_ORIGIN = "https://portal.ui.le-mn.com";
const SCHEMA_ORIGIN = "https://schemas.ui.le-mn.com";
const ACCESS_TENANT = "lemn-dev.cloudflareaccess.com";
const UI_PACKAGE_NAME = "@lemn-ltd/ui";
const PORTAL_SERVICE = "ui-portal";
const BRANDING_DEFINITION_SCHEMA_URL = `${SCHEMA_ORIGIN}/branding/v1.json`;

export const PROTECTED_ADMIN_PATHS = [
	"/admin",
	"/admin-assets/access-boundary-probe.js",
	"/api/admin/session",
] as const;
export const SERVICE_HEALTH_PATH = "/health/deep";
export const SERVICE_ADMIN_DENIAL_PATH = "/api/admin/session";

export interface BuildIdentity {
	version: string;
	gitSha: string;
	buildTime: string;
}

export interface UiPortalAccessCredentials {
	clientId: string;
	clientSecret: string;
}

type FetchImplementation = typeof fetch;

interface RetryOptions {
	attempts: number;
	delayMs: number;
}

const defaultRetryOptions: RetryOptions = { attempts: 30, delayMs: 2_000 };

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

export function assertBuildIdentity(
	payload: unknown,
	expected: BuildIdentity,
	endpoint: string,
): void {
	assert(
		payload && typeof payload === "object",
		`${endpoint} returned a non-object payload`,
	);
	const actual = payload as Record<string, unknown>;
	assert(
		actual.version === expected.version,
		`${endpoint} has stale version ${String(actual.version)}`,
	);
	assert(
		actual.gitSha === expected.gitSha,
		`${endpoint} has stale gitSha ${String(actual.gitSha)}`,
	);
	assert(
		actual.buildTime === expected.buildTime,
		`${endpoint} has stale buildTime ${String(actual.buildTime)}`,
	);
}

export function assertPackageBuildIdentity(
	payload: unknown,
	expected: BuildIdentity,
	endpoint: string,
): void {
	assertBuildIdentity(payload, expected, endpoint);
	const actual = payload as Record<string, unknown>;
	assert(
		actual.package === UI_PACKAGE_NAME,
		`${endpoint} has wrong package ${String(actual.package)}`,
	);
}

function requestSignal(signal?: AbortSignal): AbortSignal {
	return signal
		? AbortSignal.any([signal, AbortSignal.timeout(5_000)])
		: AbortSignal.timeout(5_000);
}

async function retry(
	label: string,
	operation: () => Promise<void>,
	options: RetryOptions,
	signal?: AbortSignal,
): Promise<void> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
		try {
			await operation();
			console.log(`OK ${label}`);
			return;
		} catch (error) {
			if (signal?.aborted) throw signal.reason;
			lastError = error;
			if (attempt < options.attempts) {
				await delay(options.delayMs, undefined, { signal });
			}
		}
	}
	throw new Error(
		`${label} failed after ${options.attempts} attempts: ${String(lastError)}`,
	);
}

function portalHeaders(
	versionId: string | undefined,
	headers: HeadersInit = {},
): Headers {
	const result = new Headers(headers);
	if (versionId) {
		result.set(
			"Cloudflare-Workers-Version-Overrides",
			`lemn-ui-portal="${versionId}"`,
		);
	}
	return result;
}

async function responseBody(response: Response): Promise<string> {
	return response.text();
}

function assertNoCredentialExposure(
	response: Response,
	body: string,
	credentials: UiPortalAccessCredentials,
	endpoint: string,
): void {
	const serializedHeaders = JSON.stringify(
		Object.fromEntries(response.headers),
	);
	for (const credential of [credentials.clientId, credentials.clientSecret]) {
		assert(
			!body.includes(credential),
			`${endpoint} exposed an Access credential`,
		);
		assert(
			!serializedHeaders.includes(credential),
			`${endpoint} exposed an Access credential in response headers`,
		);
	}
}

function requiredCredential(value: string | undefined, name: string): string {
	const normalized = value?.trim();
	assert(normalized, `${name} is required`);
	return normalized;
}

function assertAccessRedirect(response: Response, endpoint: string): void {
	assert(
		response.status === 302,
		`${endpoint} anonymous request returned HTTP ${response.status}`,
	);
	const location = response.headers.get("location");
	assert(location, `${endpoint} Access redirect has no location`);
	const login = new URL(location, PORTAL_ORIGIN);
	assert(
		login.protocol === "https:" &&
			login.hostname === ACCESS_TENANT &&
			login.pathname.startsWith("/cdn-cgi/access/login"),
		`${endpoint} does not redirect to the exact ${ACCESS_TENANT} tenant`,
	);
}

function assertServiceAccessBoundary(
	response: Response,
	endpoint: string,
): void {
	if (response.status === 302) {
		assertAccessRedirect(response, endpoint);
		return;
	}
	assert(
		response.status === 401 || response.status === 403,
		`${endpoint} anonymous request returned HTTP ${response.status}; expected an Access redirect or service-auth denial`,
	);
}

function assertServiceAdminDenied(response: Response, endpoint: string): void {
	if (response.status === 302) {
		assertAccessRedirect(response, endpoint);
		return;
	}
	assert(
		response.status === 401 || response.status === 403,
		`${endpoint} service request returned HTTP ${response.status}; expected an Access or origin denial`,
	);
}

function protectedHealthIdentity(
	payload: unknown,
	endpoint: string,
): BuildIdentity {
	assert(
		payload && typeof payload === "object",
		`${endpoint} returned a non-object payload`,
	);
	const report = payload as Record<string, unknown>;
	assert(report.ok === true, `${endpoint} is not OK`);
	assert(report.service === PORTAL_SERVICE, `${endpoint} has wrong service`);
	assert(report.environment === "production", `${endpoint} is not production`);
	assert(
		report.validation && typeof report.validation === "object",
		`${endpoint} has no validation result`,
	);
	assert(
		(report.validation as Record<string, unknown>).ready === true,
		`${endpoint} is not ready`,
	);
	assert(
		report.build && typeof report.build === "object",
		`${endpoint} has no build identity`,
	);
	const build = report.build as Record<string, unknown>;
	assert(
		typeof build.version === "string" &&
			typeof build.gitSha === "string" &&
			typeof build.time === "string",
		`${endpoint} has an incomplete build identity`,
	);
	return {
		version: build.version,
		gitSha: build.gitSha,
		buildTime: build.time,
	};
}

export async function smokePortalServiceAccess(input: {
	credentials: UiPortalAccessCredentials;
	edgeAccessEnabled: boolean;
	expected?: BuildIdentity;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	portalVersionId?: string;
	signal?: AbortSignal;
}): Promise<BuildIdentity> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;
	const credentials = {
		clientId: requiredCredential(
			input.credentials.clientId,
			"UI Portal Access client ID",
		),
		clientSecret: requiredCredential(
			input.credentials.clientSecret,
			"UI Portal Access client secret",
		),
	};
	assert(
		credentials.clientId !== credentials.clientSecret,
		"UI Portal Access client ID and secret must be distinct",
	);
	const endpoint = `${PORTAL_ORIGIN}${SERVICE_HEALTH_PATH}`;

	await retry(
		"ui-portal-service-health-anonymous-boundary",
		async () => {
			const response = await fetchImplementation(endpoint, {
				headers: portalHeaders(input.portalVersionId, {
					Accept: "application/json",
				}),
				redirect: "manual",
				signal: requestSignal(input.signal),
			});
			assertServiceAccessBoundary(response, endpoint);
		},
		retryOptions,
		input.signal,
	);

	let identity: BuildIdentity | undefined;
	if (input.edgeAccessEnabled) {
		await retry(
			"ui-portal-service-health-authenticated",
			async () => {
				const response = await fetchImplementation(endpoint, {
					headers: portalHeaders(input.portalVersionId, {
						Accept: "application/json",
						"CF-Access-Client-Id": credentials.clientId,
						"CF-Access-Client-Secret": credentials.clientSecret,
					}),
					redirect: "manual",
					signal: requestSignal(input.signal),
				});
				const body = await responseBody(response);
				assertNoCredentialExposure(response, body, credentials, endpoint);
				assert(
					response.status === 200,
					`${endpoint} service request returned HTTP ${response.status}`,
				);
				identity = protectedHealthIdentity(JSON.parse(body), endpoint);
				if (input.expected) {
					assertBuildIdentity(identity, input.expected, endpoint);
				}
			},
			retryOptions,
			input.signal,
		);
	} else {
		await retry(
			"ui-portal-service-health-disabled-boundary",
			async () => {
				const response = await fetchImplementation(endpoint, {
					headers: portalHeaders(input.portalVersionId, {
						Accept: "application/json",
						"CF-Access-Client-Id": credentials.clientId,
						"CF-Access-Client-Secret": credentials.clientSecret,
					}),
					redirect: "manual",
					signal: requestSignal(input.signal),
				});
				const body = await responseBody(response);
				assertNoCredentialExposure(response, body, credentials, endpoint);
				assertServiceAccessBoundary(response, endpoint);
			},
			retryOptions,
			input.signal,
		);
		const releaseEndpoint = `${PORTAL_ORIGIN}/release.json`;
		await retry(
			"ui-portal-public-release-identity",
			async () => {
				const response = await fetchImplementation(releaseEndpoint, {
					headers: portalHeaders(input.portalVersionId, {
						Accept: "application/json",
					}),
					signal: requestSignal(input.signal),
				});
				assert(
					response.ok,
					`${releaseEndpoint} returned HTTP ${response.status}`,
				);
				const payload = (await response.json()) as Record<string, unknown>;
				identity = {
					version: String(payload.version ?? ""),
					gitSha: String(payload.gitSha ?? ""),
					buildTime: String(payload.buildTime ?? ""),
				};
				assertPackageBuildIdentity(payload, identity, releaseEndpoint);
				if (input.expected) {
					assertBuildIdentity(identity, input.expected, releaseEndpoint);
				}
			},
			retryOptions,
			input.signal,
		);
	}
	assert(identity, "UI Portal release smoke returned no build identity");

	const adminEndpoint = `${PORTAL_ORIGIN}${SERVICE_ADMIN_DENIAL_PATH}`;
	await retry(
		"ui-portal-service-admin-denied",
		async () => {
			const response = await fetchImplementation(adminEndpoint, {
				headers: portalHeaders(input.portalVersionId, {
					Accept: "application/json",
					"CF-Access-Client-Id": credentials.clientId,
					"CF-Access-Client-Secret": credentials.clientSecret,
				}),
				redirect: "manual",
				signal: requestSignal(input.signal),
			});
			const body = await responseBody(response);
			assertNoCredentialExposure(response, body, credentials, adminEndpoint);
			assertServiceAdminDenied(response, adminEndpoint);
		},
		retryOptions,
		input.signal,
	);
	return identity;
}

export async function smokePortalAdminBoundary(input: {
	edgeAccessEnabled: boolean;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	portalVersionId?: string;
	signal?: AbortSignal;
}): Promise<void> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;
	for (const path of PROTECTED_ADMIN_PATHS) {
		const endpoint = `${PORTAL_ORIGIN}${path}`;
		await retry(
			`ui-portal-admin-boundary:${path}`,
			async () => {
				const response = await fetchImplementation(endpoint, {
					headers: portalHeaders(input.portalVersionId),
					redirect: "manual",
					signal: requestSignal(input.signal),
				});
				if (input.edgeAccessEnabled) {
					assertAccessRedirect(response, endpoint);
				} else {
					assertServiceAccessBoundary(response, endpoint);
				}
			},
			retryOptions,
			input.signal,
		);
	}
}

function portalAssetPath(html: string): string {
	const match = /(?:src|href)=["'](\/assets\/[^"']+)["']/u.exec(html);
	assert(match?.[1], "UI Portal home does not reference a built asset");
	return match[1];
}

async function fetchOk(
	url: string,
	fetchImplementation: FetchImplementation,
	init: RequestInit,
): Promise<Response> {
	const response = await fetchImplementation(url, init);
	assert(response.ok, `${url} returned HTTP ${response.status}`);
	return response;
}

export async function smokeProductionDeployment(input: {
	expected: BuildIdentity;
	access: UiPortalAccessCredentials;
	edgeAccessEnabled: boolean;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	portalVersionId?: string;
	signal?: AbortSignal;
}): Promise<void> {
	await smokeDocsDeployment(input);
	await smokePortalProductionDeployment(input);
}

export async function smokeDocsDeployment(input: {
	expected: BuildIdentity;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	signal?: AbortSignal;
}): Promise<void> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;
	const expected = input.expected;
	const retryCheck = (label: string, operation: () => Promise<void>) =>
		retry(label, operation, retryOptions, input.signal);

	await retryCheck("docs-home", async () => {
		const response = await fetchOk(`${DOCS_ORIGIN}/`, fetchImplementation, {
			signal: requestSignal(input.signal),
		});
		assert((await response.text()).includes("UI"), "docs home is not Lemn UI");
	});
	await retryCheck("docs-release", async () => {
		const response = await fetchOk(
			`${DOCS_ORIGIN}/release.json`,
			fetchImplementation,
			{ signal: requestSignal(input.signal) },
		);
		assertPackageBuildIdentity(await response.json(), expected, "docs release");
	});
}

export async function smokePortalProductionDeployment(input: {
	expected: BuildIdentity;
	access: UiPortalAccessCredentials;
	edgeAccessEnabled: boolean;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	portalVersionId?: string;
	signal?: AbortSignal;
}): Promise<void> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;
	const expected = input.expected;
	const publicHeaders = portalHeaders(input.portalVersionId, {
		Accept: "application/json, text/plain, text/html",
	});
	const retryCheck = (label: string, operation: () => Promise<void>) =>
		retry(label, operation, retryOptions, input.signal);

	await retryCheck("ui-portal-health", async () => {
		const response = await fetchOk(
			`${PORTAL_ORIGIN}/health`,
			fetchImplementation,
			{ headers: publicHeaders, signal: requestSignal(input.signal) },
		);
		const payload = (await response.json()) as Record<string, unknown>;
		assert(payload.ok === true, "/health is not OK");
		assert(payload.service === PORTAL_SERVICE, "/health has wrong service");
		assert(
			Object.keys(payload).sort().join(",") === "ok,service",
			"/health must remain minimal",
		);
	});

	await retryCheck("ui-portal-home-and-asset", async () => {
		const response = await fetchOk(`${PORTAL_ORIGIN}/`, fetchImplementation, {
			headers: publicHeaders,
			signal: requestSignal(input.signal),
		});
		const html = await response.text();
		assert(html.includes('id="root"'), "UI Portal home is not the built SPA");
		const assetPath = portalAssetPath(html);
		const asset = await fetchOk(
			`${PORTAL_ORIGIN}${assetPath}`,
			fetchImplementation,
			{ headers: publicHeaders, signal: requestSignal(input.signal) },
		);
		assert(
			(await asset.arrayBuffer()).byteLength > 0,
			"UI Portal asset is empty",
		);
	});

	await retryCheck("ui-portal-catalog", async () => {
		const response = await fetchOk(
			`${PORTAL_ORIGIN}/catalog.json`,
			fetchImplementation,
			{ headers: publicHeaders, signal: requestSignal(input.signal) },
		);
		const payload = (await response.json()) as Record<string, unknown>;
		assert(payload.package === UI_PACKAGE_NAME, "catalog has wrong package");
		assert(payload.version === expected.version, "catalog has stale version");
		assert(
			Array.isArray(payload.components) && payload.components.length > 0,
			"catalog is empty",
		);
	});
	await retryCheck("ui-portal-provider-registry", async () => {
		const response = await fetchOk(
			`${PORTAL_ORIGIN}/provider-registry.json`,
			fetchImplementation,
			{ headers: publicHeaders, signal: requestSignal(input.signal) },
		);
		const payload = (await response.json()) as Record<string, unknown>;
		assert(
			typeof payload.revision === "string" && payload.revision.length > 0,
			"provider registry has no revision",
		);
		assert(
			Array.isArray(payload.capabilities) && payload.capabilities.length > 0,
			"provider registry has no capabilities",
		);
	});
	await retryCheck("ui-portal-blocks", async () => {
		const response = await fetchOk(
			`${PORTAL_ORIGIN}/blocks.json`,
			fetchImplementation,
			{ headers: publicHeaders, signal: requestSignal(input.signal) },
		);
		const payload = (await response.json()) as Record<string, unknown>;
		assert(
			Array.isArray(payload.blocks) && payload.blocks.length > 0,
			"blocks catalog is empty",
		);
	});

	await retryCheck("branding-schema", async () => {
		const response = await fetchOk(
			BRANDING_DEFINITION_SCHEMA_URL,
			fetchImplementation,
			{ headers: publicHeaders, signal: requestSignal(input.signal) },
		);
		assert(
			response.headers.get("content-type")?.includes("application/schema+json"),
			"branding schema has wrong content type",
		);
		assert(
			response.headers.get("access-control-allow-origin") === "*",
			"branding schema must allow public CORS",
		);
		assert(
			response.headers.get("cache-control")?.includes("immutable"),
			"branding schema must be immutable",
		);
		const payload = (await response.json()) as Record<string, unknown>;
		assert(
			payload.$id === BRANDING_DEFINITION_SCHEMA_URL,
			"branding schema has wrong $id",
		);
	});

	for (const path of ["/llms.txt", "/llms-full.txt"] as const) {
		await retryCheck(`ui-portal${path}`, async () => {
			const response = await fetchOk(
				`${PORTAL_ORIGIN}${path}`,
				fetchImplementation,
				{ headers: publicHeaders, signal: requestSignal(input.signal) },
			);
			const content = await response.text();
			assert(content.includes("Lemn UI"), `${path} has wrong catalog identity`);
		});
	}

	await smokePortalAdminBoundary({
		edgeAccessEnabled: input.edgeAccessEnabled,
		fetchImplementation,
		retryOptions,
		portalVersionId: input.portalVersionId,
		signal: input.signal,
	});
	await smokePortalServiceAccess({
		credentials: input.access,
		edgeAccessEnabled: input.edgeAccessEnabled,
		expected,
		fetchImplementation,
		retryOptions,
		portalVersionId: input.portalVersionId,
		signal: input.signal,
	});
}

async function main(): Promise<void> {
	const expected = {
		version: process.env.EXPECTED_RELEASE_VERSION,
		gitSha: process.env.EXPECTED_RELEASE_GIT_SHA,
		buildTime: process.env.EXPECTED_RELEASE_TIME,
	};
	const access = {
		clientId: process.env.UI_PORTAL_ACCESS_CLIENT_ID,
		clientSecret: process.env.UI_PORTAL_ACCESS_CLIENT_SECRET,
	};
	for (const [name, value] of [
		["EXPECTED_RELEASE_VERSION", expected.version],
		["EXPECTED_RELEASE_GIT_SHA", expected.gitSha],
		["EXPECTED_RELEASE_TIME", expected.buildTime],
		["UI_PORTAL_ACCESS_CLIENT_ID", access.clientId],
		["UI_PORTAL_ACCESS_CLIENT_SECRET", access.clientSecret],
	] as const) {
		assert(value, `${name} is required`);
	}
	await smokeProductionDeployment({
		expected: expected as BuildIdentity,
		access: access as UiPortalAccessCredentials,
		edgeAccessEnabled: await productionPortalEdgeAccessEnabled(),
	});
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
