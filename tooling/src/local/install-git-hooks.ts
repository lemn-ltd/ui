import { chmod } from "node:fs/promises";
import { resolve } from "node:path";
import {
	isDirectExecution,
	reportFailure,
	repositoryRoot,
	runCommand,
} from "../validation/common.ts";

export async function installGitHooks(root = repositoryRoot): Promise<void> {
	for (const name of ["pre-commit", "pre-push"]) {
		await chmod(resolve(root, ".githooks", name), 0o755);
	}
	await runCommand(
		{
			id: "configure repository Git hooks",
			executable: "git",
			args: ["config", "core.hooksPath", ".githooks"],
		},
		root,
	);
	console.log(
		"Installed repository hooks: pre-commit=validate:quick, pre-push=pipeline:local",
	);
}

if (isDirectExecution(import.meta.url)) installGitHooks().catch(reportFailure);
