#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { appendFile, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { releaseChildEnvironment } from "./child-process-security.ts";

const root = resolve(import.meta.dirname, "../..");
const releaseCommitSubject = "chore: release packages [skip ci]";
const releaseMetadataPaths = [
	".changeset",
	"packages/brand-contract/package.json",
	"packages/brand-contract/CHANGELOG.md",
	"packages/ui/package.json",
	"packages/ui/CHANGELOG.md",
	"packages/brand-runtime/package.json",
	"packages/brand-runtime/CHANGELOG.md",
	"packages/brand-studio/package.json",
	"packages/brand-studio/CHANGELOG.md",
	"pnpm-lock.yaml",
	"apps/docs/src/content/docs/changelog/index.mdx",
	"apps/docs/src/content/docs/es/changelog/index.mdx",
] as const;

interface PackageManifest {
	name?: string;
	version?: string;
}

export interface ReleaseIdentity {
	readonly releaseId: string;
	readonly version: string;
	readonly gitSha: string;
	readonly buildTime: string;
}

export interface ReleaseCommit {
	readonly sha: string;
	readonly message: string;
}

interface PrepareReleaseDependencies {
	readonly git: (args: readonly string[]) => string;
	readonly hasPendingChangesets: () => Promise<boolean>;
	readonly versionPackages: () => Promise<void>;
	readonly readPackageManifest: () => Promise<PackageManifest>;
	readonly hasStagedChanges: () => boolean;
	readonly writeOutputs: (identity: ReleaseIdentity) => Promise<void>;
}

function requireText(value: string | undefined, description: string): string {
	if (!value) throw new Error(`Missing ${description}`);
	return value;
}

function assertGitSha(value: string, description: string): void {
	if (!/^[0-9a-f]{40}$/u.test(value)) {
		throw new Error(`${description} is not a full Git SHA`);
	}
}

export function releaseId(
	packageName: string,
	version: string,
	sha: string,
): string {
	assertGitSha(sha, "Release SHA");
	if (!/^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/u.test(packageName)) {
		throw new Error(`Invalid release package name: ${packageName}`);
	}
	if (
		!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u.test(
			version,
		)
	) {
		throw new Error(`Invalid release package version: ${version}`);
	}
	return `${packageName}@${version}#${sha}`;
}

export function releaseCommitForTrigger(
	commits: readonly ReleaseCommit[],
	triggerSha: string,
): ReleaseCommit | undefined {
	assertGitSha(triggerSha, "Trigger SHA");
	const trailer = `Release-Origin: ${triggerSha}`;
	const matches = commits.filter((commit) =>
		commit.message.split("\n").some((line) => line.trim() === trailer),
	);
	if (matches.length > 1) {
		throw new Error(`Multiple release commits claim trigger ${triggerSha}`);
	}
	return matches[0];
}

export function parseReleaseCommits(source: string): ReleaseCommit[] {
	if (!source) return [];
	return source
		.split("\x1e")
		.filter(Boolean)
		.map((entry) => {
			const separator = entry.indexOf("\x1f");
			if (separator < 0) throw new Error("Malformed release commit log");
			const sha = entry.slice(0, separator).trim();
			const message = entry.slice(separator + 1).trim();
			assertGitSha(sha, "Release commit SHA");
			return { sha, message };
		});
}

