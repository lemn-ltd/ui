import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
	access,
	mkdir,
	mkdtemp,
	readdir,
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
	publishedEntrypointConsumerSource,
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
					const hasTransitiveCssImport =
						expectation.name === "@lemn-ltd/ui" && target === "./dist/index.js";
					if (hasTransitiveCssImport) {
						await writeFile(
							resolve(packageRoot, "dist/component.css"),
							".published-fixture{display:block}",
						);
					}
					await writeFile(
						targetPath,
						`${hasTransitiveCssImport ? 'import "./component.css";\n' : ""}export const publishedFixture = true;\n`,
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
						const expectations =
							await materializePublishedPackageFixture(consumerRoot);
						const allEntrypoints = await readFile(
							resolve(consumerRoot, "src/all-entrypoints.ts"),
							"utf8",
						);
						for (const expectation of expectations) {
							for (const key of Object.keys(expectation.exports)) {
								const specifier =
									key === "."
										? expectation.name
										: `${expectation.name}${key.slice(1)}`;
								assert.ok(
									allEntrypoints.includes(JSON.stringify(specifier)),
									`${specifier} must be compiled by the clean web consumer`,
								);
							}
						}
						return "";
					}
					assert.equal(invocation.environment.NODE_AUTH_TOKEN, undefined);
					assert.equal(invocation.environment.GITHUB_TOKEN, undefined);
					if (
						invocation.command === process.execPath &&
						invocation.args[0]?.endsWith("verify-entrypoints.mjs")
					) {
						return executeEntrypointVerifier(invocation);
					}
					if (
						/node_modules[\\/]vite[\\/]bin[\\/]vite\.js$/u.test(
							invocation.args[0] ?? "",
						)
					) {
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
		assert.match(
			invocations[2]?.args[0] ?? "",
			/node_modules[\\/]typescript[\\/]bin[\\/]tsc$/u,
		);
		assert.deepEqual(invocations[2]?.args.slice(1), [
			"--project",
			"tsconfig.json",
		]);
		assert.match(
			invocations[3]?.args[0] ?? "",
			/node_modules[\\/]vite[\\/]bin[\\/]vite\.js$/u,
		);
		assert.deepEqual(invocations[3]?.args.slice(1), ["build"]);
	} finally {
		await rm(sandbox, { recursive: true, force: true });
	}
});

