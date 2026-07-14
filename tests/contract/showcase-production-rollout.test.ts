import assert from "node:assert/strict";
import test from "node:test";
import {
	activeVersionIdFromDeployments,
	type CommandSpec,
	cloudflareMappingSmokeCommand,
	deploymentListCommand,
	deployShowcaseCommand,
	RolloutRollbackFailure,
	rollbackCommand,
	runProductionRollout,
	safeErrorMessage,
	secretPutCommand,
} from "../../scripts/release/showcase-production-rollout.ts";

const previousVersionId = "7d6eb2a8-5421-4ee9-bbc7-4633a53edace";
const previousIdentity = {
	version: "0.1.2",
	gitSha: "previous-release-sha",
	buildTime: "2026-07-13T00:00:00Z",
};
const expected = {
	version: "0.1.3",
	gitSha: "new-release-sha",
	buildTime: "2026-07-14T00:00:00Z",
};
const productionStatusToken = "new-production-status-token";
const rollbackStatusToken = "previous-production-status-token";
const deploymentsJson = JSON.stringify([
	{
		created_on: "2026-07-13T00:00:00Z",
		versions: [
			{
				percentage: 100,
				version_id: "b2642364-a615-4287-a8b7-6134289e2746",
			},
		],
	},
	{
		created_on: "2026-07-14T00:00:00Z",
		versions: [{ percentage: 100, version_id: previousVersionId }],
	},
]);

function commandLabel(spec: CommandSpec): string {
	return `${spec.command} ${spec.args.join(" ")}`;
}

test("active deployment parsing selects the latest single version at 100 percent", () => {
	assert.equal(
		activeVersionIdFromDeployments(deploymentsJson),
		previousVersionId,
	);
	assert.throws(
		() =>
			activeVersionIdFromDeployments(
				JSON.stringify([
					{
						created_on: "2026-07-14T00:00:00Z",
						versions: [
							{ percentage: 50, version_id: previousVersionId },
							{
								percentage: 50,
								version_id: "b2642364-a615-4287-a8b7-6134289e2746",
							},
						],
					},
				]),
			),
		/exactly one version at 100% traffic/u,
	);
	assert.throws(
		() =>
			activeVersionIdFromDeployments(
				JSON.stringify([
					{
						created_on: "2026-07-14T00:00:00Z",
						versions: [{ percentage: 100, version_id: "not-a-version-id" }],
					},
				]),
			),
		/invalid active Worker version ID/u,
	);
	assert.throws(
		() =>
			activeVersionIdFromDeployments(
				JSON.stringify([
					{
						created_on: "not-a-timestamp",
						versions: [{ percentage: 100, version_id: previousVersionId }],
					},
				]),
			),
		/invalid deployment creation time/u,
	);
});

test("rollout captures, pre-smokes, rotates through stdin, deploys, and smokes in order", async () => {
	const events: string[] = [];
	const seenCommands: CommandSpec[] = [];
	await runProductionRollout(
		{ expected, productionStatusToken, rollbackStatusToken },
		{
			async runCommand(spec) {
				seenCommands.push(spec);
				events.push(commandLabel(spec));
				return spec === deploymentListCommand ? deploymentsJson : "";
			},
			async smokeProtected(input) {
				events.push(`protected:${input.token}`);
				return previousIdentity;
			},
			async smokeProduction(input) {
				events.push(`production:${input.statusToken}:${input.expected.gitSha}`);
			},
			async writeSummary(input) {
				events.push(`summary:${input.gitSha}`);
			},
		},
	);

	assert.deepEqual(events, [
		commandLabel(deploymentListCommand),
		`protected:${rollbackStatusToken}`,
		commandLabel(secretPutCommand(productionStatusToken)),
		commandLabel(deployShowcaseCommand(expected)),
		commandLabel(cloudflareMappingSmokeCommand),
		`production:${productionStatusToken}:${expected.gitSha}`,
		`summary:${expected.gitSha}`,
	]);
	const secretCommand = seenCommands[1];
	assert(secretCommand);
	assert.deepEqual(secretCommand?.args, secretPutCommand("").args);
	assert.equal(secretCommand?.stdin, productionStatusToken);
	assert.doesNotMatch(
		commandLabel(secretCommand),
		/new-production-status-token/u,
	);
	assert.deepEqual(deployShowcaseCommand(expected).environment, {
		BUILD_VERSION: expected.version,
		BUILD_GIT_SHA: expected.gitSha,
		BUILD_TIME: expected.buildTime,
	});
});

