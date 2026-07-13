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
const requiredPublicExports = new Set(['.', './tokens', './catalog', './styles.css']);

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
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lemn-ui-package-smoke-'));

try {
  const tarballPath = join(temporaryRoot, `lemn-ltd-ui-${uiPackage.version}.tgz`);
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

  const packResult = JSON.parse(
    run(pnpmCommand, ['--filter', canonicalPackageName, 'pack', '--out', tarballPath, '--json']),
  );

  assert(packResult.name === canonicalPackageName, `Packed name must be ${canonicalPackageName}`);
  assert(packResult.version === uiPackage.version, 'Packed version must match packages/ui/package.json');

  const files = packResult.files ?? [];
  const packedPaths = new Set(files.map((file) => file.path));
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

  run(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], consumerDirectory);

  const installedPackage = JSON.parse(
    await readFile(join(consumerDirectory, 'node_modules/@lemn-ltd/ui/package.json'), 'utf8'),
  );
  assert(installedPackage.name === canonicalPackageName, 'Installed package must retain its canonical name');
  assert(installedPackage.version === uiPackage.version, 'Installed package version must match the tarball');
  assert(
    isDeepStrictEqual(installedPackage.exports, uiPackage.exports),
    'Installed package must retain the public exports contract',
  );

  const dependencyGroups = ['dependencies', 'optionalDependencies', 'peerDependencies'];
  const unresolvedCatalogEntries = dependencyGroups.flatMap((group) =>
    Object.entries(installedPackage[group] ?? {})
      .filter(([, version]) => version.startsWith('catalog:'))
      .map(([name]) => `${group}.${name}`),
  );
  assert(
    unresolvedCatalogEntries.length === 0,
    `Packed manifest contains unresolved catalog entries: ${unresolvedCatalogEntries.join(', ')}`,
  );

  const npmList = JSON.parse(run(npmCommand, ['ls', canonicalPackageName, '--depth=0', '--json'], consumerDirectory));
  const listedPackage = npmList.dependencies?.[canonicalPackageName];
  assert(listedPackage?.version === uiPackage.version, 'npm must list the canonical package directly');
  assert(!listedPackage.invalid, 'npm must not classify the canonical package as invalid');
  assert(!npmList.problems?.length, `npm reported package problems: ${npmList.problems?.join(', ')}`);

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

  console.log(
    JSON.stringify(
      {
        package: `${canonicalPackageName}@${uiPackage.version}`,
        entryCount: files.length,
        css: packedCssPaths.length,
        src: files.filter((file) => file.path.startsWith('src/')).length,
        exports: resolvedExports,
      },
      null,
      2,
    ),
  );
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
