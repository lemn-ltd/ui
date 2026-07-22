import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { parse } from "yaml";
import playwrightConfig, {
	portalE2eWorkerCount,
} from "../../playwright.config.ts";
import {
	COMPONENT_ACCESSIBILITY_CASE_COUNT,
	COMPONENT_CATALOG_ROUTE_COUNT,
} from "../helpers/component-catalog.ts";

const PORTAL_ROOT = resolve(import.meta.dirname, "../..");
const REPOSITORY_ROOT = resolve(PORTAL_ROOT, "../..");

test("Playwright uses bounded parallel workers locally and in CI", () => {
	assert.equal(portalE2eWorkerCount({}), 4);
	assert.equal(portalE2eWorkerCount({ CI: "true" }), 2);
	assert.equal(portalE2eWorkerCount({ PLAYWRIGHT_WORKERS: "7" }), 7);
	assert.throws(
		() => portalE2eWorkerCount({ PLAYWRIGHT_WORKERS: "0" }),
		/positive integer/u,
	);
	assert.equal(playwrightConfig.fullyParallel, true);
	assert.ok(
		playwrightConfig.webServer && !Array.isArray(playwrightConfig.webServer),
	);
	assert.match(playwrightConfig.webServer.command, /^pnpm exec vite build &&/u);
	assert.doesNotMatch(
		playwrightConfig.webServer.command,
		/test:dist-boundaries|pnpm run build/u,
	);
});

test("route-scale contracts are collected as independently shardable cases", () => {
	const listing = execFileSync(
		resolve(PORTAL_ROOT, "node_modules/.bin/playwright"),
		["test", "--list"],
		{
			cwd: PORTAL_ROOT,
			encoding: "utf8",
			env: { ...process.env, PLAYWRIGHT_WORKERS: "1" },
			maxBuffer: 4 * 1024 * 1024,
		},
	);
	const count = (pattern: RegExp): number =>
		[...listing.matchAll(pattern)].length;

	assert.equal(
		count(/strict route health: \/(?:components|visualizations)\//gu),
		COMPONENT_CATALOG_ROUTE_COUNT,
	);
	assert.equal(
		count(/documentation contract: \/(?:components|visualizations)\//gu),
		COMPONENT_CATALOG_ROUTE_COUNT,
	);
	assert.equal(
		count(/responsive contract: \/(?:components|visualizations)\//gu),
		COMPONENT_CATALOG_ROUTE_COUNT * 6,
	);
	assert.equal(
		count(/component accessibility: \/(?:components|visualizations)\//gu),
		COMPONENT_ACCESSIBILITY_CASE_COUNT,
	);
});

test("CI fans validation and two-worker browser shards out in parallel", () => {
	const workflow = parse(
		readFileSync(
			resolve(REPOSITORY_ROOT, ".github/workflows/ci-cd.yml"),
			"utf8",
		),
	) as {
		jobs: Record<
			string,
			{
				needs?: string | string[];
				steps: readonly { run?: string }[];
				strategy?: { matrix?: { shard?: number[] } };
			}
		>;
	};

	for (const jobName of ["ui-portal-e2e", "ui-portal-accessibility"]) {
		const job = workflow.jobs[jobName];
		assert.ok(job, `${jobName} must exist`);
		assert.equal(job.needs, undefined, `${jobName} must fan out immediately`);
		assert.deepEqual(job.strategy?.matrix?.shard, [1, 2]);
		const commands = job.steps.map((step) => step.run ?? "").join("\n");
		assert.match(commands, /--workers=2/u);
		assert.match(commands, /--shard=\$\{\{ matrix\.shard \}\}\/2/u);
	}
});
