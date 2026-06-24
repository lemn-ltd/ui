import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const targets = process.argv.slice(2);
const scanRoots = targets.length > 0 ? targets : ['packages/ui/src', 'apps/showcase/src'];

const forbiddenPatterns = [
  /brainsforce/i,
  /brainstask/i,
  /brainscode/i,
  /runtime[- ]console/i,
  /code[- ]state/i,
  /local organization/i,
  /angel loor/i,
  /\blemn\b/i,
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
    const content = await readFile(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const match = forbiddenPatterns.find((pattern) => pattern.test(line));
      if (!match) return;

      failures.push(`${relative(root, file)}:${index + 1}: ${line.trim()}`);
    });
  }
}

if (failures.length > 0) {
  console.error('Brand-neutrality check failed. Remove product-specific names from shared UI:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
