import {
	assertWorktreeUnchanged,
	captureWorktree,
	isDirectExecution,
	pnpmCommand,
	reportFailure,
	repositoryRoot,
	runCommands,
} from "./common.ts";
import { runQuick } from "./quick.ts";

export async function runStandard(root = repositoryRoot): Promise<void> {
	console.log("Validation profile: standard (repository-wide)");
	const worktreeBefore = captureWorktree(root);
	await runCommands([pnpmCommand("complete dry build", "build")], root);
	await runQuick({ all: true, root });
	await runCommands(
		[
			pnpmCommand("release contracts", "validate:release-contracts"),
			pnpmCommand("local Portal smoke", "smoke:portal:local"),
			pnpmCommand("package-set tarball smoke", "pack:packages"),
		],
		root,
	);
	assertWorktreeUnchanged(worktreeBefore, root);
}

if (isDirectExecution(import.meta.url)) runStandard().catch(reportFailure);
