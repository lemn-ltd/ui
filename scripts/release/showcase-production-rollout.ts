#!/usr/bin/env node
import { type ChildProcess, spawn } from "node:child_process";
import { appendFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
	type BuildIdentity,
	smokeProductionDeployment,
	smokeProtectedStatusRoutes,
} from "./deployment-smoke.ts";

const root = resolve(import.meta.dirname, "../..");
const versionIdPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const releaseShaPattern = /^[0-9a-f]{40}$/u;
const candidateMessagePrefix = "lemn-ui-candidate/v1:";
const rollbackMessage = "Lemn UI automated rollback";

type BaselineTokenRole = "production" | "rollback";

export interface CommandSpec {
	readonly command: string;
	readonly args: readonly string[];
	readonly captureOutput?: boolean;
	readonly environment?: Readonly<Record<string, string>>;
	readonly stdin?: string;
	readonly timeoutMs?: number;
	readonly recovery?: boolean;
}

export interface ProductionRolloutInput {
	readonly releaseId: string;
	readonly expected: BuildIdentity;
	readonly productionStatusToken: string;
	readonly rollbackStatusToken: string;
}

export interface CandidateRecoveryState {
	readonly schema: 1;
	readonly releaseId: string;
	readonly expected: BuildIdentity;
	readonly baselineVersionId: string;
	readonly baselineIdentity: BuildIdentity;
	readonly baselineTokenRole: BaselineTokenRole;
}

interface VersionSummary {
	readonly id: string;
	readonly tag: string;
	readonly message: string;
}

export interface DeploymentSnapshot {
	readonly id: string;
	readonly createdOn: string;
	readonly message: string;
	readonly versions: readonly {
		readonly versionId: string;
		readonly percentage: number;
	}[];
}

interface RolloutDependencies {
	readonly runCommand: (spec: CommandSpec) => Promise<string>;
	readonly smokeProduction: typeof smokeProductionDeployment;
	readonly smokeProtected: typeof smokeProtectedStatusRoutes;
	readonly writeSummary: (expected: BuildIdentity) => Promise<void>;
	readonly signal?: AbortSignal;
}

export class CommandAbortedError extends Error {
	readonly interrupted: boolean;

	constructor(message: string, interrupted: boolean) {
		super(message);
		this.name = "CommandAbortedError";
		this.interrupted = interrupted;
	}
}

export class RolloutRollbackFailure extends Error {
	readonly rollbackError: unknown;
	readonly rolloutError: unknown;

	constructor(rolloutError: unknown, rollbackError: unknown) {
		super("Showcase rollout failed and its rollback was not fully verified");
		this.name = "RolloutRollbackFailure";
		this.rolloutError = rolloutError;
		this.rollbackError = rollbackError;
	}
}

export class ConcurrentDeploymentError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConcurrentDeploymentError";
	}
}

const wranglerBaseArgs = [
	"--dir",
	"apps/showcase",
	"exec",
	"wrangler",
] as const;
const wranglerConfigArgs = [
	"--config",
	"wrangler.jsonc",
	"--env",
	"production",
] as const;

export const deploymentListCommand: CommandSpec = {
	command: "pnpm",
	args: [
		...wranglerBaseArgs,
		"deployments",
		"list",
		...wranglerConfigArgs,
		"--json",
	],
	captureOutput: true,
	timeoutMs: 60_000,
};

export const versionListCommand: CommandSpec = {
	command: "pnpm",
	args: [
		...wranglerBaseArgs,
		"versions",
		"list",
		...wranglerConfigArgs,
		"--json",
	],
	captureOutput: true,
	timeoutMs: 60_000,
};

export const buildShowcaseCommand: CommandSpec = {
	command: "pnpm",
	args: ["--filter", "@lemn-ltd/ui-showcase", "run", "cf:build"],
	environment: { CLOUDFLARE_ENV: "production" },
	timeoutMs: 10 * 60_000,
};

export const cloudflareMappingSmokeCommand: CommandSpec = {
	command: "pnpm",
	args: ["smoke:cloudflare:release"],
	timeoutMs: 2 * 60_000,
};

function assertVersionId(versionId: string): void {
	if (!versionIdPattern.test(versionId)) {
		throw new Error("Cloudflare returned an invalid Worker version ID");
	}
}

