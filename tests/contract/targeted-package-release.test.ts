import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { parse } from "yaml";
import {
	releasePackages,
	selectReleasePackages,
} from "../../scripts/release/package-set.ts";

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

function expression(body: string): string {
	return ["$", `{{ ${body} }}`].join("");
}

test("targeted package selection accepts only one exact release package", () => {
	for (const definition of releasePackages) {
		assert.deepEqual(selectReleasePackages(["--package", definition.name]), [
			definition,
		]);
	}

	assert.strictEqual(selectReleasePackages([]), releasePackages);
	for (const invalidArguments of [
		["--package"],
		["--package=@lemn-ltd/brand-studio"],
		["brand-studio"],
		["--package", "brand-studio"],
		["--package", "@lemn-ltd/not-a-release-package"],
		["--package", "@lemn-ltd/brand-studio", "--package", "@lemn-ltd/ui"],
	]) {
		assert.throws(
			() => selectReleasePackages(invalidArguments),
			/(?:usage|not an allowed release package)/u,
		);
	}
});

test("the directed release workflow is manual, main-only, serialized, and production protected", () => {
	const on = record(workflow.on, "workflow trigger");
	const dispatch = record(on.workflow_dispatch, "workflow_dispatch");
	const inputs = record(dispatch.inputs, "workflow inputs");
	const packageInput = record(inputs.package, "package input");
	assert.equal(packageInput.required, true);
	assert.equal(packageInput.default, "package-set");
	assert.equal(packageInput.type, "choice");
	assert.deepEqual(packageInput.options, [
		"package-set",
		...releasePackages.map(({ name }) => name),
	]);

	const concurrency = record(workflow.concurrency, "workflow concurrency");
	assert.equal(
		concurrency.group,
		["lemn-ui-", expression("github.ref")].join(""),
	);
	assert.equal(concurrency["cancel-in-progress"], false);

	const jobs = record(workflow.jobs, "workflow jobs");
	const job = record(jobs["publish-package"], "publish package job");
	assert.match(String(job.if), /github\.ref == 'refs\/heads\/main'/u);
	assert.match(String(job.if), /github\.event_name == 'workflow_dispatch'/u);
	assert.match(String(job.if), /inputs\.package != 'package-set'/u);
	assert.equal(job.needs, "validate");
	assert.equal(job.environment, "production");
	const permissions = record(job.permissions, "publish package permissions");
	assert.equal(permissions.contents, "read");
	assert.equal(permissions.packages, "write");
	assert.equal(permissions.actions, undefined);
});

test("the directed release builds validated main before publishing one exact package, then clean-smokes", () => {
	const jobs = record(workflow.jobs, "workflow jobs");
	const job = record(jobs["publish-package"], "publish package job");
	const steps = job.steps as UnknownRecord[];
	const step = (name: string): UnknownRecord => {
		const result = steps.find((candidate) => candidate.name === name);
		assert.ok(result, `Missing workflow step: ${name}`);
		return result;
	};
	const stepIndex = (name: string): number =>
		steps.findIndex((candidate) => candidate.name === name);

	const validateJob = record(jobs.validate, "validate job");
	const validateSteps = validateJob.steps as UnknownRecord[];
	assert.equal(
		validateSteps.find(
			(candidate) =>
				candidate.name === "Validate repo policy and release metadata",
		)?.run,
		"pnpm validate",
	);
	assert.equal(
		validateSteps.find((candidate) => candidate.name === "Check")?.run,
		"pnpm check",
	);
	assert.equal(
		validateSteps.find((candidate) => candidate.name === "Test")?.run,
		"pnpm test",
	);
	assert.equal(
		validateSteps.find((candidate) => candidate.name === "Build")?.run,
		"pnpm build",
	);

	const build = step("Build release packages in dependency order");
	assert.equal(build.run, "pnpm build:packages:release");
	assert.equal(build.env, undefined);

	const publish = step("Publish or verify selected immutable package");
	const publishEnv = record(publish.env, "publish env");
	assert.equal(publishEnv.GITHUB_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(publishEnv.NODE_AUTH_TOKEN, expression("secrets.GITHUB_TOKEN"));
	assert.equal(publishEnv.RELEASE_PACKAGE, expression("inputs.package"));
	const releasePackageVariable = ["$", "{RELEASE_PACKAGE}"].join("");
	assert.equal(
		publish.run,
		`pnpm publish:packages:release --package "${releasePackageVariable}"`,
	);

	const smoke = step("Smoke exact releases in a clean consumer");
	assert.equal(smoke.run, "pnpm smoke:packages:github-packages");
	assert.equal(
		record(smoke.env, "smoke env").NODE_AUTH_TOKEN,
		expression("secrets.GITHUB_TOKEN"),
	);
	assert.equal(record(smoke.env, "smoke env").GITHUB_TOKEN, undefined);
	assert.equal(job.needs, "validate");
	assert.ok(
		stepIndex("Build release packages in dependency order") <
			stepIndex("Publish or verify selected immutable package"),
	);
	assert.ok(
		stepIndex("Publish or verify selected immutable package") <
			stepIndex("Smoke exact releases in a clean consumer"),
	);
});

test("the full package-set publisher remains the no-argument default", async () => {
	const rootPackage = JSON.parse(
		await readFile(resolve(root, "package.json"), "utf8"),
	) as UnknownRecord;
	const scripts = record(rootPackage.scripts, "root scripts");
	assert.equal(
		scripts["publish:packages:release"],
		"pnpm guard:release:ref && node scripts/release/publish-package-release.ts",
	);
	assert.strictEqual(selectReleasePackages([]), releasePackages);
	const jobs = record(workflow.jobs, "workflow jobs");
	const fullRelease = record(jobs["release-and-deploy"], "full release job");
	assert.match(String(fullRelease.if), /inputs\.package == 'package-set'/u);
});
