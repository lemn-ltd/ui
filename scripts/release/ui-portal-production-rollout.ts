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
	CLOUDFLARE_CHILD_ENVIRONMENT_KEYS,
	redactSensitiveText,
	releaseChildEnvironment,
	sensitiveEnvironmentValues,
} from "./child-process-security.ts";
import {
	type BuildIdentity,
	smokePortalProductionDeployment,
	smokePortalServiceAccess,
	type UiPortalAccessCredentials,
} from "./deployment-smoke.ts";

const root = resolve(import.meta.dirname, "../..");
const versionIdPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const releaseShaPattern = /^[0-9a-f]{40}$/u;
const accessAudiencePattern = /^[0-9a-f]{64}$/u;
const candidateMessagePrefix = "lemn-ui-portal-candidate/v6:";
const candidateMessageMaxBytes = 1_000;
const rollbackMessage = "Lemn UI automated rollback";
const cloudflareApi = "https://api.cloudflare.com/client/v4";
const portalConfigRelativePath = "apps/ui-portal/wrangler.jsonc";
const portalConfigPath = resolve(root, portalConfigRelativePath);

export interface CommandSpec {
	readonly command: string;
	readonly args: readonly string[];
	readonly captureOutput?: boolean;
	readonly environment?: Readonly<Record<string, string>>;
	readonly inheritedEnvironmentKeys?: readonly string[];
	readonly redactedValues?: readonly string[];
	readonly stdin?: string;
	readonly timeoutMs?: number;
	readonly recovery?: boolean;
}

export interface ProductionRolloutInput {
	readonly releaseId: string;
	readonly expected: BuildIdentity;
	readonly access: UiPortalAccessCredentials;
	readonly accessAudiences: UiPortalAccessAudienceBindings;
}

export interface UiPortalAccessAudienceBindings {
	readonly admin: string;
	readonly health: string;
}

interface CandidateRecoveryStateBase {
	readonly schema: 6;
	readonly releaseId: string;
	readonly expected: BuildIdentity;
	readonly baselineTriggersHash: string;
	readonly desiredTriggersHash: string;
	readonly accessAudiencesHash: string;
}

export interface UpgradeCandidateRecoveryState
	extends CandidateRecoveryStateBase {
	readonly mode: "upgrade";
	readonly baselineVersionId: string;
	readonly baselineIdentity: BuildIdentity;
}

export interface BootstrapCandidateRecoveryState
	extends CandidateRecoveryStateBase {
	readonly mode: "bootstrap";
	readonly baselineDomains: readonly BootstrapDomainBaseline[];
}

export type CandidateRecoveryState =
	| BootstrapCandidateRecoveryState
	| UpgradeCandidateRecoveryState;

export interface CloudflareCustomDomain {
	readonly id?: string;
	readonly hostname: string;
	readonly service: string;
}

export interface BootstrapDomainBaseline {
	readonly hostname: string;
	readonly service: string | null;
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
	readonly smokeProduction: typeof smokePortalProductionDeployment;
	readonly smokeProtected: typeof smokePortalServiceAccess;
	readonly writeSummary: (expected: BuildIdentity) => Promise<void>;
	readonly removeTriggerTemporaryRoot?: (
		temporaryRoot: string,
	) => Promise<void>;
	readonly readDesiredPortalConfig?: () => Promise<string>;
	readonly listCustomDomains?: (
		accountId: string,
	) => Promise<readonly CloudflareCustomDomain[]>;
	readonly getWorkerSubdomain?: (
		accountId: string,
		workerName: string,
	) => Promise<CloudflareWorkerSubdomain>;
	readonly workerExists?: (
		accountId: string,
		workerName: string,
	) => Promise<boolean>;
	readonly deleteWorker?: (
		accountId: string,
		workerName: string,
	) => Promise<void>;
	readonly attachDomain?: (
		accountId: string,
		hostname: string,
		workerName: string,
	) => Promise<void>;
	readonly detachDomain?: (
		accountId: string,
		domainId: string,
	) => Promise<void>;
	readonly waitForDomainPropagation?: (delayMs: number) => Promise<void>;
	readonly environment?: NodeJS.ProcessEnv;
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
		super("Portal rollout failed and its rollback was not fully verified");
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
	"apps/ui-portal",
	"exec",
	"wrangler",
] as const;
const wranglerConfigArgs = ["--config", "wrangler.jsonc"] as const;
const cloudflareCommandEnvironment = {
	inheritedEnvironmentKeys: CLOUDFLARE_CHILD_ENVIRONMENT_KEYS,
} as const;

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
	...cloudflareCommandEnvironment,
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
	...cloudflareCommandEnvironment,
	timeoutMs: 60_000,
};

export const buildPortalCommand: CommandSpec = {
	command: "pnpm",
	args: ["--filter", "@lemn-ltd/ui-portal", "run", "cf:build"],
	timeoutMs: 10 * 60_000,
};

export const cloudflareMappingSmokeCommand: CommandSpec = {
	command: "pnpm",
	args: ["smoke:cloudflare:release"],
	...cloudflareCommandEnvironment,
	timeoutMs: 2 * 60_000,
};

export const cloudflareTriggersDeployCommand: CommandSpec = {
	command: "pnpm",
	args: [...wranglerBaseArgs, "triggers", "deploy", ...wranglerConfigArgs],
	...cloudflareCommandEnvironment,
	timeoutMs: 2 * 60_000,
	recovery: true,
};