test(
	"the generated entrypoint consumer compiles transitive CSS with real TypeScript and Vite binaries",
	async () => {
		const sandbox = await mkdtemp(
			resolve(tmpdir(), "lemn-entrypoint-web-consumer-"),
		);
		try {
			const packageRoot = resolve(sandbox, "node_modules/@fixture/ui");
			const sourceRoot = resolve(sandbox, "src");
			await mkdir(resolve(packageRoot, "dist"), { recursive: true });
			await mkdir(sourceRoot, { recursive: true });
			const expectations: PackageExpectation[] = [
				{
					name: "@fixture/ui",
					version: "1.0.0",
					exports: {
						".": {
							types: "./dist/index.d.ts",
							default: "./dist/index.js",
						},
						"./styles.css": "./dist/styles.css",
					},
				},
			];
			await Promise.all([
				writeFile(
					resolve(packageRoot, "package.json"),
					`${JSON.stringify(
						{
							name: "@fixture/ui",
							version: "1.0.0",
							type: "module",
							exports: expectations[0]?.exports,
						},
						null,
						2,
					)}\n`,
				),
				writeFile(
					resolve(packageRoot, "dist/index.js"),
					'import "./component.css";\nexport const fixture = true;\n',
				),
				writeFile(
					resolve(packageRoot, "dist/index.d.ts"),
					"export declare const fixture: true;\n",
				),
				writeFile(
					resolve(packageRoot, "dist/component.css"),
					".transitive-css{color:teal}",
				),
				writeFile(
					resolve(packageRoot, "dist/styles.css"),
					".direct-css{color:navy}",
				),
				writeFile(
					resolve(sourceRoot, "all-entrypoints.ts"),
					publishedEntrypointConsumerSource(expectations),
				),
				writeFile(
					resolve(sandbox, "index.html"),
					'<script type="module" src="/src/all-entrypoints.ts"></script>\n',
				),
				writeFile(
					resolve(sandbox, "tsconfig.json"),
					`${JSON.stringify(
						{
							compilerOptions: {
								strict: true,
								noEmit: true,
								module: "ESNext",
								moduleResolution: "Bundler",
								target: "ES2022",
							},
							include: ["src"],
						},
						null,
						2,
					)}\n`,
				),
			]);

			const environment = {
				PATH: process.env.PATH,
				HOME: sandbox,
				CI: "true",
				NO_COLOR: "1",
			};
			for (const [binary, args] of [
				[
					resolve(root, "node_modules/typescript/bin/tsc"),
					["--project", "tsconfig.json"],
				],
				[resolve(root, "node_modules/vite/bin/vite.js"), ["build"]],
			] as const) {
				await execFileAsync(process.execPath, [binary, ...args], {
					cwd: sandbox,
					env: environment,
					timeout: 30_000,
				});
			}
			const assets = await readdir(resolve(sandbox, "dist/assets"));
			const cssAssets = assets.filter((name) => name.endsWith(".css"));
			assert.ok(cssAssets.length > 0);
			const bundledCss = (
				await Promise.all(
					cssAssets.map((name) =>
						readFile(resolve(sandbox, "dist/assets", name), "utf8"),
					),
				)
			).join("\n");
			assert.match(bundledCss, /\.transitive-css/u);
			assert.match(bundledCss, /\.direct-css/u);
		} finally {
			await rm(sandbox, { recursive: true, force: true });
		}
	},
	{ timeout: 40_000 },
);

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

test("command diagnostics redact credentials before applying the output bound", async () => {
	const sandbox = await mkdtemp(
		resolve(tmpdir(), "lemn-published-consumer-redaction-boundary-"),
	);
	const consumerRoot = resolve(sandbox, "consumer");
	const fixtureToken = `boundary_${"secret".repeat(20)}`;
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
					removeTemporaryDirectory: (path) =>
						rm(path, { recursive: true, force: true }),
					execute: async () => {
						throw Object.assign(new Error("consumer command failed"), {
							stderr: `${"x".repeat(65_500)}${fixtureToken}`,
						});
					},
				},
			),
			(error: unknown) => {
				assert.ok(error instanceof Error);
				assert.match(error.message, /\[REDACTED\]/u);
				assert.ok(!error.message.includes(fixtureToken));
				assert.ok(!error.message.includes(fixtureToken.slice(0, 12)));
				assert.ok(error.message.length <= 64 * 1024);
				return true;
			},
		);
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
	assert.doesNotMatch(verifier, /await import\(specifier\)/u);
	assert.doesNotMatch(verifier, /cssMarkers/u);
	assert.match(source, /bundledCss\.includes\("--lemn-color-accent:"\)/u);
	assert.match(source, /bundledCss\.includes\("\.lemn-brand-studio"\)/u);
	assert.match(source, /all-entrypoints\.ts/u);
	assert.match(source, /BrandStudioPreview,/u);
	assert.match(source, /type BrandStudioPreviewProps,/u);
	assert.match(source, /<ScreenShell/u);
	assert.match(source, /rightPanel=\{<DockPanel tabs=\{dockTabs\} \/>\}/u);
	assert.match(source, /<BrandStudioPreview \{\.\.\.previewProps\} \/>/u);

	const rootPackage = JSON.parse(
		await readFile(resolve(root, "package.json"), "utf8"),
	) as { scripts: Record<string, string> };
	assert.equal(
		rootPackage.scripts["smoke:packages:github-packages"],
		"node scripts/release/verify-published-package-consumer.ts",
	);
});
