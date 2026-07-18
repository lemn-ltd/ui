#!/usr/bin/env node
import { execFile } from "node:child_process";
import {
	access,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual, promisify } from "node:util";
import {
	PACKAGE_PUBLISH_CHILD_ENVIRONMENT_KEYS,
	redactSensitiveText,
	releaseChildEnvironment,
	sensitiveEnvironmentValues,
} from "./child-process-security.ts";
import { readReleasePackageManifest, releasePackages } from "./package-set.ts";

const execFileAsync = promisify(execFile);
const githubPackagesRegistry = "https://npm.pkg.github.com";
const exactVersion =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u;

export const publishedConsumerVersions = Object.freeze({
	packageManager: "11.8.0",
	react: "19.2.4",
	reactDom: "19.2.4",
	reactTypes: "19.2.14",
	reactDomTypes: "19.2.3",
	lucideReact: "0.469.0",
	typescript: "5.9.3",
	vite: "8.0.16",
	viteReact: "6.0.1",
});

const nodeAuthTokenPlaceholder = ["$", "{NODE_AUTH_TOKEN}"].join("");

export const githubPackagesUserConfig = [
	"registry=https://registry.npmjs.org/",
	`@lemn-ltd:registry=${githubPackagesRegistry}`,
	`//npm.pkg.github.com/:_authToken=${nodeAuthTokenPlaceholder}`,
	"always-auth=true",
	"",
].join("\n");

interface PackageExpectation {
	readonly name: string;
	readonly version: string;
	readonly exports: Readonly<Record<string, unknown>>;
}

interface InstalledPackageManifest {
	readonly name?: string;
	readonly version?: string;
	readonly exports?: Readonly<Record<string, unknown>>;
	readonly dependencies?: Readonly<Record<string, string>>;
	readonly optionalDependencies?: Readonly<Record<string, string>>;
	readonly peerDependencies?: Readonly<Record<string, string>>;
}

export interface ConsumerCommandInvocation {
	readonly command: string;
	readonly args: readonly string[];
	readonly cwd: string;
	readonly environment: NodeJS.ProcessEnv;
}

export interface PublishedConsumerDependencies {
	readonly createTemporaryDirectory: () => Promise<string>;
	readonly removeTemporaryDirectory: (path: string) => Promise<void>;
	readonly execute: (invocation: ConsumerCommandInvocation) => Promise<string>;
}

export interface PublishedConsumerResult {
	readonly packages: readonly string[];
	readonly entrypoints: number;
	readonly cssEntrypoints: number;
	readonly javascriptAssets: number;
	readonly cssAssets: number;
}

export function publishedConsumerInstallArgs(
	temporaryRoot: string,
): readonly string[] {
	return [
		"install",
		"--ignore-scripts",
		"--strict-peer-dependencies",
		"--no-frozen-lockfile",
		"--store-dir",
		resolve(temporaryRoot, "store"),
	];
}

interface EntrypointReport {
	readonly entrypoints?: number;
	readonly cssEntrypoints?: number;
}

