import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import test from "node:test";

type UnknownRecord = Record<string, unknown>;

interface ScriptCatalog {
	readonly formatVersion: number;
	readonly pattern: string;
	readonly idFormat: string;
	readonly categories: readonly string[];
	readonly manifests: readonly CatalogManifest[];
}

interface CatalogManifest {
	readonly id: string;
	readonly path: string;
	readonly owner: string;
	readonly scope: {
		readonly kind: string;
		readonly name: string;
	};
	readonly lifecycle: {
		readonly status: string;
		readonly replacement: string | null;
		readonly removalCondition: string | null;
	};
	readonly defaults: ScriptMetadata;
	readonly scripts: Readonly<Record<string, CatalogScript>>;
}

interface ScriptMetadata {
	readonly environments?: readonly string[];
	readonly mutation?: string;
	readonly executionIntent?: string;
	readonly guardScript?: string;
	readonly requiredSecrets?: readonly string[];
	readonly requiredVariables?: readonly string[];
	readonly ciUsage?: readonly string[];
}

interface CatalogScript extends ScriptMetadata {
	readonly command: string;
	readonly category: string;
}

interface ResolvedScript extends CatalogScript {
	readonly id: string;
	readonly manifest: CatalogManifest;
	readonly scriptName: string;
	readonly environments: readonly string[];
	readonly mutation: string;
	readonly executionIntent: string;
	readonly requiredSecrets: readonly string[];
	readonly requiredVariables: readonly string[];
	readonly ciUsage: readonly string[];
}

const root = resolve(import.meta.dirname, "../..");
const catalogPath = resolve(root, "tooling/catalog.json");
const catalog = JSON.parse(
	await readFile(catalogPath, "utf8"),
) as ScriptCatalog;

const expectedCategories = [
	"local",
	"check",
	"codegen",
	"test",
	"smoke",
	"db",
	"release",
	"ops",
	"bootstrap",
	"build",
] as const;
const allowedEnvironments = new Set(["local", "ci", "production"]);
const allowedMutations = new Set([
	"none",
	"generated-output",
	"source",
	"process",
	"remote",
]);
const allowedExecutionIntents = new Set([
	"not-applicable",
	"explicit-command",
	"dry-run",
	"guarded",
]);
const environmentName = /^[A-Z][A-Z0-9_]*$/u;

function record(value: unknown, description: string): UnknownRecord {
	assert.ok(
		value && typeof value === "object" && !Array.isArray(value),
		`${description} must be an object`,
	);
	return value as UnknownRecord;
}

async function exists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function activeManifestPaths(): Promise<string[]> {
	const result = ["package.json"];
	for (const workspaceRoot of ["apps", "packages"] as const) {
		const entries = await readdir(resolve(root, workspaceRoot), {
			withFileTypes: true,
		});
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const manifestPath = `${workspaceRoot}/${entry.name}/package.json`;
			if (await exists(resolve(root, manifestPath))) result.push(manifestPath);
		}
	}
	return result.sort();
}

function resolvedScripts(): ResolvedScript[] {
	return catalog.manifests.flatMap((manifest) =>
		Object.entries(manifest.scripts).map(([scriptName, script]) => ({
			...manifest.defaults,
			...script,
			id: `${manifest.id}:${scriptName}`,
			manifest,
			scriptName,
			environments: script.environments ?? manifest.defaults.environments ?? [],
			mutation: script.mutation ?? manifest.defaults.mutation ?? "",
			executionIntent:
				script.executionIntent ?? manifest.defaults.executionIntent ?? "",
			requiredSecrets:
				script.requiredSecrets ?? manifest.defaults.requiredSecrets ?? [],
			requiredVariables:
				script.requiredVariables ?? manifest.defaults.requiredVariables ?? [],
			ciUsage: script.ciUsage ?? manifest.defaults.ciUsage ?? [],
		})),
	);
}

