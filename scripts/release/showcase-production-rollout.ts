#!/usr/bin/env node
import { type ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
	appendFile,
	chmod,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";
import { type ParseError, parse, printParseErrorCode } from "jsonc-parser";
import {
	type BuildIdentity,
	smokeProductionDeployment,
	smokeProtectedStatusRoutes,
} from "./deployment-smoke.ts";

const root = resolve(import.meta.dirname, "../..");
const versionIdPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const releaseShaPattern = /^[0-9a-f]{40}$/u;
const candidateMessagePrefix = "lemn-ui-candidate/v3:";
const candidateMessageMaxBytes = 1_000;
const rollbackMessage = "Lemn UI automated rollback";
const cloudflareApi = "https://api.cloudflare.com/client/v4";
const showcaseConfigRelativePath = "apps/showcase/wrangler.jsonc";
const showcaseConfigPath = resolve(root, showcaseConfigRelativePath);

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
	readonly schema: 3;
	readonly releaseId: string;
	readonly expected: BuildIdentity;
	readonly baselineVersionId: string;
	readonly baselineIdentity: BuildIdentity;
	readonly baselineTokenRole: BaselineTokenRole;
	readonly baselineTriggersHash: string;
	readonly desiredTriggersHash: string;
}

export interface CloudflareCustomDomain {
	readonly hostname: string;
	readonly service: string;
}

export interface CloudflareWorkerSubdomain {
	readonly enabled: boolean;
	readonly previewsEnabled: boolean;
}

interface WranglerRoute {
	readonly pattern?: string;
	readonly custom_domain?: boolean;
}

interface WranglerTriggers {
	readonly crons?: readonly string[];
}

interface WranglerEnvironment {
	readonly account_id?: string;
	readonly compatibility_date?: string;
	readonly main?: string;
	readonly name?: string;
	readonly routes?: readonly WranglerRoute[];
	readonly triggers?: WranglerTriggers;
	readonly preview_urls?: boolean;
	readonly workers_dev?: boolean;
}

interface WranglerConfig extends WranglerEnvironment {
	readonly env?: Readonly<Record<string, WranglerEnvironment>>;
}

interface TriggerPlan {
	readonly accountId: string;
	readonly compatibilityDate: string;
	readonly configSource: string;
	readonly hash: string;
	readonly hostnames: readonly string[];
	readonly mainPath: string;
	readonly previewsEnabled: boolean;
	readonly workerName: string;
	readonly workersDev: boolean;
}

