#!/usr/bin/env node

import { setTimeout as delay } from "node:timers/promises";

const DOCS_ORIGIN = "https://ui.le-mn.com";
const SHOWCASE_ORIGIN = "https://showcase.ui.le-mn.com";
const SCHEMA_ORIGIN = "https://schemas.ui.le-mn.com";
const SHOWCASE_ADMIN_ORIGIN = "https://admin.showcase.ui.le-mn.com";
const SHOWCASE_ADMIN_ACCESS_TENANT = "lemn-dev.cloudflareaccess.com";
const UI_PACKAGE_NAME = "@lemn-ltd/ui";
const BRAND_PROJECT_SCHEMA_URL = `${SCHEMA_ORIGIN}/brand-project/v1.json`;
export const PROTECTED_STATUS_PATHS = [
	"/_status",
	"/_status.json",
	"/health/deep",
] as const;

export interface BuildIdentity {
	version: string;
	gitSha: string;
	buildTime: string;
}

export interface ShowcaseAdminAccessCredentials {
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

async function fetchResponse(
	url: string,
	fetchImplementation: FetchImplementation,
	init: RequestInit = {},
	signal?: AbortSignal,
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set("Accept", "application/json, text/plain, text/html");
	const response = await fetchImplementation(url, {
		...init,
		headers,
		signal: signal
			? AbortSignal.any([signal, AbortSignal.timeout(5_000)])
			: AbortSignal.timeout(5_000),
	});
	if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
	return response;
}

async function retry(
	label: string,
	operation: () => Promise<void>,
	options: RetryOptions = defaultRetryOptions,
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

function showcaseHeaders(
	versionId: string | undefined,
	headers: HeadersInit = {},
): Headers {
	const result = new Headers(headers);
	if (versionId) {
		result.set(
			"Cloudflare-Workers-Version-Overrides",
			`lemn-ui-showcase="${versionId}"`,
		);
	}
	return result;
}

function requestSignal(signal?: AbortSignal): AbortSignal {
	return signal
		? AbortSignal.any([signal, AbortSignal.timeout(5_000)])
		: AbortSignal.timeout(5_000);
}

function showcaseAssetPath(html: string): string {
	const match = /(?:src|href)=["'](\/assets\/[^"']+)["']/u.exec(html);
	assert(match?.[1], "showcase home does not reference a built asset");
	return match[1];
}

function protectedStatusIdentity(
	payload: unknown,
	endpoint: string,
): BuildIdentity {
	assert(
		payload && typeof payload === "object",
		`${endpoint} returned a non-object payload`,
	);
	const report = payload as Record<string, unknown>;
	assert(report.ok === true, `${endpoint} is not OK`);
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
		typeof build.version === "string" && build.version.length > 0,
		`${endpoint} has no build version`,
	);
	assert(
		typeof build.gitSha === "string" && build.gitSha.length > 0,
		`${endpoint} has no build gitSha`,
	);
	assert(
		typeof build.time === "string" && build.time.length > 0,
		`${endpoint} has no build time`,
	);
	return {
		version: build.version,
		gitSha: build.gitSha,
		buildTime: build.time,
	};
}

function assertResponseDoesNotExposeToken(
	response: Response,
	body: string,
	token: string,
	endpoint: string,
): void {
	assert(
		!body.includes(token),
		`${endpoint} exposed its bearer token in the body`,
	);
	assert(
		!JSON.stringify(Object.fromEntries(response.headers)).includes(token),
		`${endpoint} exposed its bearer token in response headers`,
	);
}

function requiredCredential(value: string | undefined, name: string): string {
	assert(value?.trim(), `${name} is required`);
	return value.trim();
}

export async function smokeShowcaseAdminAccess(input: {
	credentials: ShowcaseAdminAccessCredentials;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	signal?: AbortSignal;
}): Promise<void> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;
	const clientId = requiredCredential(
		input.credentials.clientId,
		"Showcase Admin Access client ID",
	);
	const clientSecret = requiredCredential(
		input.credentials.clientSecret,
		"Showcase Admin Access client secret",
	);
	const healthUrl = `${SHOWCASE_ADMIN_ORIGIN}/health`;

