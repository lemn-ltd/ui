import assert from "node:assert/strict";
import test from "node:test";
import {
	assertBuildIdentity,
	assertPackageBuildIdentity,
	smokeProductionDeployment,
	smokeShowcaseAdminAccess,
} from "../../scripts/release/deployment-smoke.ts";

const expected = {
	version: "0.1.2",
	gitSha: "release-commit-sha",
	buildTime: "2026-07-14T00:00:00Z",
};
const statusToken = "deployment-smoke-status-token";
const showcaseAdminAccess = {
	clientId: "deployment-smoke.access",
	clientSecret: "deployment-smoke-access-secret",
};
const legacyUiPackageName = `@${["app", "ranks"].join("")}/ui`;

test("build identity contract rejects stale versions and stale commits", () => {
	assert.throws(
		() =>
			assertBuildIdentity(
				{ version: "0.1.1", gitSha: expected.gitSha },
				expected,
				"health",
			),
		/stale version/u,
	);
	assert.throws(
		() =>
			assertBuildIdentity(
				{ version: expected.version, gitSha: "trigger-sha" },
				expected,
				"health",
			),
		/stale gitSha/u,
	);
	assert.throws(
		() =>
			assertBuildIdentity(
				{ ...expected, buildTime: "2026-07-13T23:59:59Z" },
				expected,
				"health",
			),
		/stale buildTime/u,
	);
});

test("release identity requires the canonical package without imposing it on health", () => {
	assert.doesNotThrow(() =>
		assertBuildIdentity({ ok: true, ...expected }, expected, "showcase health"),
	);
	assert.throws(
		() =>
			assertPackageBuildIdentity(
				{ package: legacyUiPackageName, ...expected },
				expected,
				"docs release.json",
			),
		/wrong package/u,
	);
});

test("production smoke compares exact docs and showcase build identities", async () => {
	const candidateVersionId = "b2642364-a615-4287-a8b7-6134289e2746";
	const showcaseOverrides: Array<string | null> = [];
	const protectedRequests: Array<{
		authorization: string | null;
		url: string;
	}> = [];
	const adminRequests: Array<{
		clientId: string | null;
		clientSecret: string | null;
		redirect: RequestRedirect | undefined;
	}> = [];
	const fetchImplementation: typeof fetch = async (input, init) => {
		const url = String(input);
		const headers = new Headers(init?.headers);
		if (url.startsWith("https://showcase.ui.le-mn.com")) {
			showcaseOverrides.push(
				headers.get("cloudflare-workers-version-overrides"),
			);
		}
		if (url === "https://ui.le-mn.com/")
			return new Response("<title>Overview | UI</title>");
		if (url === "https://ui.le-mn.com/release.json") {
			return Response.json({ package: "@lemn-ltd/ui", ...expected });
		}
		if (url === "https://showcase.ui.le-mn.com/health") {
			return Response.json({ ok: true, ...expected });
		}
		if (url === "https://showcase.ui.le-mn.com/health/ready") {
			return Response.json({ ok: true, ...expected });
		}
		if (url === "https://showcase.ui.le-mn.com/") {
			return new Response(
				'<div id="root"></div><script src="/assets/app.js"></script>',
			);
		}
		if (url === "https://showcase.ui.le-mn.com/assets/app.js") {
			return new Response("export {};\n");
		}
		if (url === "https://showcase.ui.le-mn.com/catalog.json") {
			return Response.json({
				package: "@lemn-ltd/ui",
				version: expected.version,
				components: [{}],
			});
		}
		if (url === "https://showcase.ui.le-mn.com/provider-registry.json") {
			return Response.json({
				revision: "registry-revision",
				capabilities: [{}],
			});
		}
		if (url === "https://showcase.ui.le-mn.com/blocks.json") {
			return Response.json({ blocks: [{}] });
		}
		if (url === "https://schemas.ui.le-mn.com/brand-project/v2.json") {
			return new Response(
				JSON.stringify({
					$id: "https://schemas.ui.le-mn.com/brand-project/v2.json",
				}),
				{ headers: { "content-type": "application/schema+json" } },
			);
		}
		if (url === "https://admin.showcase.ui.le-mn.com/health") {
			adminRequests.push({
				clientId: headers.get("cf-access-client-id"),
				clientSecret: headers.get("cf-access-client-secret"),
				redirect: init?.redirect,
			});
			if (
				headers.get("cf-access-client-id") === showcaseAdminAccess.clientId &&
				headers.get("cf-access-client-secret") ===
					showcaseAdminAccess.clientSecret
			) {
				return Response.json({
					ok: true,
					service: "ui-showcase-admin",
					environment: "production",
					simulatorConfigured: true,
				});
			}
			return new Response(null, {
				status: 302,
				headers: {
					location:
						"https://lemn-dev.cloudflareaccess.com/cdn-cgi/access/login",
				},
			});
		}
		if (url === "https://showcase.ui.le-mn.com/llms.txt")
			return new Response("@lemn-ltd/ui");
		if (url === "https://showcase.ui.le-mn.com/llms-full.txt") {
			return new Response("Lemn UI Component Catalog");
		}
		if (
			url === "https://showcase.ui.le-mn.com/_status" ||
			url === "https://showcase.ui.le-mn.com/_status.json" ||
			url === "https://showcase.ui.le-mn.com/health/deep"
		) {
			const authorization = headers.get("authorization");
			protectedRequests.push({ authorization, url });
			if (authorization !== `Bearer ${statusToken}`) {
				return Response.json({ error: "unauthorized" }, { status: 401 });
			}
			return Response.json({
				ok: true,
				build: {
					version: expected.version,
					gitSha: expected.gitSha,
					time: expected.buildTime,
				},
				validation: { ready: true },
			});
		}
		throw new Error(`Unexpected smoke fixture request: ${url}`);
	};

	await smokeProductionDeployment({
		expected,
		statusToken,
		showcaseAdminAccess,
		fetchImplementation,
		showcaseVersionId: candidateVersionId,
	});
	assert.deepEqual(adminRequests, [
		{ clientId: null, clientSecret: null, redirect: "manual" },
		{
			clientId: showcaseAdminAccess.clientId,
			clientSecret: showcaseAdminAccess.clientSecret,
			redirect: "manual",
		},
	]);
	assert.ok(showcaseOverrides.length > 0);
	assert.deepEqual(
		new Set(showcaseOverrides),
		new Set([`lemn-ui-showcase="${candidateVersionId}"`]),
	);
	assert.equal(protectedRequests.length, 6);
	for (const path of ["/_status", "/_status.json", "/health/deep"]) {
		const requests = protectedRequests.filter(({ url }) => url.endsWith(path));
		assert.deepEqual(
			requests.map(({ authorization }) => authorization),
			[null, `Bearer ${statusToken}`],
		);
	}
});

