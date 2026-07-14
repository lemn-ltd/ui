#!/usr/bin/env node
import { spawn } from "node:child_process";
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	type BuildIdentity,
	smokeProductionDeployment,
	smokeProtectedStatusRoutes,
} from "./deployment-smoke.ts";

const root = resolve(import.meta.dirname, "../..");
const versionIdPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const rollbackMessage =
	"Automated rollback after failed protected showcase rollout";

export interface CommandSpec {
	readonly command: string;
	readonly args: readonly string[];
	readonly captureOutput?: boolean;
	readonly environment?: Readonly<Record<string, string>>;
	readonly stdin?: string;
}

export interface ProductionRolloutInput {
	readonly expected: BuildIdentity;
	readonly productionStatusToken: string;
	readonly rollbackStatusToken: string;
}

interface RolloutDependencies {
	readonly runCommand: (spec: CommandSpec) => Promise<string>;
	readonly smokeProduction: typeof smokeProductionDeployment;
	readonly smokeProtected: typeof smokeProtectedStatusRoutes;
	readonly writeSummary: (expected: BuildIdentity) => Promise<void>;
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

export const deploymentListCommand: CommandSpec = {
	command: "pnpm",
	args: [
		"--dir",
		"apps/showcase",
		"exec",
		"wrangler",
		"deployments",
		"list",
		"--config",
		"wrangler.jsonc",
		"--env",
		"production",
		"--json",
	],
	captureOutput: true,
};

export function secretPutCommand(token: string): CommandSpec {
	return {
		command: "pnpm",
		args: [
			"--dir",
			"apps/showcase",
			"exec",
			"wrangler",
			"secret",
			"put",
			"STATUS_TOKEN",
			"--config",
			"wrangler.jsonc",
			"--env",
			"production",
		],
		stdin: token,
	};
}

export function deployShowcaseCommand(expected: BuildIdentity): CommandSpec {
	return {
		command: "pnpm",
		args: ["deploy:showcase:prod"],
		environment: {
			BUILD_VERSION: expected.version,
			BUILD_GIT_SHA: expected.gitSha,
			BUILD_TIME: expected.buildTime,
		},
	};
}

export const cloudflareMappingSmokeCommand: CommandSpec = {
	command: "pnpm",
	args: ["smoke:cloudflare:release"],
};

export function rollbackCommand(versionId: string): CommandSpec {
	assertVersionId(versionId);
	return {
		command: "pnpm",
		args: [
			"--dir",
			"apps/showcase",
			"exec",
			"wrangler",
			"rollback",
			versionId,
			"--config",
			"wrangler.jsonc",
			"--env",
			"production",
			"--message",
			rollbackMessage,
			"--yes",
		],
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertVersionId(versionId: string): void {
	if (!versionIdPattern.test(versionId)) {
		throw new Error("Cloudflare returned an invalid active Worker version ID");
	}
}

export function activeVersionIdFromDeployments(source: string): string {
	const parsed: unknown = JSON.parse(source);
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error("Cloudflare returned no Worker deployments");
	}

	const deployments = parsed.filter(isRecord);
	if (deployments.length !== parsed.length) {
		throw new Error("Cloudflare returned malformed Worker deployment data");
	}
	const deploymentsByTime = deployments.map((deployment) => {
		if (typeof deployment.created_on !== "string") {
			throw new Error(
				"Cloudflare returned a deployment without a creation time",
			);
		}
		const createdAt = Date.parse(deployment.created_on);
		if (!Number.isFinite(createdAt)) {
			throw new Error(
				"Cloudflare returned an invalid deployment creation time",
			);
		}
		return { createdAt, deployment };
	});
	deploymentsByTime.sort((left, right) => right.createdAt - left.createdAt);
	const activeDeployment = deploymentsByTime[0]?.deployment;
	if (!activeDeployment || !Array.isArray(activeDeployment.versions)) {
		throw new Error("The active Worker deployment has no version data");
	}
	if (activeDeployment.versions.length !== 1) {
		throw new Error(
			"The active Worker deployment must contain exactly one version at 100% traffic",
		);
	}
	const activeVersion = activeDeployment.versions[0];
	if (
		!isRecord(activeVersion) ||
		activeVersion.percentage !== 100 ||
		typeof activeVersion.version_id !== "string"
	) {
		throw new Error(
			"The active Worker deployment must contain one valid version at 100% traffic",
		);
	}
	assertVersionId(activeVersion.version_id);
	return activeVersion.version_id;
}

async function runCommand(spec: CommandSpec): Promise<string> {
	return new Promise((resolveCommand, rejectCommand) => {
		const child = spawn(spec.command, [...spec.args], {
			cwd: root,
			env: { ...process.env, ...spec.environment },
			stdio: [
				spec.stdin === undefined ? "ignore" : "pipe",
				spec.captureOutput ? "pipe" : "inherit",
				"inherit",
			],
		});
		const output: Buffer[] = [];
		if (spec.captureOutput) {
			child.stdout?.on("data", (chunk: Buffer) => output.push(chunk));
		}
		child.once("error", rejectCommand);
		child.once("exit", (code, signal) => {
			if (code === 0) {
				resolveCommand(Buffer.concat(output).toString("utf8"));
				return;
			}
			rejectCommand(
				new Error(
					`${spec.command} ${spec.args.join(" ")} failed with ${signal ? `signal ${signal}` : `exit ${String(code)}`}`,
				),
			);
		});
		if (spec.stdin !== undefined) child.stdin?.end(spec.stdin);
	});
}

async function rollbackAndVerify(
	versionId: string,
	rollbackStatusToken: string,
	previousIdentity: BuildIdentity,
	dependencies: RolloutDependencies,
): Promise<void> {
	const failures: unknown[] = [];
	try {
		await dependencies.runCommand(rollbackCommand(versionId));
	} catch (error) {
		failures.push(error);
	}
	try {
		await dependencies.smokeProtected({
			token: rollbackStatusToken,
			expected: previousIdentity,
		});
	} catch (error) {
		failures.push(error);
	}
	if (failures.length > 0) {
		throw new AggregateError(
			failures,
			"Rollback command or rollback smoke failed",
		);
	}
}

async function capturePreviousIdentity(
	input: ProductionRolloutInput,
	dependencies: RolloutDependencies,
): Promise<{ identity: BuildIdentity; token: string }> {
	const smokeInput = { retryOptions: { attempts: 1, delayMs: 0 } } as const;
	try {
		return {
			identity: await dependencies.smokeProtected({
				...smokeInput,
				token: input.rollbackStatusToken,
			}),
			token: input.rollbackStatusToken,
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
				token: input.productionStatusToken,
			};
		} catch (productionTokenError) {
			throw new AggregateError(
				[rollbackTokenError, productionTokenError],
				"Neither retained status token authenticates the active Worker version",
			);
		}
	}
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
			"- Catalog: https://showcase.ui.le-mn.com/catalog.json",
			"- Agent guide: https://showcase.ui.le-mn.com/llms.txt",
			`- Commit: \`${expected.gitSha}\``,
			`- Build time: \`${expected.buildTime}\``,
			"- Protected status: authenticated smoke passed for all three routes",
			"",
		].join("\n"),
		{ encoding: "utf8", mode: 0o600 },
	);
}

