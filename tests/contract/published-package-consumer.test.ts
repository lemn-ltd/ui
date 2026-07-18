import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
	access,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
	type ConsumerCommandInvocation,
	githubPackagesUserConfig,
	publishedConsumerInstallArgs,
	publishedConsumerVersions,
	publishedEntrypointVerifierSource,
	verifyPublishedPackageConsumer,
} from "../../scripts/release/verify-published-package-consumer.ts";

interface PackageExpectation {
	readonly name: string;
	readonly version: string;
	readonly exports: Readonly<Record<string, unknown>>;
}

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
const nodeAuthTokenPlaceholder = ["$", "{NODE_AUTH_TOKEN}"].join("");

function runtimeTarget(definition: unknown): string | undefined {
	if (typeof definition === "string") return definition;
	if (Array.isArray(definition)) {
		for (const entry of definition) {
			const target = runtimeTarget(entry);
			if (target) return target;
		}
		return undefined;
	}
	if (definition && typeof definition === "object") {
		const record = definition as Record<string, unknown>;
		return runtimeTarget(record.default) ?? runtimeTarget(record.import);
	}
	return undefined;
}

function allTargets(definition: unknown): string[] {
	if (typeof definition === "string") return [definition];
	if (Array.isArray(definition)) return definition.flatMap(allTargets);
	if (definition && typeof definition === "object") {
		return Object.values(definition).flatMap(allTargets);
	}
	return [];
}

async function materializePublishedPackageFixture(
	consumerRoot: string,
): Promise<PackageExpectation[]> {
	const expectations = JSON.parse(
		await readFile(resolve(consumerRoot, "expected-package-set.json"), "utf8"),
	) as PackageExpectation[];
	const versions = new Map(
		expectations.map(({ name, version }) => [name, version]),
	);
	for (const expectation of expectations) {
		const packageRoot = resolve(
			consumerRoot,
			"node_modules",
			...expectation.name.split("/"),
		);
		const manifest = {
			name: expectation.name,
			version: expectation.version,
			type: "module",
			exports: expectation.exports,
			...(expectation.name === "@lemn-ltd/brand-runtime"
				? {
						dependencies: {
							"@lemn-ltd/brand-contract": versions.get(
								"@lemn-ltd/brand-contract",
							),
						},
					}
				: expectation.name === "@lemn-ltd/brand-studio"
					? {
							dependencies: {
								"@lemn-ltd/brand-contract": versions.get(
									"@lemn-ltd/brand-contract",
								),
							},
							peerDependencies: {
								"@lemn-ltd/ui": versions.get("@lemn-ltd/ui"),
								react: "19.2.4",
								"react-dom": "19.2.4",
							},
						}
					: {}),
		};
		await mkdir(packageRoot, { recursive: true });
		await writeFile(
			resolve(packageRoot, "package.json"),
			`${JSON.stringify(manifest, null, 2)}\n`,
		);
		for (const definition of Object.values(expectation.exports)) {
			for (const target of allTargets(definition)) {
				const targetPath = resolve(packageRoot, target);
				await mkdir(dirname(targetPath), { recursive: true });
				if (target.endsWith(".css")) {
					const css =
						expectation.name === "@lemn-ltd/ui"
							? ":root{--lemn-color-accent:#087f75}"
							: ".lemn-brand-studio{display:block}";
					await writeFile(targetPath, css);
				} else if (target.endsWith(".d.ts")) {
					await writeFile(targetPath, "export {};\n");
				} else {
					await writeFile(
						targetPath,
						"export const publishedFixture = true;\n",
					);
				}
			}
		}
		for (const [key, definition] of Object.entries(expectation.exports)) {
			assert.ok(
				runtimeTarget(definition),
				`${expectation.name} fixture export ${key} needs a runtime target`,
			);
		}
	}
	return expectations;
}

async function executeEntrypointVerifier(
	invocation: ConsumerCommandInvocation,
): Promise<string> {
	const result = await execFileAsync(invocation.command, [...invocation.args], {
		cwd: invocation.cwd,
		env: invocation.environment,
		maxBuffer: 4 * 1024 * 1024,
	});
	return result.stdout.trim();
}

