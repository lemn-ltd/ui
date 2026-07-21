import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

export interface Workspace {
	readonly dependencies: readonly string[];
	readonly name: string;
	readonly root: string;
	readonly scripts: Readonly<Record<string, string>>;
}

export interface QuickSelection {
	readonly affectedWorkspaces: readonly Workspace[];
	readonly biomeFiles: readonly string[];
	readonly changedFiles: readonly string[];
	readonly global: boolean;
	readonly markdownFiles: readonly string[];
}

const biomeExtensions = new Set([
	".cjs",
	".css",
	".js",
	".json",
	".jsonc",
	".jsx",
	".mjs",
	".ts",
	".tsx",
]);

const globalFiles = new Set([
	".gitignore",
	"Makefile",
	"package.json",
	"pnpm-lock.yaml",
	"pnpm-workspace.yaml",
	"tsconfig.base.json",
	"turbo.json",
]);

const globalDirectories = [
	".agentops",
	".github",
	".githooks",
	"patterns",
	"scripts",
	"tests",
	"tooling",
];

const biomeExcludedDirectories = [".agentops", ".codex"];

export function collectChangedFiles(root: string): string[] {
	const paths = new Set<string>();
	const validationBase = process.env.VALIDATION_BASE?.trim();
	if (validationBase && !/^0+$/u.test(validationBase)) {
		for (const path of gitPaths(root, [
			"diff",
			"--name-only",
			"--diff-filter=ACDMR",
			"-z",
			`${validationBase}...HEAD`,
			"--",
		])) {
			paths.add(normalizePath(path));
		}
	}
	for (const path of gitPaths(root, [
		"diff",
		"--name-only",
		"--diff-filter=ACDMR",
		"-z",
		"HEAD",
		"--",
	])) {
		paths.add(normalizePath(path));
	}
	for (const path of gitPaths(root, [
		"ls-files",
		"--others",
		"--exclude-standard",
		"-z",
	])) {
		paths.add(normalizePath(path));
	}
	return [...paths].sort();
}

export function discoverWorkspaces(root: string): Workspace[] {
	const workspaces: Workspace[] = [];
	for (const boundary of ["apps", "packages"]) {
		const boundaryRoot = resolve(root, boundary);
		if (!existsSync(boundaryRoot)) continue;
		for (const entry of readdirSync(boundaryRoot, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const workspaceRoot = resolve(boundaryRoot, entry.name);
			const manifestPath = resolve(workspaceRoot, "package.json");
			if (!existsSync(manifestPath)) continue;
			const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
				readonly name: string;
				readonly scripts?: Record<string, string>;
				readonly dependencies?: Record<string, string>;
				readonly devDependencies?: Record<string, string>;
				readonly optionalDependencies?: Record<string, string>;
				readonly peerDependencies?: Record<string, string>;
			};
			workspaces.push({
				dependencies: [
					...Object.keys(manifest.dependencies ?? {}),
					...Object.keys(manifest.devDependencies ?? {}),
					...Object.keys(manifest.optionalDependencies ?? {}),
					...Object.keys(manifest.peerDependencies ?? {}),
				],
				name: manifest.name,
				root: normalizePath(relative(root, workspaceRoot)),
				scripts: manifest.scripts ?? {},
			});
		}
	}
	return workspaces.sort((left, right) => left.name.localeCompare(right.name));
}

export function selectQuickValidation(
	changedFiles: readonly string[],
	workspaces: readonly Workspace[],
	options: { readonly all?: boolean; readonly root?: string } = {},
): QuickSelection {
	const normalized = [...new Set(changedFiles.map(normalizePath))].sort();
	const owners = new Set<string>();
	let unknown = false;

	for (const path of normalized) {
		const owner = workspaces.find((workspace) =>
			isWithin(path, workspace.root),
		);
		if (owner) owners.add(owner.name);
		else if (!isGlobalPath(path) && !/\.(?:md|mdx)$/iu.test(path))
			unknown = true;
	}

	const global =
		Boolean(options.all) ||
		unknown ||
		normalized.some((path) => isGlobalPath(path));
	const affectedNames = global
		? new Set(workspaces.map(({ name }) => name))
		: transitiveConsumers(owners, workspaces);
	const existing = normalized.filter(
		(path) => !options.root || existsSync(resolve(options.root, path)),
	);

	return {
		affectedWorkspaces: workspaces.filter(({ name }) =>
			affectedNames.has(name),
		),
		biomeFiles: existing.filter(
			(path) =>
				biomeExtensions.has(extension(path)) &&
				!biomeExcludedDirectories.some((directory) =>
					isWithin(path, directory),
				),
		),
		changedFiles: normalized,
		global,
		markdownFiles: existing.filter((path) => /\.(?:md|mdx)$/iu.test(path)),
	};
}

function transitiveConsumers(
	initial: ReadonlySet<string>,
	workspaces: readonly Workspace[],
): Set<string> {
	const affected = new Set(initial);
	let changed = true;
	while (changed) {
		changed = false;
		for (const workspace of workspaces) {
			if (affected.has(workspace.name)) continue;
			if (
				workspace.dependencies.some((dependency) => affected.has(dependency))
			) {
				affected.add(workspace.name);
				changed = true;
			}
		}
	}
	return affected;
}

function isGlobalPath(path: string): boolean {
	return (
		globalFiles.has(path) ||
		globalDirectories.some((directory) => isWithin(path, directory))
	);
}

function gitPaths(root: string, args: readonly string[]): string[] {
	try {
		return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" })
			.split("\0")
			.filter(Boolean);
	} catch (error) {
		if (!args.includes("HEAD")) throw error;
		return execFileSync(
			"git",
			[
				"-C",
				root,
				"ls-files",
				"--cached",
				"--others",
				"--exclude-standard",
				"-z",
			],
			{ encoding: "utf8" },
		)
			.split("\0")
			.filter(Boolean);
	}
}

function normalizePath(path: string): string {
	return path.split(sep).join("/").replace(/^\.\//u, "");
}

function isWithin(path: string, directory: string): boolean {
	return path === directory || path.startsWith(`${directory}/`);
}

function extension(path: string): string {
	return /(?:^|\/)[^/]+(\.[^./]+)$/u.exec(path)?.[1]?.toLowerCase() ?? "";
}