interface TriggerRecovery {
	readonly baseline: TriggerPlan;
	readonly desired: TriggerPlan;
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
	readonly removeCandidateTemporaryRoot?: (
		temporaryRoot: string,
	) => Promise<void>;
	readonly removeTriggerTemporaryRoot?: (
		temporaryRoot: string,
	) => Promise<void>;
	readonly readDesiredShowcaseConfig?: () => Promise<string>;
	readonly listCustomDomains?: (
		accountId: string,
	) => Promise<readonly CloudflareCustomDomain[]>;
	readonly getWorkerSubdomain?: (
		accountId: string,
		workerName: string,
	) => Promise<CloudflareWorkerSubdomain>;
	readonly waitForDomainPropagation?: (delayMs: number) => Promise<void>;
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

export const cloudflareTriggersDeployCommand: CommandSpec = {
	command: "pnpm",
	args: [...wranglerBaseArgs, "triggers", "deploy", ...wranglerConfigArgs],
	timeoutMs: 2 * 60_000,
	recovery: true,
};

export function baselineShowcaseConfigCommand(gitSha: string): CommandSpec {
	if (!releaseShaPattern.test(gitSha)) {
		throw new Error("Baseline Git SHA must be a full 40-character SHA");
	}
	return {
		command: "git",
		args: ["show", `${gitSha}:${showcaseConfigRelativePath}`],
		captureOutput: true,
		timeoutMs: 60_000,
	};
}

export function restoreCloudflareTriggersCommand(
	configPath: string,
): CommandSpec {
	if (!resolve(configPath).startsWith(`${resolve(tmpdir())}${sep}`)) {
		throw new Error("Recovery Wrangler config must live in the temporary root");
	}
	return {
		command: "pnpm",
		args: [...wranglerBaseArgs, "triggers", "deploy", "--config", configPath],
		timeoutMs: 2 * 60_000,
		recovery: true,
	};
}

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

function requireConfigValue(
	value: string | undefined,
	description: string,
): string {
	if (!value?.trim()) throw new Error(`Missing ${description}`);
	return value.trim();
}

function parseWranglerConfig(
	source: string,
	description: string,
): WranglerConfig {
	const errors: ParseError[] = [];
	const config = parse(source, errors, { allowTrailingComma: true }) as
		| WranglerConfig
		| undefined;
	if (!config || errors.length > 0) {
		const details = errors
			.map((error) => printParseErrorCode(error.error))
			.join(", ");
		throw new Error(
			`${description} is invalid Wrangler JSONC: ${details || "empty config"}`,
		);
	}
	return config;
}

function normalizedHostname(pattern: string, description: string): string {
	const hostname = pattern.trim().toLowerCase();
	if (
		!hostname ||
		hostname.includes("*") ||
		hostname.includes("://") ||
		hostname.includes("/") ||
		/\s/u.test(hostname)
	) {
		throw new Error(`${description} must be one exact custom-domain hostname`);
	}
	return hostname;
}

function triggerHash(
	accountId: string,
	workerName: string,
	domains: readonly CloudflareCustomDomain[],
	subdomain: CloudflareWorkerSubdomain,
): string {
	const entries = [...domains]
		.map((domain) => ({
			hostname: domain.hostname.trim().toLowerCase(),
			service: domain.service.trim(),
		}))
		.sort((left, right) =>
			`${left.hostname}\u0000${left.service}`.localeCompare(
				`${right.hostname}\u0000${right.service}`,
			),
		);
	return createHash("sha256")
		.update(
			JSON.stringify({
				accountId,
				workerName,
				domains: entries,
				workersDev: subdomain.enabled,
				previewsEnabled: subdomain.previewsEnabled,
			}),
		)
		.digest("hex");
}

function triggerPlanFromSource(
	source: string,
	description: string,
): TriggerPlan {
	const config = parseWranglerConfig(source, description);
	const selected = config.env?.production;
	if (!selected) {
		throw new Error(`${description} has no production Wrangler environment`);
	}
	if (!Array.isArray(selected.routes)) {
		throw new Error(
			`${description} must explicitly declare production routes, including [] when empty`,
		);
	}
	const routes = selected.routes;
	if (
		routes.some((route) => !isRecord(route) || route.custom_domain !== true)
	) {
		throw new Error(
			`${description} contains a non-custom route; transactional route recovery is unsupported`,
		);
	}
	const cronValues = [selected.triggers?.crons, config.triggers?.crons].filter(
		(value) => value !== undefined,
	);
	if (cronValues.some((value) => !Array.isArray(value) || value.length > 0)) {
		throw new Error(
			`${description} contains cron triggers; transactional cron recovery is unsupported`,
		);
	}

	const accountId = requireConfigValue(
		selected.account_id ?? config.account_id,
		`${description} account_id`,
	);
	const workerName = requireConfigValue(
		selected.name ?? config.name,
		`${description} Worker name`,
	);
	const compatibilityDate = requireConfigValue(
		selected.compatibility_date ?? config.compatibility_date,
		`${description} compatibility_date`,
	);
	const workersDev = selected.workers_dev ?? config.workers_dev;
	if (typeof workersDev !== "boolean") {
		throw new Error(
			`${description} must resolve workers_dev to a boolean for production trigger recovery`,
		);
	}
	const previewsEnabled =
		selected.preview_urls ?? config.preview_urls ?? workersDev;
	if (typeof previewsEnabled !== "boolean") {
		throw new Error(
			`${description} must resolve preview_urls to a boolean for production trigger recovery`,
		);
	}
	const configuredMain = requireConfigValue(
		selected.main ?? config.main,
		`${description} main`,
	);
	const hostnames = routes
		.map((route, index) =>
			normalizedHostname(
				requireConfigValue(
					route.pattern,
					`${description} route ${String(index)} pattern`,
				),
				`${description} route ${String(index)}`,
			),
		)
		.sort();
	if (new Set(hostnames).size !== hostnames.length) {
		throw new Error(`${description} contains duplicate custom domains`);
	}
	const showcaseRoot = resolve(root, "apps/showcase");
	const mainPath = resolve(showcaseRoot, configuredMain);
	if (
		mainPath !== showcaseRoot &&
		!mainPath.startsWith(`${showcaseRoot}${sep}`)
	) {
		throw new Error(`${description} main must stay inside apps/showcase`);
	}
	const domains = hostnames.map((hostname) => ({
		hostname,
		service: workerName,
	}));
	return {
		accountId,
		compatibilityDate,
		configSource: `${JSON.stringify(
			{
				name: workerName,
				account_id: accountId,
				main: mainPath,
				compatibility_date: compatibilityDate,
				workers_dev: workersDev,
				preview_urls: previewsEnabled,
				routes: hostnames.map((pattern) => ({
					pattern,
					custom_domain: true,
				})),
			},
			null,
			2,
		)}\n`,
		hash: triggerHash(accountId, workerName, domains, {
			enabled: workersDev,
			previewsEnabled,
		}),
		hostnames,
		mainPath,
		previewsEnabled,
		workerName,
		workersDev,
	};
}

export function triggerRecoveryHashes(
	baselineSource: string,
	desiredSource: string,
): {
	readonly baselineTriggersHash: string;
	readonly desiredTriggersHash: string;
} {
	const baseline = triggerPlanFromSource(
		baselineSource,
		"Baseline showcase config",
	);
	const desired = triggerPlanFromSource(
		desiredSource,
		"Desired showcase config",
	);
	assertSameCustomDomainTarget(baseline, desired);
	if (desired.workersDev || desired.previewsEnabled) {
		throw new Error(
			"Desired showcase config must disable workers_dev and preview_urls in production",
		);
	}
	return {
		baselineTriggersHash: baseline.hash,
		desiredTriggersHash: desired.hash,
	};
}

function assertSameCustomDomainTarget(
	baseline: TriggerPlan,
	desired: TriggerPlan,
): void {
	if (
		baseline.accountId !== desired.accountId ||
		baseline.workerName !== desired.workerName
	) {
		throw new Error(
			"Changing the showcase Cloudflare account or Worker name is outside transactional custom-domain recovery",
		);
	}
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
	const message = `${candidateMessagePrefix}${Buffer.from(JSON.stringify(state)).toString("base64url")}`;
	if (Buffer.byteLength(message, "utf8") > candidateMessageMaxBytes) {
		throw new Error(
			`Worker candidate recovery metadata exceeds the ${String(candidateMessageMaxBytes)}-byte message limit`,
		);
	}
	return message;
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
		parsed.schema !== 3 ||
		typeof parsed.releaseId !== "string" ||
		typeof parsed.baselineVersionId !== "string" ||
		typeof parsed.baselineTriggersHash !== "string" ||
		typeof parsed.desiredTriggersHash !== "string" ||
		(parsed.baselineTokenRole !== "production" &&
			parsed.baselineTokenRole !== "rollback")
	) {
		throw new Error("Worker candidate recovery metadata has an invalid schema");
	}
	const state: CandidateRecoveryState = {
		schema: 3,
		releaseId: parsed.releaseId,
		expected: buildIdentityFromRecord(parsed.expected, "Candidate"),
		baselineVersionId: parsed.baselineVersionId,
		baselineIdentity: buildIdentityFromRecord(
			parsed.baselineIdentity,
			"Baseline",
		),
		baselineTokenRole: parsed.baselineTokenRole,
		baselineTriggersHash: parsed.baselineTriggersHash,
		desiredTriggersHash: parsed.desiredTriggersHash,
	};
	assertCandidateState(state);
	return state;
}