function assertBuildIdentity(
	identity: BuildIdentity,
	description: string,
): void {
	if (!identity.version || !identity.gitSha || !identity.buildTime) {
		throw new Error(`${description} has incomplete build identity`);
	}
	if (!releaseShaPattern.test(identity.gitSha)) {
		throw new Error(`${description} Git SHA must be a full 40-character SHA`);
	}
	if (!Number.isFinite(Date.parse(identity.buildTime))) {
		throw new Error(`${description} build time is invalid`);
	}
}

function sameIdentity(left: BuildIdentity, right: BuildIdentity): boolean {
	return (
		left.version === right.version &&
		left.gitSha === right.gitSha &&
		left.buildTime === right.buildTime
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildIdentityFromRecord(
	value: unknown,
	description: string,
): BuildIdentity {
	if (
		!isRecord(value) ||
		typeof value.version !== "string" ||
		typeof value.gitSha !== "string" ||
		typeof value.buildTime !== "string"
	) {
		throw new Error(`${description} build identity is malformed`);
	}
	const identity = {
		version: value.version,
		gitSha: value.gitSha,
		buildTime: value.buildTime,
	};
	assertBuildIdentity(identity, description);
	return identity;
}

export function candidateTag(expected: BuildIdentity): string {
	assertBuildIdentity(expected, "Candidate");
	const version = expected.version.replace(/[^0-9A-Za-z-]/gu, "-");
	return `lemn-ui-${version}-${expected.gitSha.slice(0, 16)}`;
}

export function encodeCandidateState(state: CandidateRecoveryState): string {
	assertCandidateState(state);
	return `${candidateMessagePrefix}${Buffer.from(JSON.stringify(state)).toString("base64url")}`;
}

export function decodeCandidateState(message: string): CandidateRecoveryState {
	if (!message.startsWith(candidateMessagePrefix)) {
		throw new Error("Worker candidate has no Lemn UI recovery metadata");
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(
			Buffer.from(
				message.slice(candidateMessagePrefix.length),
				"base64url",
			).toString("utf8"),
		);
	} catch {
		throw new Error("Worker candidate recovery metadata is malformed");
	}
	if (!isRecord(parsed)) {
		throw new Error("Worker candidate recovery metadata is malformed");
	}
	if (
		parsed.schema !== 1 ||
		typeof parsed.releaseId !== "string" ||
		typeof parsed.baselineVersionId !== "string" ||
		(parsed.baselineTokenRole !== "production" &&
			parsed.baselineTokenRole !== "rollback")
	) {
		throw new Error("Worker candidate recovery metadata has an invalid schema");
	}
	const state: CandidateRecoveryState = {
		schema: 1,
		releaseId: parsed.releaseId,
		expected: buildIdentityFromRecord(parsed.expected, "Candidate"),
		baselineVersionId: parsed.baselineVersionId,
		baselineIdentity: buildIdentityFromRecord(
			parsed.baselineIdentity,
			"Baseline",
		),
		baselineTokenRole: parsed.baselineTokenRole,
	};
	assertCandidateState(state);
	return state;
}

function assertCandidateState(state: CandidateRecoveryState): void {
	if (state.schema !== 1 || !state.releaseId) {
		throw new Error("Worker candidate recovery metadata has an invalid schema");
	}
	assertVersionId(state.baselineVersionId);
	assertBuildIdentity(state.expected, "Candidate");
	assertBuildIdentity(state.baselineIdentity, "Baseline");
	if (
		state.baselineTokenRole !== "rollback" &&
		state.baselineTokenRole !== "production"
	) {
		throw new Error(
			"Worker candidate recovery metadata has an invalid token role",
		);
	}
}

function rolloutMessage(
	phase: "active" | "staged",
	releaseId: string,
	baselineVersionId: string,
	candidateVersionId: string,
): string {
	return [
		"lemn-ui-rollout/v1",
		`phase=${phase}`,
		`release=${releaseId}`,
		`baseline=${baselineVersionId}`,
		`candidate=${candidateVersionId}`,
	].join(" ");
}

export function uploadCandidateCommand(
	expected: BuildIdentity,
	state: CandidateRecoveryState,
	secretsFilePath: string,
): CommandSpec {
	return {
		command: "pnpm",
		args: [
			...wranglerBaseArgs,
			"versions",
			"upload",
			...wranglerConfigArgs,
			"--var",
			`BUILD_VERSION:${expected.version}`,
			"--var",
			`BUILD_GIT_SHA:${expected.gitSha}`,
			"--var",
			`BUILD_TIME:${expected.buildTime}`,
			"--tag",
			candidateTag(expected),
			"--message",
			encodeCandidateState(state),
			"--secrets-file",
			secretsFilePath,
		],
		timeoutMs: 10 * 60_000,
	};
}

async function uploadCandidate(
	input: ProductionRolloutInput,
	state: CandidateRecoveryState,
	dependencies: RolloutDependencies,
): Promise<void> {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-showcase-secrets-"),
	);
	try {
		const secretsFilePath = resolve(temporaryRoot, "wrangler-secrets.json");
		await writeFile(
			secretsFilePath,
			JSON.stringify({ STATUS_TOKEN: input.productionStatusToken }),
			{ encoding: "utf8", flag: "wx", mode: 0o600 },
		);
		await dependencies.runCommand(
			uploadCandidateCommand(input.expected, state, secretsFilePath),
		);
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
}

export function stageCandidateCommand(
	state: CandidateRecoveryState,
	candidateVersionId: string,
): CommandSpec {
	assertVersionId(candidateVersionId);
	return {
		command: "pnpm",
		args: [
			...wranglerBaseArgs,
			"versions",
			"deploy",
			`${state.baselineVersionId}@100%`,
			`${candidateVersionId}@0%`,
			...wranglerConfigArgs,
			"--message",
			rolloutMessage(
				"staged",
				state.releaseId,
				state.baselineVersionId,
				candidateVersionId,
			),
			"--yes",
		],
		timeoutMs: 2 * 60_000,
	};
}

export function activateCandidateCommand(
	state: CandidateRecoveryState,
	candidateVersionId: string,
): CommandSpec {
	assertVersionId(candidateVersionId);
	return {
		command: "pnpm",
		args: [
			...wranglerBaseArgs,
			"versions",
			"deploy",
			`${candidateVersionId}@100%`,
			...wranglerConfigArgs,
			"--message",
			rolloutMessage(
				"active",
				state.releaseId,
				state.baselineVersionId,
				candidateVersionId,
			),
			"--yes",
		],
		timeoutMs: 2 * 60_000,
	};
}

export function rollbackCommand(versionId: string): CommandSpec {
	assertVersionId(versionId);
	return {
		command: "pnpm",
		args: [
			...wranglerBaseArgs,
			"rollback",
			versionId,
			...wranglerConfigArgs,
			"--message",
			rollbackMessage,
			"--yes",
		],
		timeoutMs: 2 * 60_000,
		recovery: true,
	};
}

function annotations(entry: Record<string, unknown>): Record<string, unknown> {
	return isRecord(entry.annotations) ? entry.annotations : {};
}

export function versionsFromJson(source: string): VersionSummary[] {
	const parsed: unknown = JSON.parse(source);
	if (!Array.isArray(parsed)) {
		throw new Error("Cloudflare returned malformed Worker version data");
	}
	return parsed.map((entry, index) => {
		if (!isRecord(entry) || typeof entry.id !== "string") {
			throw new Error(`Cloudflare returned malformed Worker version ${index}`);
		}
		assertVersionId(entry.id);
		const metadata = annotations(entry);
		return {
			id: entry.id,
			tag:
				typeof metadata["workers/tag"] === "string"
					? metadata["workers/tag"]
					: "",
			message:
				typeof metadata["workers/message"] === "string"
					? metadata["workers/message"]
					: "",
		};
	});
}

export function candidateFromVersions(
	source: string,
	tag: string,
): VersionSummary | undefined {
	const matches = versionsFromJson(source).filter(
		(version) => version.tag === tag,
	);
	if (matches.length > 1) {
		throw new Error(
			`Cloudflare returned multiple Worker versions tagged ${tag}`,
		);
	}
	return matches[0];
}

export function activeDeploymentFromJson(source: string): DeploymentSnapshot {
	const parsed: unknown = JSON.parse(source);
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error("Cloudflare returned no Worker deployments");
	}
	const deployments = parsed.map((entry, index) => {
		if (
			!isRecord(entry) ||
			typeof entry.id !== "string" ||
			typeof entry.created_on !== "string" ||
			!Array.isArray(entry.versions)
		) {
			throw new Error(
				`Cloudflare returned malformed Worker deployment ${index}`,
			);
		}
		assertVersionId(entry.id);
		const createdAt = Date.parse(entry.created_on);
		if (!Number.isFinite(createdAt)) {
			throw new Error(
				"Cloudflare returned an invalid deployment creation time",
			);
		}
		const metadata = annotations(entry);
		return {
			createdAt,
			deployment: {
				id: entry.id,
				createdOn: entry.created_on,
				message:
					typeof metadata["workers/message"] === "string"
						? metadata["workers/message"]
						: "",
				versions: entry.versions.map((version, versionIndex) => {
					if (
						!isRecord(version) ||
						typeof version.version_id !== "string" ||
						typeof version.percentage !== "number" ||
						!Number.isFinite(version.percentage)
					) {
						throw new Error(
							`Cloudflare returned malformed deployment traffic ${versionIndex}`,
						);
					}
					assertVersionId(version.version_id);
					return {
						versionId: version.version_id,
						percentage: version.percentage,
					};
				}),
			},
		};
	});
	deployments.sort((left, right) => right.createdAt - left.createdAt);
	const active = deployments[0]?.deployment;
	if (!active)
		throw new Error("Cloudflare returned no active Worker deployment");
	return active;
}

function hasTraffic(
	deployment: DeploymentSnapshot,
	expected: readonly { versionId: string; percentage: number }[],
): boolean {
	if (deployment.versions.length !== expected.length) return false;
	return expected.every((traffic) =>
		deployment.versions.some(
			(actual) =>
				actual.versionId === traffic.versionId &&
				Math.abs(actual.percentage - traffic.percentage) < 0.001,
		),
	);
}

function baselineDeployment(
	deployment: DeploymentSnapshot,
	state: CandidateRecoveryState,
): boolean {
	return hasTraffic(deployment, [
		{ versionId: state.baselineVersionId, percentage: 100 },
	]);
}

function stagedDeployment(
	deployment: DeploymentSnapshot,
	state: CandidateRecoveryState,
	candidateVersionId: string,
): boolean {
	return (
		deployment.message ===
			rolloutMessage(
				"staged",
				state.releaseId,
				state.baselineVersionId,
				candidateVersionId,
			) &&
		hasTraffic(deployment, [
			{ versionId: state.baselineVersionId, percentage: 100 },
			{ versionId: candidateVersionId, percentage: 0 },
		])
	);
}

function activeCandidateDeployment(
	deployment: DeploymentSnapshot,
	state: CandidateRecoveryState,
	candidateVersionId: string,
): boolean {
	return (
		deployment.message ===
			rolloutMessage(
				"active",
				state.releaseId,
				state.baselineVersionId,
				candidateVersionId,
			) &&
		hasTraffic(deployment, [{ versionId: candidateVersionId, percentage: 100 }])
	);
}

function terminateChild(child: ChildProcess, signal: NodeJS.Signals): void {
	if (!child.pid) return;
	try {
		if (process.platform === "win32") child.kill(signal);
		else process.kill(-child.pid, signal);
	} catch {
		child.kill(signal);
	}
}

export function createCommandRunner(signal?: AbortSignal) {
	return async (spec: CommandSpec): Promise<string> =>
		new Promise((resolveCommand, rejectCommand) => {
			const child = spawn(spec.command, [...spec.args], {
				cwd: root,
				env: { ...process.env, ...spec.environment },
				stdio: [
					spec.stdin === undefined ? "ignore" : "pipe",
					spec.captureOutput ? "pipe" : "inherit",
					"inherit",
				],
				detached: process.platform !== "win32",
			});
			const output: Buffer[] = [];
			let abortError: CommandAbortedError | undefined;
			let settled = false;
			let forceTimer: NodeJS.Timeout | undefined;

			const abort = (message: string, interrupted: boolean) => {
				if (abortError) return;
				abortError = new CommandAbortedError(message, interrupted);
				terminateChild(child, "SIGTERM");
				forceTimer = setTimeout(() => terminateChild(child, "SIGKILL"), 5_000);
				forceTimer.unref();
			};
			const timeout = setTimeout(
				() => abort(`${spec.command} ${spec.args.join(" ")} timed out`, false),
				spec.timeoutMs ?? 5 * 60_000,
			);
			timeout.unref();
			const onAbort = () =>
				abort(`${spec.command} ${spec.args.join(" ")} was interrupted`, true);
			if (!spec.recovery) {
				if (signal?.aborted) onAbort();
				else signal?.addEventListener("abort", onAbort, { once: true });
			}

			if (spec.captureOutput) {
				child.stdout?.on("data", (chunk: Buffer) => output.push(chunk));
			}
			child.once("error", (error) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				if (forceTimer) clearTimeout(forceTimer);
				signal?.removeEventListener("abort", onAbort);
				rejectCommand(abortError ?? error);
			});
			child.once("exit", (code, childSignal) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				if (forceTimer) clearTimeout(forceTimer);
				signal?.removeEventListener("abort", onAbort);
				if (abortError) {
					rejectCommand(abortError);
					return;
				}
				if (code === 0) {
					resolveCommand(Buffer.concat(output).toString("utf8"));
					return;
				}
				rejectCommand(
					new Error(
						`${spec.command} ${spec.args.join(" ")} failed with ${childSignal ? `signal ${childSignal}` : `exit ${String(code)}`}`,
					),
				);
			});
			if (spec.stdin !== undefined) child.stdin?.end(spec.stdin);
		});
}

