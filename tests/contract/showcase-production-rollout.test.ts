import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import test from "node:test";
import {
	activateCandidateCommand,
	activeDeploymentFromJson,
	baselineShowcaseConfigCommand,
	buildShowcaseCommand,
	type CandidateRecoveryState,
	CommandAbortedError,
	type CommandSpec,
	ConcurrentDeploymentError,
	candidateTag,
	cloudflareMappingSmokeCommand,
	cloudflareTriggersDeployCommand,
	createCommandRunner,
	decodeCandidateState,
	deploymentListCommand,
	encodeCandidateState,
	getCloudflareWorkerSubdomain,
	listCloudflareCustomDomains,
	RolloutRollbackFailure,
	removeCandidateTemporaryRoot,
	removeTriggerTemporaryRoot,
	rollbackCommand,
	runProductionRollout,
	safeErrorMessage,
	stageCandidateCommand,
	triggerRecoveryHashes,
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

function wranglerSource(
	hostnames: readonly string[],
	workersDev = false,
	previewUrls = workersDev,
): string {
	return JSON.stringify({
		name: "dev-lemn-ui-showcase",
		account_id: "account-id",
		main: "src/worker/index.ts",
		compatibility_date: "2026-05-14",
		env: {
			production: {
				name: "lemn-ui-showcase",
				workers_dev: workersDev,
				preview_urls: previewUrls,
				routes: hostnames.map((pattern) => ({
					pattern,
					custom_domain: true,
				})),
			},
		},
	});
}

const baselineWranglerSource = wranglerSource(
	["showcase.ui.le-mn.com"],
	true,
	true,
);
const desiredWranglerSource = wranglerSource([
	"showcase.ui.le-mn.com",
	"schemas.ui.le-mn.com",
]);
const triggerHashes = triggerRecoveryHashes(
	baselineWranglerSource,
	desiredWranglerSource,
);
const state: CandidateRecoveryState = {
	schema: 3,
	releaseId: input.releaseId,
	expected,
	baselineVersionId,
	baselineIdentity: previousIdentity,
	baselineTokenRole: "rollback",
	...triggerHashes,
};

type PlatformPhase = "active" | "baseline" | "concurrent" | "staged";
type CustomDomainsPhase = "baseline" | "concurrent" | "desired" | "partial";
type InterruptBoundary =
	| "activate"
	| "active-smoke"
	| "build"
	| "candidate-smoke"
	| "stage"
	| "summary"
	| "upload";

interface UploadEvidence {
	readonly command: string;
	readonly content: string;
	readonly directoryIsDirectory: boolean;
	readonly directoryMode: number;
	readonly directoryPath: string;
	readonly isRegularFile: boolean;
	readonly mode: number;
	readonly path: string;
	readonly stdin: string | undefined;
}

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
		customDomainsPhase?: CustomDomainsPhase;
		baselineConfigSource?: string;
		desiredConfigSource?: string;
		baselineDomains?: readonly { hostname: string; service: string }[];
		desiredDomains?: readonly { hostname: string; service: string }[];
		partialDomains?: readonly { hostname: string; service: string }[];
		candidateMessage?: string;
		candidatePresent?: boolean;
		interruptAfter?: InterruptBoundary;
		timeoutAfter?: InterruptBoundary;
		concurrentAfterCandidateSmoke?: boolean;
		concurrentAfterRollback?: boolean;
		rollbackFailure?: Error;
		rollbackSmokeFailure?: Error;
		activeSmokeFailure?: Error;
		desiredTriggerFailure?: Error;
		desiredTriggerPartial?: boolean;
		restoreFailure?: Error;
		restorePartial?: boolean;
		restoreCleanupFailure?: Error;
		concurrentDomainsBeforeRollback?: boolean;
		uploadFailure?: Error;
		cleanupFailure?: Error;
	} = {},
) {
	let phase = options.phase ?? "baseline";
	let customDomainsPhase = options.customDomainsPhase ?? "baseline";
	let candidatePresent = options.candidatePresent ?? phase !== "baseline";
	let candidateMessage =
		options.candidateMessage ?? encodeCandidateState(state);
	let desiredTriggerFailure = options.desiredTriggerFailure;
	let interruptAfter = options.interruptAfter;
	let timeoutAfter = options.timeoutAfter;
	const events: string[] = [];
	const counts = { activate: 0, build: 0, rollback: 0, stage: 0, upload: 0 };
	const cleanupPaths: string[] = [];
	const triggerCleanupPaths: string[] = [];
	const uploads: UploadEvidence[] = [];
	const restoredTriggerConfigs: UploadEvidence[] = [];

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
		cleanupPaths,
		triggerCleanupPaths,
		uploads,
		restoredTriggerConfigs,
		get phase() {
			return phase;
		},
		get customDomainsPhase() {
			return customDomainsPhase;
		},
		dependencies: {
			async readDesiredShowcaseConfig() {
				return options.desiredConfigSource ?? desiredWranglerSource;
			},
			async listCustomDomains(accountId: string) {
				assert.equal(accountId, "account-id");
				events.push(`domains:${customDomainsPhase}`);
				if (customDomainsPhase === "baseline") {
					return (
						options.baselineDomains ?? [
							{
								hostname: "showcase.ui.le-mn.com",
								service: "lemn-ui-showcase",
							},
						]
					);
				}
				if (customDomainsPhase === "desired") {
					return (
						options.desiredDomains ?? [
							{
								hostname: "showcase.ui.le-mn.com",
								service: "lemn-ui-showcase",
							},
							{ hostname: "schemas.ui.le-mn.com", service: "lemn-ui-showcase" },
						]
					);
				}
				if (customDomainsPhase === "partial") {
					return (
						options.partialDomains ?? [
							{ hostname: "schemas.ui.le-mn.com", service: "lemn-ui-showcase" },
						]
					);
				}
				return [{ hostname: "showcase.ui.le-mn.com", service: "other-worker" }];
			},
			async getWorkerSubdomain(accountId: string, workerName: string) {
				assert.equal(accountId, "account-id");
				assert.equal(workerName, "lemn-ui-showcase");
				events.push(`subdomain:${customDomainsPhase}`);
				return customDomainsPhase === "baseline"
					? { enabled: true, previewsEnabled: true }
					: { enabled: false, previewsEnabled: false };
			},
			async waitForDomainPropagation() {},
			async removeCandidateTemporaryRoot(temporaryRoot: string) {
				cleanupPaths.push(temporaryRoot);
				await removeCandidateTemporaryRoot(temporaryRoot);
				if (options.cleanupFailure) throw options.cleanupFailure;
			},
			async removeTriggerTemporaryRoot(temporaryRoot: string) {
				triggerCleanupPaths.push(temporaryRoot);
				await removeTriggerTemporaryRoot(temporaryRoot);
				if (options.restoreCleanupFailure) {
					throw options.restoreCleanupFailure;
				}
			},
			async runCommand(spec: CommandSpec) {
				events.push(commandLabel(spec));
				if (
					spec.args.join(" ") ===
					baselineShowcaseConfigCommand(previousIdentity.gitSha).args.join(" ")
				) {
					return options.baselineConfigSource ?? baselineWranglerSource;
				}
				if (spec.args.join(" ") === deploymentListCommand.args.join(" ")) {
					return deploymentJson(phase);
				}
				if (spec.args.join(" ") === versionListCommand.args.join(" ")) {
					return candidateVersionsJson(candidatePresent, candidateMessage);
				}
				if (spec === buildShowcaseCommand) {
					counts.build += 1;
					boundary("build");
					return "";
				}
				if (spec.args.includes("upload")) {
					counts.upload += 1;
					const secretsFileIndex = spec.args.indexOf("--secrets-file");
					assert.notEqual(secretsFileIndex, -1);
					const secretsFilePath = spec.args[secretsFileIndex + 1];
					assert.ok(secretsFilePath);
					const secretsDirectoryPath = dirname(secretsFilePath);
					const secretsDirectoryStat = await stat(secretsDirectoryPath);
					const secretsFileStat = await stat(secretsFilePath);
					uploads.push({
						command: commandLabel(spec),
						content: await readFile(secretsFilePath, "utf8"),
						directoryIsDirectory: secretsDirectoryStat.isDirectory(),
						directoryMode: secretsDirectoryStat.mode & 0o777,
						directoryPath: secretsDirectoryPath,
						isRegularFile: secretsFileStat.isFile(),
						mode: secretsFileStat.mode & 0o777,
						path: secretsFilePath,
						stdin: spec.stdin,
					});
					candidatePresent = true;
					const messageIndex = spec.args.indexOf("--message");
					assert.notEqual(messageIndex, -1);
					candidateMessage = spec.args[messageIndex + 1] ?? "";
					if (options.uploadFailure) throw options.uploadFailure;
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
					phase = options.concurrentAfterRollback ? "concurrent" : "baseline";
					return "";
				}
				if (spec === cloudflareMappingSmokeCommand) return "";
				if (spec === cloudflareTriggersDeployCommand) {
					customDomainsPhase =
						desiredTriggerFailure && options.desiredTriggerPartial
							? "partial"
							: "desired";
					if (desiredTriggerFailure) {
						const failure = desiredTriggerFailure;
						desiredTriggerFailure = undefined;
						throw failure;
					}
					return "";
				}
				if (
					spec.recovery === true &&
					spec.args.includes("triggers") &&
					spec.args.includes("deploy")
				) {
					const configIndex = spec.args.indexOf("--config");
					assert.notEqual(configIndex, -1);
					const configPath = spec.args[configIndex + 1];
					assert.ok(configPath);
					const configDirectoryPath = dirname(configPath);
					const directoryStat = await stat(configDirectoryPath);
					const configStat = await stat(configPath);
					restoredTriggerConfigs.push({
						command: commandLabel(spec),
						content: await readFile(configPath, "utf8"),
						directoryIsDirectory: directoryStat.isDirectory(),
						directoryMode: directoryStat.mode & 0o777,
						directoryPath: configDirectoryPath,
						isRegularFile: configStat.isFile(),
						mode: configStat.mode & 0o777,
						path: configPath,
						stdin: spec.stdin,
					});
					customDomainsPhase = options.restorePartial ? "partial" : "baseline";
					if (options.restoreFailure) throw options.restoreFailure;
					return "";
				}
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
				if (options.activeSmokeFailure) {
					if (options.concurrentDomainsBeforeRollback) {
						customDomainsPhase = "concurrent";
					}
					throw options.activeSmokeFailure;
				}
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

test("candidate upload receives only a secrets file path and activation is separate", () => {
	const secretsFilePath = resolve(tmpdir(), "wrangler-secrets.json");
	const upload = uploadCandidateCommand(expected, state, secretsFilePath);
	assert.match(commandLabel(upload), /wrangler versions upload/u);
	assert.match(commandLabel(upload), /--secrets-file/u);
	assert.ok(upload.args.includes(secretsFilePath));
	assert.ok(!upload.args.includes("/dev/stdin"));
	assert.doesNotMatch(commandLabel(upload), /new-production-status-token/u);
	assert.equal(upload.stdin, undefined);
	assert.doesNotMatch(commandLabel(upload), /secret put|wrangler deploy/u);
	assert.doesNotMatch(
		commandLabel(stageCandidateCommand(state, candidateVersionId)),
		/new-production-status-token/u,
	);
});

test("showcase triggers deploy uses the canonical production Wrangler config", () => {
	assert.deepEqual(cloudflareTriggersDeployCommand.args, [
		"--dir",
		"apps/showcase",
		"exec",
		"wrangler",
		"triggers",
		"deploy",
		"--config",
		"wrangler.jsonc",
		"--env",
		"production",
	]);
	assert.ok((cloudflareTriggersDeployCommand.timeoutMs ?? 0) > 0);
	assert.equal(cloudflareTriggersDeployCommand.recovery, true);
});

test("trigger recovery fingerprints domains, workers.dev, and preview URLs", () => {
	const emptyToOne = triggerRecoveryHashes(
		wranglerSource([], true, true),
		wranglerSource(["showcase.ui.le-mn.com"]),
	);
	const twoToOne = triggerRecoveryHashes(
		wranglerSource(
			["showcase.ui.le-mn.com", "legacy.ui.le-mn.com"],
			true,
			true,
		),
		wranglerSource(["showcase.ui.le-mn.com"]),
	);
	assert.notEqual(
		emptyToOne.baselineTriggersHash,
		emptyToOne.desiredTriggersHash,
	);
	assert.notEqual(twoToOne.baselineTriggersHash, twoToOne.desiredTriggersHash);
	assert.equal(
		triggerRecoveryHashes(
			wranglerSource(["showcase.ui.le-mn.com"]),
			wranglerSource(["showcase.ui.le-mn.com"]),
		).baselineTriggersHash,
		triggerRecoveryHashes(
			wranglerSource(["showcase.ui.le-mn.com"]),
			wranglerSource(["showcase.ui.le-mn.com"]),
		).desiredTriggersHash,
	);
});

test("custom-domain recovery fails closed for unsupported routes, crons, and workers.dev", () => {
	const routeConfig = JSON.parse(wranglerSource([]));
	routeConfig.env.production.routes = [{ pattern: "showcase.ui.le-mn.com/*" }];
	assert.throws(
		() =>
			triggerRecoveryHashes(JSON.stringify(routeConfig), desiredWranglerSource),
		/non-custom route/u,
	);

	const cronConfig = JSON.parse(wranglerSource([]));
	cronConfig.env.production.triggers = { crons: ["0 * * * *"] };
	assert.throws(
		() =>
			triggerRecoveryHashes(JSON.stringify(cronConfig), desiredWranglerSource),
		/cron triggers/u,
	);

	const workersDevConfig = JSON.parse(wranglerSource([]));
	delete workersDevConfig.env.production.workers_dev;
	delete workersDevConfig.workers_dev;
	assert.throws(
		() =>
			triggerRecoveryHashes(
				JSON.stringify(workersDevConfig),
				desiredWranglerSource,
			),
		/resolve workers_dev/u,
	);
	assert.throws(
		() =>
			triggerRecoveryHashes(
				baselineWranglerSource,
				wranglerSource(["showcase.ui.le-mn.com"], true, true),
			),
		/disable workers_dev and preview_urls/u,
	);
});

test("Cloudflare trigger inspection reads exact workers.dev and preview URL state", async () => {
	const requests: string[] = [];
	const fetchImplementation = (async (input: URL | RequestInfo) => {
		requests.push(String(input));
		return new Response(
			JSON.stringify({
				success: true,
				result: { enabled: true, previews_enabled: false },
			}),
			{ status: 200, headers: { "content-type": "application/json" } },
		);
	}) as typeof fetch;
	assert.deepEqual(
		await getCloudflareWorkerSubdomain(
			"account-id",
			"lemn-ui-showcase",
			"test-token",
			fetchImplementation,
		),
		{ enabled: true, previewsEnabled: false },
	);
	assert.deepEqual(requests, [
		"https://api.cloudflare.com/client/v4/accounts/account-id/workers/scripts/lemn-ui-showcase/subdomain",
	]);

	await assert.rejects(
		getCloudflareWorkerSubdomain(
			"account-id",
			"lemn-ui-showcase",
			"test-token",
			(async () =>
				new Response(
					JSON.stringify({ success: true, result: { enabled: true } }),
					{ status: 200 },
				)) as typeof fetch,
		),
		/malformed state/u,
	);
});

test("Cloudflare custom-domain inspection follows pagination without truncation", async () => {
	const pages: number[] = [];
	const fetchImplementation = (async (input: URL | RequestInfo) => {
		const page = Number(new URL(String(input)).searchParams.get("page"));
		pages.push(page);
		const result =
			page === 1
				? Array.from({ length: 100 }, (_, index) => ({
						hostname: `domain-${String(index)}.example.com`,
						service: "lemn-ui-showcase",
					}))
				: [{ hostname: "last.example.com", service: "lemn-ui-showcase" }];
		return new Response(
			JSON.stringify({
				success: true,
				result,
				result_info: { page, total_pages: 2 },
			}),
			{ status: 200 },
		);
	}) as typeof fetch;
	const domains = await listCloudflareCustomDomains(
		"account-id",
		"test-token",
		fetchImplementation,
	);
	assert.equal(domains.length, 101);
	assert.deepEqual(pages, [1, 2]);
});

test("candidate recovery metadata is hash-bound and stays within Cloudflare's message limit", async () => {
	const encoded = encodeCandidateState(state);
	assert.ok(Buffer.byteLength(encoded, "utf8") <= 1_000);
	assert.deepEqual(decodeCandidateState(encoded), state);
	assert.throws(
		() => encodeCandidateState({ ...state, releaseId: "x".repeat(2_000) }),
		/1000-byte message limit/u,
	);

	const platform = fakePlatform({
		candidatePresent: true,
		candidateMessage: encodeCandidateState({
			...state,
			baselineTriggersHash: "f".repeat(64),
		}),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/trigger recovery metadata no longer matches/u,
	);
	assert.equal(platform.counts.stage, 0);
});

test("a partial desired-trigger failure restores and verifies the baseline before surfacing the rollout error", async () => {
	const triggerFailure = new Error(
		"desired triggers failed after partial apply",
	);
	const platform = fakePlatform({
		desiredTriggerFailure: triggerFailure,
		desiredTriggerPartial: true,
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => error === triggerFailure,
	);
	assert.equal(platform.phase, "baseline");
	assert.equal(platform.customDomainsPhase, "baseline");
	assert.equal(platform.restoredTriggerConfigs.length, 1);
	const restored = platform.restoredTriggerConfigs[0];
	assert.ok(restored);
	assert.match(restored.content, /"workers_dev": true/u);
	assert.match(restored.content, /"preview_urls": true/u);
	assert.deepEqual(platform.triggerCleanupPaths, [restored.directoryPath]);
	await assert.rejects(stat(restored.path), { code: "ENOENT" });
	if (process.platform !== "win32") {
		assert.equal(restored.directoryMode, 0o700);
		assert.equal(restored.mode, 0o600);
	}
});

test("an incomplete trigger restore is a RolloutRollbackFailure and never a successful rollback", async () => {
	const platform = fakePlatform({
		activeSmokeFailure: new Error("active smoke failed"),
		restorePartial: true,
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			assert.match(
				safeErrorMessage(error, []),
				/Baseline trigger restoration did not reach/u,
			);
			return true;
		},
	);
	assert.equal(platform.phase, "baseline");
	assert.equal(platform.customDomainsPhase, "partial");
});

test("trigger restore and cleanup failures remain visible together", async () => {
	const platform = fakePlatform({
		activeSmokeFailure: new Error("active smoke failed"),
		restoreFailure: new Error("trigger restore failed"),
		restoreCleanupFailure: new Error("trigger cleanup failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			const message = safeErrorMessage(error, []);
			assert.match(message, /trigger restore failed/u);
			assert.match(message, /trigger cleanup failed/u);
			return true;
		},
	);
});

test("concurrent custom-domain drift immediately before restore is not overwritten", async () => {
	const platform = fakePlatform({
		activeSmokeFailure: new Error("active smoke failed"),
		concurrentDomainsBeforeRollback: true,
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			assert.match(safeErrorMessage(error, []), /trigger drift/u);
			return true;
		},
	);
	assert.equal(platform.restoredTriggerConfigs.length, 0);
	assert.equal(platform.customDomainsPhase, "concurrent");
});

test("a timed-out partial trigger apply restores baseline and a retry resumes the same candidate", async () => {
	const platform = fakePlatform({
		desiredTriggerFailure: new CommandAbortedError(
			"desired trigger apply timed out",
			false,
		),
		desiredTriggerPartial: true,
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/desired trigger apply timed out/u,
	);
	assert.equal(platform.phase, "baseline");
	assert.equal(platform.customDomainsPhase, "baseline");
	await runProductionRollout(input, platform.dependencies);
	assert.equal(platform.phase, "active");
	assert.equal(platform.customDomainsPhase, "desired");
	assert.equal(platform.counts.upload, 1);
});

test("staged and baseline retries repair an owned partial trigger state before resuming", async () => {
	for (const phase of ["staged", "baseline"] as const) {
		const platform = fakePlatform({
			phase,
			candidatePresent: true,
			customDomainsPhase: "partial",
		});
		await runProductionRollout(input, platform.dependencies);
		assert.equal(platform.phase, "active");
		assert.equal(platform.customDomainsPhase, "desired");
		assert.ok(platform.restoredTriggerConfigs.length >= 1);
	}
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
	assert.equal(platform.uploads.length, 1);
	const upload = platform.uploads[0];
	assert.ok(upload);
	assert.equal(upload.directoryIsDirectory, true);
	assert.equal(upload.isRegularFile, true);
	if (process.platform !== "win32") {
		assert.equal(upload.directoryMode, 0o700);
		assert.equal(upload.mode, 0o600);
	}
	assert.match(
		basename(upload.directoryPath),
		/^lemn-ui-showcase-secrets-.{6}$/u,
	);
	assert.equal(
		upload.content,
		JSON.stringify({ STATUS_TOKEN: input.productionStatusToken }),
	);
	assert.equal(upload.stdin, undefined);
	assert.notEqual(upload.path, "/dev/stdin");
	assert.doesNotMatch(upload.command, /new-production-status-token/u);
	await assert.rejects(stat(upload.path), { code: "ENOENT" });
	assert.deepEqual(platform.cleanupPaths, [upload.directoryPath]);
	assert.ok(
		platform.events.indexOf(commandLabel(cloudflareTriggersDeployCommand)) <
			platform.events.indexOf(commandLabel(cloudflareMappingSmokeCommand)),
	);
	assert.ok(
		platform.events.indexOf(commandLabel(cloudflareMappingSmokeCommand)) <
			platform.events.indexOf(
				`production:${input.productionStatusToken}:${candidateVersionId}`,
			),
	);
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

test("candidate secrets file is removed when upload fails", async () => {
	const platform = fakePlatform({
		uploadFailure: new Error("candidate upload failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/candidate upload failed/u,
	);
	assert.equal(platform.uploads.length, 1);
	const upload = platform.uploads[0];
	assert.ok(upload);
	await assert.rejects(stat(upload.path), { code: "ENOENT" });
	assert.deepEqual(platform.cleanupPaths, [upload.directoryPath]);
	assert.equal(platform.counts.rollback, 0);
});

test("candidate cleanup failure is surfaced after a successful upload", async () => {
	const cleanupFailure = new Error("candidate temporary cleanup failed");
	const platform = fakePlatform({ cleanupFailure });
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => error === cleanupFailure,
	);
	assert.equal(platform.uploads.length, 1);
	const upload = platform.uploads[0];
	assert.ok(upload);
	await assert.rejects(stat(upload.path), { code: "ENOENT" });
	assert.deepEqual(platform.cleanupPaths, [upload.directoryPath]);
	assert.equal(platform.counts.rollback, 0);
	assert.doesNotMatch(
		safeErrorMessage(cleanupFailure, [
			input.productionStatusToken,
			input.rollbackStatusToken,
		]),
		/new-production-status-token|previous-production-status-token/u,
	);
});

test("candidate upload and cleanup failures remain ordered and inspectable", async () => {
	const uploadFailure = new Error("candidate upload failed");
	const cleanupFailure = new Error("candidate temporary cleanup failed");
	const platform = fakePlatform({ cleanupFailure, uploadFailure });
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof AggregateError);
			assert.equal(error.errors.length, 2);
			assert.equal(error.errors[0], uploadFailure);
			assert.equal(error.errors[1], cleanupFailure);
			assert.equal(
				error.message,
				"Worker candidate upload and temporary secret cleanup both failed",
			);
			const structuredMessages = [error.message, ...error.errors]
				.map((value) =>
					value instanceof Error ? value.message : String(value),
				)
				.join("; ");
			assert.doesNotMatch(
				structuredMessages,
				/new-production-status-token|previous-production-status-token/u,
			);
			const safeMessage = safeErrorMessage(error, [
				input.productionStatusToken,
				input.rollbackStatusToken,
			]);
			assert.match(safeMessage, /candidate upload failed/u);
			assert.match(safeMessage, /candidate temporary cleanup failed/u);
			assert.doesNotMatch(
				safeMessage,
				/new-production-status-token|previous-production-status-token/u,
			);
			return true;
		},
	);
	assert.equal(platform.uploads.length, 1);
	const upload = platform.uploads[0];
	assert.ok(upload);
	assert.doesNotMatch(
		upload.command,
		/new-production-status-token|previous-production-status-token/u,
	);
	await assert.rejects(stat(upload.path), { code: "ENOENT" });
	assert.deepEqual(platform.cleanupPaths, [upload.directoryPath]);
	assert.equal(platform.counts.rollback, 0);
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
			const upload = platform.uploads[0];
			assert.ok(upload);
			await assert.rejects(stat(upload.path), { code: "ENOENT" });
			assert.deepEqual(platform.cleanupPaths, [upload.directoryPath]);
		}
		if (boundary === "stage") {
			assert.equal(platform.counts.stage, countsAfterCancellation.stage);
		}
		if (boundary === "activate") {
			assert.equal(platform.counts.activate, countsAfterCancellation.activate);
		}
	});
}

test("a timed-out candidate upload still reaches tempfile cleanup", async () => {
	const platform = fakePlatform({ timeoutAfter: "upload" });
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) =>
			error instanceof CommandAbortedError && error.interrupted === false,
	);
	assert.equal(platform.uploads.length, 1);
	const upload = platform.uploads[0];
	assert.ok(upload);
	await assert.rejects(stat(upload.path), { code: "ENOENT" });
	assert.deepEqual(platform.cleanupPaths, [upload.directoryPath]);
});

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
	assert.ok(
		platform.events.includes(commandLabel(cloudflareTriggersDeployCommand)),
	);
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

test("a failed Worker rollback refuses trigger restoration and preserves both errors", async () => {
	const platform = fakePlatform({
		activeSmokeFailure: new Error("new token smoke failed"),
		rollbackFailure: new Error("rollback command failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			const message = safeErrorMessage(error, []);
			assert.match(message, /new token smoke failed/u);
			assert.match(message, /rollback command failed/u);
			return true;
		},
	);
	assert.equal(platform.restoredTriggerConfigs.length, 0);
	assert.equal(
		platform.events.filter((event) =>
			event.endsWith(`:${previousIdentity.gitSha}`),
		).length,
		1,
	);
});

test("a concurrent deployment after rollback command is never overwritten by trigger recovery", async () => {
	const platform = fakePlatform({
		activeSmokeFailure: new Error("new token smoke failed"),
		concurrentAfterRollback: true,
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			assert.match(safeErrorMessage(error, []), /concurrent deployment/u);
			return true;
		},
	);
	assert.equal(platform.phase, "concurrent");
	assert.equal(platform.restoredTriggerConfigs.length, 0);
});

test("error formatting redacts both status tokens", () => {
	const adminAccessSecret = "showcase-admin-access-secret";
	const message = safeErrorMessage(
		new RolloutRollbackFailure(
			new Error(`failed ${input.productionStatusToken} ${adminAccessSecret}`),
			new Error(`failed ${input.rollbackStatusToken}`),
		),
		[input.productionStatusToken, input.rollbackStatusToken, adminAccessSecret],
	);
	assert.doesNotMatch(message, /new-production-status-token/u);
	assert.doesNotMatch(message, /previous-production-status-token/u);
	assert.doesNotMatch(message, /showcase-admin-access-secret/u);
	assert.equal(message.match(/\[REDACTED\]/gu)?.length, 3);
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
