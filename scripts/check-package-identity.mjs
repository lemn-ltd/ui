#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const canonicalPackageName = "@lemn-ltd/ui";
const canonicalRegistry = "https://npm.pkg.github.com";
const canonicalRepositoryUrl = "https://github.com/lemn-ltd/ui";
const canonicalDocsHost = "ui.le-mn.com";
const canonicalPortalHost = "portal.ui.le-mn.com";
const canonicalCatalogTitle = "Lemn UI";
const exactPublishedVersion =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u;
const legacyOrganization = ["app", "ranks"].join("");
const legacyPackageName = `@${legacyOrganization}/ui`;
const legacyPackagePattern = new RegExp(
	`${legacyPackageName}(?![-A-Za-z0-9])`,
	"u",
);
const legacyRepositoryPattern = new RegExp(
	`https://github\\.com/${legacyOrganization}/ui(?![-A-Za-z0-9])`,
	"iu",
);
const legacyProductDomainPattern = new RegExp(
	`[A-Za-z0-9.-]*${[legacyOrganization, "com"].join("\\.")}`,
	"iu",
);
const canonicalRepositoryFiles = [
	"apps/docs/astro.config.mjs",
	"apps/docs/src/content/docs/index.mdx",
	"apps/docs/src/content/docs/es/index.mdx",
];

const ignoredDirectories = new Set([
	".git",
	".turbo",
	"coverage",
	"dist",
	"node_modules",
	"playwright-report",
	"test-results",
]);
const textExtensions = new Set([
	".cjs",
	".css",
	".cts",
	".html",
	".js",
	".jsx",
	".json",
	".jsonc",
	".md",
	".mdx",
	".mjs",
	".mts",
	".pen",
	".toml",
	".ts",
	".tsx",
	".txt",
	".yaml",
	".yml",
]);
const textFileNames = new Set([".npmrc", "Makefile"]);

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

async function readJson(relativePath) {
	return JSON.parse(await readFile(join(root, relativePath), "utf8"));
}

async function collectTextFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

		const child = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectTextFiles(child)));
			continue;
		}

		if (
			entry.isFile() &&
			(textExtensions.has(extname(entry.name)) || textFileNames.has(entry.name))
		) {
			files.push(child);
		}
	}

	return files;
}

const rootPackage = await readJson("package.json");
const uiPackage = await readJson("packages/ui/package.json");
const brandContractPackage = await readJson(
	"packages/brand-contract/package.json",
);
const brandRuntimePackage = await readJson(
	"packages/brand-runtime/package.json",
);
const brandStudioPackage = await readJson("packages/brand-studio/package.json");
const portalPackage = await readJson("apps/ui-portal/package.json");
const changesetConfig = await readJson(".changeset/config.json");
const npmrc = await readFile(join(root, ".npmrc"), "utf8");
const workflow = await readFile(
	join(root, ".github/workflows/ci-cd.yml"),
	"utf8",
);
const makefile = await readFile(join(root, "Makefile"), "utf8");
const docsAstroConfig = await readFile(
	join(root, "apps/docs/astro.config.mjs"),
	"utf8",
);
const docsWrangler = await readFile(
	join(root, "apps/docs/wrangler.jsonc"),
	"utf8",
);
const portalWrangler = await readFile(
	join(root, "apps/ui-portal/wrangler.jsonc"),
	"utf8",
);
const portalMachineRoutes = await readFile(
	join(root, "apps/ui-portal/src/worker/public/machine-routes.ts"),
	"utf8",
);
const deploymentSmoke = await readFile(
	join(root, "scripts/release/deployment-smoke.ts"),
	"utf8",
);

