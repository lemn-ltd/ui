export const FONT_CATALOG_VERSION = 1 as const;

export const SYSTEM_FONT_REFS = [
	"system.ui",
	"system.sans",
	"system.serif",
	"system.mono",
] as const;

export const MANAGED_FONT_REFS = [
	"managed.inter",
	"managed.open-sans",
	"managed.source-sans-3",
	"managed.plus-jakarta-sans",
	"managed.space-grotesk",
	"managed.source-serif-4",
	"managed.lora",
	"managed.jetbrains-mono",
] as const;

export type SystemFontRef = (typeof SYSTEM_FONT_REFS)[number];
export type ManagedFontRef = (typeof MANAGED_FONT_REFS)[number];
export type FontCatalogRef = SystemFontRef | ManagedFontRef;
export type FontStyle = "normal" | "italic";

export type FontCatalogResource = {
	readonly id: string;
	readonly url: string;
	readonly format: "woff2";
	readonly style: FontStyle;
	readonly weightRange: readonly [number, number];
	readonly subset: "latin";
	readonly unicodeRange: string;
	readonly estimatedBytes: number;
	readonly sha256: string;
	readonly integrity: string;
	readonly immutable: true;
	readonly provisional: false;
};

export type SystemFontCatalogRecord = {
	readonly ref: SystemFontRef;
	readonly source: "system";
	readonly label: string;
	readonly category: "sans" | "serif" | "mono";
	readonly description: string;
	readonly cssStack: readonly string[];
	readonly supportedWeights: readonly number[];
	readonly supportedStyles: readonly FontStyle[];
	readonly resources: readonly [];
	readonly estimatedBytes: 0;
};

export type ManagedFontCatalogRecord = {
	readonly ref: ManagedFontRef;
	readonly source: "managed";
	readonly label: string;
	readonly category: "sans" | "serif" | "mono";
	readonly description: string;
	readonly family: string;
	readonly licenseId: "OFL-1.1" | "Apache-2.0";
	readonly licenseUrl: string;
	readonly licenseArtifactUrl: string;
	readonly licenseSha256: string;
	readonly copyrightNotice: string;
	readonly sourceUrl: string;
	readonly upstreamProjectUrl: string;
	readonly supportedWeights: readonly number[];
	readonly supportedStyles: readonly FontStyle[];
	readonly resources: readonly FontCatalogResource[];
	readonly estimatedBytes: number;
};

type ManagedFontLegalRecord = Pick<
	ManagedFontCatalogRecord,
	| "licenseArtifactUrl"
	| "licenseSha256"
	| "copyrightNotice"
	| "sourceUrl"
	| "upstreamProjectUrl"
>;

const managedFontLegalRecords: Readonly<
	Record<ManagedFontRef, ManagedFontLegalRecord>
