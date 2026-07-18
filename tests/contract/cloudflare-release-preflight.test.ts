import assert from "node:assert/strict";
import test from "node:test";
import {
	CLOUDFLARE_PRODUCTION_SECRET,
	CLOUDFLARE_TOKEN_GRANTS,
	type CloudflareReleaseTarget,
	cloudflareAuthFromEnvironment,
	loadCloudflareReleaseTargets,
	verifyCloudflareReleaseAccess,
} from "../../scripts/release/cloudflare-preflight.ts";

const accountId = "a".repeat(32);
const apiToken = "contract-scoped-api-token";

const targets: CloudflareReleaseTarget[] = [
	{
		id: "docs",
		accountId,
		workerName: "lemn-ui-docs",
		hostname: "ui.le-mn.com",
	},
	{
		id: "portal",
		accountId,
		workerName: "lemn-ui-portal",
		hostname: "portal.ui.le-mn.com",
	},
	{
		id: "schema",
		accountId,
		workerName: "lemn-ui-portal",
		hostname: "schemas.ui.le-mn.com",
	},
];

function response(result: unknown, status = 200): Response {
	return Response.json({ success: status < 400, result }, { status });
}

function cloudflareFixture(
	options: {
		conflictingHostname?: string;
		duplicateHostname?: string;
		inactiveToken?: boolean;
		malformedDomainItem?: boolean;
		malformedWorkerItem?: boolean;
		malformedWorkerList?: boolean;
		missingResources?: boolean;
		missingZone?: boolean;
		reject?: boolean;
	} = {},
) {
	const requests: Array<{ url: string; method: string }> = [];
	const fetchImplementation: typeof fetch = async (input, init) => {
		const url = String(input);
		const headers = new Headers(init?.headers);
		requests.push({ url, method: init?.method ?? "GET" });
		assert.equal(headers.get("Authorization"), `Bearer ${apiToken}`);
		assert.equal(headers.get("X-Auth-Key"), null);
		assert.equal(headers.get("X-Auth-Email"), null);

		if (options.reject) {
			return Response.json(
				{
					success: false,
					errors: [{ code: 9109, message: `Unauthorized ${apiToken}` }],
				},
				{ status: 403 },
			);
		}
		if (url.endsWith(`/accounts/${accountId}/tokens/verify`)) {
			return response({
				status: options.inactiveToken ? "disabled" : "active",
			});
		}
		if (url.includes("/zones?")) {
			return response(
				options.missingZone
					? []
					: [{ id: "zone-id", name: "le-mn.com", account: { id: accountId } }],
			);
		}
		if (url.endsWith(`/accounts/${accountId}/workers/scripts`)) {
			if (options.malformedWorkerList) return response({ scripts: [] });
			if (options.malformedWorkerItem) return response([{}]);
			return response(
				options.missingResources
					? []
					: [{ id: "lemn-ui-docs" }, { id: "lemn-ui-portal" }],
			);
		}
		if (url.includes("/workers/domains?")) {
			const requestUrl = new URL(url);
			if (options.malformedDomainItem) return response([{}]);
			if (options.missingResources) return response([]);
			const hostname = requestUrl.searchParams.get("hostname");
			const service =
				hostname === options.conflictingHostname
					? "different-worker"
					: hostname === "ui.le-mn.com"
						? "lemn-ui-docs"
						: "lemn-ui-portal";
			const mappings = [{ hostname, service }];
			if (hostname === options.duplicateHostname) {
				mappings.push({ hostname, service: "duplicate-worker" });
			}
			return response(mappings);
		}
		throw new Error(`Unexpected Cloudflare fixture request: ${url}`);
	};
	return { fetchImplementation, requests };
}

async function verifyFixture(
	fixture: ReturnType<typeof cloudflareFixture>,
	requireResources = false,
): Promise<void> {
	await verifyCloudflareReleaseAccess({
		apiToken,
		targets,
		fetchImplementation: fixture.fetchImplementation,
		requireResources,
	});
}

test("generic Wrangler deploy targets resolve the confirmed account from the environment", async () => {
	const configuredTargets = await loadCloudflareReleaseTargets(undefined, {
		CLOUDFLARE_ACCOUNT_ID: accountId,
	});
	assert.deepEqual(configuredTargets, targets);
});

test("generic Wrangler deploy targets fail closed without an account source", async () => {
	await assert.rejects(
		loadCloudflareReleaseTargets(undefined, {}),
		/CLOUDFLARE_ACCOUNT_ID/u,
	);
});

test("production token guidance names the exact account and zone grants", () => {
	assert.equal(
		CLOUDFLARE_TOKEN_GRANTS,
		'Account "Lemn DEV" -> Workers Scripts: Edit; Zone "le-mn.com" -> Zone: Read, Workers Routes: Edit',
	);
});