function ensure(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function runtimeExportTarget(definition: unknown): string | undefined {
	if (typeof definition === "string") return definition;
	if (Array.isArray(definition)) {
		for (const entry of definition) {
			const target = runtimeExportTarget(entry);
			if (target) return target;
		}
		return undefined;
	}
	if (definition && typeof definition === "object") {
		const record = definition as Record<string, unknown>;
		return (
			runtimeExportTarget(record.default) ?? runtimeExportTarget(record.import)
		);
	}
	return undefined;
}

function requireRegistryToken(environment: NodeJS.ProcessEnv): string {
	const token = environment.NODE_AUTH_TOKEN;
	if (!token) throw new Error("Missing NODE_AUTH_TOKEN for GitHub Packages");
	if (
		[...token].some((character) => {
			const code = character.codePointAt(0) ?? 0;
			return /\s/u.test(character) || code < 32 || code === 127;
		})
	) {
		throw new Error("NODE_AUTH_TOKEN has an invalid format");
	}
	return token;
}

async function packageExpectations(
	root: string,
): Promise<PackageExpectation[]> {
	const expectations: PackageExpectation[] = [];
	for (const definition of releasePackages) {
		const manifest = await readReleasePackageManifest(root, definition);
		ensure(
			manifest.name === definition.name,
			`${definition.id} package name differs from the release package set`,
		);
		ensure(
			exactVersion.test(manifest.version ?? ""),
			`${definition.name} must declare an exact published version`,
		);
		ensure(
			manifest.exports && Object.keys(manifest.exports).length > 0,
			`${definition.name} must declare public exports`,
		);
		expectations.push({
			name: definition.name,
			version: manifest.version,
			exports: manifest.exports,
		});
	}
	return expectations;
}

function packagePath(root: string, packageName: string): string {
	return resolve(root, "node_modules", ...packageName.split("/"));
}

async function readInstalledManifest(
	consumerRoot: string,
	expectation: PackageExpectation,
): Promise<InstalledPackageManifest> {
	const directory = packagePath(consumerRoot, expectation.name);
	const installedRoot = await realpath(directory);
	const relativeRoot = relative(await realpath(consumerRoot), installedRoot);
	ensure(
		relativeRoot !== ".." &&
			!relativeRoot.startsWith(
				`..${process.platform === "win32" ? "\\" : "/"}`,
			),
		`${expectation.name} resolved outside the clean consumer`,
	);
	return JSON.parse(
		await readFile(resolve(directory, "package.json"), "utf8"),
	) as InstalledPackageManifest;
}

async function assertInstalledPackageSet(
	consumerRoot: string,
	expectations: readonly PackageExpectation[],
): Promise<void> {
	const installed = new Map<string, InstalledPackageManifest>();
	for (const expectation of expectations) {
		const manifest = await readInstalledManifest(consumerRoot, expectation);
		ensure(
			manifest.name === expectation.name &&
				manifest.version === expectation.version,
			`Installed ${expectation.name} must be exactly ${expectation.version}`,
		);
		ensure(
			isDeepStrictEqual(manifest.exports, expectation.exports),
			`Installed ${expectation.name} public exports differ from the release manifest`,
		);
		for (const group of [
			"dependencies",
			"optionalDependencies",
			"peerDependencies",
		] as const) {
			for (const [name, version] of Object.entries(manifest[group] ?? {})) {
				ensure(
					exactVersion.test(version),
					`Published ${expectation.name} ${group}.${name} must be exact; received ${version}`,
				);
			}
		}
		installed.set(expectation.name, manifest);
	}

	const contractVersion = installed.get("@lemn-ltd/brand-contract")?.version;
	const uiVersion = installed.get("@lemn-ltd/ui")?.version;
	ensure(contractVersion && uiVersion, "Installed package set is incomplete");
	ensure(
		installed.get("@lemn-ltd/brand-runtime")?.dependencies?.[
			"@lemn-ltd/brand-contract"
		] === contractVersion,
		"Published Brand Runtime must depend on the exact installed Brand Contract",
	);
	const studio = installed.get("@lemn-ltd/brand-studio");
	ensure(
		studio?.dependencies?.["@lemn-ltd/brand-contract"] === contractVersion,
		"Published Brand Studio must depend on the exact installed Brand Contract",
	);
	ensure(
		studio?.peerDependencies?.["@lemn-ltd/ui"] === uiVersion,
		"Published Brand Studio must peer-depend on the exact installed UI package",
	);
}

function consumerPackageManifest(
	expectations: readonly PackageExpectation[],
): string {
	return `${JSON.stringify(
		{
			name: "lemn-published-package-consumer",
			version: "1.0.0",
			private: true,
			type: "module",
			packageManager: `pnpm@${publishedConsumerVersions.packageManager}`,
			dependencies: {
				...Object.fromEntries(
					expectations.map(({ name, version }) => [name, version]),
				),
				"lucide-react": publishedConsumerVersions.lucideReact,
				react: publishedConsumerVersions.react,
				"react-dom": publishedConsumerVersions.reactDom,
			},
			devDependencies: {
				"@types/react": publishedConsumerVersions.reactTypes,
				"@types/react-dom": publishedConsumerVersions.reactDomTypes,
				"@vitejs/plugin-react": publishedConsumerVersions.viteReact,
				typescript: publishedConsumerVersions.typescript,
				vite: publishedConsumerVersions.vite,
			},
		},
		null,
		2,
	)}\n`;
}

export function publishedEntrypointVerifierSource(): string {
	return `import { readFile, realpath, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const expectations = JSON.parse(await readFile(new URL("./expected-package-set.json", import.meta.url), "utf8"));
const cssMarkers = new Map([
  ["@lemn-ltd/ui/styles.css", "--lemn-color-accent:"],
  ["@lemn-ltd/brand-studio/styles.css", ".lemn-brand-studio"],
]);

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function runtimeTarget(definition) {
  if (typeof definition === "string") return definition;
  if (Array.isArray(definition)) {
    for (const entry of definition) {
      const target = runtimeTarget(entry);
      if (target) return target;
    }
    return undefined;
  }
  if (definition && typeof definition === "object") {
    if (Object.hasOwn(definition, "default")) return runtimeTarget(definition.default);
    if (Object.hasOwn(definition, "import")) return runtimeTarget(definition.import);
  }
  return undefined;
}

let entrypoints = 0;
let cssEntrypoints = 0;
for (const expectation of expectations) {
  const packageRoot = resolve("node_modules", ...expectation.name.split("/"));
  for (const [key, definition] of Object.entries(expectation.exports)) {
    const specifier = key === "." ? expectation.name : expectation.name + key.slice(1);
    const target = runtimeTarget(definition);
    ensure(target && target.startsWith("./"), specifier + " has no package-relative runtime target");
    const resolvedPath = fileURLToPath(import.meta.resolve(specifier));
    const expectedPath = resolve(packageRoot, target);
    ensure(await realpath(resolvedPath) === await realpath(expectedPath), specifier + " resolved outside its published export target");
    const metadata = await stat(resolvedPath);
    ensure(metadata.isFile() && metadata.size > 0, specifier + " resolved to an empty or non-file target");
    if (target.endsWith(".css")) {
      const css = await readFile(resolvedPath, "utf8");
      const marker = cssMarkers.get(specifier);
      if (marker) ensure(css.includes(marker), specifier + " is missing its public CSS contract marker");
      cssEntrypoints += 1;
    } else {
      await import(specifier);
    }
    entrypoints += 1;
  }
}

console.log(JSON.stringify({ entrypoints, cssEntrypoints }));
`;
}

const consumerSource = `import { compileBrandingDefinition } from '@lemn-ltd/brand-contract';
import { systemBrandingTemplates } from '@lemn-ltd/brand-contract/system-brandings';
import { resolveBranding } from '@lemn-ltd/brand-runtime';
import { createBrandingSsrParts } from '@lemn-ltd/brand-runtime/server';
import { BrandStudio } from '@lemn-ltd/brand-studio';
import '@lemn-ltd/brand-studio/styles.css';
import { Button, type IconName } from '@lemn-ltd/ui';
import { DashboardOverviewBlock } from '@lemn-ltd/ui/blocks';
import { AppointmentScheduleBlock, coreBlockCatalog } from '@lemn-ltd/ui/blocks/core';
import { coreBlockCatalog as coreBlockCatalogMetadata } from '@lemn-ltd/ui/blocks/core/catalog';
import { componentCatalog } from '@lemn-ltd/ui/catalog';
import { coreComponentCatalog, coreComponentExportsFromSlug } from '@lemn-ltd/ui/catalog/core';
import '@lemn-ltd/ui/styles.css';
import { tokens } from '@lemn-ltd/ui/tokens';
import { createRoot } from 'react-dom/client';

const iconName: IconName = 'check';
void compileBrandingDefinition;
void systemBrandingTemplates;
void resolveBranding;
void createBrandingSsrParts;
void BrandStudio;
void DashboardOverviewBlock;
void AppointmentScheduleBlock;
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root');

createRoot(rootElement).render(
  <main data-icon={iconName}>
    <Button>Published package consumer</Button>
    <output>
      {componentCatalog.length}:{coreComponentCatalog.length}:{coreBlockCatalog.length}:
      {coreBlockCatalogMetadata.length}:{coreComponentExportsFromSlug('button').length}:
      {tokens.spacing[2]}
    </output>
  </main>,
);
`;

async function writeConsumer(
	consumerRoot: string,
	expectations: readonly PackageExpectation[],
): Promise<{
	readonly userConfig: string;
	readonly emptyGlobalConfig: string;
}> {
	const sourceRoot = resolve(consumerRoot, "src");
	await mkdir(sourceRoot, { recursive: true });
	const userConfig = resolve(consumerRoot, "user.npmrc");
	const emptyGlobalConfig = resolve(consumerRoot, "global.npmrc");
	await Promise.all([
		writeFile(
			resolve(consumerRoot, "package.json"),
			consumerPackageManifest(expectations),
			{ mode: 0o600 },
		),
		writeFile(
			resolve(consumerRoot, "expected-package-set.json"),
			`${JSON.stringify(expectations, null, 2)}\n`,
			{ mode: 0o600 },
		),
		writeFile(userConfig, githubPackagesUserConfig, { mode: 0o600 }),
		writeFile(emptyGlobalConfig, "", { mode: 0o600 }),
		writeFile(
			resolve(consumerRoot, "verify-entrypoints.mjs"),
			publishedEntrypointVerifierSource(),
			{ mode: 0o600 },
		),
		writeFile(
			resolve(consumerRoot, "tsconfig.json"),
			`${JSON.stringify(
				{
					compilerOptions: {
						strict: true,
						skipLibCheck: false,
						noEmit: true,
						jsx: "react-jsx",
						module: "ESNext",
						moduleResolution: "Bundler",
						target: "ES2022",
						lib: ["ES2022", "DOM", "DOM.Iterable"],
					},
					include: ["src"],
				},
				null,
				2,
			)}\n`,
		),
		writeFile(resolve(sourceRoot, "main.tsx"), consumerSource),
		writeFile(
			resolve(consumerRoot, "index.html"),
			'<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
		),
		writeFile(
			resolve(consumerRoot, "vite.config.mjs"),
			`import react from '@vitejs/plugin-react';\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({ plugins: [react()] });\n`,
		),
	]);
	return { userConfig, emptyGlobalConfig };
}

async function collectFiles(directory: string): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await collectFiles(path)));
		else if (entry.isFile()) files.push(path);
	}
	return files;
}

