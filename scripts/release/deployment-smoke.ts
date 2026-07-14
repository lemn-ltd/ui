#!/usr/bin/env node

const DOCS_ORIGIN = "https://ui.le-mn.com";
const SHOWCASE_ORIGIN = "https://showcase.ui.le-mn.com";
const UI_PACKAGE_NAME = "@lemn-ltd/ui";
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
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set("Accept", "application/json, text/plain, text/html");
	const response = await fetchImplementation(url, {
		...init,
		headers,
		signal: AbortSignal.timeout(5_000),
	});
	if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
	return response;
}

async function retry(
	label: string,
	operation: () => Promise<void>,
	options: RetryOptions = defaultRetryOptions,
): Promise<void> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
		try {
			await operation();
			console.log(`OK ${label}`);
			return;
		} catch (error) {
			lastError = error;
			if (attempt < options.attempts)
				await new Promise((resolve) => setTimeout(resolve, options.delayMs));
		}
	}
	throw new Error(
		`${label} failed after ${options.attempts} attempts: ${String(lastError)}`,
	);
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

export async function smokeProtectedStatusRoutes(input: {
	token: string;
	expected?: BuildIdentity;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
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
					headers: { Accept: "application/json" },
					signal: AbortSignal.timeout(5_000),
				});
				const body = await response.text();
				assert(
					response.status === 401,
					`${url} without a token returned HTTP ${response.status}`,
				);
				assertResponseDoesNotExposeToken(response, body, input.token, url);
			},
			retryOptions,
		);

		await retry(
			`showcase-protected-authorized:${path}`,
			async () => {
				const response = await fetchImplementation(url, {
					headers: {
						Accept: "application/json",
						Authorization: `Bearer ${input.token}`,
					},
					signal: AbortSignal.timeout(5_000),
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
		);
	}

	assert(expected, "Protected status routes returned no build identity");
	return expected;
}

export async function smokeProductionDeployment(input: {
	expected: BuildIdentity;
	statusToken: string;
	fetchImplementation?: FetchImplementation;
	retryOptions?: RetryOptions;
}): Promise<void> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const expected = input.expected;
	const retryOptions = input.retryOptions ?? defaultRetryOptions;

	await retry(
		"docs-home",
		async () => {
			const text = await (
				await fetchResponse(`${DOCS_ORIGIN}/`, fetchImplementation)
			).text();
			assert(
				text.includes("Overview | UI"),
				"docs home is missing its canonical title",
			);
		},
		retryOptions,
	);
	await retry(
		"docs-release",
		async () => {
			const payload = await (
				await fetchResponse(`${DOCS_ORIGIN}/release.json`, fetchImplementation)
			).json();
			assertPackageBuildIdentity(payload, expected, "docs release.json");
		},
		retryOptions,
	);
	await retry(
		"showcase-health",
		async () => {
			const payload = (await (
				await fetchResponse(`${SHOWCASE_ORIGIN}/health`, fetchImplementation)
			).json()) as Record<string, unknown>;
			assert(payload.ok === true, "showcase health is not OK");
			assertBuildIdentity(payload, expected, "showcase health");
		},
		retryOptions,
	);
	await retry(
		"showcase-ready",
		async () => {
			const payload = (await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/health/ready`,
					fetchImplementation,
				)
			).json()) as Record<string, unknown>;
			assert(payload.ok === true, "showcase readiness is not OK");
			assertBuildIdentity(payload, expected, "showcase readiness");
		},
		retryOptions,
	);
	await retry(
		"showcase-home",
		async () => {
			const home = await fetchResponse(
				`${SHOWCASE_ORIGIN}/`,
				fetchImplementation,
			);
			const html = await home.text();
			assert(html.includes('id="root"'), "showcase home is not the built SPA");
			const assetPath = showcaseAssetPath(html);
			const asset = await fetchResponse(
				`${SHOWCASE_ORIGIN}${assetPath}`,
				fetchImplementation,
			);
			assert(
				(await asset.arrayBuffer()).byteLength > 0,
				"showcase asset is empty",
			);
		},
		retryOptions,
	);
	await retry(
		"showcase-catalog",
		async () => {
			const payload = (await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/catalog.json`,
					fetchImplementation,
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
	);
	await retry(
		"showcase-llms",
		async () => {
			const text = await (
				await fetchResponse(`${SHOWCASE_ORIGIN}/llms.txt`, fetchImplementation)
			).text();
			assert(
				text.includes("@lemn-ltd/ui"),
				"llms.txt has the wrong package identity",
			);
		},
		retryOptions,
	);
	await retry(
		"showcase-llms-full",
		async () => {
			const text = await (
				await fetchResponse(
					`${SHOWCASE_ORIGIN}/llms-full.txt`,
					fetchImplementation,
				)
			).text();
			assert(
				text.includes("Lemn UI Component Catalog"),
				"llms-full.txt has the wrong catalog title",
			);
		},
		retryOptions,
	);
	await smokeProtectedStatusRoutes({
		token: input.statusToken,
		expected,
		fetchImplementation,
		retryOptions,
	});
}

async function main(): Promise<void> {
	const version = process.env.EXPECTED_RELEASE_VERSION;
	const gitSha = process.env.EXPECTED_RELEASE_GIT_SHA;
	const buildTime = process.env.EXPECTED_RELEASE_TIME;
	const statusToken = process.env.PRODUCTION_STATUS_TOKEN;
	if (!version || !gitSha || !buildTime || !statusToken) {
		throw new Error(
			"EXPECTED_RELEASE_VERSION, EXPECTED_RELEASE_GIT_SHA, EXPECTED_RELEASE_TIME, and PRODUCTION_STATUS_TOKEN are required",
		);
	}
	await smokeProductionDeployment({
		expected: { version, gitSha, buildTime },
		statusToken,
	});
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