test("a clean consumer installs exact published packages, resolves every export, and strips the token before verification", async () => {
	const sandbox = await mkdtemp(
		resolve(tmpdir(), "lemn-published-consumer-contract-"),
	);
	const consumerRoot = resolve(sandbox, "consumer");
	const fixtureToken = "github_packages_contract_token";
	const invocations: ConsumerCommandInvocation[] = [];
	let cleanupCalls = 0;
	try {
		const result = await verifyPublishedPackageConsumer(
			{
				root,
				environment: {
					...process.env,
					NODE_AUTH_TOKEN: fixtureToken,
					GITHUB_TOKEN: "must-not-reach-the-consumer",
					AGENTOPS_MCP_TOKEN: "must-not-reach-the-consumer",
				},
			},
			{
				createTemporaryDirectory: async () => {
					await mkdir(consumerRoot, { recursive: true });
					return consumerRoot;
				},
				removeTemporaryDirectory: async (path) => {
					cleanupCalls += 1;
					await rm(path, { recursive: true, force: true });
				},
				execute: async (invocation) => {
					invocations.push(invocation);
					if (invocation.args[0] === "install") {
						assert.equal(invocation.environment.NODE_AUTH_TOKEN, fixtureToken);
						assert.equal(invocation.environment.GITHUB_TOKEN, undefined);
						assert.equal(invocation.environment.AGENTOPS_MCP_TOKEN, undefined);
						assert.ok(!invocation.args.join(" ").includes(fixtureToken));
						const userConfigPath = invocation.environment.NPM_CONFIG_USERCONFIG;
						assert.ok(userConfigPath);
						const userConfig = await readFile(userConfigPath, "utf8");
						assert.equal(userConfig, githubPackagesUserConfig);
						assert.ok(userConfig.includes(nodeAuthTokenPlaceholder));
						assert.ok(!userConfig.includes(fixtureToken));
						assert.equal((await stat(userConfigPath)).mode & 0o777, 0o600);
						const consumerManifest = JSON.parse(
							await readFile(resolve(consumerRoot, "package.json"), "utf8"),
						) as {
							dependencies: Record<string, string>;
						};
						for (const name of [
							"@lemn-ltd/brand-contract",
							"@lemn-ltd/ui",
							"@lemn-ltd/brand-runtime",
							"@lemn-ltd/brand-studio",
						]) {
							assert.match(
								consumerManifest.dependencies[name] ?? "",
								/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u,
							);
						}
						await materializePublishedPackageFixture(consumerRoot);
						return "";
					}
					assert.equal(invocation.environment.NODE_AUTH_TOKEN, undefined);
					assert.equal(invocation.environment.GITHUB_TOKEN, undefined);
					if (invocation.command === process.execPath) {
						return executeEntrypointVerifier(invocation);
					}
					if (invocation.args[0] === "exec" && invocation.args[1] === "vite") {
						const assets = resolve(consumerRoot, "dist/assets");
						await mkdir(assets, { recursive: true });
						await Promise.all([
							writeFile(
								resolve(consumerRoot, "dist/index.html"),
								"<main></main>",
							),
							writeFile(resolve(assets, "app.js"), "export {};"),
							writeFile(
								resolve(assets, "app.css"),
								":root{--lemn-color-accent:#087f75}.lemn-brand-studio{display:block}",
							),
						]);
					}
					return "";
				},
			},
		);

		assert.equal(result.packages.length, 4);
		assert.equal(result.entrypoints, 14);
		assert.equal(result.cssEntrypoints, 2);
		assert.equal(result.javascriptAssets, 1);
		assert.equal(result.cssAssets, 1);
		assert.equal(cleanupCalls, 1);
		await assert.rejects(access(consumerRoot));
		assert.equal(invocations.length, 4);
		assert.deepEqual(
			invocations[0]?.args,
			publishedConsumerInstallArgs(consumerRoot),
		);
		assert.deepEqual(
			invocations.slice(2).map(({ args }) => args.slice(0, 2)),
			[
				["exec", "tsc"],
				["exec", "vite"],
			],
		);
	} finally {
		await rm(sandbox, { recursive: true, force: true });
	}
});

