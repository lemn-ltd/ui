import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import {
	accessAudienceBindingsFromEnvironment,
	accessAudienceBindingsHash,
	activateCandidateCommand,
	activeDeploymentFromJson,
	attachCloudflareCustomDomain,
	baselinePortalConfigCommand,
	buildPortalCommand,
	CommandAbortedError,
	type CommandSpec,
	ConcurrentDeploymentError,
	candidateTag,
	cloudflareMappingSmokeCommand,
	cloudflareTriggersDeployCommand,
	cloudflareWorkerExists,
	createCommandRunner,
	decodeCandidateState,
	deleteCloudflareWorker,
	deploymentListCommand,
	detachCloudflareCustomDomain,
	encodeCandidateState,
	getCloudflareWorkerSubdomain,
	listCloudflareCustomDomains,
	RolloutRollbackFailure,
	removeTriggerTemporaryRoot,
	rollbackCommand,
	runProductionRollout,
	safeErrorMessage,
	stageCandidateCommand,
	triggerRecoveryHashes,
	type UpgradeCandidateRecoveryState,
	uploadCandidateCommand,
	versionListCommand,
} from "../../scripts/release/ui-portal-production-rollout.ts";

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
const accessAudiences = {
	admin: "a".repeat(64),
	health: "b".repeat(64),
};
const cloudflareEnvironment = {
	CLOUDFLARE_ACCOUNT_ID: "account-id",
};
const input = {
	releaseId: `@lemn-ltd/ui@${expected.version}#${expected.gitSha}`,
	expected,
	access: {
		clientId: "ui-portal-release.access",
		clientSecret: "ui-portal-release-secret",
	},
	accessAudiences,
};

function wranglerSource(
	hostnames: readonly string[],
	workersDev = false,
	previewUrls = workersDev,
): string {
	return JSON.stringify({
		name: "lemn-ui-portal",
		main: "src/worker/index.ts",
		compatibility_date: "2026-05-14",
		workers_dev: workersDev,
		preview_urls: previewUrls,
		routes: hostnames.map((pattern) => ({
			pattern,
			custom_domain: true,
		})),
	});
}

