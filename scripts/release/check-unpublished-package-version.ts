#!/usr/bin/env node
import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface PackageManifest {
	name?: string;
	version?: string;
}

interface GitHubPackageVersion {
	name: string;
}

type FetchImplementation = typeof fetch;

function requireValue(value: string | undefined, description: string): string {
	if (!value) throw new Error(`Missing ${description}`);
	return value;
}

function packageCoordinates(packageName: string, owner: string): string {
	const match = /^@([^/]+)\/(.+)$/u.exec(packageName);
	if (!match) {
		throw new Error(`Package ${packageName} must use an organization scope`);
	}
	if (match[1]?.toLowerCase() !== owner.toLowerCase()) {
		throw new Error(
			`Package scope @${match[1]} does not match GitHub owner ${owner}`,
		);
	}
	return requireValue(match[2], "package name");
}

async function packageVersionsPage(input: {
	apiUrl: string;
	owner: string;
	packageName: string;
	page: number;
	token: string;
	fetchImplementation: FetchImplementation;
}): Promise<GitHubPackageVersion[]> {
	const endpoint = new URL(
		`/orgs/${encodeURIComponent(input.owner)}/packages/npm/${encodeURIComponent(input.packageName)}/versions`,
		input.apiUrl,
	);
	endpoint.searchParams.set("per_page", "100");
	endpoint.searchParams.set("page", String(input.page));

	let response: Response;
	try {
		response = await input.fetchImplementation(endpoint, {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${input.token}`,
				"User-Agent": "lemn-ui-release-contract",
				"X-GitHub-Api-Version": "2022-11-28",
			},
			signal: AbortSignal.timeout(15_000),
		});
	} catch {
		throw new Error(
			"GitHub Packages request failed before receiving a response",
		);
	}

	if (response.status === 401 || response.status === 403) {
		throw new Error(
			`GitHub Packages authentication or authorization failed with HTTP ${response.status}`,
		);
	}
	if (response.status === 404) {
		throw new Error(
			"GitHub Packages returned HTTP 404 for the package, so its version status cannot be verified",
		);
	}
	if (!response.ok) {
		throw new Error(
			`GitHub Packages returned HTTP ${response.status}; version status cannot be verified`,
		);
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new Error("GitHub Packages returned a non-JSON version response");
	}
	if (!Array.isArray(payload)) {
		throw new Error("GitHub Packages returned a malformed version response");
	}

	return payload.map((entry, index) => {
		if (
			!entry ||
			typeof entry !== "object" ||
			Array.isArray(entry) ||
			!("name" in entry) ||
			typeof entry.name !== "string" ||
			entry.name === ""
		) {
			throw new Error(
				`GitHub Packages returned a malformed version at index ${index}`,
			);
		}
		return { name: entry.name };
	});
}

interface PackageVersionStatusInput {
	apiUrl?: string;
	owner: string;
	packageName: string;
	version: string;
	token: string;
	fetchImplementation?: FetchImplementation;
}

export async function getPackageVersionStatus(
	input: PackageVersionStatusInput,
): Promise<"published" | "unpublished"> {
	const owner = requireValue(input.owner, "GITHUB_REPOSITORY_OWNER");
	const token = requireValue(input.token, "GITHUB_TOKEN");
	const packageName = packageCoordinates(input.packageName, owner);
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const seenVersions = new Set<string>();

	for (let page = 1; ; page += 1) {
		const versions = await packageVersionsPage({
			apiUrl: input.apiUrl ?? "https://api.github.com",
			owner,
			packageName,
			page,
			token,
			fetchImplementation,
		});
		for (const version of versions) {
			if (seenVersions.has(version.name)) {
				throw new Error(
					`GitHub Packages returned duplicate version ${version.name}`,
				);
			}
			seenVersions.add(version.name);
		}
		if (seenVersions.has(input.version)) return "published";
		if (versions.length < 100) return "unpublished";
	}
}

export async function assertPackageVersionUnpublished(
	input: PackageVersionStatusInput,
): Promise<void> {
	if ((await getPackageVersionStatus(input)) === "published") {
		throw new Error(
			`${input.packageName}@${input.version} is already published; package changes require a changeset`,
		);
	}
}

async function main(): Promise<void> {
	const root = resolve(import.meta.dirname, "../..");
	const manifest = JSON.parse(
		await readFile(resolve(root, "packages/ui/package.json"), "utf8"),
	) as PackageManifest;
	const packageName = requireValue(manifest.name, "UI package name");
	const version = requireValue(manifest.version, "UI package version");
	const input = {
		apiUrl: process.env.GITHUB_API_URL,
		owner: process.env.GITHUB_REPOSITORY_OWNER ?? "",
		packageName,
		version,
		token: process.env.GITHUB_TOKEN ?? "",
	};
	const status = await getPackageVersionStatus(input);
	if (process.argv.includes("--github-output")) {
		const outputPath = requireValue(process.env.GITHUB_OUTPUT, "GITHUB_OUTPUT");
		await appendFile(outputPath, `published=${status === "published"}\n`, {
			encoding: "utf8",
			mode: 0o600,
		});
		console.log(`${packageName}@${version} publication status verified`);
		return;
	}
	if (status === "published") {
		throw new Error(
			`${packageName}@${version} is already published; package changes require a changeset`,
		);
	}
	console.log(
		`${packageName}@${version} is absent from the authenticated GitHub Packages version list`,
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
