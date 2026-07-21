import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	isDirectExecution,
	pnpmCommand,
	reportFailure,
	repositoryRoot,
	runCommand,
	runCommands,
	type ValidationCommand,
} from "./common.ts";
import {
	collectChangedFiles,
	discoverWorkspaces,
	type QuickSelection,
	selectQuickValidation,
} from "./selection.ts";

export interface QuickOptions {
	readonly all?: boolean;
	readonly fix?: boolean;
	readonly root?: string;
}

export async function runQuick(options: QuickOptions = {}): Promise<void> {
	const root = options.root ?? repositoryRoot;
	const selection = selectQuickValidation(
		collectChangedFiles(root),
		discoverWorkspaces(root),
		{ all: options.all, root },
	);

	console.log(
		`Validation profile: quick (${selection.global ? "repository-wide" : "affected-only"}${options.fix ? ", fix enabled" : ""})`,
	);
	console.log(`Changed files: ${selection.changedFiles.length}`);

	await runCommand(
		{
			id: "Git whitespace check",
			executable: "git",
			args: ["diff", "--check"],
		},
		root,
	);
	await runBiome(selection, root, Boolean(options.fix));
	validateMarkdown(selection, root);

	if (!selection.global && selection.changedFiles.length === 0) {
		console.log(
			"No uncommitted changes found; quick validation has nothing else to run.",
		);
		return;
	}

	await runCommands(createQuickCommands(selection), root);
}

function validateMarkdown(selection: QuickSelection, root: string): void {
	for (const path of selection.markdownFiles) {
		const source = readFileSync(resolve(root, path), "utf8");
		if (source.length > 0 && !source.endsWith("\n")) {
			throw new Error(`${path} must end with a newline`);
		}
	}
}

export function createQuickCommands(
	selection: QuickSelection,
): ValidationCommand[] {
	const commands: ValidationCommand[] = [];
	for (const workspace of selection.affectedWorkspaces) {
		if (workspace.scripts.check) {
			commands.push(
				pnpmCommand(`${workspace.name} check`, "--filter", [
					workspace.name,
					"run",
					"check",
				]),
			);
		}
		if (workspace.scripts.test) {
			commands.push(
				pnpmCommand(`${workspace.name} test`, "--filter", [
					workspace.name,
					"run",
					"test",
				]),
			);
		}
	}
	if (selection.global)
		commands.push(pnpmCommand("repository policy", "validate:policy"));
	return commands;
}

async function runBiome(
	selection: QuickSelection,
	root: string,
	fix: boolean,
): Promise<void> {
	if (selection.biomeFiles.length === 0) return;
	const biome = resolve(root, "node_modules/.bin/biome");
	if (!existsSync(biome))
		throw new Error("Biome is unavailable; run pnpm install first");
	await runCommand(
		{
			id: `Biome changed files${fix ? " (fix)" : ""}`,
			executable: biome,
			args: [
				"check",
				"--error-on-warnings",
				...(fix ? ["--write"] : []),
				...selection.biomeFiles,
			],
		},
		root,
	);
}

function parseOptions(args: readonly string[]): QuickOptions {
	const known = new Set(["--all", "--fix"]);
	const unknown = args.filter((argument) => !known.has(argument));
	if (unknown.length > 0)
		throw new Error(`Unknown quick option: ${unknown.join(", ")}`);
	return { all: args.includes("--all"), fix: args.includes("--fix") };
}

if (isDirectExecution(import.meta.url)) {
	runQuick(parseOptions(process.argv.slice(2))).catch(reportFailure);
}
