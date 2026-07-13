import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { parse } from "yaml";

type UnknownRecord = Record<string, unknown>;

const root = resolve(import.meta.dirname, "../..");
const workflowSource = await readFile(
	resolve(root, ".github/workflows/ci-cd.yml"),
	"utf8",
);
const workflow = parse(workflowSource) as UnknownRecord;

function record(value: unknown, description: string): UnknownRecord {
	assert.ok(
		value && typeof value === "object" && !Array.isArray(value),
		`${description} must be an object`,
	);
	return value as UnknownRecord;
}

const jobs = record(workflow.jobs, "jobs");
const releaseJob = record(jobs["release-and-deploy"], "release-and-deploy");
const steps = releaseJob.steps as UnknownRecord[];

function step(name: string): UnknownRecord {
	const result = steps.find((candidate) => candidate.name === name);
	assert.ok(result, `Missing workflow step: ${name}`);
	return result;
}

function stepIndex(name: string): number {
	const index = steps.findIndex((candidate) => candidate.name === name);
	assert.notEqual(index, -1, `Missing workflow step: ${name}`);
	return index;
}

function expression(body: string): string {
	return ["$", `{{ ${body} }}`].join("");
}

test("manual production release is guarded to main before the job starts", () => {
	assert.match(String(releaseJob.if), /github\.ref == 'refs\/heads\/main'/u);
	assert.match(
		String(releaseJob.if),
		/github\.event_name == 'workflow_dispatch'/u,
	);
});

test("Global API Key preflight runs before every release mutation and package publish", () => {
	const preflight = step("Preflight Cloudflare release access");
	const env = record(preflight.env, "Cloudflare preflight env");
	assert.equal(
		env.CLOUDFLARE_API_KEY,
		expression("secrets.CLOUDFLARE_API_KEY"),
	);
	assert.equal(env.CLOUDFLARE_EMAIL, expression("secrets.CLOUDFLARE_EMAIL"));
	assert.ok(
		stepIndex("Preflight Cloudflare release access") <
			stepIndex("Detect pending changesets"),
	);
	assert.ok(
		stepIndex("Preflight Cloudflare release access") <
			stepIndex("Version packages from changesets"),
	);
	assert.ok(
		stepIndex("Preflight Cloudflare release access") <
			stepIndex("Push release metadata"),
	);
	assert.ok(
		stepIndex("Preflight Cloudflare release access") <
			stepIndex("Publish package if needed"),
	);
	assert.doesNotMatch(
		workflowSource,
		/secrets\.CLOUDFLARE_API_TOKEN|vars\.CLOUDFLARE_EMAIL/u,
	);
});

test("unpublished current package versions do not receive an accidental second changeset bump", () => {
	const validationJob = record(jobs.validate, "validate job");
	const validationPermissions = record(
		validationJob.permissions,
		"validate permissions",
	);
	assert.equal(validationPermissions.contents, "read");
	assert.equal(validationPermissions.packages, "read");
	const validationSteps = validationJob.steps as UnknownRecord[];
	const changesetGuard = validationSteps.find(
		(candidate) => candidate.name === "Require changesets for package changes",
	);
	assert.ok(changesetGuard);
	assert.match(String(changesetGuard.run), /npm view/u);
	assert.match(String(changesetGuard.run), /E404/u);
	assert.equal(
		step("Version packages from changesets").if,
		"steps.changesets.outputs.has_pending == 'true'",
	);
});

test("deploys, smokes, and summary use the release commit outputs instead of trigger GITHUB_SHA", () => {
	assert.ok(
		stepIndex("Capture release metadata") < stepIndex("Push release metadata"),
	);
	assert.ok(
		stepIndex("Capture release metadata") <
			stepIndex("Publish package if needed"),
	);
	assert.match(
		String(step("Deploy showcase").run),
		/steps\.release\.outputs\.version/u,
	);
	assert.match(
		String(step("Deploy showcase").run),
		/steps\.release\.outputs\.sha/u,
	);

	const docsEnv = record(step("Build docs").env, "Build docs env");
	assert.equal(
		docsEnv.PUBLIC_BUILD_VERSION,
		expression("steps.release.outputs.version"),
	);
	assert.equal(
		docsEnv.PUBLIC_BUILD_GIT_SHA,
		expression("steps.release.outputs.sha"),
	);

	const smokeEnv = record(step("Smoke public endpoints").env, "Smoke env");
	assert.equal(
		smokeEnv.EXPECTED_RELEASE_VERSION,
		expression("steps.release.outputs.version"),
	);
	assert.equal(
		smokeEnv.EXPECTED_RELEASE_GIT_SHA,
		expression("steps.release.outputs.sha"),
	);
	assert.match(String(step("Summary").run), /steps\.release\.outputs\.sha/u);
	assert.doesNotMatch(String(step("Summary").run), /GITHUB_SHA/u);
});

test("all deploy commands receive the Global API Key pair and preflight account output", () => {
	for (const name of [
		"Deploy docs",
		"Deploy showcase",
		"Set showcase runtime secret",
	]) {
		const env = record(step(name).env, `${name} env`);
		assert.equal(
			env.CLOUDFLARE_API_KEY,
			expression("secrets.CLOUDFLARE_API_KEY"),
		);
		assert.equal(env.CLOUDFLARE_EMAIL, expression("secrets.CLOUDFLARE_EMAIL"));
		assert.match(
			String(env.CLOUDFLARE_ACCOUNT_ID),
			/steps\.cloudflare\.outputs\.(?:docs|showcase)_account_id/u,
		);
	}

	const mappingSmoke = step("Smoke Cloudflare deployment mappings");
	const mappingSmokeEnv = record(
		mappingSmoke.env,
		"Cloudflare mapping smoke env",
	);
	assert.equal(
		mappingSmokeEnv.CLOUDFLARE_API_KEY,
		expression("secrets.CLOUDFLARE_API_KEY"),
	);
	assert.equal(
		mappingSmokeEnv.CLOUDFLARE_EMAIL,
		expression("secrets.CLOUDFLARE_EMAIL"),
	);
	assert.ok(
		stepIndex("Set showcase runtime secret") <
			stepIndex("Smoke Cloudflare deployment mappings"),
	);
	assert.ok(
		stepIndex("Smoke Cloudflare deployment mappings") <
			stepIndex("Smoke public endpoints"),
	);
});
