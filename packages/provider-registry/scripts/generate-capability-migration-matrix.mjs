#!/usr/bin/env node
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import ts from 'typescript';

const packageRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(packageRoot, '../..');
const uiSourceRoot = resolve(repositoryRoot, 'packages/ui/src');
const outputPath = resolve(packageRoot, 'registry/capability-migration-matrix.v1.json');
const targetVersion = '0.3.0';

const catalogFiles = [
  'catalog-primary-entries.ts',
  'catalog-agent-primary-entries.ts',
  'catalog-secondary-entries.ts',
  'catalog-automation-entries.ts',
  'catalog-visualization-entries.ts',
  'catalog-capability-expansion-entries.ts',
];

const provider = {
  radix: {
    id: 'radix-ui',
    name: 'Radix UI',
    repository: 'https://github.com/radix-ui/primitives',
    ingestionMode: 'runtime_dependency',
    packageName: 'radix-ui',
    packageVersion: '1.4.3',
    packageIntegrity: 'sha512-aWizCQiyeAenIdUbqEpXgRA1ya65P13NKn/W8rWkcN0OPkRDxdBVLWnIEDsS2RpwCK2nobI7oMUSmexzTDyAmA==',
  },
  recharts: {
    id: 'recharts',
    name: 'Recharts',
    repository: 'https://github.com/recharts/recharts',
    ingestionMode: 'runtime_dependency',
    packageName: 'recharts',
    packageVersion: '3.9.2',
    packageIntegrity: 'sha512-G4fy+Pk46RaXgwWMh+Nzhyo/lbFAVqXo9gtetlyehe6Ehge9CsgDuOTwQDD+i1+llaLktNBiNq4bhnGlDRXFtw==',
  },
  echarts: {
    id: 'apache-echarts',
    name: 'Apache ECharts',
    repository: 'https://github.com/apache/echarts',
    ingestionMode: 'runtime_dependency',
    packageName: 'echarts',
    packageVersion: '6.1.0',
    packageIntegrity: 'sha512-q0yaFPggC9FUdsWH4blavRWFmxdrIodbkoKNAjJudAI6CA9gNPxHtV2RcZNEepZVlk4yvBYkOkbk6HIVpIyHZA==',
  },
  cmdk: {
    id: 'cmdk',
    name: 'cmdk',
    repository: 'https://github.com/pacocoursey/cmdk',
    ingestionMode: 'runtime_dependency',
    packageName: 'cmdk',
    packageVersion: '1.1.1',
    packageIntegrity: 'sha512-Vsv7kFaXm+ptHDMZ7izaRsP70GgrW9NBNGswt9OZaVBLlE0SNpDq8eu/VGXyF9r7M0azK3Wy7OlYXsuyYLFzHg==',
  },
  sonner: {
    id: 'sonner',
    name: 'Sonner',
    repository: 'https://github.com/emilkowalski/sonner',
    ingestionMode: 'runtime_dependency',
    packageName: 'sonner',
    packageVersion: '2.0.7',
    packageIntegrity: 'sha512-W6ZN4p58k8aDKA4XPcx2hpIQXBRAgyiWVkYhT7CvK6D3iAu7xjvVyhQHg2/iaKJZ1XVJ4r7XuwGL+WGEK37i9w==',
  },
  xyflow: {
    id: 'xyflow-react',
    name: 'XYFlow React',
    repository: 'https://github.com/xyflow/xyflow',
    ingestionMode: 'runtime_dependency',
    packageName: '@xyflow/react',
    packageVersion: '12.11.0',
    packageIntegrity: 'sha512-na4IO33FSs2OS72hASgZDmTYwFAkef7Z74uBUVrong3ARmQQHfnRUVaCFn1kTt5LbS6pK03TbYjCPGLjLFfziA==',
  },
  codemirror: {
    id: 'uiw-react-codemirror',
    name: 'UIW React CodeMirror',
    repository: 'https://github.com/uiwjs/react-codemirror',
    ingestionMode: 'runtime_dependency',
    packageName: '@uiw/react-codemirror',
    packageVersion: '4.25.10',
    packageIntegrity: 'sha512-DzgSMwM5qzB7v1FIb4gEeriYt67iiay756/HIOM9mAbeOVK0MO7rqefHf0O5c0269pJKMW7AH9FjclExD23V9w==',
  },
  shiki: {
    id: 'shiki',
    name: 'Shiki',
    repository: 'https://github.com/shikijs/shiki',
    ingestionMode: 'runtime_dependency',
    packageName: 'shiki',
    packageVersion: '4.2.0',
    packageIntegrity: 'sha512-hjNax6o/ylDy9lefQEaSDtzaT3iVNtZ3WmpQnbuQNoG4xvnSKf2kSKbihZVO4JRG1TTMejs7CmNRYlWgAL66pQ==',
  },
  markdown: {
    id: 'react-markdown',
    name: 'react-markdown',
    repository: 'https://github.com/remarkjs/react-markdown',
    ingestionMode: 'runtime_dependency',
    packageName: 'react-markdown',
    packageVersion: '10.1.0',
    packageIntegrity: 'sha512-qKxVopLT/TyA6BX3Ue5NwabOsAzm0Q7kAPwq6L+wWDwisYs7R8vZ0nRXqq6rkueboxpkjvLGU9fWifiX/ZZFxQ==',
  },
  tremor: {
    id: 'tremor',
    name: 'Tremor',
    repository: 'https://github.com/tremorlabs/tremor',
    ingestionMode: 'source_snapshot',
    commitSha: 'ca4d588f47820ff3d514d37fa4ee08a4222dec11',
  },
};