async function assertBuildOutput(
	consumerRoot: string,
): Promise<{ readonly javascriptAssets: number; readonly cssAssets: number }> {
	const outputRoot = resolve(consumerRoot, "dist");
	await access(resolve(outputRoot, "index.html"));
	const files = await collectFiles(outputRoot);
	const javascript = files.filter((path) => path.endsWith(".js"));
	const css = files.filter((path) => path.endsWith(".css"));
	ensure(
		javascript.length > 0,
		"Published consumer build emitted no JavaScript",
	);
	ensure(css.length > 0, "Published consumer build emitted no CSS");
	const bundledCss = (
		await Promise.all(css.map((path) => readFile(path, "utf8")))
	).join("\n");
	ensure(
		bundledCss.includes("--lemn-color-accent:"),
		"Published consumer build omitted the UI stylesheet contract",
	);
	ensure(
		bundledCss.includes(".lemn-brand-studio"),
		"Published consumer build omitted the Brand Studio stylesheet contract",
	);
	return { javascriptAssets: javascript.length, cssAssets: css.length };
}

async function defaultExecute(
	invocation: ConsumerCommandInvocation,
): Promise<string> {
	const result = await execFileAsync(invocation.command, [...invocation.args], {
		cwd: invocation.cwd,
		env: invocation.environment,
		maxBuffer: 32 * 1024 * 1024,
	});
	return result.stdout.trim();
}

