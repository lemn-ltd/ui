#!/usr/bin/env node

const DOCS_ORIGIN = "https://ui.le-mn.com";
const SHOWCASE_ORIGIN = "https://showcase.ui.le-mn.com";
const UI_PACKAGE_NAME = "@lemn-ltd/ui";

interface BuildIdentity {
	version: string;
	gitSha: string;
	buildTime: string;
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

function showcaseAssetPath(html: string): string {
	const match = /(?:src|href)=["'](\/assets\/[^"']+)["']/u.exec(html);
	assert(match?.[1], "showcase home does not reference a built asset");
	return match[1];
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
		assert(text.includes("Overview | UI"), "docs home is missing its canonical title");
	});
	await retry("docs-release", async () => {
		const payload = await (
			await fetchResponse(`${DOCS_ORIGIN}/release.json`, fetchImplementation)
		).json();
		assertPackageBuildIdentity(payload, expected, "docs release.json");
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
	await retry("showcase-home", async () => {
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
	});
	await retry("showcase-catalog", async () => {
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
			text.includes("Lemn UI Component Catalog"),
			"llms-full.txt has the wrong catalog title",
		);
	});
}

async function main(): Promise<void> {
	const version = process.env.EXPECTED_RELEASE_VERSION;
	const gitSha = process.env.EXPECTED_RELEASE_GIT_SHA;
	const buildTime = process.env.EXPECTED_RELEASE_TIME;
	if (!version || !gitSha || !buildTime) {
		throw new Error(
			"EXPECTED_RELEASE_VERSION, EXPECTED_RELEASE_GIT_SHA, and EXPECTED_RELEASE_TIME are required",
		);
	}
	await smokeProductionDeployment({ expected: { version, gitSha, buildTime } });
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
