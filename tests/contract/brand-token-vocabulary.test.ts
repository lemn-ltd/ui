import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');

async function sourceFiles(directory: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await sourceFiles(path)));
    else if (['.css', '.ts', '.tsx'].includes(extname(entry.name))) paths.push(path);
  }
  return paths;
}

function matches(source: string, expression: RegExp): Set<string> {
  return new Set([...source.matchAll(expression)].map((match) => String(match[1])));
}

test('compiler, fallback, typed vocabulary, and UI usage share one exact semantic token contract', async () => {
  const compiler = await readFile(resolve(root, 'packages/brand-contract/src/compiler.ts'), 'utf8');
  const fallback = await readFile(resolve(root, 'packages/ui/src/foundations/tokens.css'), 'utf8');
  const typed = await readFile(resolve(root, 'packages/ui/src/tokens.ts'), 'utf8');
  const uiSources = await Promise.all(
    (await sourceFiles(resolve(root, 'packages/ui/src'))).map((path) => readFile(path, 'utf8')),
  );

  const compilerTokens = matches(compiler, /["`]((?:--lemn-)[a-z0-9-]+)["`]/g);
  for (let index = 1; index <= 8; index += 1) compilerTokens.add(`--lemn-chart-series-${index}`);
  const fallbackTokens = matches(fallback, /((?:--lemn-)[a-z0-9-]+)\s*:/g);
  const typedTokens = matches(typed, /['"]((?:--lemn-)[a-z0-9-]+)['"]/g);
  const usedTokens = matches(uiSources.join('\n'), /var\(\s*((?:--lemn-)[a-z0-9-]+)/g);

  assert.deepEqual([...fallbackTokens].sort(), [...compilerTokens].sort());
  assert.deepEqual([...typedTokens].sort(), [...compilerTokens].sort());
  assert.deepEqual(
    [...usedTokens].filter((name) => !fallbackTokens.has(name)),
    [],
    'UI source references an undeclared semantic token',
  );
});