test("preflight verifies an account-owned bearer token and performs no mutation", async () => {
	const fixture = cloudflareFixture();
	await verifyFixture(fixture);
	assert.equal(fixture.requests.length, 8);
	assert.ok(
		fixture.requests[0]?.url.endsWith(`/accounts/${accountId}/tokens/verify`),
	);
	assert.ok(fixture.requests.every((request) => request.method === "GET"));
});

test("release auth fails closed for missing or legacy credentials", () => {
	for (const environment of [
		{},
		{
			CLOUDFLARE_API_TOKEN: apiToken,
			CLOUDFLARE_API_KEY: "legacy-key",
			CLOUDFLARE_EMAIL: "legacy@example.test",
		},
	]) {
		assert.throws(
			() => cloudflareAuthFromEnvironment(environment),
			(error: unknown) => {
				assert.ok(error instanceof Error);
				assert.match(
					error.message,
					new RegExp(CLOUDFLARE_PRODUCTION_SECRET, "u"),
				);
				assert.match(error.message, new RegExp(CLOUDFLARE_TOKEN_GRANTS, "u"));
				return true;
			},
		);
	}
	assert.throws(
		() =>
			cloudflareAuthFromEnvironment({
				CLOUDFLARE_API_TOKEN: apiToken,
				CLOUDFLARE_API_KEY: "legacy-key",
				CLOUDFLARE_EMAIL: "legacy@example.test",
			}),
		/Legacy Cloudflare authentication is forbidden/u,
	);
});

test("preflight rejects a disabled account token", async () => {
	await assert.rejects(
		verifyFixture(cloudflareFixture({ inactiveToken: true })),
		/not active for account/u,
	);
});

test("preflight allows bootstrap when the target Workers and domains do not exist yet", async () => {
	await verifyFixture(cloudflareFixture({ missingResources: true }));
});

test("preflight rejects malformed Worker results during bootstrap", async () => {
	await assert.rejects(
		verifyFixture(cloudflareFixture({ malformedWorkerList: true })),
		/malformed Worker list for docs/u,
	);
	await assert.rejects(
		verifyFixture(cloudflareFixture({ malformedWorkerItem: true })),
		/malformed Worker list for docs/u,
	);
});

test("preflight rejects malformed custom-domain items during bootstrap", async () => {
	await assert.rejects(
		verifyFixture(cloudflareFixture({ malformedDomainItem: true })),
		/malformed custom-domain list for docs/u,
	);
});

test("post-deploy resource smoke requires all Workers and exact domain mappings", async () => {
	await assert.rejects(
		verifyFixture(cloudflareFixture({ missingResources: true }), true),
		/does not contain Worker lemn-ui-docs/u,
	);
});

test("preflight defers an existing Portal hostname handoff to transactional rollout", async () => {
	await verifyFixture(
		cloudflareFixture({ conflictingHostname: "schemas.ui.le-mn.com" }),
	);
	await verifyFixture(
		cloudflareFixture({ conflictingHostname: "portal.ui.le-mn.com" }),
	);
	await assert.rejects(
		verifyFixture(
			cloudflareFixture({ conflictingHostname: "schemas.ui.le-mn.com" }),
			true,
		),
		/already mapped to another Worker/u,
	);
});

test("preflight rejects Docs conflicts and duplicate hostname mappings", async () => {
	await assert.rejects(
		verifyFixture(cloudflareFixture({ conflictingHostname: "ui.le-mn.com" })),
		/already mapped to another Worker/u,
	);
	await assert.rejects(
		verifyFixture(
			cloudflareFixture({ duplicateHostname: "schemas.ui.le-mn.com" }),
		),
		/duplicate custom-domain mappings/u,
	);
});

test("preflight fails closed when the token cannot read the le-mn.com zone", async () => {
	await assert.rejects(
		verifyFixture(cloudflareFixture({ missingZone: true })),
		/cannot read the le-mn\.com zone/u,
	);
});

test("preflight redacts the API token from provider errors", async () => {
	await assert.rejects(
		verifyFixture(cloudflareFixture({ reject: true })),
		(error: unknown) => {
			assert.ok(error instanceof Error);
			assert.doesNotMatch(error.message, new RegExp(apiToken, "u"));
			assert.match(error.message, /\[REDACTED\]/u);
			assert.match(error.message, /PRODUCTION_CLOUDFLARE_API_TOKEN/u);
			assert.match(error.message, /Workers Scripts: Edit/u);
			assert.match(error.message, /Zone: Read/u);
			assert.match(error.message, /Workers Routes: Edit/u);
			return true;
		},
	);
});
