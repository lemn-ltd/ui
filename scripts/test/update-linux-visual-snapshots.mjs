#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	copyFile,
	mkdir,
	mkdtemp,
	readdir,
	rename,
	rm,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PORTAL_VISUAL_SNAPSHOT_COUNT_PER_PLATFORM } from "../../apps/ui-portal/tests/fixtures/visual-baselines.ts";

const defaultRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const image = "mcr.microsoft.com/playwright:v1.60.0-noble";
const expectedSnapshotCount = PORTAL_VISUAL_SNAPSHOT_COUNT_PER_PLATFORM;
const testAdminAudience = "a".repeat(64);
const testHealthAudience = "b".repeat(64);
const testBuildSha = "d".repeat(40);

function commandLabel(command, args) {
	return [command, ...args].join(" ");
}

export function runChecked(
	command,
	args,
	options = {},
	spawnImplementation = spawnSync,
) {
	const result = spawnImplementation(command, args, {
		encoding: "utf8",
		...options,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(
			`${commandLabel(command, args)} failed with exit code ${result.status}`,
		);
	}
	return result;
}

export function createIndexedSourceArchive({
	repositoryRoot,
	archivePath,
	spawnImplementation = spawnSync,
}) {
	const status = runChecked(
		"git",
		["status", "--porcelain=v1", "--untracked-files=all"],
		{ cwd: repositoryRoot },
		spawnImplementation,
	).stdout;
	const unsafePaths = status
		.split("\n")
		.filter(Boolean)
		.filter((line) => line.startsWith("??") || line[1] !== " ");
	if (unsafePaths.length > 0) {
		throw new Error(
			"Stage every intended source change before generating Linux snapshots; unstaged or untracked paths are not part of the immutable Git tree",
		);
	}

	const tree = runChecked(
		"git",
		["write-tree"],
		{ cwd: repositoryRoot },
		spawnImplementation,
	).stdout.trim();
	if (!/^[0-9a-f]{40}$/u.test(tree)) {
		throw new Error("git write-tree returned an invalid tree id");
	}
	runChecked(
		"git",
		["archive", "--format=tar", `--output=${archivePath}`, tree],
		{ cwd: repositoryRoot },
		spawnImplementation,
	);
	return tree;
}

function linuxSnapshotPort(repositoryRoot) {
	const digest = createHash("sha256")
		.update(`${repositoryRoot}:linux-snapshots`)
		.digest();
	return 40_000 + (digest.readUInt16BE(0) % 10_000);
}

async function waitForServer(url, server) {
	const deadline = Date.now() + 120_000;
	while (Date.now() < deadline) {
		if (server.exitCode !== null) {
			throw new Error(
				`Canonical portal server exited with code ${server.exitCode}`,
			);
		}
		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(2_000),
			});
			if (response.ok) return;
		} catch {
			// The strict-port server is still starting.
		}
		await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
	}
	throw new Error(`Canonical portal server did not become ready at ${url}`);
}

async function stopServer(server) {
	if (server.exitCode !== null) return;
	server.kill("SIGTERM");
	await Promise.race([
		new Promise((resolvePromise) => server.once("exit", resolvePromise)),
		new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000)),
	]);
	if (server.exitCode === null) server.kill("SIGKILL");
}

function platformNames(files, platform) {
	return files
		.filter((file) => file.endsWith(`-${platform}.png`))
		.map((file) => file.replace(`-${platform}.png`, ""))
		.sort();
}

function assertSnapshotParity(currentFiles, generatedFiles) {
	const darwin = platformNames(currentFiles, "darwin");
	const linux = platformNames(generatedFiles, "linux");
	if (darwin.length !== expectedSnapshotCount) {
		throw new Error(
			`Expected ${expectedSnapshotCount} Darwin baselines; received ${darwin.length}`,
		);
	}
	if (
		linux.length !== expectedSnapshotCount ||
		linux.some((name, index) => name !== darwin[index])
	) {
		throw new Error(
			`Generated Linux baselines do not have exact ${expectedSnapshotCount}-file Darwin parity`,
		);
	}
}

async function replaceLinuxSnapshots(snapshotDirectory, generatedDirectory) {
	const currentFiles = await readdir(snapshotDirectory);
	const generatedFiles = await readdir(generatedDirectory);
	assertSnapshotParity(currentFiles, generatedFiles);

	const parent = dirname(snapshotDirectory);
	const replacement = await mkdtemp(
		resolve(parent, ".visual-snapshot-replacement-"),
	);
	const backup = `${snapshotDirectory}.backup-${process.pid}-${Date.now()}`;
	try {
		for (const file of currentFiles.filter(
			(candidate) => !candidate.endsWith("-linux.png"),
		)) {
			await copyFile(
				resolve(snapshotDirectory, file),
				resolve(replacement, file),
			);
		}
		for (const file of generatedFiles) {
			await copyFile(
				resolve(generatedDirectory, file),
				resolve(replacement, file),
			);
		}

		await rename(snapshotDirectory, backup);
		try {
			await rename(replacement, snapshotDirectory);
		} catch (error) {
			await rename(backup, snapshotDirectory);
			throw error;
		}
		await rm(backup, { recursive: true, force: true });
	} finally {
		await rm(replacement, { recursive: true, force: true });
		await rm(backup, { recursive: true, force: true });
	}
}

function repositoryRootFromArgs(args) {
	if (args.length === 0) return defaultRoot;
	if (args.length !== 2 || args[0] !== "--repository-root" || !args[1]) {
		throw new Error(
			"Usage: update-linux-visual-snapshots [--repository-root PATH]",
		);
	}
	return resolve(args[1]);
}

