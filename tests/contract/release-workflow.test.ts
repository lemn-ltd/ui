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
const prepareSource = await readFile(
	resolve(root, "scripts/release/prepare-ui-release.ts"),
	"utf8",
);
const publishSource = await readFile(
	resolve(root, "scripts/release/publish-ui-release.ts"),
	"utf8",
);
const rolloutSource = await readFile(
	resolve(root, "scripts/release/showcase-production-rollout.ts"),
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

function productionSecret(name: string): string {
	return expression(`secrets.PRODUCTION_${name}`);
}

test("manual production release is main-only and workflow concurrency never cancels", () => {
	assert.match(String(releaseJob.if), /github\.ref == 'refs\/heads\/main'/u);
	assert.match(
		String(releaseJob.if),
		/github\.event_name == 'workflow_dispatch'/u,
	);
	const concurrency = record(workflow.concurrency, "workflow concurrency");
	assert.equal(
		concurrency.group,
		["lemn-ui-", expression("github.ref")].join(""),
	);
	assert.equal(concurrency["cancel-in-progress"], false);
	assert.ok(Number(releaseJob["timeout-minutes"]) >= 60);
});

test("production credentials remain exclusive to the protected environment job", () => {
	assert.equal(releaseJob.environment, "production");
	const productionSecretPattern =
		/secrets\.PRODUCTION_(?:CLOUDFLARE_API_TOKEN|STATUS_TOKEN)/u;
	for (const [jobName, job] of Object.entries(jobs)) {
		if (jobName === "release-and-deploy") continue;
		assert.doesNotMatch(JSON.stringify(job), productionSecretPattern);
	}
	const workflowWithoutRollbackBridge = workflowSource.replaceAll(
		"secrets.STATUS_TOKEN || secrets.PRODUCTION_STATUS_TOKEN",
		"",
	);
	assert.doesNotMatch(
		workflowWithoutRollbackBridge,
		/secrets\.(?:CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL|CLOUDFLARE_API_TOKEN|STATUS_TOKEN)(?![A-Z0-9_])/u,
	);
	assert.equal(
		workflowSource.match(
			/secrets\.STATUS_TOKEN \|\| secrets\.PRODUCTION_STATUS_TOKEN/gu,
		)?.length,
		2,
	);
	const preflightEnv = record(
		step("Preflight Cloudflare release access").env,
		"preflight env",
	);
	assert.equal(
		preflightEnv.CLOUDFLARE_API_TOKEN,
		productionSecret("CLOUDFLARE_API_TOKEN"),
	);
	assert.match(
		String(step("Preflight Cloudflare release access").run),
		/PRODUCTION_CLOUDFLARE_API_TOKEN[\s\S]*Workers Scripts: Edit[\s\S]*Zone: Read/u,
	);
	assert.doesNotMatch(workflowSource, /CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL/u);
	assert.equal(
		preflightEnv.PRODUCTION_STATUS_TOKEN,
		productionSecret("STATUS_TOKEN"),
	);
	assert.equal(
		preflightEnv.ROLLBACK_STATUS_TOKEN,
		expression("secrets.STATUS_TOKEN || secrets.PRODUCTION_STATUS_TOKEN"),
	);
});

test("release permissions are limited to protected main and package writes", () => {
	const permissions = record(releaseJob.permissions, "release permissions");
	assert.equal(permissions.contents, "write");
	assert.equal(permissions.packages, "write");
	assert.equal(permissions["pull-requests"], undefined);
});

test("preflight precedes the single stateful release preparation and package gate", () => {
	assert.ok(
		stepIndex("Preflight Cloudflare release access") <
			stepIndex("Prepare or resume release metadata"),
	);
	assert.ok(
		stepIndex("Prepare or resume release metadata") <
			stepIndex("Publish or verify exact package"),
	);
	assert.equal(
		step("Prepare or resume release metadata").run,
		"pnpm prepare:ui:release",
	);
	assert.equal(
		step("Publish or verify exact package").run,
		"pnpm publish:ui:release",
	);
	assert.match(prepareSource, /Release-Origin:/u);
	assert.match(prepareSource, /"fetch",[\s\S]{0,80}"--no-tags"/u);
	assert.match(prepareSource, /HEAD:refs\/heads\/main/u);
	assert.doesNotMatch(prepareSource, /--force|force-with-lease/u);
	assert.match(publishSource, /sha512/u);
	assert.match(publishSource, /dist.*integrity|integrity/u);
	assert.doesNotMatch(
		workflowSource,
		/Detect pending changesets|Push release metadata/u,
	);
	assert.doesNotMatch(workflowSource, /npm view|E404/u);
});

test("package release receives explicit API and registry authentication", () => {
	const prepareEnv = record(
		step("Prepare or resume release metadata").env,
		"release preparation env",
	);
	const publishEnv = record(
		step("Publish or verify exact package").env,
		"package publish env",
	);
	assert.equal(publishEnv.GITHUB_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(publishEnv.NODE_AUTH_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(
		prepareEnv.CLOUDFLARE_API_TOKEN,
		productionSecret("CLOUDFLARE_API_TOKEN"),
	);
	assert.equal(
		publishEnv.CLOUDFLARE_API_TOKEN,
		productionSecret("CLOUDFLARE_API_TOKEN"),
	);
});

test("package and release entrypoints share main-only guarded implementations", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(
		scripts["release:preflight"],
		"pnpm guard:release:mutation && pnpm validate:release-preconditions",
	);
	for (const name of [
		"deploy:showcase:prod",
		"prepare:ui:release",
		"publish:ui",
		"publish:ui:release",
		"rollout:showcase:prod",
	]) {
		assert.match(String(scripts[name]), /^pnpm guard:release:mutation && /u);
	}
	assert.equal(
		scripts.release,
		"pnpm release:preflight && pnpm check && pnpm test && pnpm publish:ui:release",
	);
	assert.equal(scripts["publish:ui:internal"], undefined);
});

test("docs and showcase consume one immutable release identity", () => {
	const prepare = step("Prepare or resume release metadata");
	assert.equal(prepare.id, "release");
	const docsEnv = record(step("Build docs").env, "docs env");
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

	const rolloutEnv = record(
		step("Roll out showcase with protected rollback").env,
		"rollout env",
	);
	assert.equal(
		rolloutEnv.EXPECTED_RELEASE_ID,
		expression("steps.release.outputs.release_id"),
	);
	assert.equal(
		rolloutEnv.EXPECTED_RELEASE_VERSION,
		expression("steps.release.outputs.version"),
	);
	assert.equal(
		rolloutEnv.EXPECTED_RELEASE_GIT_SHA,
		expression("steps.release.outputs.sha"),
	);
	assert.equal(
		rolloutEnv.EXPECTED_RELEASE_TIME,
		expression("steps.release.outputs.time"),
	);
	assert.match(rolloutSource, /EXPECTED_RELEASE_ID/u);
	assert.doesNotMatch(rolloutSource, /GITHUB_SHA/u);
});

test("all production deploys receive only the scoped Environment API token", () => {
	for (const name of [
		"Deploy docs",
		"Roll out showcase with protected rollback",
	]) {
		const env = record(step(name).env, `${name} env`);
		assert.equal(
			env.CLOUDFLARE_API_TOKEN,
			productionSecret("CLOUDFLARE_API_TOKEN"),
		);
		assert.equal(env.CLOUDFLARE_API_KEY, undefined);
		assert.equal(env.CLOUDFLARE_EMAIL, undefined);
		assert.match(
			String(env.CLOUDFLARE_ACCOUNT_ID),
			/steps\.cloudflare\.outputs\.(?:docs|showcase)_account_id/u,
		);
	}
	const rolloutEnv = record(
		step("Roll out showcase with protected rollback").env,
		"rollout env",
	);
	assert.equal(
		rolloutEnv.PRODUCTION_STATUS_TOKEN,
		productionSecret("STATUS_TOKEN"),
	);
	assert.equal(
		rolloutEnv.ROLLBACK_STATUS_TOKEN,
		expression("secrets.STATUS_TOKEN || secrets.PRODUCTION_STATUS_TOKEN"),
	);
	assert.equal(
		stepIndex("Roll out showcase with protected rollback"),
		steps.length - 1,
	);
});

test("workflow never invokes direct publisher, secret mutation, or Worker deploy commands", () => {
	assert.equal(step("Deploy docs").run, "pnpm deploy:docs:prod");
	assert.equal(
		step("Roll out showcase with protected rollback").run,
		"pnpm rollout:showcase:prod",
	);
	assert.doesNotMatch(
		workflowSource,
		/run:\s*pnpm --dir apps\/(?:docs|showcase) exec wrangler (?:deploy|secret|rollback|versions)/u,
	);
	assert.doesNotMatch(
		rolloutSource,
		/wrangler[\s\S]{0,80}secret[\s\S]{0,20}put/u,
	);
	assert.match(rolloutSource, /versions[\s\S]{0,40}upload/u);
	assert.match(rolloutSource, /versions[\s\S]{0,40}deploy/u);
});

test("CI and release smoke local showcase assets before package publication", () => {
	const validationSteps = record(jobs.validate, "validate job")
		.steps as UnknownRecord[];
	const localSmoke = validationSteps.find(
		(candidate) => candidate.name === "Smoke showcase deployment locally",
	);
	assert.ok(localSmoke);
	assert.equal(localSmoke.run, "pnpm smoke:showcase:local");
	const releaseSmoke = step("Build and smoke showcase deployment locally");
	assert.equal(releaseSmoke.run, "pnpm smoke:showcase:local");
	assert.ok(
		stepIndex("Build and smoke showcase deployment locally") <
			stepIndex("Publish or verify exact package"),
	);
});

test("the validation gate isolates accessibility pressure from all three complete E2E shards", () => {
	const e2eJob = record(jobs["showcase-e2e"], "showcase E2E job");
	const strategy = record(e2eJob.strategy, "showcase E2E strategy");
	const matrix = record(strategy.matrix, "showcase E2E matrix");
	const e2eSteps = e2eJob.steps as UnknownRecord[];
	const e2eBrowserInstall = e2eSteps.find(
		(candidate) => candidate.name === "Install Chromium",
	);
	const shard = e2eSteps.find(
		(candidate) => candidate.name === "Run showcase E2E shard",
	);
	assert.ok(e2eBrowserInstall);
	assert.ok(shard);
	assert.equal(e2eJob.needs, "validate");
	assert.equal(e2eJob["runs-on"], "ubuntu-24.04");
	assert.equal(e2eJob.container, undefined);
	assert.match(String(e2eBrowserInstall.run), /install --with-deps chromium/u);
	assert.equal(strategy["fail-fast"], false);
	assert.deepEqual(matrix.shard, [1, 2, 3]);
	assert.doesNotMatch(String(shard.run), /--grep|visual\.e2e/u);
	assert.match(String(shard.run), /--project=behavior/u);
	for (const project of [
		"visual-light-mobile",
		"visual-light-tablet",
		"visual-light-desktop",
		"visual-dark-mobile",
		"visual-dark-tablet",
		"visual-dark-desktop",
	]) {
		assert.match(String(shard.run), new RegExp(`--project=${project}`, "u"));
	}
	assert.doesNotMatch(String(shard.run), /accessibility/u);

	const accessibilityJob = record(
		jobs["showcase-accessibility"],
		"showcase accessibility job",
	);
	assert.equal(accessibilityJob.needs, "validate");
	assert.equal(accessibilityJob.container, undefined);
	const accessibilitySteps = accessibilityJob.steps as UnknownRecord[];
	const browserInstall = accessibilitySteps.find(
		(candidate) => candidate.name === "Install Chromium",
	);
	const crawl = accessibilitySteps.find(
		(candidate) => candidate.name === "Run showcase accessibility crawl",
	);
	assert.ok(browserInstall);
	assert.ok(crawl);
	assert.match(String(browserInstall.run), /install --with-deps chromium/u);
	assert.match(String(crawl.run), /--project=accessibility/u);
	assert.doesNotMatch(String(crawl.run), /--shard|--grep/u);
	assert.deepEqual(releaseJob.needs, [
		"validate",
		"showcase-e2e",
		"showcase-accessibility",
	]);
});

test("contributor release guidance remains fail closed", () => {
	assert.match(
		contributing,
		/A scope, owner, authentication, version,\s+package-content, or Cloudflare mismatch fails closed/u,
	);
	assert.doesNotMatch(contributing, /records a warning and\s+continues/u);
});