	await retry(
		"showcase-admin-access-boundary",
		async () => {
			const response = await fetchImplementation(healthUrl, {
				headers: { Accept: "application/json" },
				redirect: "manual",
				signal: requestSignal(input.signal),
			});
			assert(
				response.status === 302,
				`Showcase Admin anonymous request returned HTTP ${response.status}`,
			);
			const location = response.headers.get("location");
			assert(location, "Showcase Admin Access redirect has no location");
			const accessLogin = new URL(location, SHOWCASE_ADMIN_ORIGIN);
			assert(
				accessLogin.protocol === "https:" &&
					accessLogin.hostname === SHOWCASE_ADMIN_ACCESS_TENANT &&
					accessLogin.pathname.startsWith("/cdn-cgi/access/login"),
				`Showcase Admin Access redirect does not target the exact ${SHOWCASE_ADMIN_ACCESS_TENANT} tenant login`,
			);
		},
		retryOptions,
		input.signal,
	);

	await retry(
		"showcase-admin-authenticated-health",
		async () => {
			const response = await fetchImplementation(healthUrl, {
				headers: {
					Accept: "application/json",
					"CF-Access-Client-Id": clientId,
					"CF-Access-Client-Secret": clientSecret,
				},
				redirect: "manual",
				signal: requestSignal(input.signal),
			});
			const body = await response.text();
			assertResponseDoesNotExposeToken(response, body, clientSecret, healthUrl);
			assert(
				response.status === 200,
				`Showcase Admin authenticated health returned HTTP ${response.status}`,
			);
			const payload = JSON.parse(body) as Record<string, unknown>;
			assert(payload.ok === true, "Showcase Admin health is not OK");
			assert(
				payload.service === "ui-showcase-admin",
				"Showcase Admin health has the wrong service identity",
			);
			assert(
				payload.environment === "production",
				"Showcase Admin health is not running the production environment",
			);
			assert(
				payload.simulatorConfigured === true,
				"Showcase Admin production simulator binding is not configured",
			);
		},
		retryOptions,
		input.signal,
	);
}

export async function smokeProtectedStatusRoutes(input: {
	token: string;
	expected?: BuildIdentity;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	showcaseVersionId?: string;
	signal?: AbortSignal;
}): Promise<BuildIdentity> {
	assert(input.token.length > 0, "A protected status token is required");
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;
	let expected = input.expected;

	for (const path of PROTECTED_STATUS_PATHS) {
		const url = `${SHOWCASE_ORIGIN}${path}`;
		await retry(
			`showcase-protected-unauthorized:${path}`,
			async () => {
				const response = await fetchImplementation(url, {
					headers: showcaseHeaders(input.showcaseVersionId, {
						Accept: "application/json",
					}),
					signal: requestSignal(input.signal),
				});
				const body = await response.text();
				assert(
					response.status === 401,
					`${url} without a token returned HTTP ${response.status}`,
				);
				assertResponseDoesNotExposeToken(response, body, input.token, url);
			},
			retryOptions,
			input.signal,
		);

		await retry(
			`showcase-protected-authorized:${path}`,
			async () => {
				const response = await fetchImplementation(url, {
					headers: showcaseHeaders(input.showcaseVersionId, {
						Accept: "application/json",
						Authorization: `Bearer ${input.token}`,
					}),
					signal: requestSignal(input.signal),
				});
				const body = await response.text();
				assert(
					response.status === 200,
					`${url} with a bearer token returned HTTP ${response.status}`,
				);
				assertResponseDoesNotExposeToken(response, body, input.token, url);
				const actual = protectedStatusIdentity(JSON.parse(body), url);
				if (expected) assertBuildIdentity(actual, expected, url);
				else expected = actual;
			},
			retryOptions,
			input.signal,
		);
	}

	assert(expected, "Protected status routes returned no build identity");
	return expected;
}