export function baselinePortalConfigCommand(gitSha: string): CommandSpec {
	if (!releaseShaPattern.test(gitSha)) {
		throw new Error("Baseline Git SHA must be a full 40-character SHA");
	}
	return {
		command: "git",
		args: ["show", `${gitSha}:${portalConfigRelativePath}`],
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
		...cloudflareCommandEnvironment,
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

function assertAccessAudienceBindings(
	bindings: UiPortalAccessAudienceBindings,
): void {
	for (const [description, value] of [
		["Admin Access audience", bindings.admin],
		["health Access audience", bindings.health],
	] as const) {
		if (!accessAudiencePattern.test(value)) {
			throw new Error(
				`${description} must be exactly 64 lowercase hex characters`,
			);
		}
	}
	if (bindings.admin === bindings.health) {
		throw new Error("Admin and health Access audiences must be distinct");
	}
}

export function accessAudienceBindingsFromEnvironment(
	environment: NodeJS.ProcessEnv,
): UiPortalAccessAudienceBindings {
	const bindings = {
		admin: environment.PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE ?? "",
		health: environment.PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE ?? "",
	};
	assertAccessAudienceBindings(bindings);
	return bindings;
}

export function accessAudienceBindingsHash(
	bindings: UiPortalAccessAudienceBindings,
): string {
	assertAccessAudienceBindings(bindings);
	return createHash("sha256")
		.update(JSON.stringify({ admin: bindings.admin, health: bindings.health }))
		.digest("hex");
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
	environment: NodeJS.ProcessEnv,
): TriggerPlan {
	const config = parseWranglerConfig(source, description);
	if (!Array.isArray(config.routes)) {
		throw new Error(
			`${description} must explicitly declare routes, including [] when empty`,
		);
	}
	const routes = config.routes;
	if (
		routes.some((route) => !isRecord(route) || route.custom_domain !== true)
	) {
		throw new Error(
			`${description} contains a non-custom route; transactional route recovery is unsupported`,
		);
	}
	const cronValues = [config.triggers?.crons].filter(
		(value) => value !== undefined,
	);
	if (cronValues.some((value) => !Array.isArray(value) || value.length > 0)) {
		throw new Error(
			`${description} contains cron triggers; transactional cron recovery is unsupported`,
		);
	}

	const accountId = requireConfigValue(
		config.account_id ?? environment.CLOUDFLARE_ACCOUNT_ID,
		`${description} Cloudflare account ID (account_id or CLOUDFLARE_ACCOUNT_ID)`,
	);
	const workerName = requireConfigValue(
		config.name,
		`${description} Worker name`,
	);
	const compatibilityDate = requireConfigValue(
		config.compatibility_date,
		`${description} compatibility_date`,
	);
	const workersDev = config.workers_dev;
	if (typeof workersDev !== "boolean") {
		throw new Error(
			`${description} must resolve workers_dev to a boolean for production trigger recovery`,
		);
	}
	const previewsEnabled = config.preview_urls ?? workersDev;
	if (typeof previewsEnabled !== "boolean") {
		throw new Error(
			`${description} must resolve preview_urls to a boolean for production trigger recovery`,
		);
	}
	const configuredMain = requireConfigValue(config.main, `${description} main`);
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
	const portalRoot = resolve(root, "apps/ui-portal");
	const mainPath = resolve(portalRoot, configuredMain);
	if (mainPath !== portalRoot && !mainPath.startsWith(`${portalRoot}${sep}`)) {
		throw new Error(`${description} main must stay inside apps/ui-portal`);
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
	environment: NodeJS.ProcessEnv = process.env,
): {
	readonly baselineTriggersHash: string;
	readonly desiredTriggersHash: string;
} {
	const baseline = triggerPlanFromSource(
		baselineSource,
		"Baseline portal config",
		environment,
	);
	const desired = triggerPlanFromSource(
		desiredSource,
		"Desired portal config",
		environment,
	);
	assertSameCustomDomainTarget(baseline, desired);
	if (desired.workersDev || desired.previewsEnabled) {
		throw new Error(
			"Desired portal config must disable workers_dev and preview_urls in production",
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
			"Changing the portal Cloudflare account or Worker name is outside transactional custom-domain recovery",
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

function bootstrapDomainsFromUnknown(
	value: unknown,
): BootstrapDomainBaseline[] {
	if (!Array.isArray(value) || value.length === 0) {
		throw new Error("Worker bootstrap candidate has no domain baseline");
	}
	const domains = value.map((entry, index) => {
		if (
			!isRecord(entry) ||
			typeof entry.hostname !== "string" ||
			(entry.service !== null && typeof entry.service !== "string")
		) {
			throw new Error(
				`Worker bootstrap candidate has malformed domain baseline ${String(index)}`,
			);
		}
		return {
			hostname: normalizedHostname(
				entry.hostname,
				`Worker bootstrap domain baseline ${String(index)}`,
			),
			service:
				typeof entry.service === "string"
					? requireConfigValue(
							entry.service,
							`Worker bootstrap domain baseline ${String(index)} service`,
						)
					: null,
		};
	});
	const hostnames = domains.map((domain) => domain.hostname);
	if (new Set(hostnames).size !== hostnames.length) {
		throw new Error(
			"Worker bootstrap candidate has duplicate domain baselines",
		);
	}
	return domains.sort((left, right) =>
		left.hostname.localeCompare(right.hostname),
	);
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
		parsed.schema !== 6 ||
		(parsed.mode !== "bootstrap" && parsed.mode !== "upgrade") ||
		typeof parsed.releaseId !== "string" ||
		typeof parsed.baselineTriggersHash !== "string" ||
		typeof parsed.desiredTriggersHash !== "string" ||
		typeof parsed.accessAudiencesHash !== "string"
	) {
		throw new Error("Worker candidate recovery metadata has an invalid schema");
	}
	const common = {
		schema: 6 as const,
		mode: parsed.mode,
		releaseId: parsed.releaseId,
		expected: buildIdentityFromRecord(parsed.expected, "Candidate"),
		baselineTriggersHash: parsed.baselineTriggersHash,
		desiredTriggersHash: parsed.desiredTriggersHash,
		accessAudiencesHash: parsed.accessAudiencesHash,
	};
	const state: CandidateRecoveryState =
		parsed.mode === "bootstrap"
			? {
					...common,
					mode: "bootstrap",
					baselineDomains: bootstrapDomainsFromUnknown(parsed.baselineDomains),
				}
			: {
					...common,
					mode: "upgrade",
					baselineVersionId:
						typeof parsed.baselineVersionId === "string"
							? parsed.baselineVersionId
							: "",
					baselineIdentity: buildIdentityFromRecord(
						parsed.baselineIdentity,
						"Baseline",
					),
				};
	assertCandidateState(state);
	return state;
}

function assertCandidateState(state: CandidateRecoveryState): void {
	if (state.schema !== 6 || !state.releaseId) {
		throw new Error("Worker candidate recovery metadata has an invalid schema");
	}
	assertBuildIdentity(state.expected, "Candidate");
	if (state.mode === "upgrade") {
		assertVersionId(state.baselineVersionId);
		assertBuildIdentity(state.baselineIdentity, "Baseline");
	} else {
		bootstrapDomainsFromUnknown(state.baselineDomains);
	}
	for (const [description, hash] of [
		["baseline triggers", state.baselineTriggersHash],
		["desired triggers", state.desiredTriggersHash],
		["Access audiences", state.accessAudiencesHash],
	] as const) {
		if (!/^[0-9a-f]{64}$/u.test(hash)) {
			throw new Error(
				`Worker candidate recovery metadata has an invalid ${description} hash`,
			);
		}
	}
}

function rolloutMessage(
	phase: "active" | "bootstrap" | "staged",
	releaseId: string,
	baselineVersionId: string | "absent",
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
	accessAudiences: UiPortalAccessAudienceBindings,
): CommandSpec {
	if (
		state.accessAudiencesHash !== accessAudienceBindingsHash(accessAudiences)
	) {
		throw new Error(
			"Candidate Access audiences do not match recovery metadata",
		);
	}
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
			"--var",
			`ACCESS_AUDIENCE:${accessAudiences.admin}`,
			"--var",
			`ACCESS_HEALTH_AUDIENCE:${accessAudiences.health}`,
			"--tag",
			candidateTag(expected),
			"--message",
			encodeCandidateState(state),
		],
		...cloudflareCommandEnvironment,
		redactedValues: [accessAudiences.admin, accessAudiences.health],
		timeoutMs: 10 * 60_000,
	};
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
				typeof value.id !== "string" ||
				!value.id.trim() ||
				typeof value.hostname !== "string" ||
				!value.hostname.trim() ||
				typeof value.service !== "string" ||
				!value.service.trim()
			) {
				throw new Error(
					`Cloudflare returned malformed custom domain ${String(index)} on page ${String(page)}`,
				);
			}
			domains.push({
				id: value.id,
				hostname: value.hostname,
				service: value.service,
			});
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

export async function cloudflareWorkerExists(
	accountId: string,
	workerName: string,
	apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim(),
	fetchImplementation: typeof fetch = fetch,
): Promise<boolean> {
	if (!apiToken) {
		throw new Error(
			"Missing CLOUDFLARE_API_TOKEN for Worker existence verification",
		);
	}
	const response = await fetchImplementation(
		`${cloudflareApi}/accounts/${encodeURIComponent(accountId)}/workers/scripts`,
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
			`Cloudflare Worker inventory returned non-JSON HTTP ${String(response.status)}`,
		);
	}
	if (
		!response.ok ||
		envelope.success !== true ||
		!Array.isArray(envelope.result) ||
		envelope.result.some(
			(value) => !isRecord(value) || typeof value.id !== "string",
		)
	) {
		throw new Error(
			`Cloudflare Worker inventory failed or returned malformed state with HTTP ${String(response.status)}`,
		);
	}
	return envelope.result.some(
		(value) => (value as { readonly id: string }).id === workerName,
	);
}

export async function deleteCloudflareWorker(
	accountId: string,
	workerName: string,
	apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim(),
	fetchImplementation: typeof fetch = fetch,
): Promise<void> {
	if (!apiToken) {
		throw new Error("Missing CLOUDFLARE_API_TOKEN for bootstrap rollback");
	}
	const response = await fetchImplementation(
		`${cloudflareApi}/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}`,
		{
			headers: { Authorization: `Bearer ${apiToken}` },
			method: "DELETE",
			signal: AbortSignal.timeout(30_000),
		},
	);
	let envelope: CloudflareEnvelope<unknown>;
	try {
		envelope = (await response.json()) as CloudflareEnvelope<unknown>;
	} catch {
		throw new Error(
			`Cloudflare Worker bootstrap rollback returned non-JSON HTTP ${String(response.status)}`,
		);
	}
	if (!response.ok || envelope.success !== true) {
		throw new Error(
			`Cloudflare Worker bootstrap rollback failed with HTTP ${String(response.status)}`,
		);
	}
}

export async function attachCloudflareCustomDomain(
	accountId: string,
	hostname: string,
	workerName: string,
	apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim(),
	fetchImplementation: typeof fetch = fetch,
): Promise<void> {
	if (!apiToken) {
		throw new Error("Missing CLOUDFLARE_API_TOKEN for custom-domain attach");
	}
	const response = await fetchImplementation(
		`${cloudflareApi}/accounts/${encodeURIComponent(accountId)}/workers/domains`,
		{
			body: JSON.stringify({ hostname, service: workerName }),
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"content-type": "application/json",
			},
			method: "PUT",
			signal: AbortSignal.timeout(30_000),
		},
	);
	let envelope: CloudflareEnvelope<unknown>;
	try {
		envelope = (await response.json()) as CloudflareEnvelope<unknown>;
	} catch {
		throw new Error(
			`Cloudflare custom-domain attach returned non-JSON HTTP ${String(response.status)}`,
		);
	}
	if (!response.ok || envelope.success !== true) {
		throw new Error(
			`Cloudflare custom-domain attach failed with HTTP ${String(response.status)}`,
		);
	}
}

export async function detachCloudflareCustomDomain(
	accountId: string,
	domainId: string,
	apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim(),
	fetchImplementation: typeof fetch = fetch,
): Promise<void> {
	if (!apiToken) {
		throw new Error("Missing CLOUDFLARE_API_TOKEN for custom-domain detach");
	}
	const response = await fetchImplementation(
		`${cloudflareApi}/accounts/${encodeURIComponent(accountId)}/workers/domains/${encodeURIComponent(domainId)}`,
		{
			headers: { Authorization: `Bearer ${apiToken}` },
			method: "DELETE",
			signal: AbortSignal.timeout(30_000),
		},
	);
	let envelope: CloudflareEnvelope<unknown>;
	try {
		envelope = (await response.json()) as CloudflareEnvelope<unknown>;
	} catch {
		throw new Error(
			`Cloudflare custom-domain detach returned non-JSON HTTP ${String(response.status)}`,
		);
	}
	if (!response.ok || envelope.success !== true) {
		throw new Error(
			`Cloudflare custom-domain detach failed with HTTP ${String(response.status)}`,
		);
	}
}

async function loadTriggerRecovery(
	baselineGitSha: string,
	dependencies: RolloutDependencies,
): Promise<TriggerRecovery> {
	const [baselineSource, desiredSource] = await Promise.all([
		dependencies.runCommand(baselinePortalConfigCommand(baselineGitSha)),
		(
			dependencies.readDesiredPortalConfig ??
			(() => readFile(portalConfigPath, "utf8"))
		)(),
	]);
	const baseline = triggerPlanFromSource(
		baselineSource,
		"Baseline portal config",
		dependencies.environment ?? process.env,
	);
	const desired = triggerPlanFromSource(
		desiredSource,
		"Desired portal config",
		dependencies.environment ?? process.env,
	);
	assertSameCustomDomainTarget(baseline, desired);
	if (desired.workersDev || desired.previewsEnabled) {
		throw new Error(
			"Desired portal config must disable workers_dev and preview_urls in production",
		);
	}
	return { baseline, desired };
}

async function desiredBootstrapTriggerPlan(
	dependencies: RolloutDependencies,
): Promise<TriggerPlan> {
	const desiredSource = await (
		dependencies.readDesiredPortalConfig ??
		(() => readFile(portalConfigPath, "utf8"))
	)();
	const environment = dependencies.environment ?? process.env;
	const desired = triggerPlanFromSource(
		desiredSource,
		"Desired portal config",
		environment,
	);
	if (desired.workersDev || desired.previewsEnabled) {
		throw new Error(
			"Desired portal config must disable workers_dev and preview_urls in production",
		);
	}
	return desired;
}

function bootstrapTriggerRecovery(
	desired: TriggerPlan,
	baselineDomains: readonly BootstrapDomainBaseline[],
	environment: NodeJS.ProcessEnv,
): TriggerRecovery {
	const desiredConfig = JSON.parse(desired.configSource) as Record<
		string,
		unknown
	>;
	const emptyBaseline = triggerPlanFromSource(
		`${JSON.stringify({ ...desiredConfig, routes: [] }, null, 2)}\n`,
		"Absent bootstrap portal config",
		environment,
	);
	const mappedDomains = baselineDomains
		.filter(
			(
				domain,
			): domain is { readonly hostname: string; readonly service: string } =>
				domain.service !== null,
		)
		.map((domain) => ({
			hostname: domain.hostname,
			service: domain.service,
		}));
	const baseline: TriggerPlan = {
		...emptyBaseline,
		hash: triggerHash(desired.accountId, desired.workerName, mappedDomains, {
			enabled: false,
			previewsEnabled: false,
		}),
		hostnames: mappedDomains.map((domain) => domain.hostname).sort(),
	};
	return { baseline, desired };
}

async function loadBootstrapTriggerRecovery(
	state: BootstrapCandidateRecoveryState,
	dependencies: RolloutDependencies,
): Promise<TriggerRecovery> {
	return bootstrapTriggerRecovery(
		await desiredBootstrapTriggerPlan(dependencies),
		state.baselineDomains,
		dependencies.environment ?? process.env,
	);
}

function captureBootstrapDomainBaseline(
	desired: TriggerPlan,
	domains: readonly CloudflareCustomDomain[],
): BootstrapDomainBaseline[] {
	return desired.hostnames.map((hostname) => {
		const matches = domains.filter(
			(domain) => domain.hostname.trim().toLowerCase() === hostname,
		);
		if (matches.length > 1) {
			throw new ConcurrentDeploymentError(
				`Cloudflare returned duplicate custom-domain ownership for ${hostname}`,
			);
		}
		const match = matches[0];
		if (match?.service.trim() === desired.workerName) {
			throw new ConcurrentDeploymentError(
				`Bootstrap found ${hostname} already attached to the absent target Worker`,
			);
		}
		return {
			hostname,
			service: match?.service.trim() || null,
		};
	});
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
		"Live portal triggers match neither the captured baseline nor this release; refusing to overwrite concurrent trigger drift",
	);
}

