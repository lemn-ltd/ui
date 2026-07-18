#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { guardReleaseRefFromEnvironment } from "./release-ref-guard.ts";

const supportedCommands = new Set(["add", "status", "version"]);

interface ChangesetCommandDependencies {
	readonly root: string;
	readonly cli: string;
	readonly environment: NodeJS.ProcessEnv;
	readonly guardVersion: () => Promise<void>;
}

const root = resolve(import.meta.dirname, "../..");
const defaultDependencies: ChangesetCommandDependencies = {
	root,
	cli: resolve(root, "node_modules/@changesets/cli/bin.js"),
	environment: process.env,
	guardVersion: () => guardReleaseRefFromEnvironment(),
};

export async function runChangesetCommand(
	args: string[],
	dependencies: ChangesetCommandDependencies = defaultDependencies,
): Promise<number> {
	const [command, ...commandArgs] = args;
	if (!command || !supportedCommands.has(command)) {
		throw new Error(
			"Use one of the governed Changesets commands: add, status, or version",
		);
	}

	if (command === "version") {
		await dependencies.guardVersion();
	}

	const result = spawnSync(
		process.execPath,
		[dependencies.cli, command, ...commandArgs],
		{
			cwd: dependencies.root,
			env: dependencies.environment,
			stdio: "inherit",
		},
	);
	if (result.error) throw result.error;
	if (result.signal) {
		throw new Error(`Changesets terminated by signal ${result.signal}`);
	}
	return result.status ?? 1;
}

async function main(): Promise<void> {
	process.exitCode = await runChangesetCommand(process.argv.slice(2));
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	await main();
}
