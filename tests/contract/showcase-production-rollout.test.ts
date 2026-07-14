import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
	activateCandidateCommand,
	activeDeploymentFromJson,
	buildShowcaseCommand,
	type CandidateRecoveryState,
	CommandAbortedError,
	type CommandSpec,
	ConcurrentDeploymentError,
	candidateTag,
	cloudflareMappingSmokeCommand,
	createCommandRunner,
	deploymentListCommand,
	encodeCandidateState,
	RolloutRollbackFailure,
	rollbackCommand,
	runProductionRollout,
	safeErrorMessage,
	stageCandidateCommand,
	uploadCandidateCommand,
	versionListCommand,
} from "../../scripts/release/showcase-production-rollout.ts";

const baselineVersionId = "7d6eb2a8-5421-4ee9-bbc7-4633a53edace";
const candidateVersionId = "b2642364-a615-4287-a8b7-6134289e2746";
const concurrentVersionId = "f157b049-e93f-4db2-ac17-5f75b132bc25";
const deploymentIds = {
	baseline: "887111b8-c65c-49be-b26a-8687259b498d",
	staged: "d39ecbf4-74c8-431d-a01f-bd412524c455",
	active: "390f05e8-26a2-444a-aa71-b728ef24459d",
	concurrent: "de4f9673-8713-48f4-9967-3d91ee024c75",
} as const;
const previousIdentity = {
	version: "0.1.2",
	gitSha: "1".repeat(40),
	buildTime: "2026-07-13T00:00:00Z",
};
const expected = {
	version: "0.1.3",
	gitSha: "2".repeat(40),
	buildTime: "2026-07-14T00:00:00Z",
};
const input = {
	releaseId: `@lemn-ltd/ui@${expected.version}#${expected.gitSha}`,
	expected,
	productionStatusToken: "new-production-status-token",
	rollbackStatusToken: "previous-production-status-token",
};
const state: CandidateRecoveryState = {
	schema: 1,
	releaseId: input.releaseId,
	expected,
	baselineVersionId,
	baselineIdentity: previousIdentity,
	baselineTokenRole: "rollback",
};

type PlatformPhase = "active" | "baseline" | "concurrent" | "staged";
type InterruptBoundary =
	| "activate"
	| "active-smoke"
	| "build"
	| "candidate-smoke"
	| "stage"
	| "summary"
	| "upload";

function commandLabel(spec: CommandSpec): string {
	return `${spec.command} ${spec.args.join(" ")}`;
}

function deploymentJson(phase: PlatformPhase): string {
	const definitions = {
		baseline: {
			id: deploymentIds.baseline,
			message: "prior deployment",
			versions: [{ version_id: baselineVersionId, percentage: 100 }],
		},
		staged: {
			id: deploymentIds.staged,
			message: stageCandidateCommand(state, candidateVersionId).args[
				stageCandidateCommand(state, candidateVersionId).args.indexOf(
					"--message",
				) + 1
			],
			versions: [
				{ version_id: baselineVersionId, percentage: 100 },
				{ version_id: candidateVersionId, percentage: 0 },
			],
		},
		active: {
			id: deploymentIds.active,
			message: activateCandidateCommand(state, candidateVersionId).args[
				activateCandidateCommand(state, candidateVersionId).args.indexOf(
					"--message",
				) + 1
			],
			versions: [{ version_id: candidateVersionId, percentage: 100 }],
		},
		concurrent: {
			id: deploymentIds.concurrent,
			message: "out-of-band deployment",
			versions: [{ version_id: concurrentVersionId, percentage: 100 }],
		},
	} as const;
	const value = definitions[phase];
	return JSON.stringify([
		{
			id: value.id,
			created_on: "2026-07-14T00:00:00Z",
			annotations: { "workers/message": value.message },
			versions: value.versions,
		},
	]);
}

