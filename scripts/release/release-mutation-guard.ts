#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { appendFile } from "node:fs/promises";
import {
	githubOutputs,
	loadCloudflareReleaseTargets,
	verifyCloudflareReleaseAccess,
} from "./cloudflare-preflight.ts";

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

export async function runReleaseMutationGuard(input: {
	ref: ReleaseRefInput;
	preflight: () => Promise<void>;
}): Promise<void> {
	assertMainReleaseRef(input.ref);
	await input.preflight();
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

async function main(): Promise<void> {
	await guardReleaseMutationFromEnvironment();
}

export async function guardReleaseMutationFromEnvironment(
	environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
	const githubActions = environment.GITHUB_ACTIONS === "true";
	const ref = {
		githubActions,
		githubRef: environment.GITHUB_REF,
		localBranch: githubActions ? undefined : localBranch(),
	};
	assertMainReleaseRef(ref);

	const targets = await loadCloudflareReleaseTargets();
	await runReleaseMutationGuard({
		ref,
		preflight: () =>
			verifyCloudflareReleaseAccess({
				apiKey: environment.CLOUDFLARE_API_KEY ?? "",
				email: environment.CLOUDFLARE_EMAIL ?? "",
				targets,
			}),
	});

	if (environment.GITHUB_OUTPUT) {
		await appendFile(environment.GITHUB_OUTPUT, githubOutputs(targets), {
			encoding: "utf8",
			mode: 0o600,
		});
	}
	console.log("Main-only Cloudflare release mutation guard passed");
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