const defaultDependencies: RolloutDependencies = {
	runCommand,
	smokeProduction: smokeProductionDeployment,
	smokeProtected: smokeProtectedStatusRoutes,
	writeSummary: writeGitHubSummary,
};

export async function runProductionRollout(
	input: ProductionRolloutInput,
	dependencies: RolloutDependencies = defaultDependencies,
): Promise<void> {
	if (!input.productionStatusToken || !input.rollbackStatusToken) {
		throw new Error("Production and rollback status tokens are required");
	}

	const deployments = await dependencies.runCommand(deploymentListCommand);
	const previousVersionId = activeVersionIdFromDeployments(deployments);
	const previous = await capturePreviousIdentity(input, dependencies);

	try {
		await dependencies.runCommand(
			secretPutCommand(input.productionStatusToken),
		);
		await dependencies.runCommand(deployShowcaseCommand(input.expected));
		await dependencies.runCommand(cloudflareMappingSmokeCommand);
		await dependencies.smokeProduction({
			expected: input.expected,
			statusToken: input.productionStatusToken,
		});
		await dependencies.writeSummary(input.expected);
	} catch (rolloutError) {
		try {
			await rollbackAndVerify(
				previousVersionId,
				previous.token,
				previous.identity,
				dependencies,
			);
		} catch (rollbackError) {
			throw new RolloutRollbackFailure(rolloutError, rollbackError);
		}
		throw rolloutError;
	}
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
	try {
		await runProductionRollout({
			expected: {
				version: requiredEnvironment("EXPECTED_RELEASE_VERSION"),
				gitSha: requiredEnvironment("EXPECTED_RELEASE_GIT_SHA"),
				buildTime: requiredEnvironment("EXPECTED_RELEASE_TIME"),
			},
			productionStatusToken,
			rollbackStatusToken,
		});
	} catch (error) {
		console.error(
			`Showcase production rollout failed: ${safeErrorMessage(error, [productionStatusToken, rollbackStatusToken])}`,
		);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