test("a post-rotation failure rolls back the exact captured version and verifies the old token", async () => {
	const events: string[] = [];
	const deploymentFailure = new Error("showcase deploy failed");

	await assert.rejects(
		() =>
			runProductionRollout(
				{ expected, productionStatusToken, rollbackStatusToken },
				{
					async runCommand(spec) {
						events.push(commandLabel(spec));
						if (spec === deploymentListCommand) return deploymentsJson;
						if (spec.args[0] === "deploy:showcase:prod")
							throw deploymentFailure;
						return "";
					},
					async smokeProtected(input) {
						events.push(
							`protected:${input.token}:${input.expected?.gitSha ?? "capture"}`,
						);
						return input.expected ?? previousIdentity;
					},
					async smokeProduction() {
						throw new Error("production smoke must not run");
					},
					async writeSummary() {
						throw new Error("summary must not run");
					},
				},
			),
		(error) => error === deploymentFailure,
	);

	assert.deepEqual(events, [
		commandLabel(deploymentListCommand),
		`protected:${rollbackStatusToken}:capture`,
		commandLabel(secretPutCommand(productionStatusToken)),
		commandLabel(deployShowcaseCommand(expected)),
		commandLabel(rollbackCommand(previousVersionId)),
		`protected:${rollbackStatusToken}:${previousIdentity.gitSha}`,
	]);
});

test("a retained old repo secret falls back to the new token when production is already rotated", async () => {
	const tokens: string[] = [];
	await runProductionRollout(
		{ expected, productionStatusToken, rollbackStatusToken },
		{
			async runCommand(spec) {
				return spec === deploymentListCommand ? deploymentsJson : "";
			},
			async smokeProtected(input) {
				tokens.push(input.token);
				if (input.token === rollbackStatusToken) {
					throw new Error("retained token is no longer active");
				}
				return previousIdentity;
			},
			async smokeProduction() {},
			async writeSummary() {},
		},
	);
	assert.deepEqual(tokens, [rollbackStatusToken, productionStatusToken]);
});

test("rollback errors remain visible beside the original rollout error", async () => {
	const rolloutError = new Error("new token smoke failed");
	const rollbackError = new Error("rollback command failed");
	const rollbackSmokeError = new Error("rollback smoke failed");
	const result = runProductionRollout(
		{ expected, productionStatusToken, rollbackStatusToken },
		{
			async runCommand(spec) {
				if (spec === deploymentListCommand) return deploymentsJson;
				if (spec === cloudflareMappingSmokeCommand) throw rolloutError;
				if (spec.args.includes("rollback")) throw rollbackError;
				return "";
			},
			async smokeProtected(input) {
				if (input.expected) throw rollbackSmokeError;
				return input.expected ?? previousIdentity;
			},
			async smokeProduction() {},
			async writeSummary() {},
		},
	);

	await assert.rejects(result, (error) => {
		assert(error instanceof RolloutRollbackFailure);
		const message = safeErrorMessage(error, []);
		assert.match(message, /new token smoke failed/u);
		assert.match(message, /rollback command failed/u);
		assert.match(message, /rollback smoke failed/u);
		return true;
	});
});

test("error formatting redacts both current and rollback tokens", () => {
	const message = safeErrorMessage(
		new RolloutRollbackFailure(
			new Error(`failed ${productionStatusToken}`),
			new Error(`failed ${rollbackStatusToken}`),
		),
		[productionStatusToken, rollbackStatusToken],
	);
	assert.doesNotMatch(message, /new-production-status-token/u);
	assert.doesNotMatch(message, /previous-production-status-token/u);
	assert.equal(message.match(/\[REDACTED\]/gu)?.length, 2);
});
