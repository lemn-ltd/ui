#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateVersionedChangelog(rawChangelog, currentVersion) {
  const headings = [...rawChangelog.matchAll(/^##\s+(.+?)\s*$/gmu)].map((match) => match[1]);
  assert(headings.length > 0, 'packages/ui/CHANGELOG.md has no release headings');
  assert(
    !headings.some((heading) => heading.toLowerCase() === 'unreleased'),
    'packages/ui/CHANGELOG.md must not contain an Unreleased section; pending notes belong in a changeset',
  );
  for (const heading of headings) {
    assert(semver.test(heading), `packages/ui/CHANGELOG.md has a non-version release heading: ${heading}`);
  }
  assert(
    headings[0] === currentVersion,
    `packages/ui/CHANGELOG.md must start with current version ${currentVersion}; found ${headings[0]}`,
  );
  const duplicates = headings.filter((heading, index) => headings.indexOf(heading) !== index);
  assert(
    duplicates.length === 0,
    `packages/ui/CHANGELOG.md repeats release version ${duplicates[0]}`,
  );
  return headings;
}

function writeIfChanged(root, checkOnly, relativePath, content) {
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

export function syncDocsChangelog({ repositoryRoot = defaultRoot, checkOnly = false } = {}) {
  const uiPackage = readJson(repositoryRoot, 'packages/ui/package.json');

  assert(semver.test(uiPackage.version), `packages/ui/package.json version is not SemVer: ${uiPackage.version}`);

  const changelogPath = path.join(repositoryRoot, 'packages/ui/CHANGELOG.md');
  assert(fs.existsSync(changelogPath), 'packages/ui/CHANGELOG.md is missing');

  const rawChangelog = fs.readFileSync(changelogPath, 'utf8').trim();
  validateVersionedChangelog(rawChangelog, uiPackage.version);

  const changelogBody = rawChangelog.replace(/^#\s+@lemn-ltd\/ui\s*/u, '').trim();

  const enContent = `---
title: Changelog
description: Release notes for @lemn-ltd/ui.
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
description: Release notes de @lemn-ltd/ui.
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
    writeIfChanged(
      repositoryRoot,
      checkOnly,
      'apps/docs/src/content/docs/changelog/index.mdx',
      enContent,
    ),
    writeIfChanged(
      repositoryRoot,
      checkOnly,
      'apps/docs/src/content/docs/es/changelog/index.mdx',
      esContent,
    ),
  ].some(Boolean);

  return changed;
}

function main() {
  const changed = syncDocsChangelog({ checkOnly: process.argv.includes('--check') });
  if (changed) {
    console.log('Synced docs changelog pages.');
  } else {
    console.log('Docs changelog pages are current.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