async function collectTextFiles(directory: string): Promise<string[]> {
	const output: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			output.push(...(await collectTextFiles(path)));
			continue;
		}
		if (/\.(?:json|jsonc|mjs|ts|yml)$/u.test(entry.name)) output.push(path);
	}
	return output;
}

test("the catalog is the exact contract for every active package script", async () => {
	assert.equal(catalog.formatVersion, 1);
	assert.equal(catalog.pattern, "PAT-CODE-REPOSITORY-TOOLING-001");
	assert.equal(catalog.idFormat, "<manifest-id>:<package-script-name>");
	assert.deepEqual(catalog.categories, expectedCategories);

	const actualPaths = await activeManifestPaths();
	const catalogPaths = catalog.manifests.map(({ path }) => path).sort();
	assert.deepEqual(
		catalogPaths,
		actualPaths,
		"adding or removing a workspace manifest requires updating tooling/catalog.json",
	);

	for (const manifest of catalog.manifests) {
		const packageManifest = JSON.parse(
			await readFile(resolve(root, manifest.path), "utf8"),
		) as UnknownRecord;
		const packageScripts = record(
			packageManifest.scripts ?? {},
			`${manifest.path} scripts`,
		);
		assert.deepEqual(
			Object.keys(manifest.scripts).sort(),
			Object.keys(packageScripts).sort(),
			`${manifest.path} script additions/removals must be cataloged`,
		);
		for (const [scriptName, script] of Object.entries(manifest.scripts)) {
			assert.equal(
				script.command,
				packageScripts[scriptName],
				`${manifest.path}#${scriptName} changed without a catalog update`,
			);
		}
	}
});

test("every script resolves complete ownership, safety, CI, and lifecycle metadata", async () => {
	const scripts = resolvedScripts();
	const ids = new Set<string>();
	for (const manifest of catalog.manifests) {
		assert.match(manifest.id, /^[a-z][a-z0-9-]*$/u);
		assert.match(manifest.owner, /^[a-z][a-z0-9-]*$/u);
		assert.ok(["workspace", "app", "package"].includes(manifest.scope.kind));
		assert.ok(manifest.scope.name.length > 0);
		assert.ok(["permanent", "temporary"].includes(manifest.lifecycle.status));
		if (manifest.lifecycle.status === "permanent") {
			assert.equal(manifest.lifecycle.replacement, null);
			assert.equal(manifest.lifecycle.removalCondition, null);
		} else {
			assert.ok(manifest.lifecycle.replacement);
			assert.ok(manifest.lifecycle.removalCondition);
		}
	}

	for (const script of scripts) {
		assert.ok(!ids.has(script.id), `duplicate script id ${script.id}`);
		ids.add(script.id);
		assert.ok(expectedCategories.includes(script.category as never));
		assert.ok(script.command.trim().length > 0);
		assert.ok(
			script.environments.length > 0,
			`${script.id} has no environment`,
		);
		for (const environment of script.environments) {
			assert.ok(
				allowedEnvironments.has(environment),
				`${script.id} has unsupported environment ${environment}`,
			);
		}
		assert.ok(
			allowedMutations.has(script.mutation),
			`${script.id} has unsupported mutation ${script.mutation}`,
		);
		assert.ok(
			allowedExecutionIntents.has(script.executionIntent),
			`${script.id} has unsupported execution intent ${script.executionIntent}`,
		);
		if (script.mutation === "none") {
			assert.equal(script.executionIntent, "not-applicable");
		} else {
			assert.notEqual(script.executionIntent, "not-applicable");
		}
		if (script.executionIntent === "dry-run") {
			assert.match(script.command, /--dry-run/u);
		}
		for (const workflow of script.ciUsage) {
			assert.match(workflow, /^\.github\/workflows\/[a-z0-9-]+\.yml$/u);
			assert.ok(
				await exists(resolve(root, workflow)),
				`${script.id} references missing workflow ${workflow}`,
			);
		}
	}
});