function candidateVersionsJson(
	present: boolean,
	message = encodeCandidateState(state),
) {
	return JSON.stringify(
		present
			? [
					{
						id: candidateVersionId,
						annotations: {
							"workers/tag": candidateTag(expected),
							"workers/message": message,
						},
					},
				]
			: [],
	);
}

function fakePlatform(
	options: {
		phase?: PlatformPhase;
		candidatePresent?: boolean;
		interruptAfter?: InterruptBoundary;
		timeoutAfter?: InterruptBoundary;
		concurrentAfterCandidateSmoke?: boolean;
		rollbackFailure?: Error;
		rollbackSmokeFailure?: Error;
		activeSmokeFailure?: Error;
	} = {},
) {
	let phase = options.phase ?? "baseline";
	let candidatePresent = options.candidatePresent ?? phase !== "baseline";
	let interruptAfter = options.interruptAfter;
	let timeoutAfter = options.timeoutAfter;
	const events: string[] = [];
	const counts = { activate: 0, build: 0, rollback: 0, stage: 0, upload: 0 };

	const boundary = (name: InterruptBoundary) => {
		if (interruptAfter === name) {
			interruptAfter = undefined;
			throw new CommandAbortedError(`cancelled after ${name}`, true);
		}
		if (timeoutAfter === name) {
			timeoutAfter = undefined;
			throw new CommandAbortedError(`timed out after ${name}`, false);
		}
	};

	return {
		events,
		counts,
		get phase() {
			return phase;
		},
		dependencies: {
			async runCommand(spec: CommandSpec) {
				events.push(commandLabel(spec));
				if (spec.args.join(" ") === deploymentListCommand.args.join(" ")) {
					return deploymentJson(phase);
				}
				if (spec.args.join(" ") === versionListCommand.args.join(" ")) {
					return candidateVersionsJson(candidatePresent);
				}
				if (spec === buildShowcaseCommand) {
					counts.build += 1;
					boundary("build");
					return "";
				}
				if (spec.args.includes("upload")) {
					counts.upload += 1;
					candidatePresent = true;
					boundary("upload");
					return "";
				}
				if (spec.args.includes(`${baselineVersionId}@100%`)) {
					counts.stage += 1;
					phase = "staged";
					boundary("stage");
					return "";
				}
				if (spec.args.includes(`${candidateVersionId}@100%`)) {
					counts.activate += 1;
					phase = "active";
					boundary("activate");
					return "";
				}
				if (spec.args.includes("rollback")) {
					counts.rollback += 1;
					if (options.rollbackFailure) throw options.rollbackFailure;
					phase = "baseline";
					return "";
				}
				if (spec === cloudflareMappingSmokeCommand) return "";
				throw new Error(`Unexpected command: ${commandLabel(spec)}`);
			},
			async smokeProtected(smokeInput: {
				token: string;
				expected?: typeof expected;
			}) {
				events.push(
					`protected:${smokeInput.token}:${smokeInput.expected?.gitSha ?? "capture"}`,
				);
				if (
					smokeInput.expected &&
					options.rollbackSmokeFailure &&
					counts.rollback > 0
				) {
					throw options.rollbackSmokeFailure;
				}
				return smokeInput.expected ?? previousIdentity;
			},
			async smokeProduction(smokeInput: {
				statusToken: string;
				showcaseVersionId?: string;
			}) {
				events.push(
					`production:${smokeInput.statusToken}:${smokeInput.showcaseVersionId ?? "active"}`,
				);
				if (smokeInput.showcaseVersionId) {
					assert.equal(phase, "staged");
					if (options.concurrentAfterCandidateSmoke) phase = "concurrent";
					boundary("candidate-smoke");
					return;
				}
				if (options.activeSmokeFailure) throw options.activeSmokeFailure;
				boundary("active-smoke");
			},
			async writeSummary() {
				events.push("summary");
				boundary("summary");
			},
		},
	};
}