> = {
	"managed.inter": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/inter/5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57/OFL.txt",
		licenseSha256:
			"5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57",
		copyrightNotice:
			"Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)",
		sourceUrl:
			"https://github.com/google/fonts/tree/0b58fb370093f9a9f4ff785d94405710b79de67c/ofl/inter",
		upstreamProjectUrl: "https://github.com/rsms/inter",
	},
	"managed.open-sans": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/open-sans/fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602/OFL.txt",
		licenseSha256:
			"fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602",
		copyrightNotice:
			"Copyright 2020 The Open Sans Project Authors (https://github.com/googlefonts/opensans)",
		sourceUrl:
			"https://github.com/google/fonts/tree/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/opensans",
		upstreamProjectUrl: "https://github.com/googlefonts/opensans",
	},
	"managed.source-sans-3": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/source-sans-3/09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392/OFL.txt",
		licenseSha256:
			"09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392",
		copyrightNotice:
			"Copyright 2010-2020 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'. All Rights Reserved. Source is a trademark of Adobe in the United States and/or other countries.",
		sourceUrl:
			"https://github.com/google/fonts/tree/914ec116571b1162d886aa402e715552221f0b77/ofl/sourcesans3",
		upstreamProjectUrl: "https://github.com/adobe-fonts/source-sans",
	},
	"managed.plus-jakarta-sans": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/plus-jakarta-sans/995c7199cab65954f545996326755daee7b63cc6b42b06c13da1f9502ab08a99/OFL.txt",
		licenseSha256:
			"995c7199cab65954f545996326755daee7b63cc6b42b06c13da1f9502ab08a99",
		copyrightNotice:
			"Copyright 2020 The Plus Jakarta Sans Project Authors (https://github.com/tokotype/PlusJakartaSans)",
		sourceUrl:
			"https://github.com/google/fonts/tree/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/plusjakartasans",
		upstreamProjectUrl: "https://github.com/tokotype/PlusJakartaSans",
	},
	"managed.space-grotesk": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/space-grotesk/564ce565c371c5e5bbf286006565a7c9aa55a9f56e7ca58d56e05d649dd61a72/OFL.txt",
		licenseSha256:
			"564ce565c371c5e5bbf286006565a7c9aa55a9f56e7ca58d56e05d649dd61a72",
		copyrightNotice:
			"Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk)",
		sourceUrl:
			"https://github.com/google/fonts/tree/00a38a53f92aef923b9353f40128e8f4552ddae4/ofl/spacegrotesk",
		upstreamProjectUrl: "https://github.com/floriankarsten/space-grotesk",
	},
	"managed.source-serif-4": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/source-serif-4/5f94c3fd3a23131a417ab5a0c8452de57e70c3cfb9f604d88241f7065ebf9fd9/OFL.txt",
		licenseSha256:
			"5f94c3fd3a23131a417ab5a0c8452de57e70c3cfb9f604d88241f7065ebf9fd9",
		copyrightNotice:
			"Copyright 2014 The Source Serif 4 Project Authors (https://github.com/adobe-fonts/source-serif)",
		sourceUrl:
			"https://github.com/google/fonts/tree/08dc85da6bca7ae308a6f1d38d0b137465646071/ofl/sourceserif4",
		upstreamProjectUrl: "https://github.com/adobe-fonts/source-serif",
	},
	"managed.lora": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/lora/1d9a970809ac804b582a6ce7f0ebc4e7fefcbfd7ff6299cad35ee656a21be716/OFL.txt",
		licenseSha256:
			"1d9a970809ac804b582a6ce7f0ebc4e7fefcbfd7ff6299cad35ee656a21be716",
		copyrightNotice:
			'Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora".',
		sourceUrl:
			"https://github.com/google/fonts/tree/186331d77cc99caaa9c3b52391fd2b519c9e1ee8/ofl/lora",
		upstreamProjectUrl: "https://github.com/cyrealtype/Lora-Cyrillic",
	},
	"managed.jetbrains-mono": {
		licenseArtifactUrl:
			"https://fonts.ui.le-mn.com/v2/licenses/jetbrains-mono/b2fe5e8987594e9ffd1d2ca52a2f5d73eb8335243893c5d6254b5ad69269591d/OFL.txt",
		licenseSha256:
			"b2fe5e8987594e9ffd1d2ca52a2f5d73eb8335243893c5d6254b5ad69269591d",
		copyrightNotice:
			"Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)",
		sourceUrl:
			"https://github.com/google/fonts/tree/6e4b84c976cadb3c49a40fd9a1c203e4f7fcf2da/ofl/jetbrainsmono",
		upstreamProjectUrl: "https://github.com/JetBrains/JetBrainsMono",
	},
};

export type FontCatalogRecord =
	| SystemFontCatalogRecord
	| ManagedFontCatalogRecord;

const systemRecords: readonly SystemFontCatalogRecord[] = [
	{
		ref: "system.ui",
		source: "system",
		label: "System UI",
		category: "sans",
		description:
			"The current operating system interface font; fastest and recommended for product UI.",
		cssStack: ["system-ui", "sans-serif"],
		supportedWeights: [400, 500, 600, 700],
		supportedStyles: ["normal", "italic"],
		resources: [],
		estimatedBytes: 0,
	},
	{
		ref: "system.sans",
		source: "system",
		label: "System Sans",
		category: "sans",
		description:
			"A conservative locally installed sans-serif stack for documents and dense applications.",
		cssStack: ["Arial", "Helvetica", "Liberation Sans", "sans-serif"],
		supportedWeights: [400, 500, 600, 700],
		supportedStyles: ["normal", "italic"],
		resources: [],
		estimatedBytes: 0,
	},
	{
		ref: "system.serif",
		source: "system",
		label: "System Serif",
		category: "serif",
		description:
			"A locally installed editorial serif stack with no browser font request.",
		cssStack: [
			"ui-serif",
			"Georgia",
			"Cambria",
			"Times New Roman",
			"Times",
			"serif",
		],
		supportedWeights: [400, 600, 700],
		supportedStyles: ["normal", "italic"],
		resources: [],
		estimatedBytes: 0,
	},
	{
		ref: "system.mono",
		source: "system",
		label: "System Mono",
		category: "mono",
		description:
			"A locally installed monospace stack for code, identifiers and tabular values.",
		cssStack: [
			"ui-monospace",
			"SFMono-Regular",
			"Consolas",
			"Liberation Mono",
			"Menlo",
			"monospace",
		],
		supportedWeights: [400, 500, 600, 700],
		supportedStyles: ["normal", "italic"],
		resources: [],
		estimatedBytes: 0,
	},
];