assert(
	uiPackage.name === canonicalPackageName,
	`packages/ui/package.json must declare name ${canonicalPackageName}; received ${uiPackage.name}`,
);
const releasePackages = [
	[brandContractPackage, "@lemn-ltd/brand-contract"],
	[uiPackage, canonicalPackageName],
	[brandRuntimePackage, "@lemn-ltd/brand-runtime"],
	[brandStudioPackage, "@lemn-ltd/brand-studio"],
];
for (const [manifest, name] of releasePackages) {
	assert(manifest.name === name, `Release package must be ${name}`);
	assert(
		exactPublishedVersion.test(manifest.version ?? ""),
		`${name} must declare an exact publishable version; received ${manifest.version ?? "missing"}`,
	);
	assert(
		manifest.publishConfig?.registry === canonicalRegistry,
		`${name} must publish to ${canonicalRegistry}`,
	);
	assert(
		manifest.publishConfig?.access === "restricted",
		`${name} publish access must be restricted`,
	);
	assert(
		manifest.scripts?.prepublishOnly ===
			"pnpm --dir ../.. publish:packages:verify",
		`${name} must run the governed package-set dist and consumer smoke before publish`,
	);
}
assert(
	brandRuntimePackage.dependencies?.["@lemn-ltd/brand-contract"] ===
		`workspace:${brandContractPackage.version}`,
	"Brand Runtime must use the exact current brand-contract release contract",
);
assert(
	brandStudioPackage.dependencies?.["@lemn-ltd/brand-contract"] ===
		`workspace:${brandContractPackage.version}` &&
		brandStudioPackage.peerDependencies?.[canonicalPackageName] ===
			uiPackage.version &&
		brandStudioPackage.devDependencies?.[canonicalPackageName] ===
			`workspace:${uiPackage.version}`,
	"Brand Studio must use the exact current brand-contract and UI release contracts",
);
assert(
	rootPackage.scripts?.["pack:packages"] ===
		"pnpm validate:package-identity && node scripts/smoke-package-set-tarballs.mjs",
	"pack:packages must validate and smoke-test every canonical pnpm tarball",
);
assert(
	rootPackage.scripts?.["build:packages:release"] ===
		"pnpm --filter @lemn-ltd/brand-contract run build && pnpm --filter @lemn-ltd/ui run build && pnpm --filter @lemn-ltd/brand-runtime run build && pnpm --filter @lemn-ltd/brand-studio run build",
	"Release package builds must preserve contract -> UI -> Runtime -> Studio order",
);
assert(
	rootPackage.scripts?.["publish:packages:verify"] ===
		"pnpm guard:release:ref && node scripts/release/verify-package-dists.ts && pnpm pack:packages",
	"publish:packages:verify must guard main and smoke the complete built package set",
);
assert(
	rootPackage.scripts?.release ===
		"pnpm release:preflight && pnpm check && pnpm test && pnpm build:packages:release && pnpm publish:packages:release",
	"release must build and use the guarded canonical package-set publisher after validation",
);
assert(
	!Object.keys(rootPackage.scripts ?? {}).some(
		(name) => name.startsWith("publish:ui") || name === "pack:ui",
	),
	"Legacy UI-only package release entrypoints must not exist",
);
assert(
	makefile.includes("pack-packages:\n\t$(PNPM) pack:packages") &&
		!makefile.includes("pack-ui:"),
	"Makefile must use only the canonical package-set smoke",
);
assert(
	npmrc.split(/\r?\n/u).includes(`@lemn-ltd:registry=${canonicalRegistry}`),
	".npmrc must map the @lemn-ltd scope to GitHub Packages",
);
assert(
	workflow.match(/scope: "@lemn-ltd"/gu)?.length === 5,
	"All CI jobs must configure setup-node for the @lemn-ltd registry scope",
);
assert(
	docsAstroConfig.includes(`site: 'https://${canonicalDocsHost}'`),
	`Astro docs site must use https://${canonicalDocsHost}`,
);
assert(
	docsWrangler.includes(`"pattern": "${canonicalDocsHost}"`),
	`Docs Wrangler route must use ${canonicalDocsHost}`,
);
assert(
	portalWrangler.includes(`"pattern": "${canonicalPortalHost}"`),
	`Portal Wrangler route must use ${canonicalPortalHost}`,
);
assert(
	portalMachineRoutes.includes(`# ${canonicalCatalogTitle}`),
	`Portal machine-readable catalog must use the title ${canonicalCatalogTitle}`,
);
assert(
	deploymentSmoke.includes(`https://${canonicalDocsHost}`) &&
		deploymentSmoke.includes(`https://${canonicalPortalHost}`) &&
		deploymentSmoke.includes(canonicalCatalogTitle),
	"Release smoke checks must use the canonical LEMN hosts and catalog title",
);
assert(
	portalPackage.dependencies?.[canonicalPackageName] ===
		`workspace:${uiPackage.version}`,
	`apps/ui-portal must pin ${canonicalPackageName} to workspace:${uiPackage.version}`,
);
assert(
	portalPackage.name === "@lemn-ltd/ui-portal" &&
		portalPackage.private === true,
	"apps/ui-portal must be the private canonical Portal package",
);
for (const [, packageName] of releasePackages) {
	assert(
		!changesetConfig.ignore?.includes(packageName),
		`${packageName} must remain versioned by Changesets`,
	);
}
assert(
	portalPackage.dependencies?.["@lemn-ltd/brand-studio"] ===
		`workspace:${brandStudioPackage.version}`,
	`apps/ui-portal must pin @lemn-ltd/brand-studio to workspace:${brandStudioPackage.version}`,
);

for (const relativePath of canonicalRepositoryFiles) {
	const content = await readFile(join(root, relativePath), "utf8");
	assert(
		content.includes(canonicalRepositoryUrl),
		`${relativePath} must link to ${canonicalRepositoryUrl}`,
	);
}

const staleReferences = [];
for (const file of await collectTextFiles(root)) {
	const content = await readFile(file, "utf8");
	const relativePath = relative(root, file);
	if (
		legacyPackagePattern.test(content) ||
		legacyRepositoryPattern.test(content) ||
		legacyProductDomainPattern.test(content)
	) {
		staleReferences.push(relativePath);
	}
}

assert(
	staleReferences.length === 0,
	`Legacy package, repository, or product domain remains in: ${staleReferences.join(", ")}`,
);

console.log(
	`Package identity check passed: ${canonicalPackageName}@${uiPackage.version}`,
);
