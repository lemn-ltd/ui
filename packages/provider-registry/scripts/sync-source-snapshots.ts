#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const packageRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(packageRoot, '../..');
const manifestPath = resolve(packageRoot, 'registry/provider-registry.v1.json');
const mode = process.argv.includes('--write') ? 'write' : 'check';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

let snapshotCount = 0;
let outputCount = 0;
for (const capability of manifest.capabilities) {
  if (capability.lifecycle !== 'active' || capability.source.ingestionMode !== 'source_snapshot') continue;
  snapshotCount += 1;
  await synchronizeRawClosure(capability);
  for (const transform of capability.source.transforms) {
    await verifyHash(resolve(packageRoot, transform.scriptPath), transform.scriptSha256, `${transform.id} transform`);
    const module = await import(`${pathToFileURL(resolve(packageRoot, transform.scriptPath)).href}?sha=${transform.scriptSha256}`);
    if (module.transformVersion !== transform.version || module.transformId !== transform.id) {
      throw new Error(`${capability.capabilityId} transform identity/version does not match the registry.`);
    }
    const outputs = await module.transformSnapshot({ repositoryRoot, source: capability.source });
    if (!Array.isArray(outputs) || outputs.length === 0) {
      throw new Error(`${capability.capabilityId} transform produced no outputs.`);
    }
    for (const output of outputs) {
      const absoluteOutput = resolve(repositoryRoot, output.path);
      if (!absoluteOutput.startsWith(`${repositoryRoot}/`)) throw new Error(`Unsafe transform output ${output.path}.`);
      if (mode === 'write') {
        await mkdir(dirname(absoluteOutput), { recursive: true });
        await writeFile(absoluteOutput, output.content, 'utf8');
      } else {
        const current = await readFile(absoluteOutput, 'utf8').catch(() => '');
        if (current !== output.content) {
          throw new Error(`${output.path} drifted from ${capability.provider.name} ${capability.source.commitSha}. Run sync:snapshots.`);
        }
      }
      outputCount += 1;
    }
  }
}

if (snapshotCount === 0) throw new Error('Provider registry contains no active source snapshot to verify.');
console.log(`${mode === 'write' ? 'Synchronized' : 'Verified'} ${snapshotCount} source snapshot and ${outputCount} deterministic output${outputCount === 1 ? '' : 's'}.`);

async function synchronizeRawClosure(capability) {
  const github = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/u.exec(capability.provider.repository);
  if (!github) throw new Error(`${capability.capabilityId} source sync supports immutable GitHub repositories only.`);
  const [, owner, repository] = github;
  for (const file of capability.source.closure) {
    const absolutePath = resolve(packageRoot, file.localPath);
    if (!absolutePath.startsWith(`${packageRoot}/`)) throw new Error(`Unsafe snapshot path ${file.localPath}.`);
    if (mode === 'write') {
      const url = `https://raw.githubusercontent.com/${owner}/${repository}/${capability.source.commitSha}/${file.upstreamPath}`;
      const response = await fetch(url, { redirect: 'follow' });
      if (!response.ok) throw new Error(`Unable to fetch pinned snapshot ${file.upstreamPath}: HTTP ${response.status}.`);
      const content = new Uint8Array(await response.arrayBuffer());
      const actual = sha256(content);
      if (actual !== file.upstreamSha256) throw new Error(`${file.upstreamPath} no longer matches its pinned upstream hash.`);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content);
    }
    const content = await readFile(absolutePath);
    const actual = sha256(content);
    if (actual !== file.upstreamSha256 || actual !== file.localSha256) {
      throw new Error(`${file.localPath} is not a byte-identical copy of ${file.upstreamPath}.`);
    }
  }
}

async function verifyHash(path, expected, label) {
  const actual = sha256(await readFile(path));
  if (actual !== expected) throw new Error(`${label} hash does not match the registry.`);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