async function writeGitHubSummary(expected: BuildIdentity): Promise<void> {
	const summaryPath = process.env.GITHUB_STEP_SUMMARY;
	if (!summaryPath) return;
	await appendFile(
		summaryPath,
		[
			"### Lemn UI",
			"",
			`- Package: \`@lemn-ltd/ui@${expected.version}\``,
			"- Docs: https://ui.le-mn.com",
			"- Showcase: https://showcase.ui.le-mn.com",
			`- Commit: \`${expected.gitSha}\``,
			`- Build time: \`${expected.buildTime}\``,
			"- Protected status: candidate and active deployment smokes passed",
			"",
		].join("\n"),
		{ encoding: "utf8", mode: 0o600 },
	);
}

function defaultDependencies(signal?: AbortSignal): RolloutDependencies {
	return {
		runCommand: createCommandRunner(signal),
		smokeProduction: smokeProductionDeployment,
		smokeProtected: smokeProtectedStatusRoutes,
		writeSummary: writeGitHubSummary,
		signal,
	};
}

async function deployment(
	dependencies: RolloutDependencies,
	recovery = false,
): Promise<DeploymentSnapshot> {
	return activeDeploymentFromJson(
		await dependencies.runCommand(
			recovery
				? { ...deploymentListCommand, recovery: true }
				: deploymentListCommand,
		),
	);
}