function managedRecord(input: {
	readonly ref: ManagedFontRef;
	readonly label: string;
	readonly family: string;
	readonly category: "sans" | "serif" | "mono";
	readonly description: string;
	readonly weights: readonly number[];
	readonly licenseUrl: string;
	readonly resources: readonly {
		readonly style: FontStyle;
		readonly weightRange: readonly [number, number];
		readonly estimatedBytes: number;
		readonly sha256: string;
		readonly integrity: string;
		readonly url: string;
	}[];
}): ManagedFontCatalogRecord {
	const resources: readonly FontCatalogResource[] = input.resources.map(
		(resource) => ({
			id: `${input.ref}.${resource.style}.variable-latin`,
			url: resource.url,
			format: "woff2",
			style: resource.style,
			weightRange: resource.weightRange,
			subset: "latin",
			unicodeRange: LATIN_UNICODE_RANGE,
			estimatedBytes: resource.estimatedBytes,
			sha256: resource.sha256,
			integrity: resource.integrity,
			immutable: true,
			provisional: false,
		}),
	);
	return {
		ref: input.ref,
		source: "managed",
		label: input.label,
		category: input.category,
		description: input.description,
		family: input.family,
		licenseId: "OFL-1.1",
		licenseUrl: input.licenseUrl,
		...managedFontLegalRecords[input.ref],
		supportedWeights: input.weights,
		supportedStyles: resources.map((resource) => resource.style),
		resources,
		estimatedBytes: resources.reduce(
			(total, resource) => total + resource.estimatedBytes,
			0,
		),
	};
}

const LATIN_UNICODE_RANGE =
	"U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

const managedResource = (
	style: FontStyle,
	weightRange: readonly [number, number],
	estimatedBytes: number,
	sha256: string,
	integrity: string,
	url: string,
) => ({ style, weightRange, estimatedBytes, sha256, integrity, url });

