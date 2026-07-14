#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const snapshotDirectory = resolve(
	root,
	"apps/showcase/tests/e2e/visual.e2e.ts-snapshots",
);
const image = "mcr.microsoft.com/playwright:v1.60.0-noble";

for (const file of await readdir(snapshotDirectory)) {
	if (file.endsWith("-linux.png")) {
		await unlink(resolve(snapshotDirectory, file));
	}
}

const uid = typeof process.getuid === "function" ? process.getuid() : 1000;
const gid = typeof process.getgid === "function" ? process.getgid() : 1000;
const script = [
	"set -eu",
	"mkdir -p /tmp/work /tmp/home/bin",
	"tar -C /source --exclude=.git --exclude=node_modules --exclude=dist --exclude=.turbo --exclude=playwright-report --exclude=test-results -cf - . | tar -C /tmp/work -xf -",
	"cd /tmp/work",
	"corepack enable --install-directory /tmp/home/bin",
	"export PATH=/tmp/home/bin:$PATH",
	"corepack prepare pnpm@11.8.0 --activate",
	"pnpm install --frozen-lockfile",
	"WEB_UI_LOCAL=1 pnpm --filter @appranks/ui-showcase run build",
	"WEB_UI_LOCAL=1 SHOWCASE_E2E_STATIC_PREVIEW=1 pnpm --filter @appranks/ui-showcase exec playwright test visual.e2e.ts --grep 'visual: ' --update-snapshots",
	"find apps/showcase/tests/e2e/visual.e2e.ts-snapshots -type f -name '*-linux.png' -exec cp {} /output/ \\;",
].join("\n");

const result = spawnSync(
	"docker",
	[
		"run",
		"--rm",
		"--user",
		`${uid}:${gid}`,
		"--env",
		"HOME=/tmp/home",
		"--volume",
		`${root}:/source:ro`,
		"--volume",
		`${snapshotDirectory}:/output`,
		image,
		"bash",
		"-lc",
		script,
	],
	{ encoding: "utf8", stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) {
	throw new Error(
		`Linux visual snapshot generation failed with exit code ${result.status}`,
	);
}

const linuxSnapshots = (await readdir(snapshotDirectory)).filter((file) =>
	file.endsWith("-linux.png"),
);
if (linuxSnapshots.length === 0) {
	throw new Error("Linux visual snapshot generation produced no baselines");
}
console.log(`Generated ${linuxSnapshots.length} Linux baselines with ${image}`);
