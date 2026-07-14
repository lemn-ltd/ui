import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const targets = process.argv.slice(2);
const scanRoots = targets.length > 0 ? targets : ['packages/ui/src', 'apps/showcase/src'];

const publicBrandPattern = /\blemn\b/i;
const officialPackageScopePattern = /@lemn-ltd\//i;
const forbiddenPatterns = [
  /brainsforce/i,
  /brainstask/i,
  /brainscode/i,
  /runtime[- ]console/i,
  /code[- ]state/i,
  /local organization/i,
  /angel loor/i,
  publicBrandPattern,
];

const publicBrandSurfacePrefixes = [
  'apps/showcase/src/client/pages/',
  'apps/showcase/src/worker/',
];

const textExtensions = new Set([
  '.css',
  '.cts',
  '.html',
  '.json',
  '.md',
  '.mts',
  '.ts',
  '.tsx',
]);

const ignoredSegments = new Set(['dist', 'node_modules', '.git', 'coverage']);

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

    if (!entry.isFile()) continue;
    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    if (textExtensions.has(extension)) files.push(child);
  }

  return files;
}

const failures = [];

for (const scanRoot of scanRoots) {
  const files = await collectFiles(join(root, scanRoot));

  for (const file of files) {
    const relativeFile = relative(root, file);
    const content = await readFile(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const match = forbiddenPatterns.find((pattern) => pattern.test(line));
      if (!match) return;

      if (
        match === publicBrandPattern &&
        (officialPackageScopePattern.test(line) ||
          publicBrandSurfacePrefixes.some((prefix) => relativeFile.startsWith(prefix)))
      ) {
        return;
      }

      failures.push(`${relativeFile}:${index + 1}: ${line.trim()}`);
    });
  }
}

if (failures.length > 0) {
  console.error('Brand-neutrality check failed. Remove product-specific names from shared UI:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
