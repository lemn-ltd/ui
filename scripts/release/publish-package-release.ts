#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { getPackageVersionStatus } from "./check-unpublished-package-version.ts";
import {
	type ReleasePackageDefinition,
	readReleasePackageManifest,
	releasePackages,
} from "./package-set.ts";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

export interface PackageArtifact {
	readonly packageName: string;
	readonly version: string;
	readonly integrity: string;
}

export interface PublishReleaseDependencies {
	readonly packageStatus: (
		artifact: PackageArtifact,
	) => Promise<"published" | "unpublished">;
	readonly publishedArtifact: (
		artifact: PackageArtifact,
	) => Promise<PackageArtifact>;
	readonly publish: (artifact: PackageArtifact) => Promise<void>;
	readonly wait: (attempt: number) => Promise<void>;
}

interface PackageManifest {
	name?: string;
	version?: string;
}

function requireText(value: string | undefined, description: string): string {
	if (!value) throw new Error(`Missing ${description}`);
	return value;
}

function integrityBytes(integrity: string): Buffer {
	const match = /^sha512-([A-Za-z0-9+/]+={0,2})$/u.exec(integrity);
	if (!match?.[1])
		throw new Error("Package integrity must be a sha512 SRI value");
	const value = Buffer.from(match[1], "base64");
	if (value.length !== 64)
		throw new Error("Package integrity has invalid length");
	return value;
}

export function assertArtifactIdentity(
	expected: PackageArtifact,
	actual: PackageArtifact,
): void {
	if (
		actual.packageName !== expected.packageName ||
		actual.version !== expected.version
	) {
		throw new Error(
			`Published package identity differs from ${expected.packageName}@${expected.version}`,
		);
	}
	const expectedIntegrity = integrityBytes(expected.integrity);
	const actualIntegrity = integrityBytes(actual.integrity);
	if (!timingSafeEqual(expectedIntegrity, actualIntegrity)) {
		throw new Error(
			`Published ${expected.packageName}@${expected.version} tarball does not match the release artifact`,
		);
	}
}

