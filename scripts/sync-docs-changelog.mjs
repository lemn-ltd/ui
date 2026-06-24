#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function writeIfChanged(relativePath, content) {
  const filePath = path.join(root, relativePath);
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

  if (current === content) return false;

  if (checkOnly) {
    throw new Error(`${relativePath} is out of date. Run pnpm sync:docs-changelog.`);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

const uiPackage = readJson('packages/ui/package.json');
const docsPackagePath = 'apps/docs/package.json';
const docsPackage = readJson(docsPackagePath);

assert(semver.test(uiPackage.version), `packages/ui/package.json version is not SemVer: ${uiPackage.version}`);
if (docsPackage.version !== uiPackage.version) {
  if (checkOnly) {
    throw new Error(
      `apps/docs/package.json version (${docsPackage.version}) must match @appranks/ui (${uiPackage.version})`,
    );
  }

  docsPackage.version = uiPackage.version;
  fs.writeFileSync(path.join(root, docsPackagePath), `${JSON.stringify(docsPackage, null, 2)}\n`);
  console.log(`Synced ${docsPackagePath} to ${uiPackage.version}.`);
}

const changelogPath = path.join(root, 'packages/ui/CHANGELOG.md');
assert(fs.existsSync(changelogPath), 'packages/ui/CHANGELOG.md is missing');

const rawChangelog = fs.readFileSync(changelogPath, 'utf8').trim();
assert(
  rawChangelog.includes(`## ${uiPackage.version}`),
  `packages/ui/CHANGELOG.md is missing the current version ${uiPackage.version}`,
);

const changelogBody = rawChangelog.replace(/^#\s+@appranks\/ui\s*/u, '').trim();

const enContent = `---
title: Changelog
description: Release notes for @appranks/ui.
sidebar:
  label: Changelog
  order: 6
---

Current package version: \`${uiPackage.version}\`.

This page is generated from \`packages/ui/CHANGELOG.md\`, so the published docs
stay aligned with the package version that Changesets writes.

${changelogBody}
`;

const esContent = `---
title: Historial de cambios
description: Release notes de @appranks/ui.
sidebar:
  label: Changelog
  order: 6
---

Version actual del paquete: \`${uiPackage.version}\`.

Esta pagina se genera desde \`packages/ui/CHANGELOG.md\`, asi que los docs
publicados se mantienen alineados con la version que escribe Changesets.

${changelogBody}
`;

const changed = [
  writeIfChanged('apps/docs/src/content/docs/changelog/index.mdx', enContent),
  writeIfChanged('apps/docs/src/content/docs/es/changelog/index.mdx', esContent),
].some(Boolean);

if (changed) {
  console.log('Synced docs changelog pages.');
} else {
  console.log('Docs changelog pages are current.');
}
