import assert from "node:assert/strict";
import test from "node:test";
import {
	assertBuildIdentity,
	assertPackageBuildIdentity,
	smokePortalServiceAccess,
	smokeProductionDeployment,
} from "../../scripts/release/deployment-smoke.ts";

const expected = {
	version: "0.1.2",
	gitSha: "release-commit-sha",
	buildTime: "2026-07-18T00:00:00Z",
};
const access = {
	clientId: "ui-portal-release.access",
	clientSecret: "ui-portal-release-secret",
};
const candidateVersionId = "b2642364-a615-4287-a8b7-6134289e2746";
const accessLogin =
	"https://lemn-dev.cloudflareaccess.com/cdn-cgi/access/login";

test("build identity rejects stale release fields and wrong packages", () => {
	for (const [payload, pattern] of [
		[{ ...expected, version: "0.1.1" }, /stale version/u],
		[{ ...expected, gitSha: "other" }, /stale gitSha/u],
		[{ ...expected, buildTime: "2026-07-17T00:00:00Z" }, /stale buildTime/u],
	] as const) {
		assert.throws(
			() => assertBuildIdentity(payload, expected, "release"),
			pattern,
		);
	}
	assert.throws(
		() =>
			assertPackageBuildIdentity(
				{ ...expected, package: "@invalid/ui" },
				expected,
				"docs release",
			),
		/wrong package/u,
	);
});

function fixture(
	options: { staleDeepIdentity?: boolean; exposeSecret?: boolean } = {},
) {
	const requests: Array<{
		url: string;
		clientId: string | null;
		clientSecret: string | null;
		versionOverride: string | null;
		redirect: RequestRedirect | undefined;
	}> = [];
	const fetchImplementation: typeof fetch = async (input, init) => {
		const url = String(input);
		const headers = new Headers(init?.headers);
		requests.push({
			url,
			clientId: headers.get("cf-access-client-id"),
			clientSecret: headers.get("cf-access-client-secret"),
			versionOverride: headers.get("cloudflare-workers-version-overrides"),
			redirect: init?.redirect,
		});

		if (url === "https://ui.le-mn.com/") {
			return new Response("<title>UI</title>");
		}
		if (url === "https://ui.le-mn.com/release.json") {
			return Response.json({ package: "@lemn-ltd/ui", ...expected });
		}
		if (url === "https://portal.ui.le-mn.com/health") {
			return Response.json({ ok: true, service: "ui-portal" });
		}
		if (url === "https://portal.ui.le-mn.com/") {
			return new Response(
				'<div id="root"></div><script src="/assets/app.js"></script>',
			);
		}
		if (url === "https://portal.ui.le-mn.com/assets/app.js") {
			return new Response("export {};\n");
		}
		if (url === "https://portal.ui.le-mn.com/catalog.json") {
			return Response.json({
				package: "@lemn-ltd/ui",
				version: expected.version,
				components: [{ slug: "button" }],
			});
		}
		if (url === "https://portal.ui.le-mn.com/provider-registry.json") {
			return Response.json({
				revision: "registry-revision",
				capabilities: [{ id: "button" }],
			});
		}
		if (url === "https://portal.ui.le-mn.com/blocks.json") {
			return Response.json({ blocks: [{ slug: "metric-card" }] });
		}
		if (url === "https://schemas.ui.le-mn.com/branding/v1.json") {
			return Response.json(
				{ $id: "https://schemas.ui.le-mn.com/branding/v1.json" },
				{
					headers: {
						"content-type": "application/schema+json",
						"access-control-allow-origin": "*",
						"cache-control": "public, max-age=31536000, immutable",
					},
				},
			);
		}
		if (
			url === "https://portal.ui.le-mn.com/llms.txt" ||
			url === "https://portal.ui.le-mn.com/llms-full.txt"
		) {
			return new Response("Lemn UI Component Catalog");
		}
		if (
			url === "https://portal.ui.le-mn.com/admin" ||
			url ===
				"https://portal.ui.le-mn.com/admin-assets/access-boundary-probe.js"
		) {
			return new Response(null, {
				status: 302,
				headers: { location: accessLogin },
			});
		}
		if (url === "https://portal.ui.le-mn.com/api/admin/session") {
			if (
				headers.get("cf-access-client-id") === access.clientId &&
				headers.get("cf-access-client-secret") === access.clientSecret
			) {
				return Response.json(
					{
						code: "service-health-only",
						status: 403,
						title: "Service capability denied",
					},
					{ status: 403 },
				);
			}
			return new Response(null, {
				status: 302,
				headers: { location: accessLogin },
			});
		}
		if (url === "https://portal.ui.le-mn.com/health/deep") {
			if (
				headers.get("cf-access-client-id") !== access.clientId ||
				headers.get("cf-access-client-secret") !== access.clientSecret
			) {
				return new Response(null, {
					status: 302,
					headers: { location: accessLogin },
				});
			}
			return Response.json({
				ok: true,
				service: "ui-portal",
				environment: "production",
				build: {
					version: options.staleDeepIdentity ? "0.1.1" : expected.version,
					gitSha: expected.gitSha,
					time: expected.buildTime,
				},
				validation: { ready: true },
				...(options.exposeSecret ? { leaked: access.clientSecret } : {}),
			});
		}
		throw new Error(`Unexpected smoke fixture request: ${url}`);
	};
	return { fetchImplementation, requests };
}

