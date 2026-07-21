import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import playwrightConfig from "../../apps/ui-portal/playwright.config.ts";
import {
	COMPONENT_ACCESSIBILITY_CASE_COUNT,
	COMPONENT_ACCESSIBILITY_THEMES,
	COMPONENT_CATALOG_ROUTE_COUNT,
	catalogComponentRoutes,
	componentAccessibilityCases,
	componentAccessibilityTestTitle,
} from "../../apps/ui-portal/tests/helpers/component-catalog.ts";

type UnknownRecord = Record<string, unknown>;

interface ListedSpec {
	readonly file: string;
	readonly id: string;
	readonly timeout: number;
	readonly title: string;
}

const root = resolve(import.meta.dirname, "../..");
const portalRoot = resolve(root, "apps/ui-portal");
const playwrightCli = resolve(root, "node_modules/@playwright/test/cli.js");
const accessibilityShardTotal = 4;
const componentTitlePrefix = "component accessibility: ";
const brandStudioAccessibilityTitles = [
	"has no serious accessibility violations and remains operable in desktop dark",
	"has no serious accessibility violations and remains operable in desktop light",
	"has no serious accessibility violations and remains operable in mobile dark",
	"has no serious accessibility violations and remains operable in mobile light",
] as const;

function array(value: unknown, description: string): unknown[] {
	assert.ok(Array.isArray(value), `${description} must be an array`);
	return value;
}

function isRecord(value: unknown): value is UnknownRecord {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function record(value: unknown, description: string): UnknownRecord {
	assert.ok(isRecord(value), `${description} must be an object`);
	return value;
}

function string(value: unknown, description: string): string {
	assert.equal(typeof value, "string", `${description} must be a string`);
	return value;
}

function number(value: unknown, description: string): number {
	assert.equal(typeof value, "number", `${description} must be a number`);
	return value;
}

function specsFromSuite(value: unknown, description: string): ListedSpec[] {
	const suite = record(value, description);
	const specs =
		suite.specs === undefined ? [] : array(suite.specs, `${description} specs`);
	const childSuites =
		suite.suites === undefined
			? []
			: array(suite.suites, `${description} child suites`);
	const listed = specs.map((specValue, index) => {
		const spec = record(specValue, `${description} spec ${index}`);
		const tests = array(spec.tests, `${description} spec ${index} tests`).map(
			(testValue, testIndex) =>
				record(testValue, `${description} spec ${index} test ${testIndex}`),
		);
		assert.equal(
			tests.length,
			1,
			`${description} spec ${index} must have one test`,
		);
		const listedTest = tests.at(0);
		assert.ok(listedTest);
		return {
			file: string(spec.file, `${description} spec ${index} file`),
			id: string(spec.id, `${description} spec ${index} id`),
			timeout: number(
				listedTest.timeout,
				`${description} spec ${index} timeout`,
			),
			title: string(spec.title, `${description} spec ${index} title`),
		};
	});

	return [
		...listed,
		...childSuites.flatMap((childSuite, index) =>
			specsFromSuite(childSuite, `${description} child suite ${index}`),
		),
	];
}

function listAccessibilitySpecs(shard?: number): ListedSpec[] {
	const args = [
		playwrightCli,
		"test",
		"--project=accessibility",
		"--list",
		"--reporter=json",
	];
	if (shard !== undefined) {
		args.push(`--shard=${shard}/${accessibilityShardTotal}`);
	}
	const report = record(
		JSON.parse(
			execFileSync(process.execPath, args, {
				cwd: portalRoot,
				encoding: "utf8",
				env: { ...process.env, CI: "true", NO_COLOR: "1" },
				maxBuffer: 16 * 1024 * 1024,
			}),
		),
		"Playwright list report",
	);
	return array(report.suites, "Playwright list suites").flatMap(
		(suite, index) => specsFromSuite(suite, `Playwright suite ${index}`),
	);
}

async function componentSlugsFromCorePageFiles(): Promise<string[]> {
	const entries = await readdir(
		resolve(portalRoot, "src/client/pages/core/components"),
		{ withFileTypes: true },
	);
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".page.tsx"))
		.map((entry) => entry.name.slice(0, -".page.tsx".length))
		.sort();
}

test("component accessibility cases exactly cover every catalog route and theme", async () => {
	const catalogRoutes = catalogComponentRoutes
		.map((entry) => entry.route)
		.sort();
	assert.equal(catalogRoutes.length, COMPONENT_CATALOG_ROUTE_COUNT);
	assert.equal(new Set(catalogRoutes).size, COMPONENT_CATALOG_ROUTE_COUNT);
	assert.ok(
		catalogRoutes.every((route) =>
			/^\/(?:components|visualizations)\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(route),
		),
	);
	assert.deepEqual(
		await componentSlugsFromCorePageFiles(),
		catalogComponentRoutes.map((entry) => entry.slug).sort(),
	);
	assert.equal(
		componentAccessibilityCases.length,
		COMPONENT_ACCESSIBILITY_CASE_COUNT,
	);

	const expectedCaseTitles = catalogRoutes
		.flatMap((route) =>
			COMPONENT_ACCESSIBILITY_THEMES.map((theme) =>
				componentAccessibilityTestTitle({ route, theme }),
			),
		)
		.sort();
	const actualCaseTitles = componentAccessibilityCases
		.map(componentAccessibilityTestTitle)
		.sort();
	assert.equal(
		new Set(actualCaseTitles).size,
		COMPONENT_ACCESSIBILITY_CASE_COUNT,
	);
	assert.deepEqual(actualCaseTitles, expectedCaseTitles);
});