const defaultDependencies: PublishedConsumerDependencies = {
	createTemporaryDirectory: () =>
		mkdtemp(resolve(tmpdir(), "lemn-github-packages-consumer-")),
	removeTemporaryDirectory: (path) =>
		rm(path, { recursive: true, force: true }),
	execute: defaultExecute,
};

async function executeSafely(
	dependencies: PublishedConsumerDependencies,
	invocation: ConsumerCommandInvocation,
	sensitiveValues: readonly string[],
): Promise<string> {
	try {
		return await dependencies.execute(invocation);
	} catch (error) {
		throw new Error(
			redactSensitiveText(
				error instanceof Error ? error.message : String(error),
				sensitiveValues,
			),
		);
	}
}

export async function verifyPublishedPackageConsumer(
	options: {
		readonly root: string;
		readonly environment: NodeJS.ProcessEnv;
	},
	dependencies: PublishedConsumerDependencies = defaultDependencies,
): Promise<PublishedConsumerResult> {
	const registryToken = requireRegistryToken(options.environment);
	const expectations = await packageExpectations(options.root);
	const temporaryRoot = await dependencies.createTemporaryDirectory();
	try {
		const { userConfig, emptyGlobalConfig } = await writeConsumer(
			temporaryRoot,
			expectations,
		);
		const installEnvironment = releaseChildEnvironment(
			options.environment,
			PACKAGE_PUBLISH_CHILD_ENVIRONMENT_KEYS,
			{
				NPM_CONFIG_USERCONFIG: userConfig,
				npm_config_userconfig: userConfig,
				NPM_CONFIG_GLOBALCONFIG: emptyGlobalConfig,
				npm_config_globalconfig: emptyGlobalConfig,
			},
		);
		const credentialFreeEnvironment = releaseChildEnvironment(
			options.environment,
		);
		const sensitiveValues = sensitiveEnvironmentValues(installEnvironment, {
			NODE_AUTH_TOKEN: registryToken,
		});
		const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

		await executeSafely(
			dependencies,
			{
				command: pnpmCommand,
				args: publishedConsumerInstallArgs(temporaryRoot),
				cwd: temporaryRoot,
				environment: installEnvironment,
			},
			sensitiveValues,
		);
		await assertInstalledPackageSet(temporaryRoot, expectations);

		const entrypointOutput = await executeSafely(
			dependencies,
			{
				command: process.execPath,
				args: [resolve(temporaryRoot, "verify-entrypoints.mjs")],
				cwd: temporaryRoot,
				environment: credentialFreeEnvironment,
			},
			sensitiveValues,
		);
		let entrypointReport: EntrypointReport;
		try {
			entrypointReport = JSON.parse(entrypointOutput) as EntrypointReport;
		} catch {
			throw new Error(
				"Published entrypoint verification returned invalid JSON",
			);
		}
		const expectedEntrypoints = expectations.reduce(
			(total, expectation) => total + Object.keys(expectation.exports).length,
			0,
		);
		const expectedCssEntrypoints = expectations.reduce(
			(total, expectation) =>
				total +
				Object.values(expectation.exports).filter((definition) =>
					runtimeExportTarget(definition)?.endsWith(".css"),
				).length,
			0,
		);
		ensure(
			entrypointReport.entrypoints === expectedEntrypoints,
			"Published entrypoint verification did not cover every public export",
		);
		ensure(
			entrypointReport.cssEntrypoints === expectedCssEntrypoints,
			"Published entrypoint verification did not cover every public stylesheet",
		);

		for (const args of [
			["exec", "tsc", "--project", "tsconfig.json"],
			["exec", "vite", "build"],
		] as const) {
			await executeSafely(
				dependencies,
				{
					command: pnpmCommand,
					args,
					cwd: temporaryRoot,
					environment: credentialFreeEnvironment,
				},
				sensitiveValues,
			);
		}
		const build = await assertBuildOutput(temporaryRoot);
		return {
			packages: expectations.map(({ name, version }) => `${name}@${version}`),
			entrypoints: expectedEntrypoints,
			cssEntrypoints: entrypointReport.cssEntrypoints,
			...build,
		};
	} finally {
		await dependencies.removeTemporaryDirectory(temporaryRoot);
	}
}

async function main(): Promise<void> {
	const root = resolve(import.meta.dirname, "../..");
	const result = await verifyPublishedPackageConsumer({
		root,
		environment: process.env,
	});
	console.log(
		`Published package consumer verified: ${result.packages.join(", ")}; ${result.entrypoints} public entrypoints (${result.cssEntrypoints} CSS); strict TypeScript and Vite build passed`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	await main();
}
