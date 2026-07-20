#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = resolve(dirname(scriptPath), "..");

function parseRoot(argv) {
	if (argv.length === 0) return defaultRoot;
	if (argv.length === 2 && argv[0] === "--root") return resolve(argv[1]);
	throw new Error(
		"Usage: node scripts/check-ui-portal-zero-legacy.mjs [--root <repository>]",
	);
}

const root = parseRoot(process.argv.slice(2));
const portalRoot = "apps/ui-portal";
const portalManifestPath = `${portalRoot}/package.json`;
const legacyDirectories = [
	"apps/showcase",
	"apps/showcase-admin",
	"packages/showcase-kit",
];

const generatedDirectoryNames = new Set([
	".cache",
	".git",
	".pnpm-store",
	".turbo",
	".wrangler",
	"blob-report",
	"build",
	"coverage",
	"dist",
	"node_modules",
	"playwright-report",
	"test-results",
	"tmp",
]);

const exactExcludedFiles = new Set([
	"docs/evidence/ui-portal-unification/phase-1-repository.md",
	"docs/evidence/ui-portal-unification/phase-2-production.md",
	"scripts/check-ui-portal-zero-legacy.mjs",
	"tests/contract/ui-portal-zero-legacy.test.ts",
]);

const immutableHistoryPrefixes = [
	"apps/docs/src/content/docs/changelog/",
	"apps/docs/src/content/docs/es/changelog/",
	"docs/visualization-system/benchmarks/",
	"packages/provider-registry/third-party/licenses/",
	"packages/provider-registry/third-party/source-snapshots/",
];

const textExtensions = new Set([
	".cjs",
	".css",
	".cts",
	".graphql",
	".html",
	".js",
	".jsx",
	".json",
	".jsonc",
	".md",
	".mdx",
	".mjs",
	".mts",
	".sh",
	".sql",
	".toml",
	".ts",
	".tsx",
	".txt",
	".yaml",
	".yml",
]);

const textFileNames = new Set([".npmrc", "Dockerfile", "Makefile", "Procfile"]);