async function recoverOwnedTransitionalTriggers(
	recovery: TriggerRecovery,
	deploymentState: DeploymentSnapshot,
	state: UpgradeCandidateRecoveryState,
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
		"Live portal triggers contain unowned concurrent drift; recovery refused",
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

function exactDomainMapping(
	domains: readonly CloudflareCustomDomain[],
	hostname: string,
): CloudflareCustomDomain | undefined {
	const matches = domains.filter(
		(domain) => domain.hostname.trim().toLowerCase() === hostname,
	);
	if (matches.length > 1) {
		throw new ConcurrentDeploymentError(
			`Cloudflare returned duplicate custom-domain ownership for ${hostname}`,
		);
	}
	return matches[0];
}

async function reconcileBootstrapDesiredDomains(
	state: BootstrapCandidateRecoveryState,
	recovery: TriggerRecovery,
	dependencies: RolloutDependencies,
): Promise<void> {
	const attach = dependencies.attachDomain ?? attachCloudflareCustomDomain;
	const baselineByHostname = new Map(
		state.baselineDomains.map((domain) => [domain.hostname, domain.service]),
	);
	for (const hostname of recovery.desired.hostnames) {
		const domains = await (
			dependencies.listCustomDomains ?? listCloudflareCustomDomains
		)(recovery.desired.accountId);
		const current = exactDomainMapping(domains, hostname);
		if (current?.service.trim() === recovery.desired.workerName) continue;
		const baselineService = baselineByHostname.get(hostname);
		const currentService = current?.service.trim() ?? null;
		if (baselineService === undefined || currentService !== baselineService) {
			throw new ConcurrentDeploymentError(
				`Custom domain ${hostname} changed after bootstrap capture; refusing takeover`,
			);
		}
		await attach(
			recovery.desired.accountId,
			hostname,
			recovery.desired.workerName,
		);
	}
	await pollForTriggerHash(
		recovery,
		recovery.desired.hash,
		"Bootstrap custom-domain reconciliation",
		dependencies,
	);
}

async function restoreBootstrapDomainBaseline(
	state: BootstrapCandidateRecoveryState,
	recovery: TriggerRecovery,
	dependencies: RolloutDependencies,
): Promise<void> {
	const attach = dependencies.attachDomain ?? attachCloudflareCustomDomain;
	const detach = dependencies.detachDomain ?? detachCloudflareCustomDomain;
	for (const baseline of [...state.baselineDomains].reverse()) {
		const domains = await (
			dependencies.listCustomDomains ?? listCloudflareCustomDomains
		)(recovery.desired.accountId);
		const current = exactDomainMapping(domains, baseline.hostname);
		const currentService = current?.service.trim() ?? null;
		if (currentService === baseline.service) continue;
		if (currentService !== recovery.desired.workerName) {
			throw new ConcurrentDeploymentError(
				`Custom domain ${baseline.hostname} changed concurrently during bootstrap rollback`,
			);
		}
		if (baseline.service) {
			await attach(
				recovery.desired.accountId,
				baseline.hostname,
				baseline.service,
			);
			continue;
		}
		if (!current?.id) {
			throw new Error(
				`Custom domain ${baseline.hostname} has no immutable ID for bootstrap rollback`,
			);
		}
		await detach(recovery.desired.accountId, current.id);
	}
	await pollForTriggerHash(
		recovery,
		recovery.baseline.hash,
		"Bootstrap custom-domain rollback",
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
			"Live portal triggers changed concurrently before rollback; refusing to overwrite trigger drift",
		);
	}
	const main = await stat(recovery.baseline.mainPath);
	if (!main.isFile()) {
		throw new Error(
			"Baseline trigger-only Wrangler main is not a regular file",
		);
	}
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-portal-triggers-"),
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
	await dependencies.runCommand(
		uploadCandidateCommand(input.expected, state, input.accessAudiences),
	);
}

