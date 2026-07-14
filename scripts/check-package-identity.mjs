#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const canonicalPackageName = '@lemn-ltd/ui';
const canonicalRegistry = 'https://npm.pkg.github.com';
const canonicalRepositoryUrl = 'https://github.com/lemn-ltd/ui';
const canonicalDocsHost = 'ui.lemn.ai';
const canonicalShowcaseHost = 'showcase.ui.lemn.ai';
const canonicalCatalogTitle = 'LEMN UI Component Catalog';
const legacyPackageName = ['@appranks', 'ui'].join('/');
const legacyPackagePattern = new RegExp(`${legacyPackageName}(?![-A-Za-z0-9])`, 'u');
const legacyRepositoryPattern = /https:\/\/github\.com\/appranks\/ui(?![-A-Za-z0-9])/iu;
const legacyProductDomainPattern = new RegExp(
  `[A-Za-z0-9.-]*${['appranks', 'com'].join('\\.')}`,
  'iu',
);
const canonicalRepositoryFiles = [
  'apps/docs/astro.config.mjs',
  'apps/docs/src/content/docs/index.mdx',
  'apps/docs/src/content/docs/es/index.mdx',
];
const legacyPackagePolicyFiles = new Set(['docs/showcase-component-documentation-migration/SPEC.md']);

const ignoredDirectories = new Set([
  '.git',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.cts',
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.jsonc',
  '.md',
  '.mdx',
  '.mjs',
  '.mts',
  '.pen',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);
const textFileNames = new Set(['.npmrc', 'Makefile']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'));
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

const rootPackage = await readJson('package.json');
const uiPackage = await readJson('packages/ui/package.json');
const showcasePackage = await readJson('apps/showcase/package.json');
const showcaseKitPackage = await readJson('packages/showcase-kit/package.json');
const changesetConfig = await readJson('.changeset/config.json');
const npmrc = await readFile(join(root, '.npmrc'), 'utf8');
const workflow = await readFile(join(root, '.github/workflows/ci-cd.yml'), 'utf8');
const makefile = await readFile(join(root, 'Makefile'), 'utf8');
const docsAstroConfig = await readFile(join(root, 'apps/docs/astro.config.mjs'), 'utf8');
const docsWrangler = await readFile(join(root, 'apps/docs/wrangler.jsonc'), 'utf8');
const showcaseWrangler = await readFile(join(root, 'apps/showcase/wrangler.jsonc'), 'utf8');
const showcaseWorker = await readFile(join(root, 'apps/showcase/src/worker/index.ts'), 'utf8');
const deploymentSmoke = await readFile(
  join(root, 'scripts/release/deployment-smoke.ts'),
  'utf8',
);
const packageIdentitySpec = await readFile(
  join(root, 'docs/showcase-component-documentation-migration/SPEC.md'),
  'utf8',
);

assert(
  uiPackage.name === canonicalPackageName,
  `packages/ui/package.json must declare name ${canonicalPackageName}; received ${uiPackage.name}`,
);
assert(
  uiPackage.publishConfig?.registry === canonicalRegistry,
  `packages/ui/package.json must publish to ${canonicalRegistry}`,
);
assert(uiPackage.publishConfig?.access === 'restricted', 'UI package publish access must be restricted');
assert(
  uiPackage.scripts?.prepublishOnly === 'pnpm --dir ../.. publish:ui:verify',
  'UI package must run the guarded dist and consumer smoke before publish',
);
assert(
  rootPackage.scripts?.['pack:ui'] ===
    'pnpm validate:package-identity && node scripts/smoke-package-tarball.mjs',
  'pack:ui must validate identity and smoke-test the canonical pnpm tarball',
);
assert(
  rootPackage.scripts?.['publish:ui'] ===
    'pnpm guard:release:mutation && pnpm --filter @lemn-ltd/ui run build && pnpm --filter @lemn-ltd/ui publish --access restricted --no-git-checks',
  'publish:ui must guard main, build, and invoke the lifecycle-protected publisher',
);
assert(
  rootPackage.scripts?.['publish:ui:verify'] ===
    'pnpm guard:release:mutation && node scripts/release/verify-ui-dist.mjs && pnpm pack:ui',
  'publish:ui:verify must guard main and smoke an existing built package',
);
assert(
  rootPackage.scripts?.release ===
    'pnpm release:preflight && pnpm check && pnpm test && pnpm publish:ui',
  'release must use the guarded canonical publisher after validation',
);
assert(
  !rootPackage.scripts?.['publish:ui:internal'],
  'An unguarded internal publisher must not exist',
);
assert(
  makefile.includes('pack-ui:\n\t$(PNPM) pack:ui'),
  'Makefile pack-ui must use the canonical pnpm package smoke',
);
assert(
  npmrc.split(/\r?\n/u).includes(`@lemn-ltd:registry=${canonicalRegistry}`),
  '.npmrc must map the @lemn-ltd scope to GitHub Packages',
);
assert(
  workflow.match(/scope: "@lemn-ltd"/gu)?.length === 3,
  'All CI jobs must configure setup-node for the @lemn-ltd registry scope',
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
  showcaseWrangler.includes(`"pattern": "${canonicalShowcaseHost}"`),
  `Showcase Wrangler route must use ${canonicalShowcaseHost}`,
);
assert(
  showcaseWorker.includes(`# ${canonicalCatalogTitle}`),
  `Showcase agent catalog must use the title ${canonicalCatalogTitle}`,
);
assert(
  deploymentSmoke.includes(`https://${canonicalDocsHost}`) &&
    deploymentSmoke.includes(`https://${canonicalShowcaseHost}`) &&
    deploymentSmoke.includes(canonicalCatalogTitle),
  'Release smoke checks must use the canonical LEMN hosts and catalog title',
);
assert(
  packageIdentitySpec.includes(`Se prohíben la identidad legacy \`${legacyPackageName}\``) &&
    packageIdentitySpec.includes(`el paquete recomendado es \`${canonicalPackageName}\``),
  'Package identity policy must prohibit only the legacy identity and recommend the canonical package',
);
assert(
  showcasePackage.dependencies?.[canonicalPackageName] === 'workspace:*',
  `apps/showcase must resolve ${canonicalPackageName} through workspace:*`,
);
assert(
  showcaseKitPackage.dependencies?.[canonicalPackageName] === 'workspace:*',
  `packages/showcase-kit must resolve ${canonicalPackageName} through workspace:*`,
);
assert(
  !changesetConfig.ignore?.includes(canonicalPackageName),
  `${canonicalPackageName} must remain versioned by Changesets`,
);

for (const relativePath of canonicalRepositoryFiles) {
  const content = await readFile(join(root, relativePath), 'utf8');
  assert(
    content.includes(canonicalRepositoryUrl),
    `${relativePath} must link to ${canonicalRepositoryUrl}`,
  );
}

const staleReferences = [];
for (const file of await collectTextFiles(root)) {
  const content = await readFile(file, 'utf8');
  const relativePath = relative(root, file);
  if (
    (legacyPackagePattern.test(content) && !legacyPackagePolicyFiles.has(relativePath)) ||
    legacyRepositoryPattern.test(content) ||
    legacyProductDomainPattern.test(content)
  ) {
    staleReferences.push(relativePath);
  }
}

assert(
  staleReferences.length === 0,
  `Legacy package, repository, or product domain remains in: ${staleReferences.join(', ')}`,
);

console.log(`Package identity check passed: ${canonicalPackageName}@${uiPackage.version}`);
