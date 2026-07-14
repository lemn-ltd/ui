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
const legacyUiPackageName = ["@appranks", "ui"].join("/");

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
	const fetchImplementation: typeof fetch = async (input) => {
		const url = String(input);
		if (url === "https://ui.lemn.ai/")
			return new Response("<title>Docs - UI</title>");
		if (url === "https://ui.lemn.ai/release.json") {
			return Response.json({ package: "@lemn-ltd/ui", ...expected });
		}
		if (url === "https://showcase.ui.lemn.ai/health") {
			return Response.json({ ok: true, ...expected });
		}
		if (url === "https://showcase.ui.lemn.ai/health/ready") {
			return Response.json({ ok: true, ...expected });
		}
		if (url === "https://showcase.ui.lemn.ai/") {
			return new Response(
				'<div id="root"></div><script src="/assets/app.js"></script>',
			);
		}
		if (url === "https://showcase.ui.lemn.ai/assets/app.js") {
			return new Response("export {};\n");
		}
		if (url === "https://showcase.ui.lemn.ai/catalog.json") {
			return Response.json({
				package: "@lemn-ltd/ui",
				version: expected.version,
				components: [{}],
			});
		}
		if (url === "https://showcase.ui.lemn.ai/llms.txt")
			return new Response("@lemn-ltd/ui");
		if (url === "https://showcase.ui.lemn.ai/llms-full.txt") {
			return new Response("LEMN UI Component Catalog");
		}
		throw new Error(`Unexpected smoke fixture request: ${url}`);
	};

	await smokeProductionDeployment({ expected, fetchImplementation });
});
