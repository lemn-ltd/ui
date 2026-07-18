#!/usr/bin/env node
import { execFileSync } from "node:child_process";

export interface ReleaseRefInput {
	githubActions: boolean;
	githubRef?: string;
	localBranch?: string;
}

export function assertMainReleaseRef(input: ReleaseRefInput): void {
	if (input.githubActions) {
		if (input.githubRef !== "refs/heads/main") {
			throw new Error(
				`Release mutations require GITHUB_REF=refs/heads/main; received ${input.githubRef || "unset"}`,
			);
		}
		return;
	}

	if (input.localBranch !== "main") {
		throw new Error(
			`Release mutations require local branch main; received ${input.localBranch || "detached HEAD"}`,
		);
	}
}

function localBranch(): string | undefined {
	try {
		return execFileSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], {
			encoding: "utf8",
		}).trim();
	} catch {
		return undefined;
	}
}

export function releaseRefFromEnvironment(
	environment: NodeJS.ProcessEnv = process.env,
): ReleaseRefInput {
	const githubActions = environment.GITHUB_ACTIONS === "true";
	return {
		githubActions,
		githubRef: environment.GITHUB_REF,
		localBranch: githubActions ? undefined : localBranch(),
	};
}

export async function guardReleaseRefFromEnvironment(
	environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
	assertMainReleaseRef(releaseRefFromEnvironment(environment));
}

async function main(): Promise<void> {
	await guardReleaseRefFromEnvironment();
	console.log("Main-only release ref guard passed");
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
