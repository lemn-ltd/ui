import assert from "node:assert/strict";
import test from "node:test";
import {
	assertBuildIdentity,
	assertPackageBuildIdentity,
	smokeProductionDeployment,
} from "../../scripts/release/deployment-smoke.ts";

const expected = {
	version: "0.1.2",
	gitSha: "release-commit-sha",
	buildTime: "2026-07-14T00:00:00Z",
};
const statusToken = "deployment-smoke-status-token";
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
	const protectedRequests: Array<{
		authorization: string | null;
		url: string;
	}> = [];
	const fetchImplementation: typeof fetch = async (input, init) => {
		const url = String(input);
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
			const authorization = new Headers(init?.headers).get("authorization");
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
		fetchImplementation,
	});
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
				fetchImplementation,
				retryOptions: { attempts: 1, delayMs: 0 },
			}),
		/with a bearer token returned HTTP 401/u,
	);
});