function assertCandidateState(state: CandidateRecoveryState): void {
	if (state.schema !== 3 || !state.releaseId) {
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
	for (const [description, hash] of [
		["baseline triggers", state.baselineTriggersHash],
		["desired triggers", state.desiredTriggersHash],
	] as const) {
		if (!/^[0-9a-f]{64}$/u.test(hash)) {
			throw new Error(
				`Worker candidate recovery metadata has an invalid ${description} hash`,
			);
		}
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

export async function removeCandidateTemporaryRoot(
	temporaryRoot: string,
): Promise<void> {
	await rm(temporaryRoot, { recursive: true, force: true });
}

export async function removeTriggerTemporaryRoot(
	temporaryRoot: string,
): Promise<void> {
	await rm(temporaryRoot, { recursive: true, force: true });
}

interface CloudflareEnvelope<T> {
	readonly success?: boolean;
	readonly result?: T;
	readonly result_info?: {
		readonly page?: number;
		readonly total_pages?: number;
	};
}

export async function listCloudflareCustomDomains(
	accountId: string,
	apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim(),
	fetchImplementation: typeof fetch = fetch,
): Promise<readonly CloudflareCustomDomain[]> {
	if (!apiToken) {
		throw new Error(
			"Missing CLOUDFLARE_API_TOKEN for custom-domain recovery verification",
		);
	}
	const domains: CloudflareCustomDomain[] = [];
	for (let page = 1; ; page += 1) {
		const query = new URLSearchParams({ page: String(page), per_page: "100" });
		const response = await fetchImplementation(
			`${cloudflareApi}/accounts/${encodeURIComponent(accountId)}/workers/domains?${query}`,
			{
				headers: { Authorization: `Bearer ${apiToken}` },
				signal: AbortSignal.timeout(30_000),
			},
		);
		let envelope: CloudflareEnvelope<unknown>;
		try {
			envelope = (await response.json()) as CloudflareEnvelope<unknown>;
		} catch {
			throw new Error(
				`Cloudflare custom-domain API returned non-JSON HTTP ${String(response.status)}`,
			);
		}
		if (
			!response.ok ||
			envelope.success !== true ||
			!Array.isArray(envelope.result)
		) {
			throw new Error(
				`Cloudflare custom-domain API request failed with HTTP ${String(response.status)}`,
			);
		}
		for (const [index, value] of envelope.result.entries()) {
			if (
				!isRecord(value) ||
				typeof value.hostname !== "string" ||
				!value.hostname.trim() ||
				typeof value.service !== "string" ||
				!value.service.trim()
			) {
				throw new Error(
					`Cloudflare returned malformed custom domain ${String(index)} on page ${String(page)}`,
				);
			}
			domains.push({ hostname: value.hostname, service: value.service });
		}
		const totalPages = envelope.result_info?.total_pages;
		if (typeof totalPages === "number" && Number.isInteger(totalPages)) {
			if (page >= totalPages) break;
			continue;
		}
		if (envelope.result.length < 100) break;
	}
	return domains;
}

export async function getCloudflareWorkerSubdomain(
	accountId: string,
	workerName: string,
	apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim(),
	fetchImplementation: typeof fetch = fetch,
): Promise<CloudflareWorkerSubdomain> {
	if (!apiToken) {
		throw new Error(
			"Missing CLOUDFLARE_API_TOKEN for Worker subdomain recovery verification",
		);
	}
	const response = await fetchImplementation(
		`${cloudflareApi}/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}/subdomain`,
		{
			headers: { Authorization: `Bearer ${apiToken}` },
			signal: AbortSignal.timeout(30_000),
		},
	);
	let envelope: CloudflareEnvelope<unknown>;
	try {
		envelope = (await response.json()) as CloudflareEnvelope<unknown>;
	} catch {
		throw new Error(
			`Cloudflare Worker subdomain API returned non-JSON HTTP ${String(response.status)}`,
		);
	}
	if (
		!response.ok ||
		envelope.success !== true ||
		!isRecord(envelope.result) ||
		typeof envelope.result.enabled !== "boolean" ||
		typeof envelope.result.previews_enabled !== "boolean"
	) {
		throw new Error(
			`Cloudflare Worker subdomain API request failed or returned malformed state with HTTP ${String(response.status)}`,
		);
	}
	return {
		enabled: envelope.result.enabled,
		previewsEnabled: envelope.result.previews_enabled,
	};
}

async function loadTriggerRecovery(
	baselineGitSha: string,
	dependencies: RolloutDependencies,
): Promise<TriggerRecovery> {
	const [baselineSource, desiredSource] = await Promise.all([
		dependencies.runCommand(baselineShowcaseConfigCommand(baselineGitSha)),
		(
			dependencies.readDesiredShowcaseConfig ??
			(() => readFile(showcaseConfigPath, "utf8"))
		)(),
	]);
	const baseline = triggerPlanFromSource(
		baselineSource,
		"Baseline showcase config",
	);
	const desired = triggerPlanFromSource(
		desiredSource,
		"Desired showcase config",
	);
	assertSameCustomDomainTarget(baseline, desired);
	if (desired.workersDev || desired.previewsEnabled) {
		throw new Error(
			"Desired showcase config must disable workers_dev and preview_urls in production",
		);
	}
	return { baseline, desired };
}

function assertRecoveryHashes(
	state: CandidateRecoveryState,
	recovery: TriggerRecovery,
): void {
	if (
		state.baselineTriggersHash !== recovery.baseline.hash ||
		state.desiredTriggersHash !== recovery.desired.hash
	) {
		throw new Error(
			"Worker candidate trigger recovery metadata no longer matches Git-authoritative Wrangler configs",
		);
	}
}

function liveTriggersHash(
	recovery: TriggerRecovery,
	domains: readonly CloudflareCustomDomain[],
	subdomain: CloudflareWorkerSubdomain,
): string {
	const relevantHostnames = new Set([
		...recovery.baseline.hostnames,
		...recovery.desired.hostnames,
	]);
	const relevant = domains.filter(
		(domain) =>
			domain.service.trim() === recovery.desired.workerName ||
			relevantHostnames.has(domain.hostname.trim().toLowerCase()),
	);
	return triggerHash(
		recovery.desired.accountId,
		recovery.desired.workerName,
		relevant,
		subdomain,
	);
}

async function currentTriggersHash(
	recovery: TriggerRecovery,
	dependencies: RolloutDependencies,
): Promise<string> {
	const [domains, subdomain] = await Promise.all([
		(dependencies.listCustomDomains ?? listCloudflareCustomDomains)(
			recovery.desired.accountId,
		),
		(dependencies.getWorkerSubdomain ?? getCloudflareWorkerSubdomain)(
			recovery.desired.accountId,
			recovery.desired.workerName,
		),
	]);
	return liveTriggersHash(recovery, domains, subdomain);
}

type TriggerState = "baseline" | "desired" | "drift" | "transitional";

async function inspectTriggerState(
	recovery: TriggerRecovery,
	dependencies: RolloutDependencies,
): Promise<TriggerState> {
	const [domains, subdomain] = await Promise.all([
		(dependencies.listCustomDomains ?? listCloudflareCustomDomains)(
			recovery.desired.accountId,
		),
		(dependencies.getWorkerSubdomain ?? getCloudflareWorkerSubdomain)(
			recovery.desired.accountId,
			recovery.desired.workerName,
		),
	]);
	const hash = liveTriggersHash(recovery, domains, subdomain);
	if (hash === recovery.baseline.hash) return "baseline";
	if (hash === recovery.desired.hash) return "desired";

	const relevantHostnames = new Set([
		...recovery.baseline.hostnames,
		...recovery.desired.hostnames,
	]);
	const relevant = domains.filter(
		(domain) =>
			domain.service.trim() === recovery.desired.workerName ||
			relevantHostnames.has(domain.hostname.trim().toLowerCase()),
	);
	const keys = relevant.map(
		(domain) =>
			`${domain.hostname.trim().toLowerCase()}\u0000${domain.service.trim()}`,
	);
	const isSafeTransition =
		new Set(keys).size === keys.length &&
		[subdomain.enabled, subdomain.previewsEnabled].every((value, index) => {
			const baselineValue =
				index === 0
					? recovery.baseline.workersDev
					: recovery.baseline.previewsEnabled;
			const desiredValue =
				index === 0
					? recovery.desired.workersDev
					: recovery.desired.previewsEnabled;
			return value === baselineValue || value === desiredValue;
		}) &&
		relevant.every(
			(domain) =>
				relevantHostnames.has(domain.hostname.trim().toLowerCase()) &&
				domain.service.trim() === recovery.desired.workerName,
		);
	return isSafeTransition ? "transitional" : "drift";
}

async function assertKnownTriggerState(
	recovery: TriggerRecovery,
	dependencies: RolloutDependencies,
): Promise<"baseline" | "desired"> {
	const state = await inspectTriggerState(recovery, dependencies);
	if (state === "baseline" || state === "desired") return state;
	throw new ConcurrentDeploymentError(
		"Live showcase triggers match neither the captured baseline nor this release; refusing to overwrite concurrent trigger drift",
	);
}

async function recoverOwnedTransitionalTriggers(
	recovery: TriggerRecovery,
	deploymentState: DeploymentSnapshot,
	state: CandidateRecoveryState,
	candidateVersionId: string,
	dependencies: RolloutDependencies,
): Promise<void> {
	const triggerState = await inspectTriggerState(recovery, dependencies);
	if (triggerState === "baseline" || triggerState === "desired") {
		return;
	}
	if (
		triggerState === "transitional" &&
		(baselineDeployment(deploymentState, state) ||
			stagedDeployment(deploymentState, state, candidateVersionId) ||
			activeCandidateDeployment(deploymentState, state, candidateVersionId))
	) {
		const liveDeployment = await deployment(dependencies, true);
		if (
			!baselineDeployment(liveDeployment, state) &&
			!stagedDeployment(liveDeployment, state, candidateVersionId) &&
			!activeCandidateDeployment(liveDeployment, state, candidateVersionId)
		) {
			throw new ConcurrentDeploymentError(
				"A concurrent Worker deployment replaced the release lease before trigger recovery; refusing to mutate triggers",
			);
		}
		await restoreBaselineTriggers(recovery, dependencies);
		return;
	}
	throw new ConcurrentDeploymentError(
		"Live showcase triggers contain unowned concurrent drift; recovery refused",
	);
}

async function pollForTriggerHash(
	recovery: TriggerRecovery,
	expectedHash: string,
	description: string,
	dependencies: RolloutDependencies,
): Promise<void> {
	let actualHash = "";
	for (let attempt = 1; attempt <= 5; attempt += 1) {
		actualHash = await currentTriggersHash(recovery, dependencies);
		if (actualHash === expectedHash) return;
		if (attempt < 5) {
			await (
				dependencies.waitForDomainPropagation ??
				((delayMs) =>
					new Promise<void>((resolveDelay) =>
						setTimeout(resolveDelay, delayMs),
					))
			)(1_000);
		}
	}
	throw new Error(
		`${description} did not reach its exact Git-authoritative custom-domain fingerprint`,
	);
}

async function reconcileDesiredTriggers(
	recovery: TriggerRecovery,
	dependencies: RolloutDependencies,
): Promise<void> {
	const current = await assertKnownTriggerState(recovery, dependencies);
	if (
		current === "baseline" &&
		recovery.baseline.hash !== recovery.desired.hash
	) {
		await dependencies.runCommand(cloudflareTriggersDeployCommand);
	}
	await pollForTriggerHash(
		recovery,
		recovery.desired.hash,
		"Desired trigger reconciliation",
		dependencies,
	);
}

async function restoreBaselineTriggers(
	recovery: TriggerRecovery,
	dependencies: RolloutDependencies,
): Promise<void> {
	const current = await inspectTriggerState(recovery, dependencies);
	if (current === "baseline") return;
	if (current === "drift") {
		throw new ConcurrentDeploymentError(
			"Live showcase triggers changed concurrently before rollback; refusing to overwrite trigger drift",
		);
	}
	const main = await stat(recovery.baseline.mainPath);
	if (!main.isFile()) {
		throw new Error(
			"Baseline trigger-only Wrangler main is not a regular file",
		);
	}
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-showcase-triggers-"),
	);
	let operationError: unknown;
	let cleanupError: unknown;
	try {
		await chmod(temporaryRoot, 0o700);
		const configPath = resolve(temporaryRoot, "wrangler.jsonc");
		await writeFile(configPath, recovery.baseline.configSource, {
			encoding: "utf8",
			flag: "wx",
			mode: 0o600,
		});
		await dependencies.runCommand(restoreCloudflareTriggersCommand(configPath));
		await pollForTriggerHash(
			recovery,
			recovery.baseline.hash,
			"Baseline trigger restoration",
			dependencies,
		);
	} catch (error) {
		operationError = error;
	} finally {
		try {
			await (
				dependencies.removeTriggerTemporaryRoot ?? removeTriggerTemporaryRoot
			)(temporaryRoot);
		} catch (error) {
			cleanupError = error;
		}
	}
	if (operationError !== undefined && cleanupError !== undefined) {
		throw new AggregateError(
			[operationError, cleanupError],
			"Custom-domain restoration and temporary config cleanup both failed",
		);
	}
	if (operationError !== undefined) throw operationError;
	if (cleanupError !== undefined) throw cleanupError;
}

async function uploadCandidate(
	input: ProductionRolloutInput,
	state: CandidateRecoveryState,
	dependencies: RolloutDependencies,
): Promise<void> {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-showcase-secrets-"),
	);
	let operationError: unknown;
	let operationFailed = false;
	let cleanupError: unknown;
	let cleanupFailed = false;
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
	} catch (error) {
		operationError = error;
		operationFailed = true;
	} finally {
		try {
			await (
				dependencies.removeCandidateTemporaryRoot ??
				removeCandidateTemporaryRoot
			)(temporaryRoot);
		} catch (error) {
			cleanupError = error;
			cleanupFailed = true;
		}
	}
	if (operationFailed && cleanupFailed) {
		throw new AggregateError(
			[operationError, cleanupError],
			"Worker candidate upload and temporary secret cleanup both failed",
		);
	}
	if (operationFailed) throw operationError;
	if (cleanupFailed) throw cleanupError;
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
		removeCandidateTemporaryRoot,
		removeTriggerTemporaryRoot,
		readDesiredShowcaseConfig: () => readFile(showcaseConfigPath, "utf8"),
		listCustomDomains: listCloudflareCustomDomains,
		getWorkerSubdomain: getCloudflareWorkerSubdomain,
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
	triggers: TriggerRecovery,
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
				throw new ConcurrentDeploymentError(
					"Rollback did not restore the captured baseline version or a concurrent deployment replaced it",
				);
			}
		} catch (error) {
			failures.push(error);
		}
	}
	if (failures.length > 0) {
		throw new RolloutRollbackFailure(
			rolloutError,
			new AggregateError(
				failures,
				"Worker rollback could not be verified; trigger restoration was refused",
			),
		);
	}
	try {
		const beforeTriggerRestore = await deployment(dependencies, true);
		if (!baselineDeployment(beforeTriggerRestore, state)) {
			throw new ConcurrentDeploymentError(
				"A concurrent Worker deployment replaced the restored baseline before trigger recovery; refusing to mutate triggers",
			);
		}
		await restoreBaselineTriggers(triggers, dependencies);
	} catch (error) {
		failures.push(error);
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
	const triggers = await loadTriggerRecovery(
		state.baselineIdentity.gitSha,
		dependencies,
	);
	assertRecoveryHashes(state, triggers);
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
		await recoverOwnedTransitionalTriggers(
			triggers,
			current,
			state,
			version.id,
			dependencies,
		);

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
			await reconcileDesiredTriggers(triggers, dependencies);
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

		await reconcileDesiredTriggers(triggers, dependencies);
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
		await rollbackAndVerify(
			error,
			state,
			triggers,
			version.id,
			input,
			dependencies,
		);
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
	const triggers = await loadTriggerRecovery(
		baseline.identity.gitSha,
		dependencies,
	);
	const initialTriggers = await assertKnownTriggerState(triggers, dependencies);
	if (initialTriggers !== "baseline") {
		throw new ConcurrentDeploymentError(
			"A new release requires live showcase triggers to match the Git-authoritative baseline",
		);
	}
	const state: CandidateRecoveryState = {
		schema: 3,
		releaseId: input.releaseId,
		expected: input.expected,
		baselineVersionId,
		baselineIdentity: baseline.identity,
		baselineTokenRole: baseline.tokenRole,
		baselineTriggersHash: triggers.baseline.hash,
		desiredTriggersHash: triggers.desired.hash,
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
		persistedState.baselineTriggersHash !== state.baselineTriggersHash ||
		persistedState.desiredTriggersHash !== state.desiredTriggersHash ||
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
	requiredEnvironment("SHOWCASE_ADMIN_ACCESS_CLIENT_ID");
	const adminAccessClientSecret = requiredEnvironment(
		"SHOWCASE_ADMIN_ACCESS_CLIENT_SECRET",
	);
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
			`Showcase production rollout failed: ${safeErrorMessage(error, [productionStatusToken, rollbackStatusToken, adminAccessClientSecret])}`,
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