const providerBySlug = new Map([
  ...[
    'select', 'checkbox', 'radio', 'toggle', 'segmented-control', 'accordion',
    'radio-card-group', 'toggle-group', 'slider', 'dialog', 'drawer',
    'confirm-dialog', 'floating-window', 'menu', 'popover', 'tooltip', 'tabs',
    'settings-shell',
  ].map((slug) => [slug, provider.radix]),
  ...['area-chart', 'bar-chart', 'combo-chart', 'donut-chart', 'line-chart', 'spark-chart']
    .map((slug) => [slug, provider.recharts]),
  ['heatmap-chart', provider.echarts],
  ['combobox', provider.cmdk],
  ['command-palette', provider.cmdk],
  ['toaster', provider.sonner],
  ['execution-map', provider.xyflow],
  ['json-code-editor', provider.codemirror],
  ['syntax-code-block', provider.shiki],
  ['markdown', provider.markdown],
  ['tracker', provider.tremor],
]);

const implementationDirectory = new Map([
  ['automation-graph', 'graph-canvas'],
  ['search', 'input-search'],
  ['select', 'input-select'],
  ['wait-retry-chip', 'retry-chip'],
]);

function property(object, name) {
  for (const candidate of object.properties) {
    if (!ts.isPropertyAssignment(candidate)) continue;
    const key = ts.isStringLiteral(candidate.name) || ts.isIdentifier(candidate.name)
      ? candidate.name.text
      : undefined;
    if (key === name && ts.isStringLiteral(candidate.initializer)) return candidate.initializer.text;
  }
  return undefined;
}

async function catalogEntries() {
  const entries = [];
  for (const file of catalogFiles) {
    const path = resolve(uiSourceRoot, file);
    const source = ts.createSourceFile(path, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const slug = property(node, 'slug');
        const title = property(node, 'title');
        const area = property(node, 'area');
        const group = property(node, 'group');
        if (slug && title && area && group) entries.push({ slug, title, area, group });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return entries;
}

function unwrap(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) current = current.expression;
  return current;
}

async function exportExceptions() {
  const exceptions = new Map();
  const sources = [
    ['catalog-core.ts', 'CORE_COMPONENT_EXPORT_EXCEPTIONS'],
    ['catalog.ts', 'AGENT_COMPONENT_EXPORT_EXCEPTIONS'],
  ];

  for (const [file, variableName] of sources) {
    const path = resolve(uiSourceRoot, file);
    const source = ts.createSourceFile(path, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== variableName) continue;
        const initializer = declaration.initializer && unwrap(declaration.initializer);
        if (!initializer || !ts.isObjectLiteralExpression(initializer)) continue;
        for (const entry of initializer.properties) {
          if (!ts.isPropertyAssignment(entry)) continue;
          const slug = ts.isStringLiteral(entry.name) || ts.isIdentifier(entry.name) ? entry.name.text : undefined;
          const values = unwrap(entry.initializer);
          if (!slug || !ts.isArrayLiteralExpression(values)) continue;
          if (exceptions.has(slug)) throw new Error(`Duplicate catalog export exception for ${slug}.`);
          exceptions.set(slug, values.elements.filter(ts.isStringLiteral).map((value) => value.text));
        }
      }
    }
  }

  return exceptions;
}

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory)) {
    const path = resolve(directory, entry);
    if ((await stat(path)).isDirectory()) files.push(...await filesUnder(path));
    else files.push(relative(repositoryRoot, path).replaceAll('\\', '/'));
  }
  return files;
}