async function candidate(
	expected: BuildIdentity,
	dependencies: RolloutDependencies,
): Promise<VersionSummary | undefined> {
	return candidateFromVersions(
		await dependencies.runCommand(versionListCommand),
		candidateTag(expected),
	);
}

async function captureBaseline(
	input: ProductionRolloutInput,
	dependencies: RolloutDependencies,
): Promise<{
	identity: BuildIdentity;
	tokenRole: BaselineTokenRole;
}> {
	const smokeInput = {
		retryOptions: { attempts: 1, delayMs: 0 },
		signal: dependencies.signal,
	} as const;
	try {
		return {
			identity: await dependencies.smokeProtected({
				...smokeInput,
				token: input.rollbackStatusToken,
			}),
			tokenRole: "rollback",
		};
	} catch (rollbackTokenError) {
		if (input.rollbackStatusToken === input.productionStatusToken) {
			throw rollbackTokenError;
		}
		try {
			return {
				identity: await dependencies.smokeProtected({
					...smokeInput,
					token: input.productionStatusToken,
				}),
				tokenRole: "production",
			};
		} catch (productionTokenError) {
			throw new AggregateError(
				[rollbackTokenError, productionTokenError],
				"Neither retained status token authenticates the active Worker version",
			);
		}
	}
}