test("the published-consumer install argv is accepted by the pinned pnpm CLI", async () => {
	const sandbox = await mkdtemp(
		resolve(tmpdir(), "lemn-published-consumer-pnpm-cli-"),
	);
	try {
		await writeFile(
			resolve(sandbox, "package.json"),
			`${JSON.stringify(
				{
					private: true,
					packageManager: `pnpm@${publishedConsumerVersions.packageManager}`,
				},
				null,
				2,
			)}\n`,
		);
		await writeFile(resolve(sandbox, ".npmrc"), "update-notifier=false\n");
		const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
		const environment = {
			PATH: process.env.PATH,
			HOME: sandbox,
			CI: "true",
			COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
			NPM_CONFIG_OFFLINE: "true",
			NPM_CONFIG_UPDATE_NOTIFIER: "false",
		};
		const version = await execFileAsync(pnpmCommand, ["--version"], {
			cwd: sandbox,
			env: environment,
			timeout: 30_000,
		});
		assert.equal(
			version.stdout.trim(),
			publishedConsumerVersions.packageManager,
		);
		const args = publishedConsumerInstallArgs(sandbox);
		assert.doesNotMatch(args.join(" "), /--prefer-online/u);
		await execFileAsync(pnpmCommand, [...args], {
			cwd: sandbox,
			env: environment,
			timeout: 30_000,
		});
	} finally {
		await rm(sandbox, { recursive: true, force: true });
	}
});

test("command failures redact the registry credential and always remove the temporary consumer", async () => {
	const sandbox = await mkdtemp(
		resolve(tmpdir(), "lemn-published-consumer-failure-"),
	);
	const consumerRoot = resolve(sandbox, "consumer");
	const fixtureToken = "github_packages_failure_token";
	let cleanupCalls = 0;
	try {
		await assert.rejects(
			verifyPublishedPackageConsumer(
				{
					root,
					environment: { ...process.env, NODE_AUTH_TOKEN: fixtureToken },
				},
				{
					createTemporaryDirectory: async () => {
						await mkdir(consumerRoot, { recursive: true });
						return consumerRoot;
					},
					removeTemporaryDirectory: async (path) => {
						cleanupCalls += 1;
						await rm(path, { recursive: true, force: true });
					},
					execute: async () => {
						throw new Error(`registry rejected ${fixtureToken}`);
					},
				},
			),
			(error: unknown) => {
				assert.ok(error instanceof Error);
				assert.match(error.message, /registry rejected \[REDACTED\]/u);
				assert.ok(!error.message.includes(fixtureToken));
				return true;
			},
		);
		assert.equal(cleanupCalls, 1);
		await assert.rejects(access(consumerRoot));
	} finally {
		await rm(sandbox, { recursive: true, force: true });
	}
});

test("missing or malformed registry credentials fail before creating temporary state", async () => {
	let createCalls = 0;
	for (const token of [undefined, "token with whitespace", "token\nline"]) {
		await assert.rejects(
			verifyPublishedPackageConsumer(
				{
					root,
					environment: { ...process.env, NODE_AUTH_TOKEN: token },
				},
				{
					createTemporaryDirectory: async () => {
						createCalls += 1;
						return "/unused";
					},
					removeTemporaryDirectory: async () => {},
					execute: async () => "",
				},
			),
			/NODE_AUTH_TOKEN/u,
		);
	}
	assert.equal(createCalls, 0);
});

test("the release implementation uses argv-based execution and verifies JS plus CSS public entrypoints", async () => {
	const source = await readFile(
		resolve(root, "scripts/release/verify-published-package-consumer.ts"),
		"utf8",
	);
	assert.match(source, /execFileAsync\(/u);
	assert.doesNotMatch(source, /shell\s*:\s*true|execSync\(|spawnSync\(/u);
	assert.ok(githubPackagesUserConfig.includes(nodeAuthTokenPlaceholder));
	assert.doesNotMatch(githubPackagesUserConfig, /github_pat_|ghp_/u);
	const verifier = publishedEntrypointVerifierSource();
	assert.match(verifier, /import\.meta\.resolve\(specifier\)/u);
	assert.match(verifier, /await import\(specifier\)/u);
	assert.match(verifier, /--lemn-color-accent:/u);
	assert.match(verifier, /\.lemn-brand-studio/u);

	const rootPackage = JSON.parse(
		await readFile(resolve(root, "package.json"), "utf8"),
	) as { scripts: Record<string, string> };
	assert.equal(
		rootPackage.scripts["smoke:packages:github-packages"],
		"node scripts/release/verify-published-package-consumer.ts",
	);
});
