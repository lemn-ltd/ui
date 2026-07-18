#!/usr/bin/env node
import { appendFile } from "node:fs/promises";
import {
	cloudflareAuthFromEnvironment,
	githubOutputs,
	loadCloudflareReleaseTargets,
	verifyCloudflareReleaseAccess,
} from "./cloudflare-preflight.ts";
import {
	assertMainReleaseRef,
	releaseRefFromEnvironment,
	type ReleaseRefInput,
} from "./release-ref-guard.ts";

export async function runReleaseMutationGuard(input: {
	ref: ReleaseRefInput;
	preflight: () => Promise<void>;
}): Promise<void> {
	assertMainReleaseRef(input.ref);
	await input.preflight();
}

async function main(): Promise<void> {
	await guardReleaseMutationFromEnvironment();
}

export async function guardReleaseMutationFromEnvironment(
	environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
	const ref = releaseRefFromEnvironment(environment);
	assertMainReleaseRef(ref);

	const targets = await loadCloudflareReleaseTargets();
	await runReleaseMutationGuard({
		ref,
		preflight: () =>
			verifyCloudflareReleaseAccess({
				...cloudflareAuthFromEnvironment(environment),
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