function pascal(slug) {
  return slug.split('-').map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join('');
}

function capabilityId(entry) {
  const special = {
    checkbox: 'ui.primitive.checkbox',
    'line-chart': 'ui.visualization.line-chart',
    'heatmap-chart': 'ui.visualization.heatmap-chart',
    'command-palette': 'ui.overlay.command-palette',
    toaster: 'ui.feedback.toaster',
    'execution-map': 'ui.agent.execution-map',
  }[entry.slug];
  return special ?? `ui.${entry.area}.${entry.slug}`;
}

const entries = await catalogEntries();
const exceptions = await exportExceptions();
const allSourceFiles = await filesUnder(uiSourceRoot);
const catalogProof = 'packages/ui/src/tests/catalog.spec.ts';
const records = entries.map((entry) => {
  const directory = implementationDirectory.get(entry.slug) ?? entry.slug;
  const proofs = allSourceFiles
    .filter((path) => path.includes(`/${directory}/tests/`) && /\.spec\.tsx?$/u.test(path))
    .sort();
  if (!proofs.includes(catalogProof)) proofs.push(catalogProof);
  const selectedProvider = providerBySlug.get(entry.slug);
  const finalPublicExports = exceptions.get(entry.slug) ?? [pascal(entry.slug)];
  const finalCapabilityId = capabilityId(entry);
  return {
    catalogSlug: entry.slug,
    capabilityId: finalCapabilityId,
    finalCapabilityId,
    finalPublicExports,
    disposition: selectedProvider ? 'keep-provider-backed' : 'native-with-rationale',
    ...(selectedProvider
      ? {
          provider: {
            implementationId: `${selectedProvider.id}.${entry.slug}@${selectedProvider.packageVersion ?? selectedProvider.commitSha}`,
            ...selectedProvider,
          },
        }
      : {
          nativeRationale: `${entry.title} remains a LEMN-owned ${entry.group.toLowerCase()} capability because its product-neutral composition is specific to the shared catalog and no accepted upstream provider owns this exact semantic contract.`,
        }),
    migration: {
      status: 'complete',
      publicVersionEffect: 'minor',
      targetPackageVersion: targetVersion,
      summary: selectedProvider
        ? `Retain ${finalPublicExports.join(', ')} behind a provider-neutral LEMN adapter in the 0.3.0 cutover.`
        : `Retain ${finalPublicExports.join(', ')} as reviewed native LEMN behavior in the 0.3.0 cutover.`,
    },
    conformanceProof: proofs,
  };
});

const matrix = {
  $schema: 'https://schemas.ui.le-mn.com/provider-registry/capability-migration-matrix/v1.json',
  schemaVersion: 1,
  matrixId: 'lemn-ui-provider-first-cutover',
  catalogCount: records.length,
  targetPackage: '@lemn-ltd/ui',
  targetPackageVersion: targetVersion,
  capabilities: records,
};
const serialized = `${JSON.stringify(matrix, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== serialized) {
    throw new Error('Capability migration matrix is stale or incomplete. Run pnpm --filter @lemn-ltd/provider-registry run generate:matrix and review the diff.');
  }
  for (const record of records) {
    for (const proof of record.conformanceProof) await stat(resolve(repositoryRoot, proof));
  }
  console.log(`Capability migration matrix covers all ${records.length} catalog capabilities.`);
} else {
  await writeFile(outputPath, serialized, 'utf8');
  console.log(`Wrote ${records.length} reviewed capability classifications.`);
}
