import { execFileSync, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface ValidationCommand {
	readonly id: string;
	readonly executable: string;
	readonly args: readonly string[];
}

export const repositoryRoot = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../..",
);

export function pnpmCommand(
	id: string,
	script: string,
	args: readonly string[] = [],
): ValidationCommand {
	return { id, executable: "pnpm", args: [script, ...args] };
}

export function isDirectExecution(moduleUrl: string): boolean {
	const entrypoint = process.argv[1];
	if (!entrypoint) return false;
	return pathToFileURL(resolve(entrypoint)).href === moduleUrl;
}

export async function runCommand(
	command: ValidationCommand,
	root = repositoryRoot,
): Promise<void> {
	const startedAt = performance.now();
	console.log(`\n> ${command.id}`);
	console.log(
		`  ${[command.executable, ...command.args].map(quoteArgument).join(" ")}`,
	);

	await new Promise<void>((resolvePromise, rejectPromise) => {
		const child = spawn(command.executable, [...command.args], {
			cwd: root,
			env: process.env,
			stdio: "inherit",
		});
		child.once("error", rejectPromise);
		child.once("close", (code, signal) => {
			if (code === 0) return resolvePromise();
			const outcome = signal ? `signal ${signal}` : `exit code ${String(code)}`;
			rejectPromise(new Error(`${command.id} failed with ${outcome}`));
		});
	});

	const seconds = (performance.now() - startedAt) / 1_000;
	console.log(`  completed in ${seconds.toFixed(1)}s`);
}

export async function runCommands(
	commands: readonly ValidationCommand[],
	root = repositoryRoot,
): Promise<void> {
	for (const command of commands) await runCommand(command, root);
}

export function captureWorktree(root = repositoryRoot): string {
	return execFileSync("git", ["-C", root, "status", "--porcelain=v1", "-z"], {
		encoding: "utf8",
	});
}

export function assertWorktreeUnchanged(
	before: string,
	root = repositoryRoot,
): void {
	const after = captureWorktree(root);
	if (after !== before) {
		throw new Error(
			"validation changed tracked or untracked repository output",
		);
	}
}

export function reportFailure(error: unknown): never {
	console.error(
		`\nValidation failed: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exit(1);
}

function quoteArgument(value: string): string {
	return /^[A-Za-z0-9_./:=@-]+$/u.test(value) ? value : JSON.stringify(value);
}
