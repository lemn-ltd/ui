import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const root = process.cwd();
const legacyBrand = ['app', 'ranks'].join('');
const retiredDocsLabel = ['docs', 'ui'].join(' - ');
const legacyBrandExceptions = new Set([
  '.agentops/project.json',
  'docs/showcase-component-documentation-migration/SPEC.md',
]);

const expectedPackageNames = new Map([
  ['package.json', 'lemn-ui-workspace'],
  ['packages/ui/package.json', '@lemn-ltd/ui'],
  ['packages/showcase-kit/package.json', '@lemn-ltd/showcase-kit'],
  ['apps/docs/package.json', '@lemn-ltd/ui-docs'],
  ['apps/showcase/package.json', '@lemn-ltd/ui-showcase'],
]);

const files = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  { cwd: root, encoding: 'utf8' },
)
  .split('\0')
  .filter((file) => file && existsSync(file));

const failures = [];

for (const file of files) {
  const content = await readFile(file);
  if (content.includes(0)) continue;

  const text = content.toString('utf8');
  const normalizedText = text.toLowerCase();
  if (normalizedText.includes(legacyBrand) && !legacyBrandExceptions.has(file)) {
    failures.push(`${file}: contains the legacy organization name`);
  }
  if (normalizedText.includes(retiredDocsLabel)) {
    failures.push(`${file}: contains the retired docs label`);
  }
}

for (const [file, expectedName] of expectedPackageNames) {
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  if (manifest.name !== expectedName) {
    failures.push(`${file}: expected package name ${expectedName}, received ${manifest.name}`);
  }
}

const npmrc = await readFile('.npmrc', 'utf8');
if (!npmrc.includes('@lemn-ltd:registry=https://npm.pkg.github.com')) {
  failures.push('.npmrc: missing the @lemn-ltd GitHub Packages registry');
}

const docsConfig = await readFile('apps/docs/astro.config.mjs', 'utf8');
if (!docsConfig.includes("title: 'UI'")) failures.push('apps/docs/astro.config.mjs: title must be UI');
if (docsConfig.includes('logo:')) failures.push('apps/docs/astro.config.mjs: docs logo must stay disabled');
if (!docsConfig.includes("localStorage.setItem('starlight-theme', 'light')")) {
  failures.push('apps/docs/astro.config.mjs: first-visit theme must default to light');
}
if (!docsConfig.includes('../../packages/ui/src/foundations/tokens.css')) {
  failures.push('apps/docs/astro.config.mjs: docs must consume the canonical Lemn UI tokens');
}

if (failures.length > 0) {
  console.error('Repository identity check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