export async function smokeProductionDeployment(input: {
	expected: BuildIdentity;
	statusToken: string;
	showcaseAdminAccess?: ShowcaseAdminAccessCredentials;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
	showcaseVersionId?: string;
	signal?: AbortSignal;
}): Promise<void> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const expected = input.expected;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;
	const showcaseAdminAccess = input.showcaseAdminAccess ?? {
		clientId: process.env.SHOWCASE_ADMIN_ACCESS_CLIENT_ID ?? "",
		clientSecret: process.env.SHOWCASE_ADMIN_ACCESS_CLIENT_SECRET ?? "",
	};

	await retry(
		"docs-home",
		async () => {
			const text = await (
				await fetchResponse(
					`${DOCS_ORIGIN}/`,
					fetchImplementation,
					{},
					input.signal,
				)
			).text();
			assert(
				text.includes("Overview | UI"),
				"docs home is missing its canonical title",
			);
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"docs-release",
		async () => {
			const payload = await (
				await fetchResponse(
					`${DOCS_ORIGIN}/release.json`,
					fetchImplementation,
					{},
					input.signal,
				)
			).json();
			assertPackageBuildIdentity(payload, expected, "docs release.json");
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"showcase-health",
		async () => {
			const payload = (await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/health`,
					fetchImplementation,
					{ headers: showcaseHeaders(input.showcaseVersionId) },
					input.signal,
				)
			).json()) as Record<string, unknown>;
			assert(payload.ok === true, "showcase health is not OK");
			assertBuildIdentity(payload, expected, "showcase health");
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"showcase-ready",
		async () => {
			const payload = (await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/health/ready`,
					fetchImplementation,
					{ headers: showcaseHeaders(input.showcaseVersionId) },
					input.signal,
				)
			).json()) as Record<string, unknown>;
			assert(payload.ok === true, "showcase readiness is not OK");
			assertBuildIdentity(payload, expected, "showcase readiness");
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"showcase-home",
		async () => {
			const home = await fetchResponse(
				`${SHOWCASE_ORIGIN}/`,
				fetchImplementation,
				{ headers: showcaseHeaders(input.showcaseVersionId) },
				input.signal,
			);
			const html = await home.text();
			assert(html.includes('id="root"'), "showcase home is not the built SPA");
			const assetPath = showcaseAssetPath(html);
			const asset = await fetchResponse(
				`${SHOWCASE_ORIGIN}${assetPath}`,
				fetchImplementation,
				{ headers: showcaseHeaders(input.showcaseVersionId) },
				input.signal,
			);
			assert(
				(await asset.arrayBuffer()).byteLength > 0,
				"showcase asset is empty",
			);
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"showcase-catalog",
		async () => {
			const payload = (await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/catalog.json`,
					fetchImplementation,
					{ headers: showcaseHeaders(input.showcaseVersionId) },
					input.signal,
				)
			).json()) as Record<string, unknown>;
			assert(
				payload.package === UI_PACKAGE_NAME,
				"showcase catalog has the wrong package",
			);
			assert(
				payload.version === expected.version,
				"showcase catalog has a stale version",
			);
			assert(
				Array.isArray(payload.components) && payload.components.length > 0,
				"showcase catalog is empty",
			);
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"showcase-provider-registry",
		async () => {
			const response = await fetchResponse(
				`${SHOWCASE_ORIGIN}/provider-registry.json`,
				fetchImplementation,
				{ headers: showcaseHeaders(input.showcaseVersionId) },
				input.signal,
			);
			assert(
				response.headers.get("content-type")?.includes("application/json"),
				"showcase provider registry is not JSON",
			);
			const payload = (await response.json()) as Record<string, unknown>;
			assert(
				typeof payload.revision === "string" && payload.revision.length > 0,
				"showcase provider registry has no revision",
			);
			assert(
				Array.isArray(payload.capabilities) && payload.capabilities.length > 0,
				"showcase provider registry has no active capabilities",
			);
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"showcase-blocks",
		async () => {
			const response = await fetchResponse(
				`${SHOWCASE_ORIGIN}/blocks.json`,
				fetchImplementation,
				{ headers: showcaseHeaders(input.showcaseVersionId) },
				input.signal,
			);
			assert(
				response.headers.get("content-type")?.includes("application/json"),
				"showcase blocks catalog is not JSON",
			);
			const payload = (await response.json()) as Record<string, unknown>;
			assert(
				Array.isArray(payload.blocks) && payload.blocks.length > 0,
				"showcase blocks catalog is empty",
			);
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"brand-project-schema",
		async () => {
			const response = await fetchResponse(
				BRAND_PROJECT_SCHEMA_URL,
				fetchImplementation,
				{ headers: showcaseHeaders(input.showcaseVersionId) },
				input.signal,
			);
			assert(
				response.headers
					.get("content-type")
					?.includes("application/schema+json"),
				"BrandProject schema has the wrong content type",
			);
			const payload = (await response.json()) as Record<string, unknown>;
			assert(
				payload.$id === BRAND_PROJECT_SCHEMA_URL,
				"BrandProject schema has the wrong canonical ID",
			);
		},
		retryOptions,
		input.signal,
	);
	await smokeShowcaseAdminAccess({
		credentials: showcaseAdminAccess,
		fetchImplementation,
		retryOptions,
		signal: input.signal,
	});
	await retry(
		"showcase-llms",
		async () => {
			const text = await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/llms.txt`,
					fetchImplementation,
					{ headers: showcaseHeaders(input.showcaseVersionId) },
					input.signal,
				)
			).text();
			assert(
				text.includes("@lemn-ltd/ui"),
				"llms.txt has the wrong package identity",
			);
		},
		retryOptions,
		input.signal,
	);
	await retry(
		"showcase-llms-full",
		async () => {
			const text = await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/llms-full.txt`,
					fetchImplementation,
					{ headers: showcaseHeaders(input.showcaseVersionId) },
					input.signal,
				)
			).text();
			assert(
				text.includes("Lemn UI Component Catalog"),
				"llms-full.txt has the wrong catalog title",
			);
		},
		retryOptions,
		input.signal,
	);
	await smokeProtectedStatusRoutes({
		token: input.statusToken,
		expected,
		fetchImplementation,
		retryOptions,
		showcaseVersionId: input.showcaseVersionId,
		signal: input.signal,
	});
}

async function main(): Promise<void> {
	const version = process.env.EXPECTED_RELEASE_VERSION;
	const gitSha = process.env.EXPECTED_RELEASE_GIT_SHA;
	const buildTime = process.env.EXPECTED_RELEASE_TIME;
	const statusToken = process.env.PRODUCTION_STATUS_TOKEN;
	const showcaseAdminAccessClientId =
		process.env.SHOWCASE_ADMIN_ACCESS_CLIENT_ID;
	const showcaseAdminAccessClientSecret =
		process.env.SHOWCASE_ADMIN_ACCESS_CLIENT_SECRET;
	if (
		!version ||
		!gitSha ||
		!buildTime ||
		!statusToken ||
		!showcaseAdminAccessClientId ||
		!showcaseAdminAccessClientSecret
	) {
		throw new Error(
			"EXPECTED_RELEASE_VERSION, EXPECTED_RELEASE_GIT_SHA, EXPECTED_RELEASE_TIME, PRODUCTION_STATUS_TOKEN, SHOWCASE_ADMIN_ACCESS_CLIENT_ID, and SHOWCASE_ADMIN_ACCESS_CLIENT_SECRET are required",
		);
	}
	await smokeProductionDeployment({
		expected: { version, gitSha, buildTime },
		statusToken,
		showcaseAdminAccess: {
			clientId: showcaseAdminAccessClientId,
			clientSecret: showcaseAdminAccessClientSecret,
		},
	});
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
