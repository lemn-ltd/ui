#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const canonicalPackageName = '@lemn-ltd/ui';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

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

  run(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], consumerDirectory);

  const installedPackage = JSON.parse(
    await readFile(join(consumerDirectory, 'node_modules/@lemn-ltd/ui/package.json'), 'utf8'),
  );
  assert(installedPackage.name === canonicalPackageName, 'Installed package must retain its canonical name');
  assert(installedPackage.version === uiPackage.version, 'Installed package version must match the tarball');

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

  const resolvedUrl = run(
    process.execPath,
    ['--input-type=module', '--eval', `console.log(import.meta.resolve('${canonicalPackageName}'))`],
    consumerDirectory,
  );
  const resolvedPath = fileURLToPath(resolvedUrl);
  const expectedEntry = join(consumerDirectory, 'node_modules/@lemn-ltd/ui/dist/index.js');
  assert(
    (await realpath(resolvedPath)) === (await realpath(expectedEntry)),
    `${canonicalPackageName} resolved to ${resolvedPath}`,
  );

  const files = packResult.files ?? [];
  console.log(
    JSON.stringify(
      {
        package: `${canonicalPackageName}@${uiPackage.version}`,
        entryCount: files.length,
        css: files.filter((file) => file.path.endsWith('.css')).length,
        src: files.filter((file) => file.path.startsWith('src/')).length,
        resolved: relative(consumerDirectory, expectedEntry),
      },
      null,
      2,
    ),
  );
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
