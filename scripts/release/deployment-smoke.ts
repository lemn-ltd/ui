#!/usr/bin/env node

const DOCS_ORIGIN = "https://ui.lemn.ai";
const SHOWCASE_ORIGIN = "https://showcase.ui.lemn.ai";

interface BuildIdentity {
	version: string;
	gitSha: string;
}

type FetchImplementation = typeof fetch;

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
}

async function fetchResponse(
	url: string,
	fetchImplementation: FetchImplementation,
): Promise<Response> {
	const response = await fetchImplementation(url, {
		headers: { Accept: "application/json, text/plain, text/html" },
		signal: AbortSignal.timeout(5_000),
	});
	if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
	return response;
}

async function retry(
	label: string,
	operation: () => Promise<void>,
): Promise<void> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= 30; attempt += 1) {
		try {
			await operation();
			console.log(`OK ${label}`);
			return;
		} catch (error) {
			lastError = error;
			if (attempt < 30)
				await new Promise((resolve) => setTimeout(resolve, 2_000));
		}
	}
	throw new Error(`${label} failed after 60s: ${String(lastError)}`);
}

export async function smokeProductionDeployment(input: {
	expected: BuildIdentity;
	fetchImplementation?: FetchImplementation;
}): Promise<void> {
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const expected = input.expected;

	await retry("docs-home", async () => {
		const text = await (
			await fetchResponse(`${DOCS_ORIGIN}/`, fetchImplementation)
		).text();
		assert(
			text.includes("Docs - UI"),
			"docs home is missing its canonical title",
		);
	});
	await retry("docs-release", async () => {
		const payload = await (
			await fetchResponse(`${DOCS_ORIGIN}/release.json`, fetchImplementation)
		).json();
		assertBuildIdentity(payload, expected, "docs release.json");
	});
	await retry("showcase-health", async () => {
		const payload = (await (
			await fetchResponse(`${SHOWCASE_ORIGIN}/health`, fetchImplementation)
		).json()) as Record<string, unknown>;
		assert(payload.ok === true, "showcase health is not OK");
		assertBuildIdentity(payload, expected, "showcase health");
	});
	await retry("showcase-ready", async () => {
		const payload = (await (
			await fetchResponse(
				`${SHOWCASE_ORIGIN}/health/ready`,
				fetchImplementation,
			)
		).json()) as Record<string, unknown>;
		assert(payload.ok === true, "showcase readiness is not OK");
		assertBuildIdentity(payload, expected, "showcase readiness");
	});
	await retry("showcase-catalog", async () => {
		const payload = (await (
			await fetchResponse(
				`${SHOWCASE_ORIGIN}/catalog.json`,
				fetchImplementation,
			)
		).json()) as Record<string, unknown>;
		assert(
			payload.package === "@lemn-ltd/ui",
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
	});
	await retry("showcase-llms", async () => {
		const text = await (
			await fetchResponse(`${SHOWCASE_ORIGIN}/llms.txt`, fetchImplementation)
		).text();
		assert(
			text.includes("@lemn-ltd/ui"),
			"llms.txt has the wrong package identity",
		);
	});
	await retry("showcase-llms-full", async () => {
		const text = await (
			await fetchResponse(
				`${SHOWCASE_ORIGIN}/llms-full.txt`,
				fetchImplementation,
			)
		).text();
		assert(
			text.includes("LEMN UI Component Catalog"),
			"llms-full.txt has the wrong catalog title",
		);
	});
}

async function main(): Promise<void> {
	const version = process.env.EXPECTED_RELEASE_VERSION;
	const gitSha = process.env.EXPECTED_RELEASE_GIT_SHA;
	if (!version || !gitSha) {
		throw new Error(
			"EXPECTED_RELEASE_VERSION and EXPECTED_RELEASE_GIT_SHA are required",
		);
	}
	await smokeProductionDeployment({ expected: { version, gitSha } });
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