test("production smoke verifies public Portal, immutable schema, Access boundaries, and service health", async () => {
	const { fetchImplementation, requests } = fixture();
	await smokeProductionDeployment({
		expected,
		access,
		fetchImplementation,
		portalVersionId: candidateVersionId,
		retryOptions: { attempts: 1, delayMs: 0 },
	});

	const portalRequests = requests.filter(({ url }) =>
		url.startsWith("https://portal.ui.le-mn.com"),
	);
	assert.ok(portalRequests.length > 0);
	assert.deepEqual(
		new Set(portalRequests.map(({ versionOverride }) => versionOverride)),
		new Set([`lemn-ui-portal="${candidateVersionId}"`]),
	);
	const serviceRequests = requests.filter(({ url }) =>
		url.endsWith("/health/deep"),
	);
	assert.deepEqual(
		serviceRequests.map(({ clientId, clientSecret, redirect }) => ({
			clientId,
			clientSecret,
			redirect,
		})),
		[
			{ clientId: null, clientSecret: null, redirect: "manual" },
			{
				clientId: access.clientId,
				clientSecret: access.clientSecret,
				redirect: "manual",
			},
		],
	);
	const anonymousAdminRequests = requests.filter(
		({ url, clientId }) => url.includes("/admin") && clientId === null,
	);
	assert.equal(anonymousAdminRequests.length, 3);
	for (const request of anonymousAdminRequests) {
		assert.equal(request.clientSecret, null);
		assert.equal(request.redirect, "manual");
	}
	const serviceAdminRequests = requests.filter(
		({ url, clientId }) =>
			url.endsWith("/api/admin/session") && clientId === access.clientId,
	);
	assert.deepEqual(serviceAdminRequests, [
		{
			url: "https://portal.ui.le-mn.com/api/admin/session",
			clientId: access.clientId,
			clientSecret: access.clientSecret,
			versionOverride: `lemn-ui-portal="${candidateVersionId}"`,
			redirect: "manual",
		},
	]);
});

test("service smoke fails closed for stale identity and credential disclosure", async () => {
	await assert.rejects(
		smokePortalServiceAccess({
			credentials: access,
			expected,
			fetchImplementation: fixture({ staleDeepIdentity: true })
				.fetchImplementation,
			retryOptions: { attempts: 1, delayMs: 0 },
		}),
		/stale version/u,
	);
	await assert.rejects(
		smokePortalServiceAccess({
			credentials: access,
			expected,
			fetchImplementation: fixture({ exposeSecret: true }).fetchImplementation,
			retryOptions: { attempts: 1, delayMs: 0 },
		}),
		/exposed an Access credential/u,
	);
});

test("service Access credentials are required and must be distinct", async () => {
	for (const credentials of [
		{ clientId: "", clientSecret: "secret" },
		{ clientId: "same", clientSecret: "same" },
	]) {
		await assert.rejects(
			smokePortalServiceAccess({
				credentials,
				fetchImplementation: fixture().fetchImplementation,
				retryOptions: { attempts: 1, delayMs: 0 },
			}),
			/(required|distinct)/u,
		);
	}
});
