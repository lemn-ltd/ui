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
	resolve(root, "scripts/release/prepare-package-release.ts"),
	"utf8",
);
const publishSource = await readFile(
	resolve(root, "scripts/release/publish-package-release.ts"),
	"utf8",
);
const packageSetSource = await readFile(
	resolve(root, "scripts/release/package-set.ts"),
	"utf8",
);
const rolloutSource = await readFile(
	resolve(root, "scripts/release/ui-portal-production-rollout.ts"),
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

function productionVariable(name: string): string {
	return expression(`vars.PRODUCTION_${name}`);
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

test("production Access credentials and audiences remain exclusive to the protected environment job", () => {
	assert.equal(releaseJob.environment, "production");
	const productionInputPattern =
		/(?:secrets|vars)\.PRODUCTION_(?:CLOUDFLARE_(?:ACCOUNT_ID|API_TOKEN)|UI_PORTAL_(?:ACCESS_CLIENT_(?:ID|SECRET)|(?:HEALTH_)?ACCESS_AUDIENCE))/u;
	for (const [jobName, job] of Object.entries(jobs)) {
		if (jobName === "release-and-deploy") continue;
		assert.doesNotMatch(JSON.stringify(job), productionInputPattern);
	}
	assert.doesNotMatch(
		workflowSource,
		/secrets\.(?:CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL|CLOUDFLARE_API_TOKEN)(?![A-Z0-9_])/u,
	);
	const preflightEnv = record(
		step("Preflight Cloudflare release access").env,
		"preflight env",
	);
	assert.equal(
		preflightEnv.CLOUDFLARE_API_TOKEN,
		productionSecret("CLOUDFLARE_API_TOKEN"),
	);
	assert.equal(
		preflightEnv.CLOUDFLARE_ACCOUNT_ID,
		productionVariable("CLOUDFLARE_ACCOUNT_ID"),
	);
	assert.match(
		String(step("Preflight Cloudflare release access").run),
		/PRODUCTION_CLOUDFLARE_API_TOKEN[\s\S]*Workers Scripts: Edit[\s\S]*Zone: Read, Workers Routes: Edit[\s\S]*PRODUCTION_CLOUDFLARE_ACCOUNT_ID/u,
	);
	assert.doesNotMatch(workflowSource, /CLOUDFLARE_API_KEY|CLOUDFLARE_EMAIL/u);
	assert.equal(
		preflightEnv.UI_PORTAL_ACCESS_CLIENT_ID,
		productionSecret("UI_PORTAL_ACCESS_CLIENT_ID"),
	);
	assert.equal(
		preflightEnv.UI_PORTAL_ACCESS_CLIENT_SECRET,
		productionSecret("UI_PORTAL_ACCESS_CLIENT_SECRET"),
	);
	assert.match(
		String(step("Preflight Cloudflare release access").run),
		/UI_PORTAL_ACCESS_CLIENT_ID[\s\S]*UI_PORTAL_ACCESS_CLIENT_SECRET/u,
	);
	assert.equal(
		preflightEnv.PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE,
		productionVariable("UI_PORTAL_ACCESS_AUDIENCE"),
	);
	assert.equal(
		preflightEnv.PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE,
		productionVariable("UI_PORTAL_HEALTH_ACCESS_AUDIENCE"),
	);
	assert.doesNotMatch(
		workflowSource,
		/secrets\.PRODUCTION_UI_PORTAL_(?:ACCESS_AUDIENCE|HEALTH_ACCESS_AUDIENCE)/u,
	);
	assert.match(
		String(step("Preflight Cloudflare release access").run),
		/\^\[0-9a-f\]\{64\}\$/u,
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
		stepIndex("Validate release preconditions") <
			stepIndex("Preflight Cloudflare release access"),
	);
	assert.ok(
		stepIndex("Preflight Cloudflare release access") <
			stepIndex("Prepare or resume release metadata"),
	);
	assert.ok(
		stepIndex("Prepare or resume release metadata") <
			stepIndex("Install exact prepared release revision"),
	);
	assert.ok(
		stepIndex("Install exact prepared release revision") <
			stepIndex("Validate exact prepared release revision"),
	);
	assert.ok(
		stepIndex("Validate exact prepared release revision") <
			stepIndex("Publish or verify exact package set"),
	);
	assert.ok(
		stepIndex("Publish or verify exact package set") <
			stepIndex("Verify exact published package set in a clean consumer"),
	);
	assert.ok(
		stepIndex("Verify exact published package set in a clean consumer") <
			stepIndex("Roll out UI Portal with protected rollback"),
	);
	assert.equal(
		step("Prepare or resume release metadata").run,
		"pnpm prepare:packages:release",
	);
	assert.equal(
		step("Publish or verify exact package set").run,
		"pnpm publish:packages:release",
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

test("the exact prepared release SHA receives a frozen install and the full repository gate", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(
		scripts["validate:release-contracts"],
		"pnpm --filter @lemn-ltd/ui run build && node --test tests/contract/*.test.ts",
	);
	const install = step("Install exact prepared release revision");
	const installRun = String(install.run);
	const installEnv = record(install.env, "exact release install env");
	assert.equal(
		installEnv.EXPECTED_RELEASE_GIT_SHA,
		expression("steps.release.outputs.sha"),
	);
	assert.equal(installEnv.NODE_AUTH_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(installEnv.GITHUB_TOKEN, undefined);
	assert.equal(installEnv.CLOUDFLARE_API_TOKEN, undefined);
	assert.equal(installEnv.UI_PORTAL_ACCESS_CLIENT_SECRET, undefined);
	assert.match(installRun, /git rev-parse HEAD/u);
	assert.match(installRun, /EXPECTED_RELEASE_GIT_SHA/u);
	assert.match(installRun, /git diff --exit-code/u);
	assert.match(installRun, /git diff --cached --exit-code/u);
	assert.match(installRun, /git status --porcelain --untracked-files=normal/u);
	assert.match(installRun, /pnpm install --frozen-lockfile --ignore-scripts/u);
	assert.match(
		installRun,
		/env -u NODE_AUTH_TOKEN -u GITHUB_TOKEN pnpm rebuild --pending/u,
	);

	const validation = step("Validate exact prepared release revision");
	assert.equal(validation.env, undefined);
	assert.deepEqual(String(validation.run).trim().split("\n"), [
		"pnpm validate",
		"pnpm check",
		"pnpm test",
		"pnpm build",
	]);
	assert.ok(
		stepIndex("Prepare or resume release metadata") <
			stepIndex("Install exact prepared release revision"),
	);
	assert.ok(
		stepIndex("Install exact prepared release revision") <
			stepIndex("Validate exact prepared release revision"),
	);
	assert.ok(
		stepIndex("Validate exact prepared release revision") <
			stepIndex("Audit release dependency graph"),
	);
});

test("the exact prepared release revision is audited and Cloudflare dry-run before publication", () => {
	assert.equal(step("Audit release dependency graph").run, "pnpm audit --prod");
	const dryRun = step("Dry-run Cloudflare deployables");
	assert.match(
		String(dryRun.run),
		/pnpm --filter @lemn-ltd\/ui-portal run cf:dry-run/u,
	);
	assert.match(
		String(dryRun.run),
		/pnpm --filter @lemn-ltd\/ui-docs run cf:dry-run/u,
	);
	const dryRunEnv = record(dryRun.env, "Cloudflare dry-run env");
	assert.equal(
		dryRunEnv.CLOUDFLARE_API_TOKEN,
		productionSecret("CLOUDFLARE_API_TOKEN"),
	);
	assert.equal(
		dryRunEnv.CLOUDFLARE_ACCOUNT_ID,
		expression("steps.cloudflare.outputs.portal_account_id"),
	);
	assert.equal(dryRunEnv.UI_PORTAL_ACCESS_CLIENT_ID, undefined);
	assert.equal(dryRunEnv.UI_PORTAL_ACCESS_CLIENT_SECRET, undefined);
	assert.ok(
		stepIndex("Validate exact prepared release revision") <
			stepIndex("Audit release dependency graph"),
	);
	assert.ok(
		stepIndex("Audit release dependency graph") <
			stepIndex("Dry-run Cloudflare deployables"),
	);
	assert.ok(
		stepIndex("Dry-run Cloudflare deployables") <
			stepIndex("Publish or verify exact package set"),
	);
});

test("published packages are installed in a clean consumer before any production deploy", () => {
	const verification = step(
		"Verify exact published package set in a clean consumer",
	);
	const env = record(verification.env, "published consumer verification env");

	assert.equal(verification.run, "pnpm smoke:packages:github-packages");
	assert.equal(env.NODE_AUTH_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(env.GITHUB_TOKEN, undefined);
	assert.equal(env.CLOUDFLARE_API_TOKEN, undefined);
	assert.ok(
		stepIndex("Publish or verify exact package set") <
			stepIndex("Verify exact published package set in a clean consumer"),
	);
	assert.ok(
		stepIndex("Verify exact published package set in a clean consumer") <
			stepIndex("Roll out UI Portal with protected rollback"),
	);
	assert.ok(
		stepIndex("Verify exact published package set in a clean consumer") <
			stepIndex("Deploy docs"),
	);
});

test("dependency lifecycle scripts never receive a GitHub package credential", () => {
	for (const [jobName, jobValue] of Object.entries(jobs)) {
		const job = record(jobValue, jobName);
		const jobSteps = Array.isArray(job.steps)
			? (job.steps as UnknownRecord[])
			: [];
		const installIndex = jobSteps.findIndex(
			(candidate) => candidate.name === "Install dependencies",
		);
		if (installIndex === -1) continue;
		const install = jobSteps[installIndex] as UnknownRecord;
		assert.match(String(install.run), /--ignore-scripts/u);
		assert.equal(
			record(install.env, `${jobName} install env`).NODE_AUTH_TOKEN,
			expression("secrets.GITHUB_TOKEN"),
		);
		const rebuild = jobSteps[installIndex + 1] as UnknownRecord;
		assert.equal(
			rebuild.name,
			"Rebuild approved dependencies without registry credentials",
		);
		assert.equal(
			rebuild.run,
			"env -u NODE_AUTH_TOKEN -u GITHUB_TOKEN pnpm rebuild --pending",
		);
		assert.equal(rebuild.env, undefined);
	}
});

test("release bootstrap defers strict host checks until Cloudflare mappings exist", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(scripts["validate:release-preconditions"], "pnpm validate");
	assert.equal(
		scripts["validate:release-hosts"],
		"node scripts/check-release-hosts.mjs",
	);

	const validationSteps = record(jobs.validate, "validate job")
		.steps as UnknownRecord[];
	assert.equal(
		validationSteps.some(
			(candidate) => candidate.name === "Validate release host DNS",
		),
		false,
	);

	const stagedDeployment = rolloutSource.indexOf("if (stagedDeployment(");
	const mappingSmoke = rolloutSource.indexOf(
		"cloudflareMappingSmokeCommand",
		stagedDeployment,
	);
	const productionSmoke = rolloutSource.indexOf(
		"await dependencies.smokeProduction(",
		mappingSmoke,
	);
	const activation = rolloutSource.indexOf(
		"activateCandidateCommand(",
		productionSmoke,
	);
	assert.ok(stagedDeployment >= 0);
	assert.ok(mappingSmoke > stagedDeployment);
	assert.ok(productionSmoke > mappingSmoke);
	assert.ok(activation > productionSmoke);
});

test("package release receives explicit API and registry authentication", () => {
	const prepareEnv = record(
		step("Prepare or resume release metadata").env,
		"release preparation env",
	);
	const publishEnv = record(
		step("Publish or verify exact package set").env,
		"package publish env",
	);
	assert.equal(publishEnv.GITHUB_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(publishEnv.NODE_AUTH_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(prepareEnv.CLOUDFLARE_API_TOKEN, undefined);
	assert.equal(publishEnv.CLOUDFLARE_API_TOKEN, undefined);
	assert.match(publishSource, /"--ignore-scripts"/u);
	assert.doesNotMatch(prepareSource, /env:\s*process\.env/u);
	assert.doesNotMatch(publishSource, /env:\s*process\.env/u);
});

test("secret preflight removes Access credentials before invoking Cloudflare tooling", () => {
	const run = String(step("Preflight Cloudflare release access").run);
	for (const name of [
		"UI_PORTAL_ACCESS_CLIENT_ID",
		"UI_PORTAL_ACCESS_CLIENT_SECRET",
		"PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE",
		"PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE",
	]) {
		assert.match(run, new RegExp(`-u ${name}`, "u"));
	}
	assert.match(run, /pnpm preflight:cloudflare:release/u);
	assert.doesNotMatch(run, /pnpm release:preflight/u);
	assert.equal(
		step("Validate release preconditions").run,
		"pnpm release:preflight",
	);
});

test("release package order is contract then UI then Runtime then Studio with immutable verification", () => {
	const contractIndex = packageSetSource.indexOf(
		'name: "@lemn-ltd/brand-contract"',
	);
	const uiIndex = packageSetSource.indexOf('name: "@lemn-ltd/ui"');
	const runtimeIndex = packageSetSource.indexOf(
		'name: "@lemn-ltd/brand-runtime"',
	);
	const studioIndex = packageSetSource.indexOf(
		'name: "@lemn-ltd/brand-studio"',
	);
	assert.ok(
		contractIndex >= 0 &&
			contractIndex < uiIndex &&
			uiIndex < runtimeIndex &&
			runtimeIndex < studioIndex,
	);
	assert.match(publishSource, /for \(const artifact of artifacts\)/u);
	assert.match(publishSource, /timingSafeEqual/u);
	assert.match(publishSource, /sha512/u);
	assert.doesNotMatch(
		packageSetSource,
		/expectedVersion/u,
		"Changesets must remain the version-transition authority",
	);
	assert.equal(
		step("Build release packages in dependency order").run,
		"pnpm build:packages:release",
	);
});

test("package and release entrypoints share main-only guarded implementations", () => {
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(
		scripts["release:preflight"],
		"pnpm guard:release:ref && pnpm validate:release-preconditions",
	);
	for (const name of [
		"prepare:packages:release",
		"publish:packages:release",
		"publish:packages:verify",
	]) {
		assert.match(String(scripts[name]), /^pnpm guard:release:ref && /u);
		assert.doesNotMatch(String(scripts[name]), /guard:release:mutation/u);
	}
	for (const name of [
		"deploy:portal:prod",
		"deploy:docs:prod",
		"rollout:portal:prod",
	]) {
		assert.match(String(scripts[name]), /^pnpm guard:release:mutation && /u);
	}
	assert.equal(
		scripts.release,
		"pnpm release:preflight && pnpm check && pnpm test && pnpm build:packages:release && pnpm publish:packages:release",
	);
	assert.equal(scripts["publish:ui"], undefined);
	assert.equal(scripts["deploy:portal-admin:prod"], undefined);
});

test("docs and portal consume one immutable release identity", () => {
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
		step("Roll out UI Portal with protected rollback").env,
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
		"Roll out UI Portal with protected rollback",
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
			/steps\.cloudflare\.outputs\.(?:docs|portal)_account_id/u,
		);
	}
	const rolloutEnv = record(
		step("Roll out UI Portal with protected rollback").env,
		"rollout env",
	);
	assert.equal(
		rolloutEnv.UI_PORTAL_ACCESS_CLIENT_ID,
		productionSecret("UI_PORTAL_ACCESS_CLIENT_ID"),
	);
	assert.equal(
		rolloutEnv.UI_PORTAL_ACCESS_CLIENT_SECRET,
		productionSecret("UI_PORTAL_ACCESS_CLIENT_SECRET"),
	);
	assert.equal(
		rolloutEnv.PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE,
		productionVariable("UI_PORTAL_ACCESS_AUDIENCE"),
	);
	assert.equal(
		rolloutEnv.PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE,
		productionVariable("UI_PORTAL_HEALTH_ACCESS_AUDIENCE"),
	);
	for (const name of ["Deploy docs"]) {
		const env = record(step(name).env, `${name} env`);
		assert.equal(env.UI_PORTAL_ACCESS_CLIENT_ID, undefined);
		assert.equal(env.UI_PORTAL_ACCESS_CLIENT_SECRET, undefined);
		assert.equal(env.PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE, undefined);
		assert.equal(env.PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE, undefined);
	}
	assert.ok(
		stepIndex("Roll out UI Portal with protected rollback") <
			stepIndex("Deploy docs"),
	);
	assert.ok(
		stepIndex("Deploy docs") < stepIndex("Smoke released production identity"),
	);
	assert.equal(
		stepIndex("Smoke released production identity"),
		steps.length - 1,
	);
	const productionSmoke = step("Smoke released production identity");
	assert.equal(productionSmoke.run, "pnpm smoke:release:production");
	const productionSmokeEnv = record(
		productionSmoke.env,
		"production smoke env",
	);
	assert.equal(
		productionSmokeEnv.EXPECTED_RELEASE_VERSION,
		expression("steps.release.outputs.version"),
	);
	assert.equal(
		productionSmokeEnv.EXPECTED_RELEASE_GIT_SHA,
		expression("steps.release.outputs.sha"),
	);
	assert.equal(
		productionSmokeEnv.EXPECTED_RELEASE_TIME,
		expression("steps.release.outputs.time"),
	);
	assert.equal(
		productionSmokeEnv.UI_PORTAL_ACCESS_CLIENT_ID,
		productionSecret("UI_PORTAL_ACCESS_CLIENT_ID"),
	);
	assert.equal(
		productionSmokeEnv.UI_PORTAL_ACCESS_CLIENT_SECRET,
		productionSecret("UI_PORTAL_ACCESS_CLIENT_SECRET"),
	);
	assert.equal(productionSmokeEnv.CLOUDFLARE_API_TOKEN, undefined);
	assert.equal(productionSmokeEnv.CLOUDFLARE_ACCOUNT_ID, undefined);
});

test("workflow never invokes direct publisher, secret mutation, or Worker deploy commands", () => {
	assert.equal(step("Deploy docs").run, "pnpm deploy:docs:prod");
	assert.equal(
		step("Roll out UI Portal with protected rollback").run,
		"pnpm rollout:portal:prod",
	);
	assert.doesNotMatch(
		workflowSource,
		/run:\s*pnpm --dir apps\/(?:docs|ui-portal) exec wrangler (?:deploy|secret|rollback|versions)/u,
	);
	assert.doesNotMatch(
		rolloutSource,
		/wrangler[\s\S]{0,80}secret[\s\S]{0,20}put/u,
	);
	assert.match(rolloutSource, /versions[\s\S]{0,40}upload/u);
	assert.match(rolloutSource, /versions[\s\S]{0,40}deploy/u);
});

test("CI and release smoke local portal assets before package publication", () => {
	const validationSteps = record(jobs.validate, "validate job")
		.steps as UnknownRecord[];
	const localSmoke = validationSteps.find(
		(candidate) => candidate.name === "Smoke UI Portal deployment locally",
	);
	assert.ok(localSmoke);
	assert.equal(localSmoke.run, "pnpm smoke:portal:local");
	const releaseSmoke = step("Build and smoke UI Portal deployment locally");
	assert.equal(releaseSmoke.run, "pnpm smoke:portal:local");
	assert.ok(
		stepIndex("Build and smoke UI Portal deployment locally") <
			stepIndex("Publish or verify exact package set"),
	);
});

test("the validation gate isolates complete E2E and accessibility shard matrices", () => {
	const e2eJob = record(jobs["ui-portal-e2e"], "UI Portal E2E job");
	const strategy = record(e2eJob.strategy, "portal E2E strategy");
	const matrix = record(strategy.matrix, "portal E2E matrix");
	const e2eSteps = e2eJob.steps as UnknownRecord[];
	const e2eImagePull = e2eSteps.find(
		(candidate) => candidate.name === "Pull pinned Playwright image",
	);
	const shard = e2eSteps.find(
		(candidate) => candidate.name === "Run UI Portal E2E shard",
	);
	assert.ok(e2eImagePull);
	assert.ok(shard);
	assert.equal(e2eJob.needs, "validate");
	assert.equal(e2eJob["runs-on"], "ubuntu-24.04");
	assert.equal(e2eJob.container, undefined);
	assert.equal(
		e2eImagePull.run,
		"docker pull mcr.microsoft.com/playwright:v1.60.0-noble",
	);
	assert.equal(strategy["fail-fast"], false);
	assert.deepEqual(matrix.shard, [1, 2, 3]);
	assert.match(String(shard.run), /docker run --rm --ipc=host/u);
	assert.match(
		String(shard.run),
		/mcr\.microsoft\.com\/playwright:v1\.60\.0-noble/u,
	);
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
		jobs["ui-portal-accessibility"],
		"UI Portal accessibility job",
	);
	const accessibilityStrategy = record(
		accessibilityJob.strategy,
		"portal accessibility strategy",
	);
	const accessibilityMatrix = record(
		accessibilityStrategy.matrix,
		"portal accessibility matrix",
	);
	const accessibilityPermissions = record(
		accessibilityJob.permissions,
		"portal accessibility permissions",
	);
	assert.equal(
		accessibilityJob.name,
		`UI Portal Accessibility (${expression("matrix.shard")}/4)`,
	);
	assert.equal(accessibilityJob.needs, "validate");
	assert.equal(accessibilityJob.container, undefined);
	assert.equal(accessibilityJob["timeout-minutes"], 25);
	assert.equal(accessibilityStrategy["fail-fast"], false);
	assert.deepEqual(accessibilityMatrix.shard, [1, 2, 3, 4]);
	assert.deepEqual(accessibilityPermissions, {
		contents: "read",
		packages: "read",
	});
	const accessibilitySteps = accessibilityJob.steps as UnknownRecord[];
	const browserInstall = accessibilitySteps.find(
		(candidate) => candidate.name === "Install Chromium",
	);
	const crawl = accessibilitySteps.find(
		(candidate) => candidate.name === "Run UI Portal accessibility crawl",
	);
	assert.ok(browserInstall);
	assert.ok(crawl);
	assert.match(String(browserInstall.run), /install --with-deps chromium/u);
	assert.match(String(crawl.run), /--project=accessibility/u);
	assert.match(String(crawl.run), /--shard=\$\{\{ matrix\.shard \}\}\/4/u);
	assert.doesNotMatch(String(crawl.run), /--grep/u);
	assert.deepEqual(releaseJob.needs, [
		"validate",
		"ui-portal-e2e",
		"ui-portal-accessibility",
	]);
});

test("contributor release guidance remains fail closed", () => {
	assert.match(
		contributing,
		/A scope, owner, authentication, version,\s+package-content, dependency, or\s+Cloudflare mismatch fails closed/u,
	);
	assert.doesNotMatch(contributing, /records a warning and\s+continues/u);
});