test("deployment JSON requires validated IDs and selects the latest deployment", () => {
	const older = JSON.parse(deploymentJson("baseline"))[0];
	older.created_on = "2026-07-13T00:00:00Z";
	const active = JSON.parse(deploymentJson("active"))[0];
	assert.equal(
		activeDeploymentFromJson(JSON.stringify([older, active])).id,
		deploymentIds.active,
	);
	active.id = "not-a-uuid";
	assert.throws(
		() => activeDeploymentFromJson(JSON.stringify([active])),
		/invalid Worker version ID/u,
	);
});

test("candidate upload stages the secret only through stdin and activation is separate", () => {
	const upload = uploadCandidateCommand(input, state);
	assert.match(commandLabel(upload), /wrangler versions upload/u);
	assert.match(commandLabel(upload), /--secrets-file \/dev\/stdin/u);
	assert.doesNotMatch(commandLabel(upload), /new-production-status-token/u);
	assert.equal(
		JSON.parse(upload.stdin ?? "{}").STATUS_TOKEN,
		input.productionStatusToken,
	);
	assert.doesNotMatch(commandLabel(upload), /secret put|wrangler deploy/u);
	assert.doesNotMatch(
		commandLabel(stageCandidateCommand(state, candidateVersionId)),
		/new-production-status-token/u,
	);
});

test("new rollout persists candidate, acquires zero-traffic lease, smokes, and activates", async () => {
	const platform = fakePlatform();
	await runProductionRollout(input, platform.dependencies);
	assert.equal(platform.phase, "active");
	assert.deepEqual(platform.counts, {
		activate: 1,
		build: 1,
		rollback: 0,
		stage: 1,
		upload: 1,
	});
	assert.ok(
		platform.events.indexOf(
			`production:${input.productionStatusToken}:${candidateVersionId}`,
		) <
			platform.events.indexOf(
				commandLabel(activateCandidateCommand(state, candidateVersionId)),
			),
	);
	assert.equal(platform.events.at(-1), "summary");
});

for (const boundary of [
	"build",
	"upload",
	"stage",
	"candidate-smoke",
	"activate",
	"active-smoke",
	"summary",
] as const) {
	test(`cancellation at ${boundary} leaves a serviceable state that retry resumes`, async () => {
		const platform = fakePlatform({ interruptAfter: boundary });
		await assert.rejects(
			runProductionRollout(input, platform.dependencies),
			/cancelled after/u,
		);
		assert.notEqual(platform.phase, "concurrent");
		const countsAfterCancellation = { ...platform.counts };
		await runProductionRollout(input, platform.dependencies);
		assert.equal(platform.phase, "active");
		if (boundary === "upload") {
			assert.equal(platform.counts.upload, countsAfterCancellation.upload);
		}
		if (boundary === "stage") {
			assert.equal(platform.counts.stage, countsAfterCancellation.stage);
		}
		if (boundary === "activate") {
			assert.equal(platform.counts.activate, countsAfterCancellation.activate);
		}
	});
}

test("a timed-out staged deployment is rolled back and remains retryable", async () => {
	const platform = fakePlatform({ timeoutAfter: "stage" });
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/timed out after stage/u,
	);
	assert.equal(platform.phase, "baseline");
	assert.equal(platform.counts.rollback, 1);
	await runProductionRollout(input, platform.dependencies);
	assert.equal(platform.phase, "active");
	assert.equal(platform.counts.upload, 1);
});

test("stale retry and a lease changed during smoke never overwrite concurrent traffic", async () => {
	const stale = fakePlatform({ phase: "concurrent", candidatePresent: true });
	await assert.rejects(
		runProductionRollout(input, stale.dependencies),
		ConcurrentDeploymentError,
	);
	assert.equal(stale.counts.activate, 0);
	assert.equal(stale.counts.rollback, 0);

	const raced = fakePlatform({ concurrentAfterCandidateSmoke: true });
	await assert.rejects(
		runProductionRollout(input, raced.dependencies),
		ConcurrentDeploymentError,
	);
	assert.equal(raced.phase, "concurrent");
	assert.equal(raced.counts.activate, 0);
	assert.equal(raced.counts.rollback, 0);
});

