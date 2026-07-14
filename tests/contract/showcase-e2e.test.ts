import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import playwrightConfig, {
	showcaseE2ePortForCheckout,
} from "../../apps/showcase/playwright.config.ts";
import { createIndexedSourceArchive } from "../../scripts/test/update-linux-visual-snapshots.mjs";

type UnknownRecord = Record<string, unknown>;

const root = resolve(import.meta.dirname, "../..");

function record(value: unknown, description: string): UnknownRecord {
	assert.ok(
		value && typeof value === "object" && !Array.isArray(value),
		`${description} must be an object`,
	);
	return value as UnknownRecord;
}

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
		/^test-e2e-ui-showcase:\n\t\$\(PNPM\) --filter @appranks\/ui-showcase run test:e2e$/mu,
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
	assert.equal(darwin.length, 78);
	assert.deepEqual(linux, darwin);
	const expectConfig = record(playwrightConfig.expect, "Playwright expect");
	const screenshots = record(
		expectConfig.toHaveScreenshot,
		"Playwright screenshot expectations",
	);
	assert.equal(screenshots.maxDiffPixelRatio, 0.01);
	assert.equal(screenshots.animations, "disabled");
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
	assert.match(generator, /pnpm install --frozen-lockfile/u);
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

test("Linux source archive fails closed when its producer fails", () => {
	const calls: string[] = [];
	const fakeSpawn = (command: string, args: string[]) => {
		calls.push([command, ...args].join(" "));
		if (args[0] === "status") return { status: 0, stdout: "M  staged.ts\n" };
		if (args[0] === "write-tree") {
			return { status: 0, stdout: `${"a".repeat(40)}\n` };
		}
		return { status: 23, stdout: "" };
	};
	assert.throws(
		() =>
			createIndexedSourceArchive({
				repositoryRoot: "/tmp/immutable-source",
				archivePath: "/tmp/source.tar",
				spawnImplementation: fakeSpawn,
			}),
		/git archive .* failed with exit code 23/u,
	);
	assert.equal(calls.length, 3);
	assert.match(calls[2] ?? "", /^git archive --format=tar --output=/u);
});

test("catalog-scale E2E closes isolated pages within explicit aggregate budgets", async () => {
	const [documentation, navigation, visual] = await Promise.all([
		readFile(
			resolve(root, "apps/showcase/tests/e2e/documentation-contract.e2e.ts"),
			"utf8",
		),
		readFile(
			resolve(root, "apps/showcase/tests/e2e/navigation.e2e.ts"),
			"utf8",
		),
		readFile(resolve(root, "apps/showcase/tests/e2e/visual.e2e.ts"), "utf8"),
	]);
	for (const source of [documentation, navigation, visual]) {
		assert.match(source, /newDeterministicPage/u);
		assert.match(source, /finally\s*\{[\s\S]*await page\.close\(\)/u);
	}
	assert.match(documentation, /test\.setTimeout\(900_000\)/u);
	assert.match(navigation, /test\.setTimeout\(900_000\)/u);
	assert.match(visual, /test\.setTimeout\(900_000\)/u);
});
