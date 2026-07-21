import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	isDirectExecution,
	reportFailure,
	repositoryRoot,
	runCommand,
} from "./common.ts";
import { runFull } from "./full.ts";

export async function runLocalPipeline(root = repositoryRoot): Promise<void> {
	console.log("Local pipeline simulation: CI plus release dry checks");
	const dirtyPaths = execFileSync(
		"git",
		["-C", root, "status", "--porcelain", "--untracked-files=all"],
		{ encoding: "utf8" },
	).trim();
	if (dirtyPaths) {
		throw new Error(
			`local pipeline requires a clean revision before release simulation:\n${dirtyPaths}`,
		);
	}
	await runFull(root);
	await runCommand(
		{
			id: "production dependency audit",
			executable: "pnpm",
			args: ["audit", "--prod"],
		},
		root,
	);
	const directory = resolve(root, "tooling/artifacts/checks");
	await mkdir(directory, { recursive: true });
	await writeFile(
		resolve(directory, "local-pipeline.json"),
		`${JSON.stringify(
			{
				schemaVersion: 1,
				kind: "local-pipeline-evidence",
				status: "passed",
				completedAt: new Date().toISOString(),
				commit: execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
					encoding: "utf8",
				}).trim(),
				nodeVersion: process.version,
			},
			null,
			2,
		)}\n`,
		{ encoding: "utf8", mode: 0o600 },
	);
}

if (isDirectExecution(import.meta.url)) runLocalPipeline().catch(reportFailure);
