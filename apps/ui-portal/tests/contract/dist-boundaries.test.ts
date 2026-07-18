import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { basename, relative, resolve, sep } from "node:path";
import test from "node:test";

const portalRoot = resolve(import.meta.dirname, "../..");
const clientRoot = resolve(portalRoot, "dist/client");
const uiSourceRoot = resolve(portalRoot, "../../packages/ui/src");
const agentStylesRoot = resolve(uiSourceRoot, "agents");
const agentBlockStylePaths = [
	resolve(uiSourceRoot, "blocks/approval-queue-block.css"),
];

const FORBIDDEN_BROWSER_SOURCES = [
	/(?:^|\/)src\/client\/pages\/agents\//iu,
	/(?:^|\/)packages\/ui\/src\/agents\//iu,
	/(?:^|\/)src\/client\/registry\/entries\/agents\.[^/]+$/iu,
	/(?:^|\/)src\/client\/registry\/entries\/agent-patterns\.[^/]+$/iu,
	/(?:^|\/)catalog-agent-[^/]+$/iu,
	/(?:^|\/)catalog-automation-entries\.[^/]+$/iu,
	/(?:^|\/)approval-queue-block\.[^/]+$/iu,
	/(?:^|\/)disabled-agent-entry\.[^/]+$/iu,
];

const FORBIDDEN_DISABLED_AREA_METADATA = [
	/area\s*:\s*["'`]agents["'`]/iu,
	/catalog-agent-/iu,
	/disabled-agent-entry/iu,
	/source-retained agent surfaces/iu,
];

function normalize(path: string): string {
	return path.split(sep).join("/");
}

async function listFiles(root: string): Promise<string[]> {
	const output: string[] = [];
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const absolutePath = resolve(root, entry.name);
		if (entry.isDirectory()) {
			output.push(...(await listFiles(absolutePath)));
		} else if (entry.isFile()) {
			output.push(normalize(relative(clientRoot, absolutePath)));
		}
	}
	return output.sort();
}

async function listAbsoluteFiles(root: string): Promise<string[]> {
	const output: string[] = [];
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const absolutePath = resolve(root, entry.name);
		if (entry.isDirectory()) {
			output.push(...(await listAbsoluteFiles(absolutePath)));
		} else if (entry.isFile()) {
			output.push(absolutePath);
		}
	}
	return output.sort();
}

async function forbiddenAgentStylePrefixes(): Promise<string[]> {
	const sourceStylePaths = (await listAbsoluteFiles(agentStylesRoot)).filter(
		(path) => path.endsWith(".css"),
	);
	return [
		...new Set(
			[...sourceStylePaths, ...agentBlockStylePaths].map(
				(path) => `.ui-${basename(path, ".css")}`,
			),
		),
	].sort();
}

async function sourceNames(mapPath: string): Promise<string[]> {
	const parsed = JSON.parse(
		await readFile(resolve(clientRoot, mapPath), "utf8"),
	) as { readonly sources?: unknown };
	assert(Array.isArray(parsed.sources), `${mapPath} must contain sources`);
	return parsed.sources.filter(
		(source): source is string => typeof source === "string",
	);
}

async function sourceContents(mapPath: string): Promise<string[]> {
	const parsed = JSON.parse(
		await readFile(resolve(clientRoot, mapPath), "utf8"),
	) as { readonly sourcesContent?: unknown };
	assert(
		Array.isArray(parsed.sourcesContent),
		`${mapPath} must contain sourcesContent`,
	);
	return parsed.sourcesContent.filter(
		(source): source is string => typeof source === "string",
	);
}

function isBrowserJavaScript(file: string): boolean {
	return file.endsWith(".js") || file.endsWith(".js.map");
}

function isBrowserStyle(file: string): boolean {
	return file.endsWith(".css") || file.endsWith(".css.map");
}