export async function ensurePackageRelease(
	artifact: PackageArtifact,
	dependencies: PublishReleaseDependencies,
): Promise<"published" | "verified"> {
	const initialStatus = await dependencies.packageStatus(artifact);
	if (initialStatus === "published") {
		assertArtifactIdentity(
			artifact,
			await dependencies.publishedArtifact(artifact),
		);
		return "verified";
	}

	await dependencies.publish(artifact);
	let lastError: unknown;
	for (let attempt = 1; attempt <= 10; attempt += 1) {
		try {
			if ((await dependencies.packageStatus(artifact)) !== "published") {
				throw new Error("Published package version is not visible yet");
			}
			assertArtifactIdentity(
				artifact,
				await dependencies.publishedArtifact(artifact),
			);
			return "published";
		} catch (error) {
			lastError = error;
			if (attempt < 10) await dependencies.wait(attempt);
		}
	}
	throw new Error(
		`Published package could not be verified: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
	);
}

export async function ensurePackageSetRelease(
	artifacts: readonly PackageArtifact[],
	dependencies: PublishReleaseDependencies,
): Promise<
	readonly {
		readonly artifact: PackageArtifact;
		readonly outcome: "published" | "verified";
	}[]
> {
	const results: Array<{
		readonly artifact: PackageArtifact;
		readonly outcome: "published" | "verified";
	}> = [];
	for (const artifact of artifacts) {
		results.push({
			artifact,
			outcome: await ensurePackageRelease(artifact, dependencies),
		});
	}
	return results;
}

export async function localPackageArtifact(
	definition: ReleasePackageDefinition,
): Promise<PackageArtifact> {
	const manifest = (await readReleasePackageManifest(
		root,
		definition,
	)) as PackageManifest;
	const packageName = requireText(
		manifest.name,
		`${definition.id} package name`,
	);
	const version = requireText(
		manifest.version,
		`${definition.id} package version`,
	);
	if (version !== definition.expectedVersion) {
		throw new Error(
			`${packageName} must publish ${definition.expectedVersion}; received ${version}`,
		);
	}
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), `lemn-${definition.id}-release-`),
	);
	const tarballPath = resolve(temporaryRoot, `${definition.id}-${version}.tgz`);
	try {
		await execFileAsync(
			"pnpm",
			["--filter", packageName, "pack", "--out", tarballPath, "--json"],
			{ cwd: root, env: process.env, maxBuffer: 16 * 1024 * 1024 },
		);
		const digest = createHash("sha512")
			.update(await readFile(tarballPath))
			.digest("base64");
		return { packageName, version, integrity: `sha512-${digest}` };
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
}

function registryPackagePath(packageName: string): string {
	return `/${packageName.replace("/", "%2F")}`;
}

async function registryArtifact(
	artifact: PackageArtifact,
): Promise<PackageArtifact> {
	const token = requireText(process.env.GITHUB_TOKEN, "GITHUB_TOKEN");
	let response: Response;
	try {
		response = await fetch(
			new URL(
				registryPackagePath(artifact.packageName),
				"https://npm.pkg.github.com",
			),
			{
				headers: {
					Accept: "application/vnd.npm.install-v1+json",
					Authorization: `Bearer ${token}`,
					"User-Agent": "lemn-ui-release-integrity",
				},
				signal: AbortSignal.timeout(15_000),
			},
		);
	} catch {
		throw new Error("GitHub Packages registry request failed");
	}
	if (!response.ok) {
		throw new Error(
			`GitHub Packages registry returned HTTP ${response.status}`,
		);
	}
	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new Error("GitHub Packages registry returned non-JSON metadata");
	}
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new Error("GitHub Packages registry returned malformed metadata");
	}
	const versions = Reflect.get(payload, "versions");
	if (!versions || typeof versions !== "object" || Array.isArray(versions)) {
		throw new Error("GitHub Packages registry metadata has no versions map");
	}
	const version = Reflect.get(versions, artifact.version);
	if (!version || typeof version !== "object" || Array.isArray(version)) {
		throw new Error(
			`GitHub Packages registry has no metadata for ${artifact.packageName}@${artifact.version}`,
		);
	}
	const dist = Reflect.get(version, "dist");
	const name = Reflect.get(version, "name");
	const versionName = Reflect.get(version, "version");
	const integrity =
		dist && typeof dist === "object" && !Array.isArray(dist)
			? Reflect.get(dist, "integrity")
			: undefined;
	if (
		typeof name !== "string" ||
		typeof versionName !== "string" ||
		typeof integrity !== "string"
	) {
		throw new Error("GitHub Packages registry version metadata is incomplete");
	}
	return { packageName: name, version: versionName, integrity };
}

const defaultDependencies: PublishReleaseDependencies = {
	packageStatus: (artifact) =>
		getPackageVersionStatus({
			apiUrl: process.env.GITHUB_API_URL,
			owner: process.env.GITHUB_REPOSITORY_OWNER ?? "",
			packageName: artifact.packageName,
			version: artifact.version,
			token: process.env.GITHUB_TOKEN ?? "",
			missingPackageIsUnpublished: true,
		}),
	publishedArtifact: registryArtifact,
	publish: async (artifact) => {
		await execFileAsync(
			"pnpm",
			[
				"--filter",
				artifact.packageName,
				"publish",
				"--access",
				"restricted",
				"--no-git-checks",
			],
			{
				cwd: root,
				env: process.env,
				maxBuffer: 16 * 1024 * 1024,
			},
		);
	},
	wait: async () => {
		await new Promise((resolveWait) => setTimeout(resolveWait, 3_000));
	},
};

async function main(): Promise<void> {
	const artifacts = await Promise.all(
		releasePackages.map(localPackageArtifact),
	);
	for (const { artifact, outcome } of await ensurePackageSetRelease(
		artifacts,
		defaultDependencies,
	)) {
		console.log(
			`${artifact.packageName}@${artifact.version} immutable tarball identity ${outcome}`,
		);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
