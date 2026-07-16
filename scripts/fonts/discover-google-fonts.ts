#!/usr/bin/env node
import { createHash } from "node:crypto";

const GOOGLE_FONTS_CSS_API = "https://fonts.googleapis.com/css2";
const GOOGLE_FONTS_REPOSITORY = "https://github.com/google/fonts";
const GOOGLE_FONTS_API_REPOSITORY =
	"https://api.github.com/repos/google/fonts/commits";
const USER_AGENT =
	"Mozilla/5.0 AppleWebKit/537.36 Chrome/131 Safari/537.36 LemnFontCatalogDiscovery/1.0";

const families = [
	{
		id: "inter",
		family: "Inter",
		directory: "ofl/inter",
		query: "Inter:ital,wght@0,100..900;1,100..900",
	},
	{
		id: "open-sans",
		family: "Open Sans",
		directory: "ofl/opensans",
		query: "Open Sans:ital,wght@0,300..800;1,300..800",
	},
	{
		id: "source-sans-3",
		family: "Source Sans 3",
		directory: "ofl/sourcesans3",
		query: "Source Sans 3:ital,wght@0,200..900;1,200..900",
	},
	{
		id: "plus-jakarta-sans",
		family: "Plus Jakarta Sans",
		directory: "ofl/plusjakartasans",
		query: "Plus Jakarta Sans:ital,wght@0,200..800;1,200..800",
	},
	{
		id: "space-grotesk",
		family: "Space Grotesk",
		directory: "ofl/spacegrotesk",
		query: "Space Grotesk:wght@300..700",
	},
	{
		id: "source-serif-4",
		family: "Source Serif 4",
		directory: "ofl/sourceserif4",
		query: "Source Serif 4:ital,wght@0,200..900;1,200..900",
	},
	{
		id: "lora",
		family: "Lora",
		directory: "ofl/lora",
		query: "Lora:ital,wght@0,400..700;1,400..700",
	},
	{
		id: "jetbrains-mono",
		family: "JetBrains Mono",
		directory: "ofl/jetbrainsmono",
		query: "JetBrains Mono:ital,wght@0,100..800;1,100..800",
	},
] as const;

interface GoogleFontsFace {
	style: string;
	weight: string;
	url: string;
	unicodeRange: string;
}

function requireMatch(
	source: string,
	pattern: RegExp,
	description: string,
): string {
	const match = source.match(pattern)?.[1]?.trim();
	if (!match) throw new Error(`Missing ${description}`);
	return match;
}

function parseLatinFaces(css: string): GoogleFontsFace[] {
	const faces: GoogleFontsFace[] = [];
	const blockPattern = /\/\*\s*([^*]+?)\s*\*\/\s*@font-face\s*\{([\s\S]*?)\}/g;
	for (const match of css.matchAll(blockPattern)) {
		if (match[1]?.trim() !== "latin") continue;
		const block = match[2] ?? "";
		faces.push({
			style: requireMatch(block, /font-style:\s*([^;]+);/, "font style"),
			weight: requireMatch(block, /font-weight:\s*([^;]+);/, "font weight"),
			url: requireMatch(block, /src:\s*url\(([^)]+)\)/, "WOFF2 URL"),
			unicodeRange: requireMatch(
				block,
				/unicode-range:\s*([^;]+);/,
				"unicode range",
			),
		});
	}
	return faces;
}

async function fetchRequired(url: string, accept: string): Promise<Response> {
	const response = await fetch(url, {
		headers: { Accept: accept, "User-Agent": USER_AGENT },
		signal: AbortSignal.timeout(30_000),
	});
	if (!response.ok) {
		throw new Error(`GET ${url} returned HTTP ${response.status}`);
	}
	return response;
}

async function discoverFamily(family: (typeof families)[number]) {
	const repositoryUrl = new URL(GOOGLE_FONTS_API_REPOSITORY);
	repositoryUrl.searchParams.set("path", family.directory);
	repositoryUrl.searchParams.set("per_page", "1");
	const commits = (await (
		await fetchRequired(repositoryUrl.toString(), "application/vnd.github+json")
	).json()) as Array<{ sha?: string }>;
	const commitSha = commits[0]?.sha;
	if (!commitSha || !/^[a-f0-9]{40}$/.test(commitSha)) {
		throw new Error(`Missing pinned Google Fonts commit for ${family.family}`);
	}

	const cssUrl = new URL(GOOGLE_FONTS_CSS_API);
	cssUrl.searchParams.set("family", family.query);
	discoveryParams(cssUrl);
	const css = await (await fetchRequired(cssUrl.toString(), "text/css")).text();
	const faces = parseLatinFaces(css);
	if (faces.length === 0) {
		throw new Error(`No Latin WOFF2 faces returned for ${family.family}`);
	}

	return {
		id: family.id,
		family: family.family,
		repository: GOOGLE_FONTS_REPOSITORY,
		commitSha,
		cssUrl: cssUrl.toString(),
		licenseUrl: `https://raw.githubusercontent.com/google/fonts/${commitSha}/${family.directory}/OFL.txt`,
		faces: await Promise.all(
			faces.map(async (face) => {
				const bytes = new Uint8Array(
					await (await fetchRequired(face.url, "font/woff2")).arrayBuffer(),
				);
				if (new TextDecoder("ascii").decode(bytes.subarray(0, 4)) !== "wOF2") {
					throw new Error(`${family.family} ${face.style} is not WOFF2`);
				}
				return {
					...face,
					byteSize: bytes.byteLength,
					sha256: createHash("sha256").update(bytes).digest("hex"),
				};
			}),
		),
	};
}

function discoveryParams(url: URL): void {
	url.searchParams.set("display", "swap");
}

const result = [];
for (const family of families) result.push(await discoverFamily(family));
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