function baselineToken(
	state: CandidateRecoveryState,
	input: ProductionRolloutInput,
): string {
	return state.baselineTokenRole === "rollback"
		? input.rollbackStatusToken
		: input.productionStatusToken;
}

function assertCandidateMatchesRelease(
	version: VersionSummary,
	input: ProductionRolloutInput,
): CandidateRecoveryState {
	const state = decodeCandidateState(version.message);
	if (
		state.releaseId !== input.releaseId ||
		!sameIdentity(state.expected, input.expected)
	) {
		throw new Error(
			"Existing Worker candidate tag has different immutable release metadata",
		);
	}
	return state;
}

function interrupted(error: unknown): boolean {
	return error instanceof CommandAbortedError && error.interrupted;
}

async function rollbackAndVerify(
	rolloutError: unknown,
	state: CandidateRecoveryState,
	candidateVersionId: string,
	input: ProductionRolloutInput,
	dependencies: RolloutDependencies,
): Promise<never> {
	let current: DeploymentSnapshot;
	try {
		current = await deployment(dependencies, true);
	} catch (error) {
		throw new RolloutRollbackFailure(rolloutError, error);
	}
	if (
		!baselineDeployment(current, state) &&
		!stagedDeployment(current, state, candidateVersionId) &&
		!activeCandidateDeployment(current, state, candidateVersionId)
	) {
		throw new RolloutRollbackFailure(
			rolloutError,
			new ConcurrentDeploymentError(
				"A concurrent Worker deployment replaced the release lease; refusing to overwrite it during recovery",
			),
		);
	}

	const failures: unknown[] = [];
	if (!baselineDeployment(current, state)) {
		try {
			await dependencies.runCommand(rollbackCommand(state.baselineVersionId));
			const rolledBack = await deployment(dependencies, true);
			if (!baselineDeployment(rolledBack, state)) {
				throw new Error(
					"Rollback did not restore the captured baseline version",
				);
			}
		} catch (error) {
			failures.push(error);
		}
	}
	try {
		await dependencies.smokeProtected({
			token: baselineToken(state, input),
			expected: state.baselineIdentity,
			retryOptions: { attempts: 3, delayMs: 1_000 },
		});
	} catch (error) {
		failures.push(error);
	}
	if (failures.length > 0) {
		throw new RolloutRollbackFailure(
			rolloutError,
			new AggregateError(failures, "Rollback command or smoke failed"),
		);
	}
	throw rolloutError;
}