test("isolates Admin JavaScript and CSS under admin-assets", async () => {
	const files = await listFiles(clientRoot);
	const adminArtifacts = files.filter((file) =>
		file.startsWith("admin-assets/"),
	);
	assert(
		adminArtifacts.some((file) => file.endsWith(".js")),
		"Admin JavaScript is missing from admin-assets",
	);
	assert(
		adminArtifacts.some((file) => file.endsWith(".css")),
		"Admin CSS is missing from admin-assets",
	);

	const misplacedAdminSources: string[] = [];
	for (const mapPath of files.filter((file) => file.endsWith(".js.map"))) {
		for (const source of await sourceNames(mapPath)) {
			if (
				/(?:^|\/)src\/client\/modules\/admin\//u.test(source) &&
				!mapPath.startsWith("admin-assets/")
			) {
				misplacedAdminSources.push(`${mapPath}: ${source}`);
			}
		}
	}
	assert.deepEqual(
		misplacedAdminSources,
		[],
		`Admin modules escaped admin-assets:\n${misplacedAdminSources.join("\n")}`,
	);

	const html = await readFile(resolve(clientRoot, "index.html"), "utf8");
	assert.doesNotMatch(
		html,
		/(?:src|href)=["'][^"']*admin-assets\//iu,
		"The public HTML must not preload or load Admin assets",
	);
});

test("keeps Agent modules, styles, and catalog metadata out of every browser chunk", async () => {
	const files = await listFiles(clientRoot);
	const browserJavaScript = files.filter(isBrowserJavaScript);
	const browserStyles = files.filter(isBrowserStyle);
	const browserMaps = [...browserJavaScript, ...browserStyles].filter((file) =>
		file.endsWith(".map"),
	);
	assert(
		browserJavaScript.some((file) => file.startsWith("assets/")),
		"Public JavaScript is missing from assets",
	);
	assert(
		browserJavaScript.some((file) => file.startsWith("admin-assets/")),
		"Admin JavaScript is missing from the browser-wide Agent boundary scan",
	);
	assert(
		browserStyles.some((file) => file.startsWith("assets/")),
		"Public CSS is missing from the browser-wide Agent boundary scan",
	);

	const forbiddenSources: string[] = [];
	for (const mapPath of browserMaps) {
		for (const source of await sourceNames(mapPath)) {
			if (FORBIDDEN_BROWSER_SOURCES.some((pattern) => pattern.test(source))) {
				forbiddenSources.push(`${mapPath}: ${source}`);
			}
		}
	}
	assert.deepEqual(
		forbiddenSources,
		[],
		`Agent modules escaped into browser chunks:\n${forbiddenSources.join("\n")}`,
	);

	const forbiddenStylePrefixes = await forbiddenAgentStylePrefixes();
	assert(
		forbiddenStylePrefixes.length > 0,
		"Agent CSS source inventory is unexpectedly empty",
	);
	const styleLeaks: string[] = [];
	for (const stylePath of browserStyles.filter((file) => file.endsWith(".css"))) {
		const css = await readFile(resolve(clientRoot, stylePath), "utf8");
		for (const prefix of forbiddenStylePrefixes) {
			if (css.includes(prefix)) styleLeaks.push(`${stylePath}: ${prefix}`);
		}
	}
	assert.deepEqual(
		styleLeaks,
		[],
		`Agent selectors escaped into browser CSS:\n${styleLeaks.join("\n")}`,
	);

	const metadataLeaks: string[] = [];
	for (const chunkPath of browserJavaScript) {
		const codeSegments = chunkPath.endsWith(".js.map")
			? await sourceContents(chunkPath)
			: [await readFile(resolve(clientRoot, chunkPath), "utf8")];
		if (
			codeSegments.some((code) =>
				FORBIDDEN_DISABLED_AREA_METADATA.some((pattern) => pattern.test(code)),
			)
		) {
			metadataLeaks.push(chunkPath);
		}
	}
	assert.deepEqual(
		metadataLeaks,
		[],
		`Agent catalog metadata escaped into browser chunks: ${metadataLeaks.join(", ")}`,
	);
});
