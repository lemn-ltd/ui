import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const scanRoots = [
	".github",
	"apps",
	"docs",
	"packages",
	"patterns",
	"scripts",
	"tests",
];
const rootFiles = ["README.md"];
const textExtensions = new Set([
	".css",
	".cts",
	".html",
	".json",
	".jsonc",
	".md",
	".mdx",
	".mjs",
	".mts",
	".ts",
	".tsx",
]);
const ignoredSegments = new Set([
	".git",
	".pnpm-store",
	"coverage",
	"dist",
	"node_modules",
]);

const retiredIdentifiers = [
	/\bBrandProject\b/,
	/\bBrandProfile\b/,
	/\bBrandRevision\b/,
	/\bBrandAssignment\b/,
	/\bcompileBrandProject\b/,
	/\bsafeParseBrandProject\b/,
	/\bgetCompiledScope(?:FontPreloads)?\b/,
	/\bserializeBrandBootstrap\b/,
	/\bverifyBrandArtifact\b/,
	/\bdefaultProfileId\b/,
	/\bassignmentSequence\b/,
	/\bsourceHash\b/,
	/brand-project\/v2\.json/,
	/project\/environment\/slot/i,
];

const brandingSpecificSegments = [
	"/brand-contract/",
	"/brand-runtime/",
	"/brand-studio/",
	"/branding/brand-runtime.",
	"/pages/ecosystem/brand-studio.",
	"/modules/brand-studio-panel.",
	"/content/docs/branding/",
	"/content/docs/architecture/",
	"/content/docs/ssr-branding/",
	"/content/docs/es/branding/",
	"/content/docs/es/architecture/",
	"/content/docs/es/ssr-branding/",
];
const retiredBrandingVocabulary = [
	/\bProfiles?\b/,
	/\bAssignments?\b/,
	/\binheritable branding\b/i,
	/\bnested branding identity families\b/i,
];

async function collectFiles(path) {
	const entries = await readdir(path, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		if (ignoredSegments.has(entry.name)) continue;
		const child = join(path, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectFiles(child)));
			continue;
		}
		if (!entry.isFile() || entry.name === "CHANGELOG.md") continue;
		if (textExtensions.has(extname(entry.name))) files.push(child);
	}
	return files;
}

const failures = [];
for (const rootFile of rootFiles) {
	const lines = (await readFile(join(root, rootFile), "utf8")).split(/\r?\n/);
	lines.forEach((line, index) => {
		const match = retiredIdentifiers.find((pattern) => pattern.test(line));
		if (match) failures.push(`${rootFile}:${index + 1}: ${line.trim()}`);
	});
}
for (const scanRoot of scanRoots) {
	const files = await collectFiles(join(root, scanRoot));
	for (const file of files) {
		const relativeFile = relative(root, file);
		if (relativeFile === "scripts/check-branding-vnext.mjs") continue;
		if (relativeFile.endsWith(".pen")) continue;
		const normalized = `/${relativeFile.replaceAll("\\", "/")}`;
		const patterns = brandingSpecificSegments.some((segment) =>
			normalized.includes(segment),
		)
			? [...retiredIdentifiers, ...retiredBrandingVocabulary]
			: retiredIdentifiers;
		const lines = (await readFile(file, "utf8")).split(/\r?\n/);
		lines.forEach((line, index) => {
			const match = patterns.find((pattern) => pattern.test(line));
			if (match) failures.push(`${relativeFile}:${index + 1}: ${line.trim()}`);
		});
	}
}

if (failures.length > 0) {
	console.error(
		"Branding vNext policy failed. Remove retired branding contracts and vocabulary:",
	);
	for (const failure of failures) console.error(`- ${failure}`);
	process.exitCode = 1;
}