async function main(args = []) {
	const repositoryRoot = repositoryRootFromArgs(args);
	const snapshotDirectory = resolve(
		repositoryRoot,
		"apps/ui-portal/tests/e2e/visual.e2e.ts-snapshots",
	);
	const temporaryRoot = await mkdtemp(
		resolve(dirname(repositoryRoot), ".lemn-linux-snapshots-"),
	);
	const archivePath = resolve(temporaryRoot, "source.tar");
	const sourceRoot = resolve(temporaryRoot, "source");
	const generatedDirectory = resolve(temporaryRoot, "generated");
	const port = linuxSnapshotPort(repositoryRoot);
	let server;

	try {
		createIndexedSourceArchive({ repositoryRoot, archivePath });
		await Promise.all([
			mkdir(sourceRoot, { recursive: true }),
			mkdir(generatedDirectory, { recursive: true }),
		]);
		runChecked("tar", ["-xf", archivePath, "-C", sourceRoot]);
		runChecked("pnpm", ["install", "--frozen-lockfile"], {
			cwd: sourceRoot,
			stdio: "inherit",
		});

		// Build the Worker input without running the snapshot-parity contract that
		// this command is responsible for repairing. The complete Portal build and
		// contract suite still runs after the generated baselines are committed.
		runChecked(
			"pnpm",
			["--filter", "@lemn-ltd/ui-portal", "exec", "vite", "build"],
			{
				cwd: sourceRoot,
				stdio: "inherit",
			},
		);
		server = spawn(
			"pnpm",
			[
				"--filter",
				"@lemn-ltd/ui-portal",
				"exec",
				"wrangler",
				"dev",
				"--local",
				"--ip",
				"0.0.0.0",
				"--port",
				String(port),
				"--log-level",
				"warn",
				"--show-interactive-dev-session=false",
				"--var",
				"DEPLOYMENT_ENVIRONMENT:test",
				"--var",
				"ACCESS_ISSUER:https://lemn-dev.cloudflareaccess.com",
				"--var",
				`ACCESS_AUDIENCE:${testAdminAudience}`,
				"--var",
				`ACCESS_HEALTH_AUDIENCE:${testHealthAudience}`,
				"--var",
				"BUILD_VERSION:0.0.0-linux-snapshots",
				"--var",
				`BUILD_GIT_SHA:${testBuildSha}`,
				"--var",
				"BUILD_TIME:2026-07-18T00:00:00Z",
			],
			{ cwd: sourceRoot, stdio: "inherit" },
		);
		await waitForServer(`http://127.0.0.1:${port}/health`, server);

		const uid = typeof process.getuid === "function" ? process.getuid() : 1000;
		const gid = typeof process.getgid === "function" ? process.getgid() : 1000;
		const containerScript = [
			"set -euo pipefail",
			"mkdir -p /tmp/work /tmp/home/bin",
			"tar -xf /source.tar -C /tmp/work",
			"cd /tmp/work",
			"corepack enable --install-directory /tmp/home/bin",
			"export PATH=/tmp/home/bin:$PATH",
			"corepack prepare pnpm@11.8.0 --activate",
			"pnpm install --frozen-lockfile --child-concurrency=1 --network-concurrency=4",
			"proxy_ready=/tmp/portal-linux-snapshot-proxy.ready",
			'rm -f "$proxy_ready"',
			'node scripts/test/linux-snapshot-loopback-proxy.ts --ready-file "$proxy_ready" &',
			"proxy_pid=$!",
			"cleanup_proxy() {",
			'  if kill -0 "$proxy_pid" 2>/dev/null; then kill "$proxy_pid"; fi',
			'  wait "$proxy_pid" 2>/dev/null || true',
			"}",
			"trap cleanup_proxy EXIT",
			"for attempt in $(seq 1 300); do",
			'  if [ -f "$proxy_ready" ]; then break; fi',
			'  if ! kill -0 "$proxy_pid" 2>/dev/null; then wait "$proxy_pid"; exit 1; fi',
			"  sleep 0.1",
			"done",
			'test -f "$proxy_ready"',
			"pnpm --filter @lemn-ltd/ui-portal exec playwright test --config playwright.linux-snapshots.config.ts --grep 'visual: ' --update-snapshots",
			"find apps/ui-portal/tests/e2e/visual.e2e.ts-snapshots -type f -name '*-linux.png' -exec cp {} /output/ \\;",
		].join("\n");

		runChecked(
			"docker",
			[
				"run",
				"--rm",
				"--user",
				`${uid}:${gid}`,
				"--add-host",
				"host.docker.internal:host-gateway",
				"--env",
				"HOME=/tmp/home",
				"--env",
				`PORTAL_LINUX_SNAPSHOT_BASE_URL=http://127.0.0.1:${port}`,
				"--env",
				`PORTAL_LINUX_SNAPSHOT_TARGET_PORT=${port}`,
				"--volume",
				`${archivePath}:/source.tar:ro`,
				"--volume",
				`${generatedDirectory}:/output`,
				image,
				"bash",
				"-lc",
				containerScript,
			],
			{ stdio: "inherit" },
		);
		await replaceLinuxSnapshots(snapshotDirectory, generatedDirectory);
		console.log(
			`Generated ${expectedSnapshotCount} Linux baselines with ${image} against the canonical Worker-backed server`,
		);
	} finally {
		if (server) await stopServer(server);
		await rm(temporaryRoot, { recursive: true, force: true });
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	await main(process.argv.slice(2));
}