async function executeCandidate(
	input: ProductionRolloutInput,
	version: VersionSummary,
	state: CandidateRecoveryState,
	dependencies: RolloutDependencies,
): Promise<void> {
	try {
		let current = await deployment(dependencies);
		if (
			!baselineDeployment(current, state) &&
			!stagedDeployment(current, state, version.id) &&
			!activeCandidateDeployment(current, state, version.id)
		) {
			throw new ConcurrentDeploymentError(
				"The active Worker deployment is neither the captured baseline nor this release lease",
			);
		}

		if (baselineDeployment(current, state)) {
			await dependencies.smokeProtected({
				token: baselineToken(state, input),
				expected: state.baselineIdentity,
				retryOptions: { attempts: 1, delayMs: 0 },
				signal: dependencies.signal,
			});
			await dependencies.runCommand(stageCandidateCommand(state, version.id));
			current = await deployment(dependencies);
			if (!stagedDeployment(current, state, version.id)) {
				throw new ConcurrentDeploymentError(
					"The release could not acquire its zero-traffic Worker deployment lease",
				);
			}
		}

		if (stagedDeployment(current, state, version.id)) {
			const leaseDeploymentId = current.id;
			await dependencies.runCommand(cloudflareMappingSmokeCommand);
			await dependencies.smokeProduction({
				expected: input.expected,
				statusToken: input.productionStatusToken,
				showcaseVersionId: version.id,
				signal: dependencies.signal,
			});
			current = await deployment(dependencies);
			if (
				current.id !== leaseDeploymentId ||
				!stagedDeployment(current, state, version.id)
			) {
				throw new ConcurrentDeploymentError(
					"The Worker deployment lease changed during candidate smoke; activation refused",
				);
			}
			await dependencies.runCommand(
				activateCandidateCommand(state, version.id),
			);
			current = await deployment(dependencies);
			if (!activeCandidateDeployment(current, state, version.id)) {
				throw new ConcurrentDeploymentError(
					"The candidate activation was replaced by a concurrent Worker deployment",
				);
			}
		}

		await dependencies.runCommand(cloudflareMappingSmokeCommand);
		await dependencies.smokeProduction({
			expected: input.expected,
			statusToken: input.productionStatusToken,
			signal: dependencies.signal,
		});
		await dependencies.writeSummary(input.expected);
	} catch (error) {
		if (interrupted(error) || error instanceof ConcurrentDeploymentError) {
			throw error;
		}
		await rollbackAndVerify(error, state, version.id, input, dependencies);
	}
}

