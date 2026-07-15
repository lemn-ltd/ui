#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const canonicalPackageName = '@lemn-ltd/ui';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const requiredPublicExports = new Set(['.', './tokens', './catalog', './blocks', './styles.css']);
const exactPublishedVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u;
const consumerVersions = {
  react: '19.2.4',
  reactDom: '19.2.4',
  reactTypes: '19.2.14',
  reactDomTypes: '19.2.3',
  lucideReact: '0.469.0',
  typescript: '5.9.3',
  vite: '8.0.16',
  viteReact: '6.0.1',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      [`${command} ${args.join(' ')} failed with exit code ${result.status}`, result.stdout, result.stderr]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result.stdout.trim();
}

async function collectCssFiles(directory, sourceRoot = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectCssFiles(child, sourceRoot)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push(`dist/${relative(sourceRoot, child).replaceAll('\\', '/')}`);
    }
  }

  return files;
}

async function collectRelativeFiles(directory, outputRoot = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectRelativeFiles(child, outputRoot)));
      continue;
    }
    if (entry.isFile()) files.push(relative(outputRoot, child).replaceAll('\\', '/'));
  }

  return files;
}

function collectExportTargets(definition) {
  if (typeof definition === 'string') return [definition];
  if (Array.isArray(definition)) return definition.flatMap(collectExportTargets);
  if (definition && typeof definition === 'object') {
    return Object.values(definition).flatMap(collectExportTargets);
  }
  return [];
}

function defaultExportTarget(definition) {
  if (typeof definition === 'string') return definition;
  return definition?.default;
}

const uiPackage = JSON.parse(await readFile(join(root, 'packages/ui/package.json'), 'utf8'));
const brandContractPackage = JSON.parse(
  await readFile(join(root, 'packages/brand-contract/package.json'), 'utf8'),
);
const brandStudioPackage = JSON.parse(
  await readFile(join(root, 'packages/brand-studio/package.json'), 'utf8'),
);
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lemn-ui-package-set-smoke-'));

