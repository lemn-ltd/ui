import assert from "node:assert/strict";
import test from "node:test";
import {
	type CloudflareReleaseTarget,
	loadCloudflareReleaseTargets,
	verifyCloudflareReleaseAccess,
} from "../../scripts/release/cloudflare-preflight.ts";

const accountId = "71da6f8791d79c8abe7beea6f03d0162";
const apiKey = "contract-global-api-key";
const email = "contract@example.test";

const targets: CloudflareReleaseTarget[] = [
	{
		id: "docs",
		accountId,
		workerName: "lemn-ui-docs",
		hostname: "ui.le-mn.com",
	},
	{
		id: "showcase",
		accountId,
		workerName: "lemn-ui-showcase",
		hostname: "showcase.ui.le-mn.com",
	},
];

function response(result: unknown, status = 200): Response {
	return Response.json({ success: status < 400, result }, { status });
}

function cloudflareFixture(
	options: {
		conflictingDomain?: boolean;
		malformedDomainItem?: boolean;
		malformedWorkerItem?: boolean;
		malformedWorkerList?: boolean;
		missingResources?: boolean;
		missingZone?: boolean;
		readOnly?: boolean;
		reject?: boolean;
	} = {},
) {
	const requests: Array<{ url: string; method: string }> = [];
	const fetchImplementation: typeof fetch = async (input, init) => {
		const url = String(input);
		const headers = new Headers(init?.headers);
		requests.push({ url, method: init?.method ?? "GET" });
		assert.equal(headers.get("X-Auth-Key"), apiKey);
		assert.equal(headers.get("X-Auth-Email"), email);

		if (options.reject) {
			return Response.json(
				{
					success: false,
					errors: [{ code: 9109, message: `Unauthorized ${apiKey}` }],
				},
				{ status: 403 },
			);
		}
		if (url.endsWith("/user")) return response({ email });
		if (url.endsWith("/memberships")) {
			return response([
				{ id: "membership", account: { id: accountId }, status: "accepted" },
			]);
		}
		if (url.endsWith("/memberships/membership")) {
			return response({
				status: "accepted",
				policies: [
					{
						access: "allow",
						permission_groups: [
							{
								name: options.readOnly
									? "Workers Scripts Read"
									: "Workers Scripts Write",
							},
						],
					},
				],
			});
		}
		if (url.endsWith(`/accounts/${accountId}`))
			return response({ id: accountId, name: "Lemn DEV" });
		if (url.includes("/zones?")) {
			return response(
				options.missingZone
					? []
					: [{ id: "zone-id", name: "le-mn.com", account: { id: accountId } }],
			);
		}
		if (url.endsWith(`/accounts/${accountId}/workers/scripts`)) {
			if (options.malformedWorkerList) {
				return response({ success: true, result: [] });
			}
			if (options.malformedWorkerItem) return response([{}]);
			return response(
				options.missingResources
					? [{ id: "lemn-ui-showcase" }]
					: [{ id: "lemn-ui-docs" }, { id: "lemn-ui-showcase" }],
			);
		}
		if (url.includes("/workers/domains?")) {
			const requestUrl = new URL(url);
			if (options.malformedDomainItem) return response([{}]);
			if (options.missingResources) return response([]);
			return response([
				{
					hostname: requestUrl.searchParams.get("hostname"),
					service: options.conflictingDomain
						? "different-worker"
						: requestUrl.searchParams.get("hostname") === "ui.le-mn.com"
							? "lemn-ui-docs"
								: "lemn-ui-showcase",
				},
			]);
		}
		throw new Error(`Unexpected Cloudflare fixture request: ${url}`);
	};
	return { fetchImplementation, requests };
}

test("both Wrangler deploy targets use the confirmed Lemn DEV account", async () => {
	const configuredTargets = await loadCloudflareReleaseTargets();
	assert.deepEqual(configuredTargets, targets);
});

test("preflight verifies Global API Key ownership, write permissions, Workers, and domains without mutation", async () => {
	const fixture = cloudflareFixture();
	await verifyCloudflareReleaseAccess({
		apiKey,
		email,
		targets,
		fetchImplementation: fixture.fetchImplementation,
	});
	assert.ok(fixture.requests.length >= 7);
	assert.ok(fixture.requests.every((request) => request.method === "GET"));
});

test("preflight rejects a read-only Cloudflare membership", async () => {
	const fixture = cloudflareFixture({ readOnly: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
		}),
		/lacks Workers Scripts Write permission/u,
	);
});

test("preflight allows bootstrap when the target Worker and domains do not exist yet", async () => {
	const fixture = cloudflareFixture({ missingResources: true });
	await verifyCloudflareReleaseAccess({
		apiKey,
		email,
		targets,
		fetchImplementation: fixture.fetchImplementation,
	});
});

test("preflight rejects a malformed Worker list during bootstrap", async () => {
	const fixture = cloudflareFixture({ malformedWorkerList: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
			requireResources: false,
		}),
		/malformed Worker list for docs/u,
	);
});

test("preflight rejects malformed Worker items during bootstrap", async () => {
	const fixture = cloudflareFixture({ malformedWorkerItem: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
			requireResources: false,
		}),
		/malformed Worker list for docs/u,
	);
});

test("preflight rejects malformed custom-domain items during bootstrap", async () => {
	const fixture = cloudflareFixture({ malformedDomainItem: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
			requireResources: false,
		}),
		/malformed custom-domain list for docs/u,
	);
});

test("post-deploy resource smoke requires both Workers and exact domain mappings", async () => {
	const fixture = cloudflareFixture({ missingResources: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
			requireResources: true,
		}),
		/does not contain Worker lemn-ui-docs/u,
	);
});

test("preflight rejects a conflicting existing custom-domain mapping", async () => {
	const fixture = cloudflareFixture({ conflictingDomain: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
		}),
		/already mapped to another Worker/u,
	);
});

test("preflight fails closed when Lemn DEV cannot manage the le-mn.com zone", async () => {
	const fixture = cloudflareFixture({ missingZone: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
		}),
			/cannot manage the le-mn\.com zone/u,
	);
});

test("preflight redacts the Global API Key and email from provider errors", async () => {
	const fixture = cloudflareFixture({ reject: true });
	await assert.rejects(
		verifyCloudflareReleaseAccess({
			apiKey,
			email,
			targets,
			fetchImplementation: fixture.fetchImplementation,
		}),
		(error: unknown) => {
			assert.ok(error instanceof Error);
			assert.doesNotMatch(error.message, new RegExp(apiKey, "u"));
			assert.doesNotMatch(error.message, new RegExp(email, "u"));
			assert.match(error.message, /\[REDACTED\]/u);
			return true;
		},
	);
});
