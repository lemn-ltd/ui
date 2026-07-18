/**
 * fidelity:contact-sheets — builds the human-review contact sheet.
 *
 * No master-vs-render PIXEL gate exists (a vector canvas and a Chromium raster
 * never match byte-for-byte); the contact sheet is for a SECOND human reviewer
 * to judge faithfulness side by side. For each master it lays the captured
 * Pencil master (Light/Dark, plus 375/768/1280 for responsive shell masters)
 * next to the live render of that component's portal page.
 *
 * Output: `contact-sheets/index.html` (dependency-free; open it with the dev
 * server running at the configured base URL). Masters that have not been
 * captured yet render as a BLOCKED placeholder.
 *
 * Run: `pnpm --filter @lemn-ltd/ui-portal run fidelity:contact-sheets`
 */
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { registerHooks } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(HERE, "master-manifest.json");
const MASTERS_DIR = resolve(HERE, "masters");
const OUT_DIR = resolve(HERE, "contact-sheets");
const OUT_FILE = resolve(OUT_DIR, "index.html");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:6500";
const RESPONSIVE_WIDTHS = ["375", "768", "1280"] as const;

export interface MasterEntry {
	readonly slug: string;
	readonly group: string;
	readonly masterNodeId: string | null;
	readonly responsive: boolean;
}

interface Manifest {
	readonly masters: readonly MasterEntry[];
}

export interface CatalogRouteEntry {
	readonly area: string;
	readonly kind: string;
	readonly path: string;
	readonly slug: string;
}

/**
 * Project the fidelity routes from the active catalog authority. Disabled
 * areas and non-component entries never enter this map, and the catalog's
 * canonical path is retained verbatim instead of being reconstructed here.
 */
export function activeCoreComponentRoutes(
	entries: readonly CatalogRouteEntry[],
): ReadonlyMap<string, string> {
	const routes = new Map<string, string>();
	const paths = new Set<string>();
	for (const entry of entries) {
		if (entry.area !== "core" || entry.kind !== "component") continue;
		if (!/^\/(?!\/)[^?#]+$/u.test(entry.path)) {
			throw new Error(
				`Active Core component "${entry.slug}" has a non-canonical path "${entry.path}".`,
			);
		}
		if (routes.has(entry.slug)) {
			throw new Error(`Duplicate active Core component slug "${entry.slug}".`);
		}
		if (paths.has(entry.path)) {
			throw new Error(`Duplicate active Core component path "${entry.path}".`);
		}
		routes.set(entry.slug, entry.path);
		paths.add(entry.path);
	}
	if (routes.size === 0) {
		throw new Error("The active Core component catalog is empty.");
	}
	return routes;
}

export function renderUrlForMaster(
	entry: Pick<MasterEntry, "slug">,
	routes: ReadonlyMap<string, string>,
	baseUrl = BASE_URL,
): string {
	const path = routes.get(entry.slug);
	if (!path) {
		throw new Error(
			`Fidelity master "${entry.slug}" is not an active Core component.`,
		);
	}
	return new URL(path, baseUrl).href;
}

function firstPng(dir: string): string | null {
	if (!existsSync(dir)) return null;
	const png = readdirSync(dir).find((file) => file.endsWith(".png"));
	return png ? resolve(dir, png) : null;
}

function masterCell(
	entry: MasterEntry,
	mode: "light" | "dark",
	width?: string,
): string {
	const dir = width
		? resolve(MASTERS_DIR, entry.slug, mode, width)
		: resolve(MASTERS_DIR, entry.slug, mode);
	const png = firstPng(dir);
	if (!png) return '<div class="blocked">master not captured</div>';
	return `<img loading="lazy" src="${relative(OUT_DIR, png)}" alt="${entry.slug} master ${mode}${width ? ` ${width}` : ""}" />`;
}

function renderCell(
	entry: MasterEntry,
	routes: ReadonlyMap<string, string>,
): string {
	const route = renderUrlForMaster(entry, routes);
	return `<iframe loading="lazy" src="${route}" title="${entry.slug} render"></iframe>`;
}

function sheet(
	entry: MasterEntry,
	routes: ReadonlyMap<string, string>,
): string {
	const modes: ("light" | "dark")[] = ["light", "dark"];
	const rows = modes
		.map(
			(mode) => `
      <tr>
        <th>${mode}</th>
        <td>${masterCell(entry, mode)}</td>
        <td>${renderCell(entry, routes)}</td>
      </tr>`,
		)
		.join("");
	const responsiveRows = entry.responsive
		? RESPONSIVE_WIDTHS.map(
				(w) => `
      <tr>
        <th>light ${w}</th>
        <td>${masterCell(entry, "light", w)}</td>
        <td class="muted">resize render to ${w}px</td>
      </tr>`,
			).join("")
		: "";
	return `
    <section id="${entry.slug}">
      <h2>${entry.slug} <small>${entry.group}${entry.masterNodeId ? ` · ${entry.masterNodeId}` : ""}</small></h2>
      <table>
        <thead><tr><th></th><th>Pencil master</th><th>Code render</th></tr></thead>
        <tbody>${rows}${responsiveRows}</tbody>
      </table>
    </section>`;
}

async function main(): Promise<void> {
	const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
	registerHooks({
		load(url, context, nextLoad) {
			if (url.endsWith(".css")) {
				return { format: "module", shortCircuit: true, source: "" };
			}
			return nextLoad(url, context);
		},
	});
	const { CATALOG_MANIFEST } = await import(
		"../../src/catalog/catalog-manifest.ts"
	);
	const routes = activeCoreComponentRoutes(CATALOG_MANIFEST);
	const masterSlugs = new Set<string>();
	for (const master of manifest.masters) {
		if (masterSlugs.has(master.slug)) {
			throw new Error(`Duplicate fidelity master slug "${master.slug}".`);
		}
		masterSlugs.add(master.slug);
		renderUrlForMaster(master, routes);
	}
	mkdirSync(OUT_DIR, { recursive: true });
	const body = manifest.masters.map((entry) => sheet(entry, routes)).join("\n");
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
     Start the dev server (<code>make dev-ui-portal</code>) so the render iframes load.</p>
  ${body}
</body>
</html>
`;
	writeFileSync(OUT_FILE, html);
	console.log(`Wrote ${OUT_FILE} (${manifest.masters.length} masters).`);
}

const invokedPath = process.argv[1]
	? pathToFileURL(resolve(process.argv[1])).href
	: null;
if (invokedPath === import.meta.url) {
	main().catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	});
}
