import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import {
	chmod,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import test from "node:test";
import playwrightConfig, {
	showcaseE2ePortForCheckout,
} from "../../apps/showcase/playwright.config.ts";
import {
	createDeterministicPage,
	formatGotoStableFailure,
} from "../../apps/showcase/tests/helpers/deterministic.ts";

type UnknownRecord = Record<string, unknown>;

const root = resolve(import.meta.dirname, "../..");

async function aggregateSnapshotHash(directory: string): Promise<string> {
	const hash = createHash("sha256");
	const files = (await readdir(directory)).sort();
	for (const file of files) {
		hash.update(file);
		hash.update("\0");
		hash.update(await readFile(resolve(directory, file)));
	}
	return hash.digest("hex");
}

async function filesUnder(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const path = resolve(directory, entry.name);
			return entry.isDirectory() ? filesUnder(path) : [path];
		}),
	);
	return files.flat();
}

function isTestArtifact(path: string): boolean {
	const segments = path.split("/");
	return (
		segments.includes("tests") ||
		segments.includes("__tests__") ||
		/\.(?:spec|test)\.[cm]?[jt]sx?$/u.test(path)
	);
}

function shellQuote(value: string): string {
	return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function record(value: unknown, description: string): UnknownRecord {
	assert.ok(
		value && typeof value === "object" && !Array.isArray(value),
		`${description} must be an object`,
	);
	return value as UnknownRecord;
}

test("gotoStable failures retain route state and transport diagnostics", () => {
	const message = formatGotoStableFailure({
		body: "Loading...",
		consoleErrors: [],
		failedRequests: [
			"GET http://127.0.0.1:3000/date-range-picker.page.js (net::ERR_FAILED)",
		],
		httpErrors: ["500 GET http://127.0.0.1:3000/date-range-picker.page.js"],
		pageErrors: [],
		path: "/core/components/date-range-picker",
		readyState: "complete",
		reason: "browser diagnostics reported route failures",
		state: "loading",
		url: "http://127.0.0.1:3000/core/components/date-range-picker",
	});

	assert.match(message, /state=loading/u);
	assert.match(message, /readyState=complete/u);
	assert.match(message, /date-range-picker\.page\.js \(net::ERR_FAILED\)/u);
	assert.match(message, /500 GET .*date-range-picker\.page\.js/u);
	assert.match(message, /body="Loading\.\.\."/u);
});

test("deterministic page creation closes a page when configuration fails", async () => {
	let closed = false;
	const configurationFailure = new Error("emulateMedia failed");
	const page = {
		async addInitScript(): Promise<void> {},
		async close(): Promise<void> {
			closed = true;
		},
		async emulateMedia(): Promise<void> {
			throw configurationFailure;
		},
	};

	await assert.rejects(
		createDeterministicPage(async () => page, "behavior"),
		configurationFailure,
	);
	assert.equal(closed, true);
});

test("Playwright always owns an isolated strict-port showcase server", async () => {
	const firstCheckout = "/worktrees/ui-review-a/apps/showcase";
	const secondCheckout = "/worktrees/ui-review-b/apps/showcase";
	const firstPort = showcaseE2ePortForCheckout(firstCheckout);
	const secondPort = showcaseE2ePortForCheckout(secondCheckout);
	assert.notEqual(firstPort, secondPort);
	assert.ok(firstPort >= 20_000 && firstPort < 40_000);
	assert.equal(firstPort, showcaseE2ePortForCheckout(firstCheckout));

	const webServer = record(playwrightConfig.webServer, "Playwright webServer");
	const use = record(playwrightConfig.use, "Playwright use");
	const configSource = await readFile(
		resolve(root, "apps/showcase/playwright.config.ts"),
		"utf8",
	);
	assert.equal(webServer.reuseExistingServer, false);
	assert.match(String(webServer.command), /vite dev .*--strictPort/u);
	assert.equal(webServer.cwd, realpathSync(resolve(root, "apps/showcase")));
	assert.match(String(webServer.url), /^http:\/\/127\.0\.0\.1:\d+$/u);
	assert.equal(use.baseURL, webServer.url);
	assert.equal(
		playwrightConfig.snapshotPathTemplate,
		"{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}{ext}",
	);
	assert.doesNotMatch(configSource, /process\.env\.BASE_URL/u);
	assert.doesNotMatch(configSource, /reuseExistingServer:\s*true/u);
	assert.deepEqual(webServer.gracefulShutdown, {
		signal: "SIGTERM",
		timeout: 5_000,
	});
});

test("the documented canonical E2E command exists and runs the full suite", async () => {
	const [readme, makefile, packageSource] = await Promise.all([
		readFile(resolve(root, "apps/showcase/README.md"), "utf8"),
		readFile(resolve(root, "Makefile"), "utf8"),
		readFile(resolve(root, "apps/showcase/package.json"), "utf8"),
	]);
	const packageManifest = JSON.parse(packageSource) as UnknownRecord;
	const scripts = record(packageManifest.scripts, "showcase scripts");
	assert.match(readme, /make test-e2e-ui-showcase/u);
	assert.match(
		makefile,
		/^test-e2e-ui-showcase:\n\t\$\(PNPM\) --filter @lemn-ltd\/ui-showcase run test:e2e$/mu,
	);
	assert.equal(scripts["test:e2e"], "playwright test");
});

test("Darwin and Linux visual baselines have exact platform parity", async () => {
	const snapshotDirectory = resolve(
		root,
		"apps/showcase/tests/e2e/visual.e2e.ts-snapshots",
	);
	const files = await readdir(snapshotDirectory);
	const platformBaselines = (platform: "darwin" | "linux"): string[] =>
		files
			.filter((file) => file.endsWith(`-${platform}.png`))
			.map((file) => file.replace(`-${platform}.png`, ""))
			.sort();
	const darwin = platformBaselines("darwin");
	const linux = platformBaselines("linux");
	assert.equal(darwin.length, 90);
	assert.deepEqual(linux, darwin);
	const expectConfig = record(playwrightConfig.expect, "Playwright expect");
	const screenshots = record(
		expectConfig.toHaveScreenshot,
		"Playwright screenshot expectations",
	);
	assert.equal(screenshots.maxDiffPixelRatio, 0.01);
	assert.equal(screenshots.animations, "disabled");
});

test("Sidebar visual coverage captures one explicit canonical instance", async () => {
	const [pageSource, visualSource] = await Promise.all([
		readFile(
			resolve(
				root,
				"apps/showcase/src/client/pages/core/components/sidebar.page.tsx",
			),
			"utf8",
		),
		readFile(resolve(root, "apps/showcase/tests/e2e/visual.e2e.ts"), "utf8"),
	]);
	assert.equal(
		pageSource.match(/data-testid=\{visualTarget \? "sidebar-visual-target"/gu)
			?.length,
		1,
	);
	assert.match(visualSource, /getByTestId\("sidebar-visual-target"\)/u);
	assert.match(visualSource, /embed=playground&theme=/u);
	assert.match(visualSource, /testInfo\.project\.name\.includes\("dark"\)/u);
	assert.match(visualSource, /expect\(target\)\.toHaveCount\(1\)/u);
	assert.match(visualSource, /expect\(target\)\.toHaveScreenshot/u);
});

test("Linux baselines use the pinned official Playwright runtime", async () => {
	const [rootPackageSource, generator, linuxConfig] = await Promise.all([
		readFile(resolve(root, "package.json"), "utf8"),
		readFile(
			resolve(root, "scripts/test/update-linux-visual-snapshots.mjs"),
			"utf8",
		),
		readFile(
			resolve(root, "apps/showcase/playwright.linux-snapshots.config.ts"),
			"utf8",
		),
	]);
	const scripts = record(
		(JSON.parse(rootPackageSource) as UnknownRecord).scripts,
		"root scripts",
	);
	assert.equal(
		scripts["visual:update:linux"],
		"node scripts/test/update-linux-visual-snapshots.mjs",
	);
	assert.match(generator, /mcr\.microsoft\.com\/playwright:v1\.60\.0-noble/u);
	assert.match(generator, /corepack prepare pnpm@11\.8\.0 --activate/u);
	assert.match(
		generator,
		/pnpm install --frozen-lockfile --child-concurrency=1 --network-concurrency=4/u,
	);
	assert.match(generator, /"write-tree"/u);
	assert.match(generator, /"archive"[\s\S]*--output/u);
	assert.match(generator, /set -euo pipefail/u);
	assert.match(generator, /replaceLinuxSnapshots/u);
	assert.doesNotMatch(generator, /SHOWCASE_E2E_STATIC_PREVIEW|WEB_UI_LOCAL/u);
	assert.doesNotMatch(generator, /tar[^\n]*\|[^\n]*tar/u);
	assert.match(generator, /--grep 'visual: ' --update-snapshots/u);
	assert.match(linuxConfig, /SHOWCASE_LINUX_SNAPSHOT_BASE_URL/u);
	assert.match(linuxConfig, /webServer: undefined/u);
});

test("Linux snapshot CLI preserves aggregate baselines when Git archive fails", async () => {
	const temporaryRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-linux-snapshot-failure-"),
	);
	try {
		const repositoryRoot = resolve(temporaryRoot, "repository");
		const fakeBin = resolve(temporaryRoot, "bin");
		const snapshotDirectory = resolve(
			repositoryRoot,
			"apps/showcase/tests/e2e/visual.e2e.ts-snapshots",
		);
		await Promise.all([
			mkdir(snapshotDirectory, { recursive: true }),
			mkdir(fakeBin, { recursive: true }),
		]);
		await Promise.all([
			writeFile(resolve(snapshotDirectory, "fixture-darwin.png"), "darwin"),
			writeFile(resolve(snapshotDirectory, "fixture-linux.png"), "linux"),
		]);
		execFileSync("git", ["init", "--initial-branch=main"], {
			cwd: repositoryRoot,
			stdio: "ignore",
		});
		execFileSync("git", ["config", "user.name", "Contract Test"], {
			cwd: repositoryRoot,
		});
		execFileSync("git", ["config", "user.email", "contract@example.test"], {
			cwd: repositoryRoot,
		});
		execFileSync("git", ["add", "."], { cwd: repositoryRoot });
		execFileSync("git", ["commit", "-m", "fixture"], {
			cwd: repositoryRoot,
			stdio: "ignore",
		});

		const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
		const fakeGit = resolve(fakeBin, "git");
		await writeFile(
			fakeGit,
			`#!/bin/sh\nif [ "\${1:-}" = "archive" ]; then\n  exit 23\nfi\nexec ${shellQuote(realGit)} "$@"\n`,
		);
		await chmod(fakeGit, 0o755);

		const before = await aggregateSnapshotHash(snapshotDirectory);
		const result = spawnSync(
			process.execPath,
			[
				resolve(root, "scripts/test/update-linux-visual-snapshots.mjs"),
				"--repository-root",
				repositoryRoot,
			],
			{
				encoding: "utf8",
				env: {
					...process.env,
					PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
				},
			},
		);
		assert.notEqual(result.status, 0);
		assert.match(
			`${result.stdout}${result.stderr}`,
			/git archive .* failed with exit code 23/u,
		);
		assert.equal(await aggregateSnapshotHash(snapshotDirectory), before);
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});

test("test architecture keeps pages isolated, timeouts fixed, and package tests canonical", async () => {
	const [
		capabilityExpansion,
		documentation,
		navigation,
		visual,
		showcaseKitVitestConfig,
	] = await Promise.all([
		readFile(
			resolve(root, "apps/showcase/tests/e2e/capability-expansion.e2e.ts"),
			"utf8",
		),
		readFile(
			resolve(root, "apps/showcase/tests/e2e/documentation-contract.e2e.ts"),
			"utf8",
		),
		readFile(
			resolve(root, "apps/showcase/tests/e2e/navigation.e2e.ts"),
			"utf8",
		),
		readFile(resolve(root, "apps/showcase/tests/e2e/visual.e2e.ts"), "utf8"),
		readFile(resolve(root, "packages/showcase-kit/vitest.config.ts"), "utf8"),
	]);
	for (const source of [
		capabilityExpansion,
		documentation,
		navigation,
		visual,
	]) {
		assert.match(source, /newDeterministicPage/u);
		assert.match(source, /finally\s*\{[\s\S]*await page\.close\(\)/u);
	}
	assert.doesNotMatch(capabilityExpansion, /test\.setTimeout\(/u);
	assert.match(documentation, /test\.setTimeout\(900_000\)/u);
	assert.match(navigation, /test\.setTimeout\(900_000\)/u);
	assert.match(visual, /test\.setTimeout\(900_000\)/u);

	const showcaseKitRoot = resolve(root, "packages/showcase-kit");
	const sourceViolations = (await filesUnder(resolve(showcaseKitRoot, "src")))
		.map((path) => relative(showcaseKitRoot, path))
		.filter(isTestArtifact)
		.sort();
	assert.deepEqual(sourceViolations, []);
	const canonicalSuites = (
		await filesUnder(resolve(showcaseKitRoot, "tests/unit"))
	)
		.map((path) => relative(showcaseKitRoot, path))
		.filter((path) => /\.spec\.[cm]?[jt]sx?$/u.test(path))
		.sort();
	assert.deepEqual(canonicalSuites, [
		"tests/unit/example/example-block.spec.tsx",
		"tests/unit/example/variants-gallery.spec.tsx",
		"tests/unit/page/component-page-documentation.spec.tsx",
		"tests/unit/page/documentation-page.spec.tsx",
		"tests/unit/page/live-page-preview.spec.tsx",
		"tests/unit/registry/nav-groups.spec.ts",
		"tests/unit/router/build-showcase-router.spec.tsx",
	]);
	assert.match(showcaseKitVitestConfig, /"tests\/\*\*\/\*\.spec\.tsx"/u);
	assert.match(showcaseKitVitestConfig, /"tests\/\*\*\/\*\.spec\.ts"/u);
	assert.doesNotMatch(showcaseKitVitestConfig, /"src\/\*\*\/\*\.spec\./u);
});