const contentRules = [
	{
		id: "legacy-package",
		message: "contains a retired workspace package identity",
		pattern:
			/@lemn-ltd\/(?:showcase-kit|ui-showcase(?:-admin)?)(?![-A-Za-z0-9])/giu,
	},
	{
		id: "legacy-repository-path",
		message: "references a retired repository root",
		pattern:
			/(?:apps\/showcase(?:-admin)?|packages\/showcase-kit)(?=\/|[\s"'`),:;\]}]|$)/giu,
	},
	{
		id: "legacy-worker",
		message: "contains a retired Worker or service identity",
		pattern:
			/\b(?:(?:dev-)?lemn-)?ui-showcase(?:-admin(?:-(?:development|staging))?)?\b/giu,
	},
	{
		id: "legacy-domain",
		message: "contains a retired public or Admin domain",
		pattern: /\b(?:admin\.)?showcase\.ui\.le-mn\.com\b/giu,
	},
	{
		id: "legacy-status-token",
		message: "contains a retired status-token contract",
		pattern:
			/\b(?:PRODUCTION_STATUS_TOKEN|ROLLBACK_STATUS_TOKEN|STATUS_TOKEN)\b/gu,
	},
	{
		id: "legacy-showcase-vocabulary",
		message:
			"contains retired Showcase vocabulary in active code or documentation",
		pattern: /\bshowcase\b/giu,
	},
	{
		id: "legacy-showcase-identifier",
		message:
			"contains a retired Showcase identifier, type, or environment name",
		pattern:
			/\b(?:[Ss]howcase[A-Z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*Showcase[A-Za-z0-9_]*|[A-Z0-9_]*SHOWCASE[A-Z0-9_]*)\b/gu,
	},
	{
		id: "legacy-route-family",
		message: "contains a retired public route family",
		pattern:
			/(?:^|[\s"'`(=:[])\/(?:agents|core)(?:\/|(?=[\s"'`)#?\]}]|$))|(?:^|[\s"'`(=:[])\/(?:brand-studio|catalog)(?=[\s"'`)#?\]}]|$)/giu,
	},
];

function normalizePath(path) {
	return path.split(sep).join("/").replace(/^\.\//u, "");
}

function isGenerated(relativePath) {
	return normalizePath(relativePath)
		.split("/")
		.some((segment) => generatedDirectoryNames.has(segment));
}

function isImmutableHistory(relativePath) {
	const normalized = normalizePath(relativePath);
	return (
		normalized === "CHANGELOG.md" ||
		normalized.endsWith("/CHANGELOG.md") ||
		immutableHistoryPrefixes.some((prefix) => normalized.startsWith(prefix))
	);
}

function isExcluded(relativePath) {
	const normalized = normalizePath(relativePath);
	return (
		exactExcludedFiles.has(normalized) ||
		isGenerated(normalized) ||
		isImmutableHistory(normalized)
	);
}

function isTextFile(relativePath) {
	const normalized = normalizePath(relativePath);
	return (
		textExtensions.has(extname(normalized)) ||
		textFileNames.has(normalized.split("/").at(-1))
	);
}

function listRepositoryFiles() {
	let output;
	try {
		output = execFileSync(
			"git",
			["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
			{ cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
		);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`Cannot inventory repository files with git: ${detail}`);
	}

	return output
		.split("\0")
		.map(normalizePath)
		.filter(
			(file, index, files) =>
				file.length > 0 &&
				files.indexOf(file) === index &&
				existsSync(join(root, file)) &&
				!isExcluded(file),
		)
		.sort();
}

function lineNumberAt(text, index) {
	let line = 1;
	for (let cursor = 0; cursor < index; cursor += 1) {
		if (text.charCodeAt(cursor) === 10) line += 1;
	}
	return line;
}

function collectContentFailures(file, text) {
	const failures = [];
	for (const rule of contentRules) {
		rule.pattern.lastIndex = 0;
		const matches = [...text.matchAll(rule.pattern)];
		if (matches.length === 0) continue;
		failures.push({
			id: rule.id,
			message: rule.message,
			path: file,
			line: lineNumberAt(text, matches[0].index ?? 0),
			count: matches.length,
		});
	}
	return failures;
}

const importSpecifierPattern =
	/(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/gu;

async function resolvePortalImport(importer, specifier) {
	let unresolved;
	if (specifier.startsWith(".")) {
		unresolved = resolve(dirname(join(root, importer)), specifier);
	} else if (specifier === "@portal/catalog-kit") {
		unresolved = join(
			root,
			portalRoot,
			"src/client/shared/catalog-kit/index.ts",
		);
	} else {
		return null;
	}

	const base = unresolved.replace(/\.(?:c|m)?js$/u, "");
	const candidates = [
		unresolved,
		`${base}.ts`,
		`${base}.tsx`,
		`${base}.js`,
		`${base}.jsx`,
		join(unresolved, "index.ts"),
		join(unresolved, "index.tsx"),
	];

	for (const candidate of candidates) {
		if (!existsSync(candidate)) continue;
		const candidateStat = await stat(candidate);
		if (candidateStat.isFile()) return normalizePath(relative(root, candidate));
	}
	return null;
}

async function collectPortalReachability(entrypoints) {
	const reachable = new Set();
	const pending = [...entrypoints];

	while (pending.length > 0) {
		const file = pending.pop();
		if (!file || reachable.has(file) || !existsSync(join(root, file))) continue;
		reachable.add(file);

		const text = await readFile(join(root, file), "utf8");
		for (const match of text.matchAll(importSpecifierPattern)) {
			const specifier = match[1] ?? match[2];
			if (!specifier || specifier.endsWith(".css")) continue;
			const resolvedImport = await resolvePortalImport(file, specifier);
			if (resolvedImport?.startsWith(`${portalRoot}/`)) {
				pending.push(resolvedImport);
			}
		}
	}

	return reachable;
}

const failures = [];

for (const legacyDirectory of legacyDirectories) {
	if (existsSync(join(root, legacyDirectory))) {
		failures.push({
			id: "legacy-directory",
			message: "retired repository root still exists",
			path: legacyDirectory,
			line: null,
			count: 1,
		});
	}
}

if (!existsSync(join(root, portalManifestPath))) {
	failures.push({
		id: "canonical-portal",
		message: "canonical UI Portal manifest is missing",
		path: portalManifestPath,
		line: null,
		count: 1,
	});
} else {
	try {
		const portalManifest = JSON.parse(
			await readFile(join(root, portalManifestPath), "utf8"),
		);
		if (
			portalManifest.name !== "@lemn-ltd/ui-portal" ||
			portalManifest.private !== true
		) {
			failures.push({
				id: "canonical-portal",
				message: "must be the private @lemn-ltd/ui-portal package",
				path: portalManifestPath,
				line: null,
				count: 1,
			});
		}
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		failures.push({
			id: "canonical-portal",
			message: `cannot parse canonical UI Portal manifest: ${detail}`,
			path: portalManifestPath,
			line: null,
			count: 1,
		});
	}
}

const repositoryFiles = listRepositoryFiles();
for (const file of repositoryFiles) {
	if (/(?:^|[-_/])showcase(?=[-_/.]|$)/iu.test(file)) {
		failures.push({
			id: "legacy-active-path",
			message: "active file path retains the retired Showcase identity",
			path: file,
			line: null,
			count: 1,
		});
	}
	if (!isTextFile(file)) continue;
	const content = await readFile(join(root, file));
	if (content.includes(0)) continue;
	failures.push(...collectContentFailures(file, content.toString("utf8")));
}

const portalEntrypoints = [
	`${portalRoot}/src/client/main.tsx`,
	`${portalRoot}/src/worker/index.ts`,
];
for (const entrypoint of portalEntrypoints) {
	if (!existsSync(join(root, entrypoint))) {
		failures.push({
			id: "canonical-entrypoint",
			message: "canonical UI Portal entrypoint is missing",
			path: entrypoint,
			line: null,
			count: 1,
		});
	}
}
const reachablePortalFiles = await collectPortalReachability(portalEntrypoints);
const forbiddenAgentSources = [
	`${portalRoot}/src/client/pages/agents/`,
	`${portalRoot}/src/client/registry/disabled-agent-entry.ts`,
	`${portalRoot}/src/client/registry/entries/agent-patterns.tsx`,
	`${portalRoot}/src/client/registry/entries/agents.tsx`,
];

for (const file of [...reachablePortalFiles].sort()) {
	if (
		forbiddenAgentSources.some((forbiddenPath) =>
			forbiddenPath.endsWith("/")
				? file.startsWith(forbiddenPath)
				: file === forbiddenPath,
		)
	) {
		failures.push({
			id: "agents-active-import",
			message: "Agents source is reachable from an active UI Portal entrypoint",
			path: file,
			line: null,
			count: 1,
		});
	}
}

if (failures.length > 0) {
	console.error(
		`UI Portal zero-legacy check failed with ${failures.length} residue group(s):`,
	);
	for (const failure of failures) {
		const location =
			failure.line === null ? failure.path : `${failure.path}:${failure.line}`;
		const suffix =
			failure.count > 1 ? ` (${failure.count} matches in file)` : "";
		console.error(`- [${failure.id}] ${location}: ${failure.message}${suffix}`);
	}
	process.exitCode = 1;
} else {
	console.log(
		`UI Portal zero-legacy check passed (${repositoryFiles.length} active repository files, ${reachablePortalFiles.size} reachable Portal modules).`,
	);
}