function defaultGit(args: readonly string[]): string {
	return execFileSync("git", [...args], {
		cwd: root,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

async function defaultHasPendingChangesets(): Promise<boolean> {
	const entries = await readdir(resolve(root, ".changeset"));
	return entries.some(
		(entry) => entry.endsWith(".md") && entry !== "README.md",
	);
}

async function defaultReadPackageManifest(): Promise<PackageManifest> {
	return JSON.parse(
		await readFile(resolve(root, "packages/ui/package.json"), "utf8"),
	) as PackageManifest;
}

async function defaultWriteOutputs(identity: ReleaseIdentity): Promise<void> {
	const outputPath = process.env.GITHUB_OUTPUT;
	if (!outputPath) return;
	await appendFile(
		outputPath,
		[
			`release_id=${identity.releaseId}`,
			`version=${identity.version}`,
			`sha=${identity.gitSha}`,
			`time=${identity.buildTime}`,
			"",
		].join("\n"),
		{ encoding: "utf8", mode: 0o600 },
	);
}

const defaultDependencies: PrepareReleaseDependencies = {
	git: defaultGit,
	hasPendingChangesets: defaultHasPendingChangesets,
	versionPackages: async () => {
		const childEnvironment = releaseChildEnvironment(process.env);
		execFileSync("pnpm", ["version:packages"], {
			cwd: root,
			stdio: "inherit",
			env: childEnvironment,
		});
		execFileSync(
			"pnpm",
			["install", "--lockfile-only", "--no-frozen-lockfile"],
			{
				cwd: root,
				stdio: "inherit",
				env: childEnvironment,
			},
		);
	},
	readPackageManifest: defaultReadPackageManifest,
	hasStagedChanges: () => {
		const result = spawnSync("git", ["diff", "--cached", "--quiet"], {
			cwd: root,
			stdio: "ignore",
		});
		if (result.error) throw result.error;
		if (result.status === 0) return false;
		if (result.status === 1) return true;
		throw new Error(
			`git diff --cached --quiet failed with exit ${String(result.status)}`,
		);
	},
	writeOutputs: defaultWriteOutputs,
};

function isAncestor(
	ancestor: string,
	descendant: string,
	git: PrepareReleaseDependencies["git"],
): boolean {
	try {
		git(["merge-base", "--is-ancestor", ancestor, descendant]);
		return true;
	} catch {
		return false;
	}
}

async function identityAtHead(
	dependencies: PrepareReleaseDependencies,
): Promise<ReleaseIdentity> {
	const manifest = await dependencies.readPackageManifest();
	const packageName = requireText(manifest.name, "release anchor package name");
	const version = requireText(
		manifest.version,
		"release anchor package version",
	);
	const gitSha = dependencies.git(["rev-parse", "HEAD"]);
	assertGitSha(gitSha, "Release SHA");
	const buildTime = dependencies.git(["show", "-s", "--format=%cI", "HEAD"]);
	if (!Number.isFinite(Date.parse(buildTime))) {
		throw new Error("Release commit has an invalid commit timestamp");
	}
	return {
		releaseId: releaseId(packageName, version, gitSha),
		version,
		gitSha,
		buildTime,
	};
}

async function resumeExistingRelease(
	triggerSha: string,
	remoteSha: string,
	dependencies: PrepareReleaseDependencies,
): Promise<boolean> {
	if (!isAncestor(triggerSha, remoteSha, dependencies.git)) {
		throw new Error(
			"The workflow SHA is not an ancestor of protected main; refusing a non-fast-forward release",
		);
	}
	const source = dependencies.git([
		"log",
		"--format=%H%x1f%B%x1e",
		"--ancestry-path",
		`${triggerSha}..${remoteSha}`,
	]);
	const existing = releaseCommitForTrigger(
		parseReleaseCommits(source),
		triggerSha,
	);
	if (!existing) {
		throw new Error(
			"Protected main advanced without this run's release commit; a fresh main workflow must own the release",
		);
	}
	if (existing.sha !== remoteSha) {
		throw new Error(
			"The resumable release commit is no longer latest protected main; a fresh main workflow must own the release",
		);
	}
	dependencies.git(["checkout", "--detach", existing.sha]);
	return true;
}

export async function preparePackageRelease(
	input: { readonly triggerSha: string },
	dependencies: PrepareReleaseDependencies = defaultDependencies,
): Promise<ReleaseIdentity> {
	assertGitSha(input.triggerSha, "Trigger SHA");
	dependencies.git([
		"fetch",
		"--no-tags",
		"origin",
		"+refs/heads/main:refs/remotes/origin/main",
	]);
	const localSha = dependencies.git(["rev-parse", "HEAD"]);
	const remoteSha = dependencies.git(["rev-parse", "refs/remotes/origin/main"]);
	assertGitSha(localSha, "Local SHA");
	assertGitSha(remoteSha, "Protected main SHA");

	const resumed =
		localSha === remoteSha
			? false
			: await resumeExistingRelease(input.triggerSha, remoteSha, dependencies);

	if (!resumed && (await dependencies.hasPendingChangesets())) {
		await dependencies.versionPackages();
		dependencies.git(["add", ...releaseMetadataPaths]);
		if (!dependencies.hasStagedChanges()) {
			throw new Error("Changesets produced no release metadata changes");
		}

		const manifest = await dependencies.readPackageManifest();
		const packageName = requireText(
			manifest.name,
			"release anchor package name",
		);
		const version = requireText(
			manifest.version,
			"release anchor package version",
		);
		const pendingReleaseId = `${packageName}@${version}`;
		dependencies.git(["config", "user.name", "github-actions[bot]"]);
		dependencies.git([
			"config",
			"user.email",
			"41898282+github-actions[bot]@users.noreply.github.com",
		]);
		dependencies.git([
			"commit",
			"-m",
			releaseCommitSubject,
			"-m",
			`Release-Origin: ${input.triggerSha}\nRelease-Id: ${pendingReleaseId}`,
		]);
		dependencies.git(["push", "origin", "HEAD:refs/heads/main"]);
	}

	const identity = await identityAtHead(dependencies);
	await dependencies.writeOutputs(identity);
	return identity;
}

async function main(): Promise<void> {
	await preparePackageRelease({
		triggerSha: requireText(process.env.GITHUB_SHA, "GITHUB_SHA"),
	});
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