test("production smoke fails when the new protected status token is rejected", async () => {
	const fetchImplementation: typeof fetch = async (input, init) => {
		const url = String(input);
		if (url === "https://ui.le-mn.com/")
			return new Response("<title>Overview | UI</title>");
		if (url === "https://ui.le-mn.com/release.json")
			return Response.json({ package: "@lemn-ltd/ui", ...expected });
		if (url === "https://showcase.ui.le-mn.com/health")
			return Response.json({ ok: true, ...expected });
		if (url === "https://showcase.ui.le-mn.com/health/ready")
			return Response.json({ ok: true, ...expected });
		if (url === "https://showcase.ui.le-mn.com/")
			return new Response(
				'<div id="root"></div><script src="/assets/app.js"></script>',
			);
		if (url === "https://showcase.ui.le-mn.com/assets/app.js")
			return new Response("export {};\n");
		if (url === "https://showcase.ui.le-mn.com/catalog.json")
			return Response.json({
				package: "@lemn-ltd/ui",
				version: expected.version,
				components: [{}],
			});
		if (url === "https://showcase.ui.le-mn.com/provider-registry.json")
			return Response.json({
				revision: "registry-revision",
				capabilities: [{}],
			});
		if (url === "https://showcase.ui.le-mn.com/blocks.json")
			return Response.json({ blocks: [{}] });
		if (url === "https://schemas.ui.le-mn.com/brand-project/v2.json")
			return new Response(
				JSON.stringify({
					$id: "https://schemas.ui.le-mn.com/brand-project/v2.json",
				}),
				{ headers: { "content-type": "application/schema+json" } },
			);
		if (url === "https://admin.showcase.ui.le-mn.com/health") {
			const headers = new Headers(init?.headers);
			if (
				headers.get("cf-access-client-id") === showcaseAdminAccess.clientId &&
				headers.get("cf-access-client-secret") ===
					showcaseAdminAccess.clientSecret
			) {
				return Response.json({
					ok: true,
					service: "ui-showcase-admin",
					environment: "production",
					simulatorConfigured: true,
				});
			}
			return new Response(null, {
				status: 302,
				headers: {
					location:
						"https://lemn-dev.cloudflareaccess.com/cdn-cgi/access/login",
				},
			});
		}
		if (url === "https://showcase.ui.le-mn.com/llms.txt")
			return new Response("@lemn-ltd/ui");
		if (url === "https://showcase.ui.le-mn.com/llms-full.txt")
			return new Response("Lemn UI Component Catalog");
		if (new Headers(init?.headers).has("authorization"))
			return Response.json({ error: "unauthorized" }, { status: 401 });
		return Response.json({ error: "unauthorized" }, { status: 401 });
	};

	await assert.rejects(
		() =>
			smokeProductionDeployment({
				expected,
				statusToken,
				showcaseAdminAccess,
				fetchImplementation,
				retryOptions: { attempts: 1, delayMs: 0 },
			}),
		/with a bearer token returned HTTP 401/u,
	);
});

test("Showcase Admin smoke requires the exact Access tenant", async () => {
	const fetchImplementation: typeof fetch = async (_input, init) => {
		const headers = new Headers(init?.headers);
		if (headers.has("cf-access-client-id")) {
			return Response.json({
				ok: true,
				service: "ui-showcase-admin",
				environment: "production",
				simulatorConfigured: true,
			});
		}
		return new Response(null, {
			status: 302,
			headers: {
				location:
					"https://another-team.cloudflareaccess.com/cdn-cgi/access/login",
			},
		});
	};

	await assert.rejects(
		() =>
			smokeShowcaseAdminAccess({
				credentials: showcaseAdminAccess,
				fetchImplementation,
				retryOptions: { attempts: 1, delayMs: 0 },
			}),
		/exact lemn-dev\.cloudflareaccess\.com tenant login/u,
	);
});

test("Showcase Admin authenticated smoke proves production and simulator configuration", async () => {
	const fetchImplementation: typeof fetch = async (_input, init) => {
		const headers = new Headers(init?.headers);
		if (headers.has("cf-access-client-id")) {
			return Response.json({
				ok: true,
				service: "ui-showcase-admin",
				environment: "staging",
				simulatorConfigured: false,
			});
		}
		return new Response(null, {
			status: 302,
			headers: {
				location: "https://lemn-dev.cloudflareaccess.com/cdn-cgi/access/login",
			},
		});
	};

	await assert.rejects(
		() =>
			smokeShowcaseAdminAccess({
				credentials: showcaseAdminAccess,
				fetchImplementation,
				retryOptions: { attempts: 1, delayMs: 0 },
			}),
		/not running the production environment/u,
	);
});
