import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const checker = resolve(
	repositoryRoot,
	"scripts/check-ui-portal-zero-legacy.mjs",
);
const retiredWord = ["show", "case"].join("");

async function writeFixtureFile(
	fixtureRoot: string,
	relativePath: string,
	content: string,
): Promise<void> {
	const path = resolve(fixtureRoot, relativePath);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content);
}

async function createCanonicalFixture(): Promise<string> {
	const fixtureRoot = await mkdtemp(
		resolve(tmpdir(), "lemn-ui-portal-zero-legacy-"),
	);
	execFileSync("git", ["init", "-q"], { cwd: fixtureRoot });
	await writeFixtureFile(
		fixtureRoot,
		"apps/ui-portal/package.json",
		JSON.stringify({ name: "@lemn-ltd/ui-portal", private: true }),
	);
	await writeFixtureFile(
		fixtureRoot,
		"apps/ui-portal/src/client/main.tsx",
		"export const portal = true;\n",
	);
	await writeFixtureFile(
		fixtureRoot,
		"apps/ui-portal/src/worker/index.ts",
		'export default { fetch: () => new Response("ok") };\n',
	);
	await writeFixtureFile(
		fixtureRoot,
		"package.json",
		JSON.stringify({ name: "fixture", private: true }),
	);
	return fixtureRoot;
}

function stage(fixtureRoot: string): void {
	execFileSync("git", ["add", "-A"], { cwd: fixtureRoot });
}

function runChecker(fixtureRoot: string): ReturnType<typeof spawnSync> {
	return spawnSync(process.execPath, [checker, "--root", fixtureRoot], {
		encoding: "utf8",
	});
}

test("accepts the canonical Portal and explicit immutable history exclusions", async () => {
	const fixtureRoot = await createCanonicalFixture();
	try {
		await writeFixtureFile(
			fixtureRoot,
			"apps/ui-portal/src/client/pages/agents/source.tsx",
			"export const dormantAgentSource = true;\n",
		);
		await writeFixtureFile(
			fixtureRoot,
			"CHANGELOG.md",
			`Historical ${retiredWord} release.\n`,
		);
		await writeFixtureFile(
			fixtureRoot,
			"docs/evidence/ui-portal-unification/phase-1-repository.md",
			`Removed apps/${retiredWord}.\n`,
		);
		await writeFixtureFile(
			fixtureRoot,
			"packages/provider-registry/third-party/source-snapshots/provider/revision/README.md",
			`Immutable upstream ${retiredWord} fixture.\n`,
		);
		stage(fixtureRoot);

		const result = runChecker(fixtureRoot);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /zero-legacy check passed/u);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
});

test("does not treat the entire migration evidence directory as immutable history", async () => {
	const fixtureRoot = await createCanonicalFixture();
	try {
		await writeFixtureFile(
			fixtureRoot,
			"docs/evidence/ui-portal-unification/unreviewed-notes.md",
			`Active ${retiredWord} compatibility remains.\n`,
		);
		stage(fixtureRoot);

		const result = runChecker(fixtureRoot);
		assert.equal(result.status, 1);
		assert.ok(result.stderr.includes("[legacy-showcase-vocabulary]"));
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
});

test("rejects retired identities, routes, credentials, roots, and active paths", async () => {
	const fixtureRoot = await createCanonicalFixture();
	try {
		const retiredStatusToken = ["PRODUCTION", "STATUS", "TOKEN"].join("_");
		const retiredRoute = ["", "core", "components", "button"].join("/");
		await writeFixtureFile(
			fixtureRoot,
			"active-config.txt",
			[
				`@lemn-ltd/ui-${retiredWord}`,
				`@lemn-ltd/${retiredWord}-kit`,
				`lemn-ui-${retiredWord}`,
				`${retiredWord}.ui.le-mn.com`,
				retiredStatusToken,
				retiredRoute,
			].join("\n"),
		);
		await writeFixtureFile(
			fixtureRoot,
			`apps/${retiredWord}/README.md`,
			"retired application\n",
		);
		await writeFixtureFile(
			fixtureRoot,
			`scripts/release/${retiredWord}-smoke.ts`,
			"export {};\n",
		);
		stage(fixtureRoot);

		const result = runChecker(fixtureRoot);
		assert.equal(result.status, 1);
		for (const marker of [
			"[legacy-directory]",
			"[legacy-package]",
			"[legacy-worker]",
			"[legacy-domain]",
			"[legacy-status-token]",
			"[legacy-route-family]",
			"[legacy-active-path]",
		]) {
			assert.ok(result.stderr.includes(marker), `missing diagnostic ${marker}`);
		}
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
});

test("rejects dormant Agent source when an active Portal entrypoint imports it", async () => {
	const fixtureRoot = await createCanonicalFixture();
	try {
		await writeFixtureFile(
			fixtureRoot,
			"apps/ui-portal/src/client/pages/agents/source.tsx",
			"export const dormantAgentSource = true;\n",
		);
		stage(fixtureRoot);
		assert.equal(runChecker(fixtureRoot).status, 0);

		await writeFixtureFile(
			fixtureRoot,
			"apps/ui-portal/src/client/main.tsx",
			'import "./pages/agents/source.js";\n',
		);
		stage(fixtureRoot);
		const result = runChecker(fixtureRoot);
		assert.equal(result.status, 1);
		assert.ok(result.stderr.includes("[agents-active-import]"));
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
});

test("the standard profile composes zero-legacy, Portal tests, and built chunk boundaries", async () => {
	const manifest = JSON.parse(
		await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
	) as { readonly scripts?: Record<string, string> };
	const gate = manifest.scripts?.["validate:ui-portal-zero-legacy"] ?? "";
	const standardProfile = await readFile(
		resolve(repositoryRoot, "tooling/src/validation/standard.ts"),
		"utf8",
	);
	const quickProfile = await readFile(
		resolve(repositoryRoot, "tooling/src/validation/quick.ts"),
		"utf8",
	);

	assert.match(gate, /check-ui-portal-zero-legacy\.mjs/u);
	assert.match(standardProfile, /await runQuick\(\{ all: true, root \}\)/u);
	assert.match(
		standardProfile,
		/pnpmCommand\("complete dry build", "build"\)/u,
	);
	assert.match(quickProfile, /workspace\.scripts\.test/u);
	assert.match(quickProfile, /"run",\s*"test"/u);
});
