import { gzipSync } from 'node:zlib';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesRoot = join(root, 'packages/ui/tests/bundle/fixtures');

const fixtures = [
  { id: 'button', entry: join(fixturesRoot, 'button.ts') },
  { id: 'line-chart', entry: join(fixturesRoot, 'line-chart.ts') },
  { id: 'catalog', entry: join(fixturesRoot, 'catalog.ts') },
];

function isExternal(id) {
  return id === 'react' || id === 'react-dom' || id === 'react/jsx-runtime';
}

function moduleNames(output) {
  return output.output.flatMap((item) =>
    item.type === 'chunk' ? Object.keys(item.modules).map((id) => relative(root, id)) : [],
  );
}

function codeBytes(output) {
  return output.output.reduce(
    (total, item) => total + (item.type === 'chunk' ? Buffer.byteLength(item.code) : 0),
    0,
  );
}

function gzipBytes(output) {
  const code = output.output
    .filter((item) => item.type === 'chunk')
    .map((item) => item.code)
    .join('\n');
  return gzipSync(code).byteLength;
}

function assertAbsent(modules, pattern, fixtureId) {
  const matches = modules.filter((id) => pattern.test(id));
  if (matches.length > 0) {
    throw new Error(`${fixtureId} unexpectedly includes ${matches.join(', ')}`);
  }
}

const reports = {};
for (const fixture of fixtures) {
  const output = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      cssCodeSplit: true,
      lib: { entry: fixture.entry, formats: ['es'] },
      minify: true,
      rollupOptions: { external: isExternal },
      write: false,
    },
  });
  const normalizedOutput = Array.isArray(output)
    ? { output: output.flatMap((result) => result.output) }
    : output;

  const modules = moduleNames(normalizedOutput);
  reports[fixture.id] = {
    bytes: codeBytes(normalizedOutput),
    gzipBytes: gzipBytes(normalizedOutput),
    moduleCount: modules.length,
  };

  assertAbsent(modules, /(?:^|\/)echarts(?:\/|$)/i, fixture.id);
  if (fixture.id !== 'line-chart') assertAbsent(modules, /(?:^|\/)recharts(?:\/|$)/i, fixture.id);
  if (fixture.id === 'button') assertAbsent(modules, /(?:^|\/)victory-vendor(?:\/|$)/i, fixture.id);
  if (fixture.id === 'catalog') {
    assertAbsent(modules, /(?:^|\/)react(?:-dom)?(?:\/|$)/i, fixture.id);
  }
  if (fixture.id === 'line-chart' && !modules.some((id) => /(?:^|\/)recharts(?:\/|$)/i.test(id))) {
    throw new Error('line-chart must include Recharts');
  }
}

console.log(JSON.stringify(reports, null, 2));