export async function runProductionRollout(
	input: ProductionRolloutInput,
	dependencies: RolloutDependencies = defaultDependencies(),
): Promise<void> {
	if (!input.productionStatusToken || !input.rollbackStatusToken) {
		throw new Error("Production and rollback status tokens are required");
	}
	assertBuildIdentity(input.expected, "Release");
	if (
		input.releaseId !==
		`@lemn-ltd/ui@${input.expected.version}#${input.expected.gitSha}`
	) {
		throw new Error("Release ID does not match the immutable build identity");
	}

	let existing = await candidate(input.expected, dependencies);
	if (existing) {
		await executeCandidate(
			input,
			existing,
			assertCandidateMatchesRelease(existing, input),
			dependencies,
		);
		return;
	}

	const current = await deployment(dependencies);
	if (
		current.versions.length !== 1 ||
		current.versions[0]?.percentage !== 100
	) {
		throw new ConcurrentDeploymentError(
			"A new release requires one stable active Worker version at 100% traffic",
		);
	}
	const baselineVersionId = current.versions[0].versionId;
	const baseline = await captureBaseline(input, dependencies);
	const state: CandidateRecoveryState = {
		schema: 1,
		releaseId: input.releaseId,
		expected: input.expected,
		baselineVersionId,
		baselineIdentity: baseline.identity,
		baselineTokenRole: baseline.tokenRole,
	};

	await dependencies.runCommand(buildShowcaseCommand);
	await uploadCandidate(input, state, dependencies);
	existing = await candidate(input.expected, dependencies);
	if (!existing) {
		throw new Error(
			"Cloudflare did not persist the uploaded Worker candidate by release tag",
		);
	}
	const persistedState = assertCandidateMatchesRelease(existing, input);
	if (
		persistedState.baselineVersionId !== state.baselineVersionId ||
		persistedState.baselineTokenRole !== state.baselineTokenRole ||
		!sameIdentity(persistedState.baselineIdentity, state.baselineIdentity)
	) {
		throw new Error("Persisted Worker candidate baseline metadata changed");
	}
	await executeCandidate(input, existing, persistedState, dependencies);
}

function describeError(error: unknown): string {
	if (error instanceof RolloutRollbackFailure) {
		return `${describeError(error.rolloutError)}; rollback: ${describeError(error.rollbackError)}`;
	}
	if (error instanceof AggregateError) {
		return [error.message, ...error.errors.map(describeError)].join("; ");
	}
	return error instanceof Error ? error.message : String(error);
}

export function safeErrorMessage(
	error: unknown,
	secrets: readonly string[],
): string {
	let message = describeError(error);
	for (const secret of secrets) {
		if (secret) message = message.split(secret).join("[REDACTED]");
	}
	return message;
}

function requiredEnvironment(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required production input: ${name}`);
	return value;
}

async function main(): Promise<void> {
	const productionStatusToken = requiredEnvironment("PRODUCTION_STATUS_TOKEN");
	const rollbackStatusToken = requiredEnvironment("ROLLBACK_STATUS_TOKEN");
	const abortController = new AbortController();
	const interrupt = (signal: NodeJS.Signals) => {
		abortController.abort(new CommandAbortedError(`Received ${signal}`, true));
	};
	const onSigterm = () => interrupt("SIGTERM");
	const onSigint = () => interrupt("SIGINT");
	process.once("SIGTERM", onSigterm);
	process.once("SIGINT", onSigint);
	try {
		await runProductionRollout(
			{
				releaseId: requiredEnvironment("EXPECTED_RELEASE_ID"),
				expected: {
					version: requiredEnvironment("EXPECTED_RELEASE_VERSION"),
					gitSha: requiredEnvironment("EXPECTED_RELEASE_GIT_SHA"),
					buildTime: requiredEnvironment("EXPECTED_RELEASE_TIME"),
				},
				productionStatusToken,
				rollbackStatusToken,
			},
			defaultDependencies(abortController.signal),
		);
	} catch (error) {
		console.error(
			`Showcase production rollout failed: ${safeErrorMessage(error, [productionStatusToken, rollbackStatusToken])}`,
		);
		process.exitCode = 1;
	} finally {
		process.removeListener("SIGTERM", onSigterm);
		process.removeListener("SIGINT", onSigint);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