export function stageCandidateCommand(
	state: UpgradeCandidateRecoveryState,
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
		...cloudflareCommandEnvironment,
		timeoutMs: 2 * 60_000,
	};
}

export function bootstrapCandidateCommand(
	state: BootstrapCandidateRecoveryState,
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
				"bootstrap",
				state.releaseId,
				"absent",
				candidateVersionId,
			),
			"--yes",
		],
		...cloudflareCommandEnvironment,
		timeoutMs: 2 * 60_000,
	};
}

export function activateCandidateCommand(
	state: UpgradeCandidateRecoveryState,
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
		...cloudflareCommandEnvironment,
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
		...cloudflareCommandEnvironment,
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

export function optionalDeploymentFromJson(
	source: string,
): DeploymentSnapshot | undefined {
	const parsed: unknown = JSON.parse(source);
	if (!Array.isArray(parsed)) {
		throw new Error("Cloudflare returned malformed Worker deployment data");
	}
	if (parsed.length === 0) return undefined;
	return activeDeploymentFromJson(source);
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
	state: UpgradeCandidateRecoveryState,
): boolean {
	return hasTraffic(deployment, [
		{ versionId: state.baselineVersionId, percentage: 100 },
	]);
}

function stagedDeployment(
	deployment: DeploymentSnapshot,
	state: UpgradeCandidateRecoveryState,
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
	state: UpgradeCandidateRecoveryState,
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

function activeBootstrapDeployment(
	deployment: DeploymentSnapshot,
	state: BootstrapCandidateRecoveryState,
	candidateVersionId: string,
): boolean {
	return (
		deployment.message ===
			rolloutMessage(
				"bootstrap",
				state.releaseId,
				"absent",
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

function redactCommandText(
	value: string,
	redactedValues: readonly string[] = [],
): string {
	return redactSensitiveText(value, redactedValues);
}

function commandDescription(
	spec: CommandSpec,
	protectedValues: readonly string[],
): string {
	return redactCommandText(
		`${spec.command} ${spec.args.join(" ")}`,
		protectedValues,
	);
}

export function createCommandRunner(
	signal?: AbortSignal,
	sourceEnvironment: NodeJS.ProcessEnv = process.env,
) {
	return async (spec: CommandSpec): Promise<string> =>
		new Promise((resolveCommand, rejectCommand) => {
			const childEnvironment = releaseChildEnvironment(
				sourceEnvironment,
				spec.inheritedEnvironmentKeys,
				spec.environment,
			);
			const protectedValues = [
				...sensitiveEnvironmentValues(childEnvironment),
				...(spec.redactedValues ?? []),
			];
			const redactOutput = protectedValues.length > 0;
			const child = spawn(spec.command, [...spec.args], {
				cwd: root,
				env: childEnvironment,
				stdio: [
					spec.stdin === undefined ? "ignore" : "pipe",
					spec.captureOutput || redactOutput ? "pipe" : "inherit",
					redactOutput ? "pipe" : "inherit",
				],
				detached: process.platform !== "win32",
			});
			const output: Buffer[] = [];
			const errorOutput: Buffer[] = [];
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
				() =>
					abort(
						`${commandDescription(spec, protectedValues)} timed out`,
						false,
					),
				spec.timeoutMs ?? 5 * 60_000,
			);
			timeout.unref();
			const onAbort = () =>
				abort(
					`${commandDescription(spec, protectedValues)} was interrupted`,
					true,
				);
			if (!spec.recovery) {
				if (signal?.aborted) onAbort();
				else signal?.addEventListener("abort", onAbort, { once: true });
			}

			if (spec.captureOutput) {
				child.stdout?.on("data", (chunk: Buffer) => output.push(chunk));
			} else if (redactOutput) {
				child.stdout?.on("data", (chunk: Buffer) => output.push(chunk));
			}
			if (redactOutput) {
				child.stderr?.on("data", (chunk: Buffer) => errorOutput.push(chunk));
			}
			const flushRedactedOutput = () => {
				if (!redactOutput) return;
				const stdout = redactCommandText(
					Buffer.concat(output).toString("utf8"),
					protectedValues,
				);
				const stderr = redactCommandText(
					Buffer.concat(errorOutput).toString("utf8"),
					protectedValues,
				);
				if (!spec.captureOutput && stdout) process.stdout.write(stdout);
				if (stderr) process.stderr.write(stderr);
			};
			child.once("error", (error) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				if (forceTimer) clearTimeout(forceTimer);
				signal?.removeEventListener("abort", onAbort);
				flushRedactedOutput();
				rejectCommand(
					abortError ??
						new Error(redactCommandText(String(error), protectedValues)),
				);
			});
			child.once("exit", (code, childSignal) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				if (forceTimer) clearTimeout(forceTimer);
				signal?.removeEventListener("abort", onAbort);
				flushRedactedOutput();
				if (abortError) {
					rejectCommand(abortError);
					return;
				}
				if (code === 0) {
					resolveCommand(
						redactCommandText(
							Buffer.concat(output).toString("utf8"),
							protectedValues,
						),
					);
					return;
				}
				rejectCommand(
					new Error(
						`${commandDescription(spec, protectedValues)} failed with ${childSignal ? `signal ${childSignal}` : `exit ${String(code)}`}`,
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
			"- Portal: https://portal.ui.le-mn.com",
			`- Commit: \`${expected.gitSha}\``,
			`- Build time: \`${expected.buildTime}\``,
			"- Cloudflare Access service health: candidate and active deployment smokes passed",
			"",
		].join("\n"),
		{ encoding: "utf8", mode: 0o600 },
	);
}

function defaultDependencies(signal?: AbortSignal): RolloutDependencies {
	return {
		runCommand: createCommandRunner(signal),
		smokeProduction: smokePortalProductionDeployment,
		smokeProtected: smokePortalServiceAccess,
		writeSummary: writeGitHubSummary,
		removeTriggerTemporaryRoot,
		readDesiredPortalConfig: () => readFile(portalConfigPath, "utf8"),
		listCustomDomains: listCloudflareCustomDomains,
		getWorkerSubdomain: getCloudflareWorkerSubdomain,
		workerExists: cloudflareWorkerExists,
		deleteWorker: deleteCloudflareWorker,
		attachDomain: attachCloudflareCustomDomain,
		detachDomain: detachCloudflareCustomDomain,
		environment: process.env,
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

async function optionalDeployment(
	dependencies: RolloutDependencies,
	recovery = false,
): Promise<DeploymentSnapshot | undefined> {
	return optionalDeploymentFromJson(
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
): Promise<BuildIdentity> {
	return dependencies.smokeProtected({
		credentials: input.access,
		retryOptions: { attempts: 1, delayMs: 0 },
		signal: dependencies.signal,
	});
}

function assertCandidateMatchesRelease(
	version: VersionSummary,
	input: ProductionRolloutInput,
): CandidateRecoveryState {
	const state = decodeCandidateState(version.message);
	if (
		state.releaseId !== input.releaseId ||
		!sameIdentity(state.expected, input.expected) ||
		state.accessAudiencesHash !==
			accessAudienceBindingsHash(input.accessAudiences)
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
	state: UpgradeCandidateRecoveryState,
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
			credentials: input.access,
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

async function executeUpgradeCandidate(
	input: ProductionRolloutInput,
	version: VersionSummary,
	state: UpgradeCandidateRecoveryState,
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
				credentials: input.access,
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
				access: input.access,
				portalVersionId: version.id,
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
			access: input.access,
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

async function rollbackBootstrapAndVerify(
	rolloutError: unknown,
	state: BootstrapCandidateRecoveryState,
	triggers: TriggerRecovery,
	candidateVersionId: string,
	dependencies: RolloutDependencies,
): Promise<never> {
	const failures: unknown[] = [];
	let current: DeploymentSnapshot | undefined;
	try {
		current = await optionalDeployment(dependencies, true);
		if (
			current &&
			!activeBootstrapDeployment(current, state, candidateVersionId)
		) {
			throw new ConcurrentDeploymentError(
				"A concurrent Worker deployment replaced the bootstrap lease; refusing destructive cleanup",
			);
		}
	} catch (error) {
		throw new RolloutRollbackFailure(rolloutError, error);
	}

	try {
		await restoreBootstrapDomainBaseline(state, triggers, dependencies);
	} catch (error) {
		failures.push(error);
	}
	if (failures.length === 0) {
		try {
			const exists = await (
				dependencies.workerExists ?? cloudflareWorkerExists
			)(triggers.desired.accountId, triggers.desired.workerName);
			if (exists) {
				await (dependencies.deleteWorker ?? deleteCloudflareWorker)(
					triggers.desired.accountId,
					triggers.desired.workerName,
				);
			}
			if (
				await (dependencies.workerExists ?? cloudflareWorkerExists)(
					triggers.desired.accountId,
					triggers.desired.workerName,
				)
			) {
				throw new Error(
					"Bootstrap rollback did not remove the release-owned Worker",
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
				"Bootstrap rollback could not restore the exact domain baseline and absent Worker state",
			),
		);
	}
	throw rolloutError;
}

async function executeBootstrapCandidate(
	input: ProductionRolloutInput,
	version: VersionSummary,
	state: BootstrapCandidateRecoveryState,
	dependencies: RolloutDependencies,
): Promise<void> {
	const triggers = await loadBootstrapTriggerRecovery(state, dependencies);
	assertRecoveryHashes(state, triggers);
	try {
		if (
			!(await (dependencies.workerExists ?? cloudflareWorkerExists)(
				triggers.desired.accountId,
				triggers.desired.workerName,
			))
		) {
			throw new ConcurrentDeploymentError(
				"Bootstrap candidate metadata exists but its Worker is absent",
			);
		}
		let current = await optionalDeployment(dependencies);
		if (current && !activeBootstrapDeployment(current, state, version.id)) {
			throw new ConcurrentDeploymentError(
				"The target Worker has a deployment not owned by this bootstrap release",
			);
		}
		if (!current) {
			const triggerState = await assertKnownTriggerState(
				triggers,
				dependencies,
			);
			if (triggerState !== "baseline") {
				throw new ConcurrentDeploymentError(
					"Bootstrap requires the exact captured custom-domain baseline before activation",
				);
			}
			await dependencies.runCommand(
				bootstrapCandidateCommand(state, version.id),
			);
			current = await optionalDeployment(dependencies);
			if (!current || !activeBootstrapDeployment(current, state, version.id)) {
				throw new ConcurrentDeploymentError(
					"The bootstrap release could not acquire its deployment lease",
				);
			}
		}

		await reconcileBootstrapDesiredDomains(state, triggers, dependencies);
		await dependencies.runCommand(cloudflareMappingSmokeCommand);
		await dependencies.smokeProduction({
			expected: input.expected,
			access: input.access,
			portalVersionId: version.id,
			signal: dependencies.signal,
		});
		current = await optionalDeployment(dependencies);
		if (!current || !activeBootstrapDeployment(current, state, version.id)) {
			throw new ConcurrentDeploymentError(
				"The bootstrap deployment lease changed during production smoke",
			);
		}
		await dependencies.smokeProduction({
			expected: input.expected,
			access: input.access,
			signal: dependencies.signal,
		});
		await dependencies.writeSummary(input.expected);
	} catch (error) {
		await rollbackBootstrapAndVerify(
			error,
			state,
			triggers,
			version.id,
			dependencies,
		);
	}
}

async function executeCandidate(
	input: ProductionRolloutInput,
	version: VersionSummary,
	state: CandidateRecoveryState,
	dependencies: RolloutDependencies,
): Promise<void> {
	if (state.mode === "bootstrap") {
		await executeBootstrapCandidate(input, version, state, dependencies);
		return;
	}
	await executeUpgradeCandidate(input, version, state, dependencies);
}

export async function runProductionRollout(
	input: ProductionRolloutInput,
	dependencies: RolloutDependencies = defaultDependencies(),
): Promise<void> {
	assertAccessAudienceBindings(input.accessAudiences);
	if (
		!input.access.clientId ||
		!input.access.clientSecret ||
		input.access.clientId === input.access.clientSecret
	) {
		throw new Error(
			"Distinct UI Portal Access client ID and secret are required",
		);
	}
	assertBuildIdentity(input.expected, "Release");
	if (
		input.releaseId !==
		`@lemn-ltd/ui@${input.expected.version}#${input.expected.gitSha}`
	) {
		throw new Error("Release ID does not match the immutable build identity");
	}

	const desired = await desiredBootstrapTriggerPlan(dependencies);
	const targetWorkerExists = await (
		dependencies.workerExists ?? cloudflareWorkerExists
	)(desired.accountId, desired.workerName);
	let existing = targetWorkerExists
		? await candidate(input.expected, dependencies)
		: undefined;
	if (existing) {
		await executeCandidate(
			input,
			existing,
			assertCandidateMatchesRelease(existing, input),
			dependencies,
		);
		return;
	}
	if (!targetWorkerExists) {
		const liveDomains = await (
			dependencies.listCustomDomains ?? listCloudflareCustomDomains
		)(desired.accountId);
		const baselineDomains = captureBootstrapDomainBaseline(
			desired,
			liveDomains,
		);
		const triggers = bootstrapTriggerRecovery(
			desired,
			baselineDomains,
			dependencies.environment ?? process.env,
		);
		const relevantHostnames = new Set(desired.hostnames);
		const relevantDomains = liveDomains.filter(
			(domain) =>
				domain.service.trim() === desired.workerName ||
				relevantHostnames.has(domain.hostname.trim().toLowerCase()),
		);
		const capturedHash = triggerHash(
			desired.accountId,
			desired.workerName,
			relevantDomains,
			{ enabled: false, previewsEnabled: false },
		);
		if (capturedHash !== triggers.baseline.hash) {
			throw new ConcurrentDeploymentError(
				"Bootstrap custom-domain inventory includes target-Worker state outside the exact captured baseline",
			);
		}
		const bootstrapState: BootstrapCandidateRecoveryState = {
			schema: 6,
			mode: "bootstrap",
			releaseId: input.releaseId,
			expected: input.expected,
			baselineDomains,
			baselineTriggersHash: triggers.baseline.hash,
			desiredTriggersHash: triggers.desired.hash,
			accessAudiencesHash: accessAudienceBindingsHash(input.accessAudiences),
		};
		await dependencies.runCommand(buildPortalCommand);
		await uploadCandidate(input, bootstrapState, dependencies);
		if (
			!(await (dependencies.workerExists ?? cloudflareWorkerExists)(
				desired.accountId,
				desired.workerName,
			))
		) {
			throw new Error(
				"Cloudflare did not create the Worker for the uploaded bootstrap candidate",
			);
		}
		existing = await candidate(input.expected, dependencies);
		if (!existing) {
			throw new Error(
				"Cloudflare did not persist the uploaded bootstrap candidate by release tag",
			);
		}
		const persisted = assertCandidateMatchesRelease(existing, input);
		if (
			persisted.mode !== "bootstrap" ||
			persisted.baselineTriggersHash !== bootstrapState.baselineTriggersHash ||
			persisted.desiredTriggersHash !== bootstrapState.desiredTriggersHash ||
			JSON.stringify(persisted.baselineDomains) !==
				JSON.stringify(bootstrapState.baselineDomains)
		) {
			throw new Error("Persisted Worker bootstrap baseline metadata changed");
		}
		await executeBootstrapCandidate(input, existing, persisted, dependencies);
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
	const triggers = await loadTriggerRecovery(baseline.gitSha, dependencies);
	const initialTriggers = await assertKnownTriggerState(triggers, dependencies);
	if (initialTriggers !== "baseline") {
		throw new ConcurrentDeploymentError(
			"A new release requires live portal triggers to match the Git-authoritative baseline",
		);
	}
	const state: UpgradeCandidateRecoveryState = {
		schema: 6,
		mode: "upgrade",
		releaseId: input.releaseId,
		expected: input.expected,
		baselineVersionId,
		baselineIdentity: baseline,
		baselineTriggersHash: triggers.baseline.hash,
		desiredTriggersHash: triggers.desired.hash,
		accessAudiencesHash: accessAudienceBindingsHash(input.accessAudiences),
	};

	await dependencies.runCommand(buildPortalCommand);
	await uploadCandidate(input, state, dependencies);
	existing = await candidate(input.expected, dependencies);
	if (!existing) {
		throw new Error(
			"Cloudflare did not persist the uploaded Worker candidate by release tag",
		);
	}
	const persistedState = assertCandidateMatchesRelease(existing, input);
	if (
		persistedState.mode !== "upgrade" ||
		persistedState.baselineVersionId !== state.baselineVersionId ||
		persistedState.baselineTriggersHash !== state.baselineTriggersHash ||
		persistedState.desiredTriggersHash !== state.desiredTriggersHash ||
		persistedState.accessAudiencesHash !== state.accessAudiencesHash ||
		!sameIdentity(persistedState.baselineIdentity, state.baselineIdentity)
	) {
		throw new Error("Persisted Worker candidate baseline metadata changed");
	}
	if (persistedState.mode !== "upgrade") {
		throw new Error("Persisted Worker candidate mode changed");
	}
	await executeUpgradeCandidate(input, existing, persistedState, dependencies);
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
	return redactSensitiveText(describeError(error), [
		...sensitiveEnvironmentValues(process.env),
		...secrets,
	]);
}

function requiredEnvironment(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required production input: ${name}`);
	return value;
}

async function main(): Promise<void> {
	const access = {
		clientId: requiredEnvironment("UI_PORTAL_ACCESS_CLIENT_ID"),
		clientSecret: requiredEnvironment("UI_PORTAL_ACCESS_CLIENT_SECRET"),
	};
	const accessAudiences = accessAudienceBindingsFromEnvironment(process.env);
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
				access,
				accessAudiences,
			},
			defaultDependencies(abortController.signal),
		);
	} catch (error) {
		console.error(
			`UI Portal production rollout failed: ${safeErrorMessage(error, [
				access.clientId,
				access.clientSecret,
				accessAudiences.admin,
				accessAudiences.health,
			])}`,
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