test("an already active release resumes smoke without upload or republish-like mutation", async () => {
	const platform = fakePlatform({ phase: "active", candidatePresent: true });
	await runProductionRollout(input, platform.dependencies);
	assert.deepEqual(platform.counts, {
		activate: 0,
		build: 0,
		rollback: 0,
		stage: 0,
		upload: 0,
	});
	assert.equal(platform.events.at(-1), "summary");
});

test("mismatched candidate metadata fails closed before deployment mutation", async () => {
	const platform = fakePlatform({ candidatePresent: true });
	platform.dependencies.runCommand = async (spec: CommandSpec) => {
		if (spec.args.join(" ") === versionListCommand.args.join(" ")) {
			return candidateVersionsJson(
				true,
				encodeCandidateState({
					...state,
					releaseId: `${state.releaseId}-other`,
				}),
			);
		}
		return deploymentJson("baseline");
	};
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/different immutable release metadata/u,
	);
});

test("rollback command and smoke failures remain visible beside the rollout error", async () => {
	const platform = fakePlatform({
		activeSmokeFailure: new Error("new token smoke failed"),
		rollbackFailure: new Error("rollback command failed"),
		rollbackSmokeFailure: new Error("rollback smoke failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			const message = safeErrorMessage(error, []);
			assert.match(message, /new token smoke failed/u);
			assert.match(message, /rollback command failed/u);
			assert.match(message, /rollback smoke failed/u);
			return true;
		},
	);
});

test("error formatting redacts both status tokens", () => {
	const message = safeErrorMessage(
		new RolloutRollbackFailure(
			new Error(`failed ${input.productionStatusToken}`),
			new Error(`failed ${input.rollbackStatusToken}`),
		),
		[input.productionStatusToken, input.rollbackStatusToken],
	);
	assert.doesNotMatch(message, /new-production-status-token/u);
	assert.doesNotMatch(message, /previous-production-status-token/u);
	assert.equal(message.match(/\[REDACTED\]/gu)?.length, 2);
});

test("rollback command is exact and recovery commands carry bounded timeouts", () => {
	assert.deepEqual(rollbackCommand(baselineVersionId).args.slice(-3), [
		"--message",
		"Lemn UI automated rollback",
		"--yes",
	]);
	assert.equal(rollbackCommand(baselineVersionId).recovery, true);
	assert.ok((rollbackCommand(baselineVersionId).timeoutMs ?? 0) > 0);
});

test("command timeouts and aborts terminate their child with SIGTERM", async () => {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-rollout-child-"),
	);
	try {
		const script = resolve(temporaryRoot, "wait-for-signal.mjs");
		const marker = resolve(temporaryRoot, "signal.txt");
		await writeFile(
			script,
			`import { writeFileSync } from "node:fs";\nprocess.once("SIGTERM", () => { writeFileSync(process.env.SIGNAL_MARKER, "SIGTERM"); process.exit(0); });\nsetInterval(() => {}, 1000);\n`,
		);
		await assert.rejects(
			createCommandRunner()({
				command: process.execPath,
				args: [script],
				environment: { SIGNAL_MARKER: marker },
				timeoutMs: 300,
			}),
			(error) =>
				error instanceof CommandAbortedError && error.interrupted === false,
		);
		assert.equal(await readFile(marker, "utf8"), "SIGTERM");

		const abortMarker = resolve(temporaryRoot, "abort-signal.txt");
		const controller = new AbortController();
		const command = createCommandRunner(controller.signal)({
			command: process.execPath,
			args: [script],
			environment: { SIGNAL_MARKER: abortMarker },
			timeoutMs: 5_000,
		});
		setTimeout(() => controller.abort(), 300);
		await assert.rejects(
			command,
			(error) =>
				error instanceof CommandAbortedError && error.interrupted === true,
		);
		assert.equal(await readFile(abortMarker, "utf8"), "SIGTERM");
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});
