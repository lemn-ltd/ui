import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, '..');
const scanRoot = join(root, 'packages/ui/src');
const nodeBuiltins = new Set([
  'assert',
  'buffer',
  'child_process',
  'crypto',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'process',
  'stream',
  'timers',
  'url',
  'util',
  'worker_threads',
  'zlib',
]);

const allowedRuntimePackages = new Set([
  '@codemirror/lang-json',
  '@codemirror/language',
  '@codemirror/lint',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/highlight',
  '@shikijs/langs',
  '@shikijs/themes',
  '@uiw/react-codemirror',
  '@xyflow/react',
  'cmdk',
  'hast-util-to-jsx-runtime',
  'lucide-react',
  'radix-ui',
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react-markdown',
  'remark-gfm',
  'shiki',
  'sonner',
]);

const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\)/g;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(child)));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(child);
  }

  return files;
}

function isTestFile(file) {
  return /\/tests\//.test(file) || /\.spec\.(ts|tsx)$/.test(file);
}

function isRelativeOrCss(specifier) {
  return specifier.startsWith('.') || specifier.endsWith('.css');
}

function packageName(specifier) {
  if (!specifier.startsWith('@')) return specifier.split('/')[0] ?? specifier;
  const [scope, name] = specifier.split('/');
  return `${scope}/${name}`;
}

const failures = [];
const files = await collectFiles(scanRoot);

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const relativeFile = relative(root, file);
  const testFile = isTestFile(relativeFile);

  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    if (!specifier || isRelativeOrCss(specifier)) continue;

    const basePackage = packageName(specifier);
    const normalizedNodeSpecifier = specifier.startsWith('node:')
      ? specifier.slice('node:'.length)
      : specifier;

    if (!testFile && (specifier.startsWith('node:') || nodeBuiltins.has(normalizedNodeSpecifier))) {
      failures.push(`${relativeFile}: runtime source imports Node API "${specifier}"`);
      continue;
    }

    if (specifier.startsWith('@lemn-ltd/')) {
      failures.push(`${relativeFile}: @lemn-ltd/ui must not import workspace package "${specifier}"`);
      continue;
    }

    if (specifier.startsWith('@cloudflare/') || specifier === 'agents') {
      failures.push(`${relativeFile}: shared UI must not import runtime package "${specifier}"`);
      continue;
    }

    if (!testFile && !allowedRuntimePackages.has(basePackage)) {
      failures.push(`${relativeFile}: unexpected runtime dependency "${specifier}"`);
    }
  }
}

if (failures.length > 0) {
  console.error('UI boundary check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