test("mutation flags and secret names fail closed", async () => {
	const scripts = resolvedScripts();
	const scriptsById = new Map(scripts.map((script) => [script.id, script]));
	const evidenceFiles = [
		resolve(root, "package.json"),
		...(await collectTextFiles(resolve(root, "scripts/release"))),
		...(await collectTextFiles(resolve(root, ".github/workflows"))),
	];
	const evidence = (
		await Promise.all(evidenceFiles.map((path) => readFile(path, "utf8")))
	).join("\n");

	for (const script of scripts) {
		const names = [...script.requiredSecrets, ...script.requiredVariables];
		assert.equal(
			new Set(script.requiredSecrets).size,
			script.requiredSecrets.length,
		);
		assert.equal(
			new Set(script.requiredVariables).size,
			script.requiredVariables.length,
		);
		for (const name of names) {
			assert.match(
				name,
				environmentName,
				`${script.id} stores a value, not a name`,
			);
			assert.ok(
				evidence.includes(name),
				`${script.id} declares unverified environment input ${name}`,
			);
		}
		for (const secret of script.requiredSecrets) {
			assert.ok(
				!script.requiredVariables.includes(secret),
				`${script.id} classifies ${secret} as both secret and variable`,
			);
		}

		if (script.mutation !== "remote") continue;
		assert.equal(script.category, "release");
		assert.ok(script.environments.includes("production"));
		assert.equal(script.executionIntent, "guarded");
		assert.ok(script.guardScript, `${script.id} has no guard script`);
		const guard = scriptsById.get(script.guardScript ?? "");
		assert.ok(guard, `${script.id} references an unknown guard script`);
		assert.equal(guard?.category, "release");
		assert.equal(guard?.mutation, "none");
	}
});

test("workflow package-script references carry CI usage metadata", async () => {
	const scripts = resolvedScripts();
	const byManifestAndName = new Map(
		scripts.map((script) => [
			`${script.manifest.path}#${script.scriptName}`,
			script,
		]),
	);
	const manifestPathByPackageName = new Map(
		catalog.manifests.map((manifest) => [manifest.scope.name, manifest.path]),
	);

	for (const workflowPath of await collectTextFiles(
		resolve(root, ".github/workflows"),
	)) {
		if (!workflowPath.endsWith(".yml")) continue;
		const workflow = await readFile(workflowPath, "utf8");
		const workflowRelativePath = relative(root, workflowPath).replaceAll(
			"\\",
			"/",
		);
		for (const match of workflow.matchAll(
			/\bpnpm\s+(?:run\s+)?([a-z][a-z0-9:_-]*)\b/giu,
		)) {
			const scriptName = match[1];
			if (!scriptName) continue;
			const script = byManifestAndName.get(`package.json#${scriptName}`);
			if (!script) continue;
			assert.ok(
				script.ciUsage.includes(workflowRelativePath),
				`${script.id} is used by ${workflowRelativePath} but is not marked for CI`,
			);
		}

		for (const match of workflow.matchAll(
			/\bpnpm\s+--filter\s+([^\s\\]+)\s+(?:run\s+)?([a-z][a-z0-9:_-]*)\b/giu,
		)) {
			const packageName = match[1];
			const scriptName = match[2];
			if (!packageName || !scriptName || scriptName === "exec") continue;
			const manifestPath = manifestPathByPackageName.get(packageName);
			assert.ok(manifestPath, `CI references unknown workspace ${packageName}`);
			const script = byManifestAndName.get(`${manifestPath}#${scriptName}`);
			assert.ok(
				script,
				`CI references uncataloged ${packageName} script ${scriptName}`,
			);
			assert.ok(
				script?.ciUsage.includes(workflowRelativePath),
				`${script?.id} is used by ${workflowRelativePath} but is not marked for CI`,
			);
		}
	}
});
