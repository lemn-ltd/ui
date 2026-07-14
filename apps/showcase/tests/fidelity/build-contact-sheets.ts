/**
 * fidelity:contact-sheets — builds the human-review contact sheet.
 *
 * No master-vs-render PIXEL gate exists (a vector canvas and a Chromium raster
 * never match byte-for-byte); the contact sheet is for a SECOND human reviewer
 * to judge faithfulness side by side. For each master it lays the captured
 * Pencil master (Light/Dark, plus 375/768/1280 for responsive shell masters)
 * next to the live render of that component's showcase page.
 *
 * Output: `contact-sheets/index.html` (dependency-free; open it with the dev
 * server running at the configured base URL). Masters that have not been
 * captured yet render as a BLOCKED placeholder.
 *
 * Run: `pnpm --filter @lemn-ltd/ui-showcase run fidelity:contact-sheets`
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(HERE, 'master-manifest.json');
const MASTERS_DIR = resolve(HERE, 'masters');
const OUT_DIR = resolve(HERE, 'contact-sheets');
const OUT_FILE = resolve(OUT_DIR, 'index.html');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:6500';
const RESPONSIVE_WIDTHS = ['375', '768', '1280'] as const;

interface MasterEntry {
  readonly slug: string;
  readonly group: string;
  readonly masterNodeId: string | null;
  readonly responsive: boolean;
}

interface Manifest {
  readonly masters: readonly MasterEntry[];
}

function firstPng(dir: string): string | null {
  if (!existsSync(dir)) return null;
  const png = readdirSync(dir).find((file) => file.endsWith('.png'));
  return png ? resolve(dir, png) : null;
}

function masterCell(entry: MasterEntry, mode: 'light' | 'dark', width?: string): string {
  const dir = width
    ? resolve(MASTERS_DIR, entry.slug, mode, width)
    : resolve(MASTERS_DIR, entry.slug, mode);
  const png = firstPng(dir);
  if (!png) return '<div class="blocked">master not captured</div>';
  return `<img loading="lazy" src="${relative(OUT_DIR, png)}" alt="${entry.slug} master ${mode}${width ? ` ${width}` : ''}" />`;
}

function renderCell(entry: MasterEntry): string {
  const area = entry.group === 'Agents' ? 'agents' : 'core';
  const route = `${BASE_URL}/${area}/components/${entry.slug}`;
  return `<iframe loading="lazy" src="${route}" title="${entry.slug} render"></iframe>`;
}

function sheet(entry: MasterEntry): string {
  const modes: ('light' | 'dark')[] = ['light', 'dark'];
  const rows = modes
    .map(
      (mode) => `
      <tr>
        <th>${mode}</th>
        <td>${masterCell(entry, mode)}</td>
        <td>${renderCell(entry)}</td>
      </tr>`,
    )
    .join('');
  const responsiveRows = entry.responsive
    ? RESPONSIVE_WIDTHS.map(
        (w) => `
      <tr>
        <th>light ${w}</th>
        <td>${masterCell(entry, 'light', w)}</td>
        <td class="muted">resize render to ${w}px</td>
      </tr>`,
      ).join('')
    : '';
  return `
    <section id="${entry.slug}">
      <h2>${entry.slug} <small>${entry.group}${entry.masterNodeId ? ` · ${entry.masterNodeId}` : ''}</small></h2>
      <table>
        <thead><tr><th></th><th>Pencil master</th><th>Code render</th></tr></thead>
        <tbody>${rows}${responsiveRows}</tbody>
      </table>
    </section>`;
}

function main(): void {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  mkdirSync(OUT_DIR, { recursive: true });
  const body = manifest.masters.map(sheet).join('\n');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Fidelity contact sheets</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; background: #fff; color: #111; }
  section { margin: 0 0 48px; }
  h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  small { color: #888; font-weight: 400; font-family: monospace; }
  table { border-collapse: collapse; width: 100%; }
  th { text-align: left; vertical-align: top; padding: 8px; color: #555; font-size: 12px; width: 80px; }
  td { padding: 8px; vertical-align: top; border-top: 1px solid #eee; width: 50%; }
  img, iframe { max-width: 100%; border: 1px solid #ccc; border-radius: 6px; }
  iframe { width: 100%; height: 420px; }
  .blocked { color: #b00; font-size: 12px; padding: 16px; border: 1px dashed #b00; border-radius: 6px; }
  .muted { color: #999; font-size: 12px; }
</style>
</head>
<body>
  <h1>Fidelity contact sheets</h1>
  <p>Side-by-side Pencil master vs code render for a second reviewer. No pixel gate.
     Start the dev server (<code>make dev-ui-showcase</code>) so the render iframes load.</p>
  ${body}
</body>
</html>
`;
  writeFileSync(OUT_FILE, html);
  console.log(`Wrote ${OUT_FILE} (${manifest.masters.length} masters).`);
}

main();