const baselineWranglerSource = wranglerSource(
	["portal.ui.le-mn.com"],
	true,
	true,
);
const desiredWranglerSource = wranglerSource([
	"portal.ui.le-mn.com",
	"schemas.ui.le-mn.com",
]);
const triggerHashes = triggerRecoveryHashes(
	baselineWranglerSource,
	desiredWranglerSource,
	cloudflareEnvironment,
);
const state: UpgradeCandidateRecoveryState = {
	schema: 6,
	mode: "upgrade",
	releaseId: input.releaseId,
	expected,
	baselineVersionId,
	baselineIdentity: previousIdentity,
	...triggerHashes,
	accessAudiencesHash: accessAudienceBindingsHash(accessAudiences),
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
	const triggerCleanupPaths: string[] = [];
	const uploads: string[] = [];
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
			environment: cloudflareEnvironment,
			async workerExists() {
				return true;
			},
			async readDesiredPortalConfig() {
				return options.desiredConfigSource ?? desiredWranglerSource;
			},
			async listCustomDomains(accountId: string) {
				assert.equal(accountId, "account-id");
				events.push(`domains:${customDomainsPhase}`);
				if (customDomainsPhase === "baseline") {
					return (
						options.baselineDomains ?? [
							{
								hostname: "portal.ui.le-mn.com",
								service: "lemn-ui-portal",
							},
						]
					);
				}
				if (customDomainsPhase === "desired") {
					return (
						options.desiredDomains ?? [
							{
								hostname: "portal.ui.le-mn.com",
								service: "lemn-ui-portal",
							},
							{ hostname: "schemas.ui.le-mn.com", service: "lemn-ui-portal" },
						]
					);
				}
				if (customDomainsPhase === "partial") {
					return (
						options.partialDomains ?? [
							{ hostname: "schemas.ui.le-mn.com", service: "lemn-ui-portal" },
						]
					);
				}
				return [{ hostname: "portal.ui.le-mn.com", service: "other-worker" }];
			},
			async getWorkerSubdomain(accountId: string, workerName: string) {
				assert.equal(accountId, "account-id");
				assert.equal(workerName, "lemn-ui-portal");
				events.push(`subdomain:${customDomainsPhase}`);
				return customDomainsPhase === "baseline"
					? { enabled: true, previewsEnabled: true }
					: { enabled: false, previewsEnabled: false };
			},
			async waitForDomainPropagation() {},
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
					baselinePortalConfigCommand(previousIdentity.gitSha).args.join(" ")
				) {
					return options.baselineConfigSource ?? baselineWranglerSource;
				}
				if (spec.args.join(" ") === deploymentListCommand.args.join(" ")) {
					return deploymentJson(phase);
				}
				if (spec.args.join(" ") === versionListCommand.args.join(" ")) {
					return candidateVersionsJson(candidatePresent, candidateMessage);
				}
				if (spec === buildPortalCommand) {
					counts.build += 1;
					boundary("build");
					return "";
				}
				if (spec.args.includes("upload")) {
					counts.upload += 1;
					uploads.push(commandLabel(spec));
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
				credentials: typeof input.access;
				expected?: typeof expected;
			}) {
				events.push(
					`protected:${smokeInput.credentials.clientId}:${smokeInput.expected?.gitSha ?? "capture"}`,
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
				access: typeof input.access;
				portalVersionId?: string;
			}) {
				events.push(
					`production:${smokeInput.access.clientId}:${smokeInput.portalVersionId ?? "active"}`,
				);
				if (smokeInput.portalVersionId) {
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

function fakeBootstrapPlatform(
	options: {
		activeSmokeFailure?: Error;
		concurrentSchemaTakeover?: boolean;
		deleteFailure?: Error;
		timeoutAfterUpload?: boolean;
	} = {},
) {
	let workerPresent = false;
	let candidatePresent = false;
	let candidateMessage = "";
	let deploymentMessage = "";
	let deploymentPresent = false;
	let timeoutAfterUpload = options.timeoutAfterUpload ?? false;
	const domains = new Map([
		[
			"schemas.ui.le-mn.com",
			{ id: "schemas-domain-id", service: "legacy-schema-worker" },
		],
		[
			"unrelated.le-mn.com",
			{ id: "unrelated-domain-id", service: "unrelated-worker" },
		],
	]);
	const events: string[] = [];
	let deleteCount = 0;
	let buildCount = 0;
	let uploadCount = 0;

	const currentDomains = () =>
		[...domains.entries()].map(([hostname, value]) => ({
			id: value.id,
			hostname,
			service: value.service,
		}));

	const dependencies = {
		environment: cloudflareEnvironment,
		async readDesiredPortalConfig() {
			return desiredWranglerSource;
		},
		async workerExists() {
			events.push(`worker:${workerPresent ? "present" : "absent"}`);
			return workerPresent;
		},
		async listCustomDomains() {
			events.push("domains:list");
			return currentDomains();
		},
		async getWorkerSubdomain() {
			assert.equal(workerPresent, true);
			return { enabled: false, previewsEnabled: false };
		},
		async attachDomain(
			_accountId: string,
			hostname: string,
			workerName: string,
		) {
			const previous = domains.get(hostname)?.service ?? "absent";
			events.push(`attach:${hostname}:${previous}->${workerName}`);
			domains.set(hostname, {
				id: `${hostname}-domain-id`,
				service: workerName,
			});
			if (
				options.concurrentSchemaTakeover &&
				hostname === "portal.ui.le-mn.com"
			) {
				domains.set("schemas.ui.le-mn.com", {
					id: "schemas-domain-id",
					service: "concurrent-schema-worker",
				});
			}
		},
		async detachDomain(_accountId: string, domainId: string) {
			const match = [...domains.entries()].find(
				([, value]) => value.id === domainId,
			);
			assert.ok(match);
			events.push(`detach:${match[0]}`);
			domains.delete(match[0]);
		},
		async deleteWorker() {
			events.push("worker:delete");
			if (options.deleteFailure) throw options.deleteFailure;
			deleteCount += 1;
			workerPresent = false;
			candidatePresent = false;
			deploymentPresent = false;
			candidateMessage = "";
			deploymentMessage = "";
		},
		async waitForDomainPropagation() {},
		async runCommand(spec: CommandSpec) {
			events.push(commandLabel(spec));
			if (spec.args.join(" ") === versionListCommand.args.join(" ")) {
				return candidateVersionsJson(candidatePresent, candidateMessage);
			}
			if (spec.args.join(" ") === deploymentListCommand.args.join(" ")) {
				return deploymentPresent
					? JSON.stringify([
							{
								id: deploymentIds.active,
								created_on: "2026-07-14T00:00:00Z",
								annotations: { "workers/message": deploymentMessage },
								versions: [
									{
										version_id: candidateVersionId,
										percentage: 100,
									},
								],
							},
						])
					: "[]";
			}
			if (spec === buildPortalCommand) {
				buildCount += 1;
				return "";
			}
			if (spec.args.includes("upload")) {
				uploadCount += 1;
				workerPresent = true;
				candidatePresent = true;
				const messageIndex = spec.args.indexOf("--message");
				candidateMessage = spec.args[messageIndex + 1] ?? "";
				if (timeoutAfterUpload) {
					timeoutAfterUpload = false;
					throw new CommandAbortedError("bootstrap upload timed out", false);
				}
				return "";
			}
			if (spec.args.includes(`${candidateVersionId}@100%`)) {
				deploymentPresent = true;
				const messageIndex = spec.args.indexOf("--message");
				deploymentMessage = spec.args[messageIndex + 1] ?? "";
				return "";
			}
			if (spec === cloudflareMappingSmokeCommand) return "";
			throw new Error(`Unexpected bootstrap command: ${commandLabel(spec)}`);
		},
		async smokeProtected() {
			throw new Error(
				"Bootstrap must not capture a nonexistent protected baseline",
			);
		},
		async smokeProduction(smokeInput: { portalVersionId?: string }) {
			events.push(
				smokeInput.portalVersionId ? "smoke:candidate" : "smoke:active",
			);
			if (options.activeSmokeFailure) throw options.activeSmokeFailure;
		},
		async writeSummary() {
			events.push("summary");
		},
	};

	return {
		dependencies,
		domains,
		events,
		get buildCount() {
			return buildCount;
		},
		get deleteCount() {
			return deleteCount;
		},
		get deploymentPresent() {
			return deploymentPresent;
		},
		get uploadCount() {
			return uploadCount;
		},
		get workerPresent() {
			return workerPresent;
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

test("candidate upload carries only immutable build metadata and activation is separate", () => {
	const upload = uploadCandidateCommand(expected, state, accessAudiences);
	assert.match(commandLabel(upload), /wrangler versions upload/u);
	assert.doesNotMatch(commandLabel(upload), /--secrets-file|secret put/u);
	assert.match(commandLabel(upload), /BUILD_VERSION:0\.1\.3/u);
	assert.match(
		commandLabel(upload),
		new RegExp(`BUILD_GIT_SHA:${expected.gitSha}`, "u"),
	);
	assert.match(
		commandLabel(upload),
		new RegExp(`ACCESS_AUDIENCE:${accessAudiences.admin}`, "u"),
	);
	assert.match(
		commandLabel(upload),
		new RegExp(`ACCESS_HEALTH_AUDIENCE:${accessAudiences.health}`, "u"),
	);
	assert.deepEqual(upload.redactedValues, [
		accessAudiences.admin,
		accessAudiences.health,
	]);
	assert.equal(upload.stdin, undefined);
	assert.doesNotMatch(commandLabel(upload), /wrangler deploy/u);
});

test("production Access audiences are exact, distinct, and environment-owned", async () => {
	assert.deepEqual(
		accessAudienceBindingsFromEnvironment({
			PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE: accessAudiences.admin,
			PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE: accessAudiences.health,
		}),
		accessAudiences,
	);
	for (const invalidAudiences of [
		{ ...accessAudiences, admin: "" },
		{ ...accessAudiences, health: "c".repeat(63) },
		{ ...accessAudiences, health: accessAudiences.admin },
	]) {
		const platform = fakePlatform();
		await assert.rejects(
			runProductionRollout(
				{ ...input, accessAudiences: invalidAudiences },
				platform.dependencies,
			),
			/(?:64 lowercase hex characters|must be distinct)/u,
		);
		assert.deepEqual(platform.events, []);
	}
});

test("portal triggers deploy uses the canonical production Wrangler config", () => {
	assert.deepEqual(cloudflareTriggersDeployCommand.args, [
		"--dir",
		"apps/ui-portal",
		"exec",
		"wrangler",
		"triggers",
		"deploy",
		"--config",
		"wrangler.jsonc",
	]);
	assert.ok((cloudflareTriggersDeployCommand.timeoutMs ?? 0) > 0);
	assert.equal(cloudflareTriggersDeployCommand.recovery, true);
});

test("trigger recovery fingerprints domains, workers.dev, and preview URLs", () => {
	const emptyToOne = triggerRecoveryHashes(
		wranglerSource([], true, true),
		wranglerSource(["portal.ui.le-mn.com"]),
		cloudflareEnvironment,
	);
	const twoToOne = triggerRecoveryHashes(
		wranglerSource(["portal.ui.le-mn.com", "legacy.ui.le-mn.com"], true, true),
		wranglerSource(["portal.ui.le-mn.com"]),
		cloudflareEnvironment,
	);
	assert.notEqual(
		emptyToOne.baselineTriggersHash,
		emptyToOne.desiredTriggersHash,
	);
	assert.notEqual(twoToOne.baselineTriggersHash, twoToOne.desiredTriggersHash);
	assert.equal(
		triggerRecoveryHashes(
			wranglerSource(["portal.ui.le-mn.com"]),
			wranglerSource(["portal.ui.le-mn.com"]),
			cloudflareEnvironment,
		).baselineTriggersHash,
		triggerRecoveryHashes(
			wranglerSource(["portal.ui.le-mn.com"]),
			wranglerSource(["portal.ui.le-mn.com"]),
			cloudflareEnvironment,
		).desiredTriggersHash,
	);
});

test("production-like generic Wrangler config resolves the account from the environment", () => {
	assert.doesNotMatch(desiredWranglerSource, /account_id/u);
	assert.doesNotThrow(() =>
		triggerRecoveryHashes(
			baselineWranglerSource,
			desiredWranglerSource,
			cloudflareEnvironment,
		),
	);
	assert.throws(
		() =>
			triggerRecoveryHashes(baselineWranglerSource, desiredWranglerSource, {}),
		/CLOUDFLARE_ACCOUNT_ID/u,
	);
});

test("Wrangler account_id takes precedence over the environment, matching Wrangler", () => {
	const configOwned = JSON.stringify({
		...JSON.parse(desiredWranglerSource),
		account_id: "config-account",
	});
	const configHash = triggerRecoveryHashes(configOwned, configOwned, {
		CLOUDFLARE_ACCOUNT_ID: "different-account",
	}).baselineTriggersHash;
	const equivalentEnvironmentHash = triggerRecoveryHashes(
		desiredWranglerSource,
		desiredWranglerSource,
		{ CLOUDFLARE_ACCOUNT_ID: "config-account" },
	).baselineTriggersHash;
	assert.equal(configHash, equivalentEnvironmentHash);
});

test("custom-domain recovery fails closed for unsupported routes, crons, and workers.dev", () => {
	const routeConfig = JSON.parse(wranglerSource([]));
	routeConfig.routes = [{ pattern: "portal.ui.le-mn.com/*" }];
	assert.throws(
		() =>
			triggerRecoveryHashes(
				JSON.stringify(routeConfig),
				desiredWranglerSource,
				cloudflareEnvironment,
			),
		/non-custom route/u,
	);

	const cronConfig = JSON.parse(wranglerSource([]));
	cronConfig.triggers = { crons: ["0 * * * *"] };
	assert.throws(
		() =>
			triggerRecoveryHashes(
				JSON.stringify(cronConfig),
				desiredWranglerSource,
				cloudflareEnvironment,
			),
		/cron triggers/u,
	);

	const workersDevConfig = JSON.parse(wranglerSource([]));
	delete workersDevConfig.workers_dev;
	assert.throws(
		() =>
			triggerRecoveryHashes(
				JSON.stringify(workersDevConfig),
				desiredWranglerSource,
				cloudflareEnvironment,
			),
		/resolve workers_dev/u,
	);
	assert.throws(
		() =>
			triggerRecoveryHashes(
				baselineWranglerSource,
				wranglerSource(["portal.ui.le-mn.com"], true, true),
				cloudflareEnvironment,
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
			"lemn-ui-portal",
			"test-token",
			fetchImplementation,
		),
		{ enabled: true, previewsEnabled: false },
	);
	assert.deepEqual(requests, [
		"https://api.cloudflare.com/client/v4/accounts/account-id/workers/scripts/lemn-ui-portal/subdomain",
	]);

	await assert.rejects(
		getCloudflareWorkerSubdomain(
			"account-id",
			"lemn-ui-portal",
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
						id: `domain-${String(index)}`,
						hostname: `domain-${String(index)}.example.com`,
						service: "lemn-ui-portal",
					}))
				: [
						{
							id: "domain-last",
							hostname: "last.example.com",
							service: "lemn-ui-portal",
						},
					];
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

test("Cloudflare bootstrap adapters use scoped endpoints and never expose credentials", async () => {
	const token = "bootstrap-api-token";
	const requests: Array<{
		readonly body: string | undefined;
		readonly method: string;
		readonly url: string;
	}> = [];
	const fetchImplementation = (async (
		input: URL | RequestInfo,
		init?: RequestInit,
	) => {
		assert.equal(
			new Headers(init?.headers).get("authorization"),
			`Bearer ${token}`,
		);
		requests.push({
			body: typeof init?.body === "string" ? init.body : undefined,
			method: init?.method ?? "GET",
			url: String(input),
		});
		if (String(input).endsWith("/workers/scripts")) {
			return new Response(
				JSON.stringify({
					success: true,
					result: [{ id: "lemn-ui-portal" }, { id: "another-worker" }],
				}),
				{ status: 200 },
			);
		}
		return new Response(JSON.stringify({ success: true, result: null }), {
			status: 200,
		});
	}) as typeof fetch;

	assert.equal(
		await cloudflareWorkerExists(
			"account-id",
			"lemn-ui-portal",
			token,
			fetchImplementation,
		),
		true,
	);
	await attachCloudflareCustomDomain(
		"account-id",
		"portal.ui.le-mn.com",
		"lemn-ui-portal",
		token,
		fetchImplementation,
	);
	await detachCloudflareCustomDomain(
		"account-id",
		"domain/id",
		token,
		fetchImplementation,
	);
	await deleteCloudflareWorker(
		"account-id",
		"lemn-ui-portal",
		token,
		fetchImplementation,
	);

	assert.deepEqual(requests, [
		{
			body: undefined,
			method: "GET",
			url: "https://api.cloudflare.com/client/v4/accounts/account-id/workers/scripts",
		},
		{
			body: JSON.stringify({
				hostname: "portal.ui.le-mn.com",
				service: "lemn-ui-portal",
			}),
			method: "PUT",
			url: "https://api.cloudflare.com/client/v4/accounts/account-id/workers/domains",
		},
		{
			body: undefined,
			method: "DELETE",
			url: "https://api.cloudflare.com/client/v4/accounts/account-id/workers/domains/domain%2Fid",
		},
		{
			body: undefined,
			method: "DELETE",
			url: "https://api.cloudflare.com/client/v4/accounts/account-id/workers/scripts/lemn-ui-portal",
		},
	]);

	await assert.rejects(
		deleteCloudflareWorker(
			"account-id",
			"lemn-ui-portal",
			token,
			(async () =>
				new Response(JSON.stringify({ success: false }), {
					status: 403,
				})) as typeof fetch,
		),
		(error) => {
			const message = safeErrorMessage(error, [token]);
			assert.match(message, /HTTP 403/u);
			assert.equal(message.includes(token), false);
			return true;
		},
	);
});

test("first rollout bootstraps only after candidate upload and preserves unrelated domains", async () => {
	const platform = fakeBootstrapPlatform();
	await runProductionRollout(input, platform.dependencies);
	assert.equal(platform.workerPresent, true);
	assert.equal(platform.deploymentPresent, true);
	assert.equal(platform.buildCount, 1);
	assert.equal(platform.uploadCount, 1);
	assert.equal(platform.deleteCount, 0);
	assert.equal(
		platform.domains.get("portal.ui.le-mn.com")?.service,
		"lemn-ui-portal",
	);
	assert.equal(
		platform.domains.get("schemas.ui.le-mn.com")?.service,
		"lemn-ui-portal",
	);
	assert.equal(
		platform.domains.get("unrelated.le-mn.com")?.service,
		"unrelated-worker",
	);
	const deployIndex = platform.events.findIndex((event) =>
		event.includes(`${candidateVersionId}@100%`),
	);
	const firstAttachIndex = platform.events.findIndex((event) =>
		event.startsWith("attach:"),
	);
	assert.ok(deployIndex >= 0 && deployIndex < firstAttachIndex);
	assert.ok(
		platform.events.indexOf("smoke:candidate") <
			platform.events.indexOf("smoke:active"),
	);
	assert.equal(platform.events.at(-1), "summary");
});

test("bootstrap upload timeout resumes the persisted candidate without rebuilding", async () => {
	const platform = fakeBootstrapPlatform({ timeoutAfterUpload: true });
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/bootstrap upload timed out/u,
	);
	assert.equal(platform.workerPresent, true);
	assert.equal(platform.deploymentPresent, false);
	await runProductionRollout(input, platform.dependencies);
	assert.equal(platform.workerPresent, true);
	assert.equal(platform.deploymentPresent, true);
	assert.equal(platform.buildCount, 1);
	assert.equal(platform.uploadCount, 1);
});

test("failed bootstrap restores every prior hostname owner before deleting its Worker", async () => {
	const platform = fakeBootstrapPlatform({
		activeSmokeFailure: new Error("bootstrap smoke failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/bootstrap smoke failed/u,
	);
	assert.equal(platform.workerPresent, false);
	assert.equal(platform.deploymentPresent, false);
	assert.equal(platform.deleteCount, 1);
	assert.equal(platform.domains.has("portal.ui.le-mn.com"), false);
	assert.equal(
		platform.domains.get("schemas.ui.le-mn.com")?.service,
		"legacy-schema-worker",
	);
	assert.equal(
		platform.domains.get("unrelated.le-mn.com")?.service,
		"unrelated-worker",
	);
	const lastRestoreIndex = platform.events.reduce(
		(lastIndex, event, index) =>
			event.startsWith("attach:schemas.ui.le-mn.com") ||
			event === "detach:portal.ui.le-mn.com"
				? index
				: lastIndex,
		-1,
	);
	assert.notEqual(lastRestoreIndex, -1);
	assert.ok(platform.events.indexOf("worker:delete") > lastRestoreIndex);
});

test("bootstrap rollback never overwrites a concurrently reassigned hostname", async () => {
	const platform = fakeBootstrapPlatform({ concurrentSchemaTakeover: true });
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			assert.match(
				safeErrorMessage(error, []),
				/concurrently during bootstrap rollback/u,
			);
			return true;
		},
	);
	assert.equal(platform.deleteCount, 0);
	assert.equal(platform.workerPresent, true);
	assert.equal(
		platform.domains.get("schemas.ui.le-mn.com")?.service,
		"concurrent-schema-worker",
	);
	assert.equal(
		platform.domains.get("unrelated.le-mn.com")?.service,
		"unrelated-worker",
	);
});

test("bootstrap deletion failure leaves the restored baseline visible and retryable", async () => {
	const platform = fakeBootstrapPlatform({
		activeSmokeFailure: new Error("bootstrap smoke failed"),
		deleteFailure: new Error("bootstrap delete failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			assert.match(safeErrorMessage(error, []), /bootstrap delete failed/u);
			return true;
		},
	);
	assert.equal(platform.workerPresent, true);
	assert.equal(platform.deploymentPresent, true);
	assert.equal(platform.deleteCount, 0);
	assert.equal(platform.domains.has("portal.ui.le-mn.com"), false);
	assert.equal(
		platform.domains.get("schemas.ui.le-mn.com")?.service,
		"legacy-schema-worker",
	);
	assert.equal(
		platform.domains.get("unrelated.le-mn.com")?.service,
		"unrelated-worker",
	);
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
	assert.match(platform.uploads[0] ?? "", /wrangler versions upload/u);
	assert.doesNotMatch(platform.uploads[0] ?? "", /--secrets-file|secret put/u);
	assert.ok(
		platform.events.indexOf(commandLabel(cloudflareTriggersDeployCommand)) <
			platform.events.indexOf(commandLabel(cloudflareMappingSmokeCommand)),
	);
	assert.ok(
		platform.events.indexOf(commandLabel(cloudflareMappingSmokeCommand)) <
			platform.events.indexOf(
				`production:${input.access.clientId}:${candidateVersionId}`,
			),
	);
	assert.ok(
		platform.events.indexOf(
			`production:${input.access.clientId}:${candidateVersionId}`,
		) <
			platform.events.indexOf(
				commandLabel(activateCandidateCommand(state, candidateVersionId)),
			),
	);
	assert.equal(platform.events.at(-1), "summary");
});

test("candidate upload failure is surfaced before any deployment mutation", async () => {
	const platform = fakePlatform({
		uploadFailure: new Error("candidate upload failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		/candidate upload failed/u,
	);
	assert.equal(platform.uploads.length, 1);
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
		}
		if (boundary === "stage") {
			assert.equal(platform.counts.stage, countsAfterCancellation.stage);
		}
		if (boundary === "activate") {
			assert.equal(platform.counts.activate, countsAfterCancellation.activate);
		}
	});
}

test("a timed-out candidate upload remains resumable without credential artifacts", async () => {
	const platform = fakePlatform({ timeoutAfter: "upload" });
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) =>
			error instanceof CommandAbortedError && error.interrupted === false,
	);
	assert.equal(platform.uploads.length, 1);
	assert.doesNotMatch(platform.uploads[0] ?? "", /--secrets-file|secret put/u);
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
		activeSmokeFailure: new Error("new service smoke failed"),
		rollbackFailure: new Error("rollback command failed"),
	});
	await assert.rejects(
		runProductionRollout(input, platform.dependencies),
		(error) => {
			assert(error instanceof RolloutRollbackFailure);
			const message = safeErrorMessage(error, []);
			assert.match(message, /new service smoke failed/u);
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
		activeSmokeFailure: new Error("new service smoke failed"),
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

test("error formatting redacts Access credentials and audience bindings", () => {
	const message = safeErrorMessage(
		new RolloutRollbackFailure(
			new Error(
				`failed ${input.access.clientId} ${input.accessAudiences.admin}`,
			),
			new Error(
				`failed ${input.access.clientSecret} ${input.accessAudiences.health}`,
			),
		),
		[
			input.access.clientId,
			input.access.clientSecret,
			input.accessAudiences.admin,
			input.accessAudiences.health,
		],
	);
	assert.doesNotMatch(message, /ui-portal-release\.access/u);
	assert.doesNotMatch(message, /ui-portal-release-secret/u);
	assert.doesNotMatch(message, new RegExp(input.accessAudiences.admin, "u"));
	assert.doesNotMatch(message, new RegExp(input.accessAudiences.health, "u"));
	assert.equal(message.match(/\[REDACTED\]/gu)?.length, 4);
});

test("release child commands inherit only their explicit environment allowlist", async () => {
	const cloudflareToken = "synthetic-cloudflare-token-do-not-use";
	const sourceEnvironment: NodeJS.ProcessEnv = {
		CLOUDFLARE_ACCOUNT_ID: "account-id",
		CLOUDFLARE_API_TOKEN: cloudflareToken,
		GITHUB_TOKEN: "synthetic-github-token-do-not-use",
		HOME: process.env.HOME,
		PATH: process.env.PATH,
		UI_PORTAL_ACCESS_CLIENT_ID: "synthetic-access-id-do-not-use",
		UI_PORTAL_ACCESS_CLIENT_SECRET: "synthetic-access-secret-do-not-use",
	};
	const inspectEnvironment = [
		"-e",
		`console.log(JSON.stringify({ cloudflare: process.env.CLOUDFLARE_API_TOKEN ?? null, github: process.env.GITHUB_TOKEN ?? null, accessId: process.env.UI_PORTAL_ACCESS_CLIENT_ID ?? null, accessSecret: process.env.UI_PORTAL_ACCESS_CLIENT_SECRET ?? null }))`,
	];
	const isolated = await createCommandRunner(
		undefined,
		sourceEnvironment,
	)({
		command: process.execPath,
		args: inspectEnvironment,
		captureOutput: true,
	});
	assert.deepEqual(JSON.parse(isolated), {
		cloudflare: null,
		github: null,
		accessId: null,
		accessSecret: null,
	});

	const scoped = await createCommandRunner(
		undefined,
		sourceEnvironment,
	)({
		command: process.execPath,
		args: [
			"-e",
			`console.log([process.env.CLOUDFLARE_API_TOKEN, process.env.CLOUDFLARE_ACCOUNT_ID, process.env.GITHUB_TOKEN ?? "absent"].join("|"))`,
		],
		captureOutput: true,
		inheritedEnvironmentKeys: ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"],
	});
	assert.equal(scoped.trim(), "[REDACTED]|account-id|absent");
	assert.doesNotMatch(scoped, new RegExp(cloudflareToken, "u"));
});

test("only Cloudflare command specs request the scoped Cloudflare environment", () => {
	const cloudflareKeys = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];
	for (const command of [
		deploymentListCommand,
		versionListCommand,
		cloudflareMappingSmokeCommand,
		cloudflareTriggersDeployCommand,
		uploadCandidateCommand(expected, state, accessAudiences),
		stageCandidateCommand(state, candidateVersionId),
		activateCandidateCommand(state, candidateVersionId),
		rollbackCommand(baselineVersionId),
	]) {
		assert.deepEqual(command.inheritedEnvironmentKeys, cloudflareKeys);
	}
	assert.equal(buildPortalCommand.inheritedEnvironmentKeys, undefined);
	assert.equal(
		baselinePortalConfigCommand(previousIdentity.gitSha)
			.inheritedEnvironmentKeys,
		undefined,
	);
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