test("native accessibility shards are complete, disjoint, bounded, and fail closed", () => {
	assert.equal(playwrightConfig.fullyParallel, false);
	assert.equal(playwrightConfig.workers, 1);
	const accessibilityProject = array(
		playwrightConfig.projects,
		"Playwright projects",
	)
		.map((project, index) => record(project, `Playwright project ${index}`))
		.find((project) => project.name === "accessibility");
	assert.ok(accessibilityProject);
	assert.equal(accessibilityProject.fullyParallel, true);

	const allSpecs = listAccessibilitySpecs();
	assert.equal(allSpecs.length, COMPONENT_ACCESSIBILITY_CASE_COUNT + 8);
	assert.equal(new Set(allSpecs.map((spec) => spec.id)).size, allSpecs.length);
	assert.ok(
		allSpecs.every(
			(spec) =>
				spec.file === "accessibility.e2e.ts" ||
				spec.file === "brand-studio-accessibility.e2e.ts",
		),
	);

	const expectedComponentTitles = componentAccessibilityCases
		.map(componentAccessibilityTestTitle)
		.sort();
	const componentSpecs = allSpecs.filter((spec) =>
		spec.title.startsWith(componentTitlePrefix),
	);
	assert.equal(componentSpecs.length, COMPONENT_ACCESSIBILITY_CASE_COUNT);
	assert.deepEqual(
		componentSpecs.map((spec) => spec.title).sort(),
		expectedComponentTitles,
	);
	assert.ok(componentSpecs.every((spec) => spec.timeout === 60_000));

	const nonComponentSpec = allSpecs.find(
		(spec) =>
			spec.title ===
			"no critical accessibility violations across non-component registry pages",
	);
	assert.ok(nonComponentSpec);
	assert.equal(nonComponentSpec.timeout, 180_000);
	assert.deepEqual(
		allSpecs
			.filter((spec) => spec.file === "brand-studio-accessibility.e2e.ts")
			.map((spec) => spec.title)
			.sort(),
		brandStudioAccessibilityTitles,
	);
	assert.deepEqual(
		allSpecs
			.filter((spec) => spec.file === "accessibility.e2e.ts")
			.filter((spec) => !spec.title.startsWith(componentTitlePrefix))
			.map((spec) => spec.title)
			.sort(),
		[
			"accessibility contexts do not inherit route or theme state",
			"component accessibility inventory matches the runtime catalog",
			"no critical accessibility violations across non-component registry pages",
			"the homepage dialog preserves accessible modal behavior",
		],
	);

	const assignments = new Map<string, number[]>();
	const shardSizes: number[] = [];
	for (let shard = 1; shard <= accessibilityShardTotal; shard += 1) {
		const shardSpecs = listAccessibilitySpecs(shard);
		shardSizes.push(shardSpecs.length);
		for (const spec of shardSpecs) {
			const assignedShards = assignments.get(spec.id) ?? [];
			assignedShards.push(shard);
			assignments.set(spec.id, assignedShards);
		}
	}
	const baseShardSize = Math.floor(allSpecs.length / accessibilityShardTotal);
	const largerShardCount = allSpecs.length % accessibilityShardTotal;
	assert.deepEqual(
		shardSizes,
		Array.from(
			{ length: accessibilityShardTotal },
			(_, index) => baseShardSize + (index < largerShardCount ? 1 : 0),
		),
	);
	assert.deepEqual(
		[...assignments.keys()].sort(),
		allSpecs.map((spec) => spec.id).sort(),
	);
	for (const spec of allSpecs) {
		assert.equal(
			assignments.get(spec.id)?.length,
			1,
			`${spec.title} must be assigned to exactly one shard`,
		);
	}

	const invalidShard = spawnSync(
		process.execPath,
		[
			playwrightCli,
			"test",
			"--project=accessibility",
			"--list",
			`--shard=0/${accessibilityShardTotal}`,
		],
		{
			cwd: portalRoot,
			encoding: "utf8",
			env: { ...process.env, CI: "true", NO_COLOR: "1" },
		},
	);
	assert.notEqual(invalidShard.status, 0);
	assert.match(
		`${invalidShard.stdout}${invalidShard.stderr}`,
		/current must be a positive number, not greater than shard total/u,
	);
});
