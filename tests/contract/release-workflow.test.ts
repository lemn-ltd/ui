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
const rootPackage = JSON.parse(
	await readFile(resolve(root, "package.json"), "utf8"),
) as UnknownRecord;
const contributing = await readFile(resolve(root, "CONTRIBUTING.md"), "utf8");
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
	assert.equal(preflight.run, "pnpm release:preflight");
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

test("package publication entrypoints run one Cloudflare preflight before internal publish", () => {
	const scripts = record(rootPackage.scripts, "root package scripts");
	assert.equal(
		scripts["release:preflight"],
		"pnpm validate:release-preconditions && pnpm preflight:cloudflare:release",
	);
	assert.equal(
		scripts["publish:ui"],
		"pnpm release:preflight && pnpm publish:ui:internal",
	);
	assert.equal(
		scripts.release,
		"pnpm release:preflight && pnpm build && pnpm publish:ui:internal",
	);
	assert.equal(
		scripts["publish:ui:internal"],
		"pnpm --filter @lemn-ltd/ui publish --access restricted --no-git-checks",
	);
	assert.equal(
		step("Publish package if needed").run,
		"pnpm publish:ui:internal",
	);
});

test("direct main pushes re-run the fail-closed changeset and version guard", () => {
	const guard = step("Guard main package version");
	const env = record(guard.env, "main version guard env");
	assert.equal(
		env.GITHUB_REPOSITORY_OWNER,
		expression("github.repository_owner"),
	);
	assert.equal(env.GITHUB_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(env.RELEASE_BASE_SHA, expression("github.event.before"));
	assert.match(String(guard.run), /git diff --quiet/u);
	assert.match(String(guard.run), /packages\/ui/u);
	assert.match(String(guard.run), /check-unpublished-package-version\.ts/u);
	assert.match(String(guard.run), /changeset status/u);
	assert.ok(
		stepIndex("Guard main package version") <
			stepIndex("Preflight Cloudflare release access"),
	);
	assert.ok(
		stepIndex("Guard main package version") <
			stepIndex("Detect pending changesets"),
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
	const changesetGuardEnv = record(changesetGuard.env, "changeset guard env");
	assert.equal(
		changesetGuardEnv.GITHUB_REPOSITORY_OWNER,
		expression("github.repository_owner"),
	);
	assert.equal(
		changesetGuardEnv.GITHUB_TOKEN,
		expression("secrets.GITHUB_TOKEN"),
	);
	assert.match(
		String(changesetGuard.run),
		/check-unpublished-package-version\.ts/u,
	);
	assert.doesNotMatch(String(changesetGuard.run), /npm view|grep.*E404/u);
	assert.doesNotMatch(workflowSource, /npm view|E404/u);
	const publicationCheck = step("Check package publication status");
	const publicationCheckEnv = record(
		publicationCheck.env,
		"publication status env",
	);
	assert.equal(publicationCheck.id, "package-version");
	assert.equal(
		publicationCheckEnv.GITHUB_TOKEN,
		expression("secrets.GITHUB_TOKEN"),
	);
	assert.equal(
		step("Publish package if needed").if,
		"steps.package-version.outputs.published == 'false'",
	);
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
	assert.equal(
		docsEnv.PUBLIC_BUILD_TIME,
		expression("steps.release.outputs.time"),
	);
	assert.match(
		String(step("Deploy showcase").run),
		/BUILD_TIME:\$\{\{ steps\.release\.outputs\.time \}\}/u,
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
	assert.equal(
		smokeEnv.EXPECTED_RELEASE_TIME,
		expression("steps.release.outputs.time"),
	);
	assert.match(String(step("Summary").run), /steps\.release\.outputs\.sha/u);
	assert.match(String(step("Summary").run), /steps\.release\.outputs\.time/u);
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

test("CI and release smoke the exact local showcase asset deployment before publish", () => {
	const validationJob = record(jobs.validate, "validate job");
	const validationSteps = validationJob.steps as UnknownRecord[];
	const localSmoke = validationSteps.find(
		(candidate) => candidate.name === "Smoke showcase deployment locally",
	);
	assert.ok(localSmoke);
	assert.equal(localSmoke.run, "pnpm smoke:showcase:local");
	assert.ok(
		validationSteps.indexOf(localSmoke) >
			validationSteps.findIndex((candidate) => candidate.name === "Build"),
	);

	const releaseSmoke = step("Build and smoke showcase deployment locally");
	assert.equal(releaseSmoke.run, "pnpm smoke:showcase:local");
	assert.ok(
		stepIndex("Build and smoke showcase deployment locally") <
			stepIndex("Publish package if needed"),
	);
});

test("contributor release guidance documents fail-closed behavior", () => {
	assert.match(
		contributing,
		/A scope, owner,\s+authentication, version, or Cloudflare mismatch fails closed/u,
	);
	assert.doesNotMatch(contributing, /records a warning and\s+continues/u);
});