const managedRecords: readonly ManagedFontCatalogRecord[] = [
	managedRecord({
		ref: "managed.inter",
		label: "Inter",
		family: "Lemn Managed Inter",
		category: "sans",
		description: "Neutral product UI sans with a broad variable-weight range.",
		weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/0b58fb370093f9a9f4ff785d94405710b79de67c/ofl/inter/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[100, 900],
				48256,
				"3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62",
				"sha256-MQDndehhbNJhG+7PojpCY9cDdYZ4m0PwNSNqLm+9TGI=",
				"https://fonts.ui.le-mn.com/v2/3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62/inter-latin-variable-normal.woff2",
			),
			managedResource(
				"italic",
				[100, 900],
				51832,
				"7291b5970da2237441273c03b424a504b70b18f09791473fab99687dcc314720",
				"sha256-cpG1lw2iI3RBJzwDtCSlBLcLGPCXkUc/q5lofcwxRyA=",
				"https://fonts.ui.le-mn.com/v2/7291b5970da2237441273c03b424a504b70b18f09791473fab99687dcc314720/inter-latin-variable-italic.woff2",
			),
		],
	}),
	managedRecord({
		ref: "managed.open-sans",
		label: "Open Sans",
		family: "Lemn Managed Open Sans",
		category: "sans",
		description:
			"Humanist sans optimized for interfaces and long-form reading.",
		weights: [300, 400, 500, 600, 700, 800],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/opensans/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[300, 800],
				48320,
				"d8e4fe0452aa2076429a9bb5d8757d00a994dd95986cf950e9a1a371b9a072a0",
				"sha256-2OT+BFKqIHZCmpu12HV9AKmU3ZWYbPlQ6aGjcbmgcqA=",
				"https://fonts.ui.le-mn.com/v2/d8e4fe0452aa2076429a9bb5d8757d00a994dd95986cf950e9a1a371b9a072a0/open-sans-latin-variable-normal.woff2",
			),
			managedResource(
				"italic",
				[300, 800],
				50216,
				"186836b74ceac07b2764c07c0379420e3014efb30fe918461c235e0ef6cbc4a2",
				"sha256-GGg2t0zqwHsnZMB8A3lCDjAU77MP6RhGHCNeDvbLxKI=",
				"https://fonts.ui.le-mn.com/v2/186836b74ceac07b2764c07c0379420e3014efb30fe918461c235e0ef6cbc4a2/open-sans-latin-variable-italic.woff2",
			),
		],
	}),
	managedRecord({
		ref: "managed.source-sans-3",
		label: "Source Sans 3",
		family: "Lemn Managed Source Sans 3",
		category: "sans",
		description:
			"Versatile sans for multilingual application and document surfaces.",
		weights: [200, 300, 400, 500, 600, 700, 800, 900],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/914ec116571b1162d886aa402e715552221f0b77/ofl/sourcesans3/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[200, 900],
				28740,
				"7a19a7027e125257d310c6dbd78ae3a30b5ea1e3794d60b12bb28227a003bfda",
				"sha256-ehmnAn4SUlfTEMbb14rjowteoeN5TWCxK7KCJ6ADv9o=",
				"https://fonts.ui.le-mn.com/v2/7a19a7027e125257d310c6dbd78ae3a30b5ea1e3794d60b12bb28227a003bfda/source-sans-3-latin-variable-normal.woff2",
			),
			managedResource(
				"italic",
				[200, 900],
				28532,
				"9a15dafc2c2b2414aaa9d6c30830d9aab4361329d8495b1574633603b994b411",
				"sha256-mhXa/CwrJBSqqdbDCDDZqrQ2EynYSVsVdGM2A7mUtBE=",
				"https://fonts.ui.le-mn.com/v2/9a15dafc2c2b2414aaa9d6c30830d9aab4361329d8495b1574633603b994b411/source-sans-3-latin-variable-italic.woff2",
			),
		],
	}),
	managedRecord({
		ref: "managed.plus-jakarta-sans",
		label: "Plus Jakarta Sans",
		family: "Lemn Managed Plus Jakarta Sans",
		category: "sans",
		description: "Contemporary geometric sans for distinctive product brands.",
		weights: [200, 300, 400, 500, 600, 700, 800],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/plusjakartasans/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[200, 800],
				27348,
				"153fc85b70298beeb1d61a5f723331649e7f23bb77302a66e61cb3e2fbdb5e79",
				"sha256-FT/IW3Api+6x1hpfcjMxZJ5/I7t3MCpm5hyz4vvbXnk=",
				"https://fonts.ui.le-mn.com/v2/153fc85b70298beeb1d61a5f723331649e7f23bb77302a66e61cb3e2fbdb5e79/plus-jakarta-sans-latin-variable-normal.woff2",
			),
			managedResource(
				"italic",
				[200, 800],
				29600,
				"bb113d8f5be89636a9a31ffa0966762126546b98be171d6fa81115abb2cd5352",
				"sha256-uxE9j1voljapox/6CWZ2ISZUa5i+Fx1vqBEVq7LNU1I=",
				"https://fonts.ui.le-mn.com/v2/bb113d8f5be89636a9a31ffa0966762126546b98be171d6fa81115abb2cd5352/plus-jakarta-sans-latin-variable-italic.woff2",
			),
		],
	}),
	managedRecord({
		ref: "managed.space-grotesk",
		label: "Space Grotesk",
		family: "Lemn Managed Space Grotesk",
		category: "sans",
		description:
			"Characterful grotesk suited to headings and compact product copy.",
		weights: [300, 400, 500, 600, 700],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/00a38a53f92aef923b9353f40128e8f4552ddae4/ofl/spacegrotesk/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[300, 700],
				22288,
				"0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d",
				"sha256-BkCJBHb8EZirTeVx+2WN5EPE2FtmRm7AlTSoc3qxzp0=",
				"https://fonts.ui.le-mn.com/v2/0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d/space-grotesk-latin-variable-normal.woff2",
			),
		],
	}),
	managedRecord({
		ref: "managed.source-serif-4",
		label: "Source Serif 4",
		family: "Lemn Managed Source Serif 4",
		category: "serif",
		description: "Editorial serif with an extensive variable-weight range.",
		weights: [200, 300, 400, 500, 600, 700, 800, 900],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/08dc85da6bca7ae308a6f1d38d0b137465646071/ofl/sourceserif4/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[200, 900],
				50824,
				"c1df4596be5029233ed2afbb8b2f6ea20784b3fb1aa5d6b5c6519ccd85eb3dfb",
				"sha256-wd9Flr5QKSM+0q+7iy9uogeEs/sapda1xlGczYXrPfs=",
				"https://fonts.ui.le-mn.com/v2/c1df4596be5029233ed2afbb8b2f6ea20784b3fb1aa5d6b5c6519ccd85eb3dfb/source-serif-4-latin-variable-normal.woff2",
			),
			managedResource(
				"italic",
				[200, 900],
				51516,
				"663e7ef3037a56dce81dfc33f68c1e6445995ffd8887991b3c0b68a7689c9da5",
				"sha256-Zj5+8wN6VtzoHfwz9oweZEWZX/2Ih5kbPAtop2icnaU=",
				"https://fonts.ui.le-mn.com/v2/663e7ef3037a56dce81dfc33f68c1e6445995ffd8887991b3c0b68a7689c9da5/source-serif-4-latin-variable-italic.woff2",
			),
		],
	}),
	managedRecord({
		ref: "managed.lora",
		label: "Lora",
		family: "Lemn Managed Lora",
		category: "serif",
		description:
			"Contemporary serif for editorial headings and readable prose.",
		weights: [400, 500, 600, 700],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/186331d77cc99caaa9c3b52391fd2b519c9e1ee8/ofl/lora/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[400, 700],
				37788,
				"ddb8c66035104e233fc024669183aad3738b6daa16deee2ebb1241bd0f98ace1",
				"sha256-3bjGYDUQTiM/wCRmkYOq03OLbaoW3u4uuxJBvQ+YrOE=",
				"https://fonts.ui.le-mn.com/v2/ddb8c66035104e233fc024669183aad3738b6daa16deee2ebb1241bd0f98ace1/lora-latin-variable-normal.woff2",
			),
			managedResource(
				"italic",
				[400, 700],
				40772,
				"d824d807d4d832d12c87932d0b8ec1314dcfd502157a56dee6bb04cf8a3768ae",
				"sha256-2CTYB9TYMtEsh5MtC47BMU3P1QIVelbe5rsEz4o3aK4=",
				"https://fonts.ui.le-mn.com/v2/d824d807d4d832d12c87932d0b8ec1314dcfd502157a56dee6bb04cf8a3768ae/lora-latin-variable-italic.woff2",
			),
		],
	}),
	managedRecord({
		ref: "managed.jetbrains-mono",
		label: "JetBrains Mono",
		family: "Lemn Managed JetBrains Mono",
		category: "mono",
		description:
			"Developer-focused monospace with clear character distinction.",
		weights: [100, 200, 300, 400, 500, 600, 700, 800],
		licenseUrl:
			"https://raw.githubusercontent.com/google/fonts/6e4b84c976cadb3c49a40fd9a1c203e4f7fcf2da/ofl/jetbrainsmono/OFL.txt",
		resources: [
			managedResource(
				"normal",
				[100, 800],
				40404,
				"18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e",
				"sha256-GL5FJyS/3CNsB0ypSiSaf0GoZ1LH0EqyWM6e1WUfan4=",
				"https://fonts.ui.le-mn.com/v2/18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e/jetbrains-mono-latin-variable-normal.woff2",
			),
			managedResource(
				"italic",
				[100, 800],
				42964,
				"a8afa085e9ca5e53434e2ee918ba6b65c7dd4dda56509976b36591478c99d62e",
				"sha256-qK+ghenKXlNDTi7pGLprZcfdTdpWUJl2s2WRR4yZ1i4=",
				"https://fonts.ui.le-mn.com/v2/a8afa085e9ca5e53434e2ee918ba6b65c7dd4dda56509976b36591478c99d62e/jetbrains-mono-latin-variable-italic.woff2",
			),
		],
	}),
];

function deepFreeze<T>(value: T): T {
	if (value === null || typeof value !== "object") return value;
	for (const child of Object.values(value as Record<string, unknown>))
		deepFreeze(child);
	return Object.isFrozen(value) ? value : Object.freeze(value);
}

export const fontCatalog: readonly FontCatalogRecord[] = deepFreeze([
	...systemRecords,
	...managedRecords,
]);

export function getFontCatalogRecord(ref: FontCatalogRef): FontCatalogRecord {
	const record = fontCatalog.find((entry) => entry.ref === ref);
	if (!record) throw new Error(`Unknown font catalog reference: ${ref}`);
	return record;
}
