/**
 * fidelity:capture-masters — Lane A master-capture orchestrator.
 *
 * Pencil's `export_nodes` / `get_screenshot` run on the editor main thread, so
 * the actual pixel capture is a deliberate human (or Pencil-MCP-driven) step,
 * not a headless CI job. This helper makes that step reproducible: it reads the
 * manifest, flags staleness against the live `ui.pen` hash, reports which
 * masters are still missing, and prints the exact capture plan (node id ->
 * target PNG paths, Light + Dark, plus 375/768/1280 artboards for responsive
 * shell masters).
 *
 * Capture MUST run against the canonical `packages/ui/design/ui.pen`. Until the
 * manifest's `capturedAgainstPatchedPen` flag is set, Lane A stays BLOCKED.
 *
 * Run: `pnpm --filter @lemn-ltd/ui-showcase run fidelity:capture-masters`
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../..');
const MANIFEST_PATH = resolve(HERE, 'master-manifest.json');
const MASTERS_DIR = resolve(HERE, 'masters');
const RESPONSIVE_WIDTHS = ['375', '768', '1280'] as const;

interface MasterEntry {
  readonly slug: string;
  readonly group: string;
  readonly masterNodeId: string | null;
  readonly responsive: boolean;
}

interface Manifest {
  readonly penFile: string;
  readonly penHash: string;
  readonly capturedAgainstPatchedPen: boolean;
  readonly masters: readonly MasterEntry[];
}

function hashFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function hasPng(dir: string): boolean {
  return existsSync(dir) && readdirSync(dir).some((file) => file.endsWith('.png'));
}

function expectedDirs(entry: MasterEntry): string[] {
  const base = resolve(MASTERS_DIR, entry.slug);
  const modes = ['light', 'dark'];
  if (!entry.responsive) return modes.map((mode) => resolve(base, mode));
  return modes.flatMap((mode) => RESPONSIVE_WIDTHS.map((w) => resolve(base, mode, w)));
}

function main(): void {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  const livePenHash = hashFile(resolve(REPO_ROOT, manifest.penFile));

  console.log(`Lane A master capture — ${manifest.masters.length} masters`);
  console.log(`  pen file:      ${manifest.penFile}`);
  console.log(`  manifest hash: ${manifest.penHash}`);
  console.log(`  live hash:     ${livePenHash ?? '(pen file not found)'}`);

  const stale = livePenHash !== null && livePenHash !== manifest.penHash;
  if (stale) {
    console.log('  STALE: ui.pen changed since the manifest was written — re-capture affected masters.');
  }
  if (!manifest.capturedAgainstPatchedPen) {
    console.log('  BLOCKED: manifest.capturedAgainstPatchedPen is false — capture only against the canonical ui.pen.');
  }

  const missing: MasterEntry[] = [];
  for (const entry of manifest.masters) {
    if (!expectedDirs(entry).every(hasPng)) missing.push(entry);
  }

  console.log(`\nCoverage: ${manifest.masters.length - missing.length}/${manifest.masters.length} masters present.`);
  if (missing.length > 0) {
    console.log('\nCapture plan (drive Pencil MCP export_nodes + get_screenshot per row):');
    for (const entry of missing) {
      const id = entry.masterNodeId ?? '(resolve node id in the patched .pen)';
      const targets = entry.responsive ? 'light+dark x {375,768,1280}' : 'light+dark';
      console.log(`  - ${entry.slug.padEnd(18)} node=${String(id).padEnd(28)} ${targets}`);
    }
  }

  const blocked = missing.length > 0 || stale || !manifest.capturedAgainstPatchedPen;
  process.exitCode = blocked ? 1 : 0;
}

main();