try {
  const brandContractTarballPath = join(
    temporaryRoot,
    `lemn-ltd-brand-contract-${brandContractPackage.version}.tgz`,
  );
  const tarballPath = join(temporaryRoot, `lemn-ltd-ui-${uiPackage.version}.tgz`);
  const brandStudioTarballPath = join(
    temporaryRoot,
    `lemn-ltd-brand-studio-${brandStudioPackage.version}.tgz`,
  );
  const consumerDirectory = join(temporaryRoot, 'consumer');
  await mkdir(consumerDirectory);
  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'lemn-ui-package-smoke',
        version: '1.0.0',
        private: true,
        type: 'module',
      },
      null,
      2,
    )}\n`,
  );

  const brandContractPackResult = JSON.parse(
    run(pnpmCommand, [
      '--filter',
      '@lemn-ltd/brand-contract',
      'pack',
      '--out',
      brandContractTarballPath,
      '--json',
    ]),
  );
  const packResult = JSON.parse(
    run(pnpmCommand, ['--filter', canonicalPackageName, 'pack', '--out', tarballPath, '--json']),
  );
  const brandStudioPackResult = JSON.parse(
    run(pnpmCommand, [
      '--filter',
      '@lemn-ltd/brand-studio',
      'pack',
      '--out',
      brandStudioTarballPath,
      '--json',
    ]),
  );

  assert(
    brandContractPackResult.name === '@lemn-ltd/brand-contract' &&
      brandContractPackResult.version === brandContractPackage.version,
    'Packed brand-contract identity must match its manifest',
  );
  assert(
    brandStudioPackResult.name === '@lemn-ltd/brand-studio' &&
      brandStudioPackResult.version === brandStudioPackage.version,
    'Packed brand-studio identity must match its manifest',
  );
  for (const [name, result, requiredFiles] of [
    ['@lemn-ltd/brand-contract', brandContractPackResult, ['CHANGELOG.md', 'LICENSE', 'README.md']],
    [canonicalPackageName, packResult, ['CHANGELOG.md', 'README.md']],
    ['@lemn-ltd/brand-studio', brandStudioPackResult, ['CHANGELOG.md', 'LICENSE', 'README.md']],
  ]) {
    const paths = new Set((result.files ?? []).map((file) => file.path));
    for (const requiredFile of requiredFiles) {
      assert(paths.has(requiredFile), `${name} tarball is missing required ${requiredFile}`);
    }
  }

  assert(packResult.name === canonicalPackageName, `Packed name must be ${canonicalPackageName}`);
  assert(packResult.version === uiPackage.version, 'Packed version must match packages/ui/package.json');

  const files = packResult.files ?? [];
  const packedPaths = new Set(files.map((file) => file.path));
  const packedSourcePaths = files.filter((file) => file.path.startsWith('src/')).map((file) => file.path);
  assert(packedSourcePaths.length === 0, `Tarball must not contain src/: ${packedSourcePaths.join(', ')}`);
  const publicExportKeys = Object.keys(uiPackage.exports ?? {});
  for (const exportKey of requiredPublicExports) {
    assert(publicExportKeys.includes(exportKey), `Package manifest must expose ${exportKey}`);
  }
  for (const exportKey of publicExportKeys) {
    for (const target of collectExportTargets(uiPackage.exports[exportKey])) {
      assert(target.startsWith('./'), `Export ${exportKey} target must be package-relative: ${target}`);
      assert(packedPaths.has(target.slice(2)), `Tarball is missing export ${exportKey} target ${target}`);
    }
  }

  const expectedCssPaths = (await collectCssFiles(join(root, 'packages/ui/src'))).sort();
  const packedCssPaths = files
    .filter((file) => file.path.startsWith('dist/') && file.path.endsWith('.css'))
    .map((file) => file.path)
    .sort();
  const missingCss = expectedCssPaths.filter((path) => !packedPaths.has(path));
  const unexpectedCss = packedCssPaths.filter((path) => !expectedCssPaths.includes(path));
  assert(
    isDeepStrictEqual(packedCssPaths, expectedCssPaths),
    `Tarball CSS differs from packages/ui/src (missing: ${missingCss.join(', ') || 'none'}; unexpected: ${unexpectedCss.join(', ') || 'none'})`,
  );
  for (const artifact of [
    'dist/provider-registry/registry/provider-registry.v1.json',
    'dist/provider-registry/registry/capability-migration-matrix.v1.json',
    'dist/provider-registry/third-party/sbom.spdx.json',
    'dist/provider-registry/third-party/licenses/echarts-6.1.0-LICENSE.txt',
    'dist/provider-registry/third-party/licenses/echarts-6.1.0-NOTICE.txt',
  ]) {
    assert(packedPaths.has(artifact), `UI tarball is missing provider release artifact ${artifact}`);
  }

  run(
    npmCommand,
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--save-exact',
      brandContractTarballPath,
      tarballPath,
      brandStudioTarballPath,
      `react@${consumerVersions.react}`,
      `react-dom@${consumerVersions.reactDom}`,
      `lucide-react@${consumerVersions.lucideReact}`,
    ],
    consumerDirectory,
  );
  run(
    npmCommand,
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--save-dev',
      '--save-exact',
      `typescript@${consumerVersions.typescript}`,
      `@types/react@${consumerVersions.reactTypes}`,
      `@types/react-dom@${consumerVersions.reactDomTypes}`,
      `vite@${consumerVersions.vite}`,
      `@vitejs/plugin-react@${consumerVersions.viteReact}`,
    ],
    consumerDirectory,
  );

  const installedPackage = JSON.parse(
    await readFile(join(consumerDirectory, 'node_modules/@lemn-ltd/ui/package.json'), 'utf8'),
  );

  const installedBrandContract = JSON.parse(
    await readFile(
      join(consumerDirectory, 'node_modules/@lemn-ltd/brand-contract/package.json'),
      'utf8',
    ),
  );
  const installedBrandStudio = JSON.parse(
    await readFile(
      join(consumerDirectory, 'node_modules/@lemn-ltd/brand-studio/package.json'),
      'utf8',
    ),
  );
  assert(
    installedBrandContract.version === brandContractPackage.version,
    'Installed brand-contract version must match its tarball',
  );
  assert(
    installedBrandStudio.version === brandStudioPackage.version,
    'Installed brand-studio version must match its tarball',
  );
  assert(
    installedBrandStudio.dependencies?.['@lemn-ltd/brand-contract'] === '0.1.0',
    'Packed Brand Studio must depend on exact @lemn-ltd/brand-contract 0.1.0',
  );
  assert(
    installedBrandStudio.peerDependencies?.['@lemn-ltd/ui'] === '0.3.0',
    'Packed Brand Studio must peer-depend on exact @lemn-ltd/ui 0.3.0',
  );
  assert(installedPackage.name === canonicalPackageName, 'Installed package must retain its canonical name');
  assert(installedPackage.version === uiPackage.version, 'Installed package version must match the tarball');
  assert(
    isDeepStrictEqual(installedPackage.exports, uiPackage.exports),
    'Installed package must retain the public exports contract',
  );

  const dependencyGroups = ['dependencies', 'optionalDependencies', 'peerDependencies'];
  const installedReleasePackages = [installedBrandContract, installedPackage, installedBrandStudio];
  const unresolvedCatalogEntries = installedReleasePackages.flatMap((manifest) =>
    dependencyGroups.flatMap((group) =>
      Object.entries(manifest[group] ?? {})
        .filter(([, version]) => !exactPublishedVersion.test(String(version)))
        .map(([name, version]) => `${manifest.name}:${group}.${name}=${version}`),
    ),
  );
  assert(
    unresolvedCatalogEntries.length === 0,
    `Packed manifests contain unresolved or floating entries: ${unresolvedCatalogEntries.join(', ')}`,
  );

  const npmList = JSON.parse(run(npmCommand, ['ls', canonicalPackageName, '--depth=0', '--json'], consumerDirectory));
  const listedPackage = npmList.dependencies?.[canonicalPackageName];
  assert(listedPackage?.version === uiPackage.version, 'npm must list the canonical package directly');
  assert(!listedPackage.invalid, 'npm must not classify the canonical package as invalid');
  assert(!npmList.problems?.length, `npm reported package problems: ${npmList.problems?.join(', ')}`);

  const installedVersionContracts = {
    react: consumerVersions.react,
    'react-dom': consumerVersions.reactDom,
    'lucide-react': consumerVersions.lucideReact,
    '@types/react': consumerVersions.reactTypes,
    '@types/react-dom': consumerVersions.reactDomTypes,
    typescript: consumerVersions.typescript,
    vite: consumerVersions.vite,
    '@vitejs/plugin-react': consumerVersions.viteReact,
  };
  for (const [packageName, expectedVersion] of Object.entries(installedVersionContracts)) {
    const packagePath = join(consumerDirectory, 'node_modules', ...packageName.split('/'), 'package.json');
    const installedVersion = JSON.parse(await readFile(packagePath, 'utf8')).version;
    assert(installedVersion === expectedVersion, `${packageName} must resolve to ${expectedVersion}; received ${installedVersion}`);
  }

  const publicSpecifiers = publicExportKeys.map((exportKey) =>
    exportKey === '.' ? canonicalPackageName : `${canonicalPackageName}${exportKey.slice(1)}`,
  );
  const resolvedUrls = JSON.parse(
    run(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `const specifiers = ${JSON.stringify(publicSpecifiers)}; console.log(JSON.stringify(Object.fromEntries(specifiers.map((specifier) => [specifier, import.meta.resolve(specifier)]))));`,
      ],
      consumerDirectory,
    ),
  );
  const resolvedExports = {};
  for (const exportKey of publicExportKeys) {
    const specifier = exportKey === '.' ? canonicalPackageName : `${canonicalPackageName}${exportKey.slice(1)}`;
    const target = defaultExportTarget(uiPackage.exports[exportKey]);
    assert(target, `Export ${exportKey} must provide a default runtime target`);
    const expectedEntry = join(consumerDirectory, 'node_modules/@lemn-ltd/ui', target);
    const resolvedPath = fileURLToPath(resolvedUrls[specifier]);
    assert(
      (await realpath(resolvedPath)) === (await realpath(expectedEntry)),
      `${specifier} resolved to ${resolvedPath}`,
    );
    resolvedExports[specifier] = relative(consumerDirectory, expectedEntry);
  }

  const sourceDirectory = join(consumerDirectory, 'src');
  await mkdir(sourceDirectory);
  await writeFile(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          jsx: 'react-jsx',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        },
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(sourceDirectory, 'main.tsx'),
    `import { compileBrandProject } from '@lemn-ltd/brand-contract';
