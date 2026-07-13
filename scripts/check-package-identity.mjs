#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const canonicalPackageName = '@lemn-ltd/ui';
const canonicalRegistry = 'https://npm.pkg.github.com';
const legacyPackageName = ['@appranks', 'ui'].join('/');
const legacyPackagePattern = new RegExp(`${legacyPackageName}(?![-A-Za-z0-9])`, 'u');

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
  uiPackage.scripts?.prepublishOnly === 'node ../../scripts/check-package-identity.mjs',
  'UI package must run the package identity contract before publish',
);
assert(
  rootPackage.scripts?.['publish:ui'] ===
    'pnpm validate:package-identity && pnpm --filter @lemn-ltd/ui publish --access restricted --no-git-checks',
  'publish:ui must validate and publish the canonical package name',
);
assert(
  npmrc.split(/\r?\n/u).includes(`@lemn-ltd:registry=${canonicalRegistry}`),
  '.npmrc must map the @lemn-ltd scope to GitHub Packages',
);
assert(
  workflow.match(/scope: "@lemn-ltd"/gu)?.length === 2,
  'Both CI jobs must configure setup-node for the @lemn-ltd registry scope',
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

const staleReferences = [];
for (const file of await collectTextFiles(root)) {
  const content = await readFile(file, 'utf8');
  if (legacyPackagePattern.test(content)) staleReferences.push(relative(root, file));
}

assert(
  staleReferences.length === 0,
  `Legacy package identity remains in: ${staleReferences.join(', ')}`,
);

console.log(`Package identity check passed: ${canonicalPackageName}@${uiPackage.version}`);
