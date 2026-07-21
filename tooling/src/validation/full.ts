import {
	isDirectExecution,
	pnpmCommand,
	reportFailure,
	repositoryRoot,
	runCommands,
} from "./common.ts";
import { runStandard } from "./standard.ts";

export async function runFull(root = repositoryRoot): Promise<void> {
	console.log("Validation profile: full (repository-wide)");
	await runStandard(root);
	await runCommands(
		[
			pnpmCommand("complete Portal Playwright suite", "test:portal:e2e"),
			pnpmCommand("Portal Worker dry run", "dry-run:portal"),
			pnpmCommand("Docs Worker dry run", "dry-run:docs"),
		],
		root,
	);
}

if (isDirectExecution(import.meta.url)) runFull().catch(reportFailure);