import { BrandStudio } from '@lemn-ltd/brand-studio';
import '@lemn-ltd/brand-studio/styles.css';
import { Button, type IconName } from '@lemn-ltd/ui';
import { DashboardOverviewBlock } from '@lemn-ltd/ui/blocks';
import { componentCatalog } from '@lemn-ltd/ui/catalog';
import '@lemn-ltd/ui/styles.css';
import { tokens } from '@lemn-ltd/ui/tokens';
import { createRoot } from 'react-dom/client';

const iconName: IconName = 'check';
void compileBrandProject;
void BrandStudio;
void DashboardOverviewBlock;
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root');

createRoot(rootElement).render(
  <main data-icon={iconName}>
    <Button>Package smoke</Button>
    <output>{componentCatalog.length}:{tokens.spacing[2]}</output>
  </main>,
);
`,
  );
  await writeFile(
    join(consumerDirectory, 'index.html'),
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
  );
  await writeFile(
    join(consumerDirectory, 'vite.config.mjs'),
    `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [react()] });
`,
  );

  const executableExtension = process.platform === 'win32' ? '.cmd' : '';
  const tscCommand = join(consumerDirectory, 'node_modules/.bin', `tsc${executableExtension}`);
  const viteCommand = join(consumerDirectory, 'node_modules/.bin', `vite${executableExtension}`);
  run(tscCommand, ['--project', 'tsconfig.json'], consumerDirectory);
  run(viteCommand, ['build'], consumerDirectory);

  const viteOutputDirectory = join(consumerDirectory, 'dist');
  const viteOutputFiles = await collectRelativeFiles(viteOutputDirectory);
  const viteJavaScript = viteOutputFiles.filter((path) => path.endsWith('.js'));
  const viteCss = viteOutputFiles.filter((path) => path.endsWith('.css'));
  assert(viteOutputFiles.includes('index.html'), 'Vite consumer must emit index.html');
  assert(viteJavaScript.length > 0, 'Vite consumer must emit JavaScript');
  assert(viteCss.length > 0, 'Vite consumer must emit the imported public stylesheet');
  const bundledCss = (
    await Promise.all(viteCss.map((path) => readFile(join(viteOutputDirectory, path), 'utf8')))
  ).join('\n');
  assert(
    bundledCss.includes('--lemn-color-accent:'),
    'Vite CSS output must contain the compiled @lemn-ltd/ui brand tokens',
  );

  console.log(
    JSON.stringify(
      {
        packages: [
          `@lemn-ltd/brand-contract@${brandContractPackage.version}`,
          `${canonicalPackageName}@${uiPackage.version}`,
          `@lemn-ltd/brand-studio@${brandStudioPackage.version}`,
        ],
        entryCount: files.length,
        css: packedCssPaths.length,
        src: packedSourcePaths.length,
        exports: resolvedExports,
        typescript: {
          strict: true,
          skipLibCheck: false,
          react: consumerVersions.react,
          reactTypes: consumerVersions.reactTypes,
          lucideReact: consumerVersions.lucideReact,
        },
        vite: {
          javascript: viteJavaScript.length,
          css: viteCss.length,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
