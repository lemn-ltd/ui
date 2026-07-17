import {
	canonicalJson,
	serializeBootstrapJson,
	sha256,
} from "./canonical-json.js";
import {
	bestContrastingColor,
	contrastRatio,
	mixHexColors,
	translucentHex,
} from "./color.js";
import {
	BRANDING_COMPILER_VERSION,
	BRANDING_SCHEMA_VERSION,
	type BrandingMode,
	type BrandingTypography,
	type DirectFontSelection,
	safeParseBrandingDefinition,
} from "./contract.js";
import {
	FONT_CATALOG_VERSION,
	type FontCatalogRef,
	type FontCatalogResource,
	type FontStyle,
	getFontCatalogRecord,
	type ManagedFontCatalogRecord,
} from "./font-catalog.js";

export type DiagnosticSeverity = "error" | "warning";

export type BrandingDiagnostic = {
	readonly code: string;
	readonly severity: DiagnosticSeverity;
	readonly path: string;
	readonly message: string;
	readonly actual?: number;
	readonly required?: number;
	readonly suggestion?: string;
};

export type RechartsBrandingTheme = {
	readonly series: readonly string[];
	readonly positive: string;
	readonly negative: string;
	readonly neutral: string;
	readonly axis: string;
	readonly grid: string;
	readonly cursor: string;
	readonly selection: string;
	readonly tooltip: {
		readonly background: string;
		readonly border: string;
		readonly text: string;
	};
};

export type EChartsBrandingTheme = {
	readonly color: readonly string[];
	readonly backgroundColor: "transparent";
	readonly textStyle: Readonly<Record<string, unknown>>;
	readonly legend: Readonly<Record<string, unknown>>;
	readonly categoryAxis: Readonly<Record<string, unknown>>;
	readonly valueAxis: Readonly<Record<string, unknown>>;
	readonly tooltip: Readonly<Record<string, unknown>>;
};

export type CompiledFontResource = {
	readonly id: string;
	readonly catalogRef: FontCatalogRef;
	readonly family: string;
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
	readonly provisional: boolean;
	readonly fidelity: "preferred" | "required";
	readonly preload: boolean;
	readonly fontDisplay: "optional" | "block";
};

export type FontNetworkPolicy = {
	readonly mode: "none" | "managed-immutable-cdn";
	readonly requiresNetwork: boolean;
	readonly allowedOrigins: readonly string[];
	readonly emergencyFallbackRequired: true;
};

export type CompiledFontPreload = {
	readonly resourceId: string;
	readonly rel: "preload";
	readonly href: string;
	readonly as: "font";
	readonly type: "font/woff2";
	readonly crossOrigin: "anonymous";
	readonly integrity: string;
};

export type CompiledBrandingMode = {
	readonly id: string;
	readonly modeId: string;
	readonly modeHash: string;
	readonly colorScheme: "light" | "dark";
	readonly selector: string;
	readonly attributes: {
		readonly "data-lemn-brand-scope": string;
		readonly "data-lemn-branding": string;
		readonly "data-lemn-mode": string;
	};
	readonly fontResourceIds: readonly string[];
	readonly tokens: Readonly<Record<string, string>>;
	readonly recharts: RechartsBrandingTheme;
	readonly echarts: EChartsBrandingTheme;
	readonly configuration: Readonly<BrandingMode>;
	readonly css: string;
};

export type CompiledBrandingArtifact = {
	readonly schemaVersion: typeof BRANDING_SCHEMA_VERSION;
	readonly compilerVersion: typeof BRANDING_COMPILER_VERSION;
	readonly definitionName: string;
	readonly defaultModeId: string;
	readonly allowedModeIds: readonly string[];
	readonly definitionHash: string;
	readonly compiledHash: string;
	readonly compatibility: {
		readonly schema: "1.x";
		readonly compiler: "1.x";
	};
	readonly modes: Readonly<Record<string, CompiledBrandingMode>>;
	readonly fontCatalogVersion: typeof FONT_CATALOG_VERSION;
	readonly fontResources: readonly CompiledFontResource[];
	readonly estimatedFontBytes: number;
	readonly fontNetworkPolicy: FontNetworkPolicy;
	readonly fontCss: string;
	readonly fullCss: string;
	readonly assetRoles: Readonly<Record<string, string>>;
	readonly assetManifest: Readonly<
		Record<
			string,
			{
				readonly storageKey: string;
				readonly sha256: string;
				readonly mediaType: string;
				readonly width?: number;
				readonly height?: number;
				readonly accessibleLabel?: string;
				readonly licenseId?: string;
				readonly variants?: Readonly<Record<string, string>>;
			}
		>
	>;
};

export type CompiledBrandingSignature = {
	readonly algorithm: "Ed25519";
	readonly keyId: string;
	readonly value: string;
};

export type CompiledBrandingObject = {
	readonly format: "lemn.compiled-branding";
	readonly formatVersion: 1;
	readonly schemaVersion: typeof BRANDING_SCHEMA_VERSION;
	readonly compilerVersion: typeof BRANDING_COMPILER_VERSION;
	readonly compiledHash: string;
	readonly byteHash: string;
	readonly artifact: CompiledBrandingArtifact;
	readonly signature: CompiledBrandingSignature;
};

export type CompiledBrandingSigner = (
	payload: string,
) => Promise<CompiledBrandingSignature> | CompiledBrandingSignature;

export type CompiledBrandingVerifier = (
	payload: string,
	signature: CompiledBrandingSignature,
) => Promise<boolean> | boolean;

export type BrandingCompileResult =
	| {
			readonly ok: true;
			readonly artifact: CompiledBrandingArtifact;
			readonly diagnostics: readonly BrandingDiagnostic[];
	  }
	| {
			readonly ok: false;
			readonly definitionHash?: string;
			readonly diagnostics: readonly BrandingDiagnostic[];
	  };

export async function compileBrandingDefinition(
	input: unknown,
): Promise<BrandingCompileResult> {
	const parsed = safeParseBrandingDefinition(input);
	if (!parsed.success) {
		return {
			ok: false,
			diagnostics: parsed.error.issues.map((issue) => ({
				code: "BRANDING_SCHEMA_INVALID",
				severity: "error",
				path: formatPath(issue.path),
				message: issue.message,
			})),
		};
	}

	const definition = parsed.data;
	const definitionHash = await sha256(canonicalJson(definition));
	const modeIds = Object.keys(definition.modes).sort();
	const diagnostics = modeIds.flatMap((modeId) => {
		const mode = definition.modes[modeId];
		return mode ? validateMode(modeId, mode) : [];
	});
	if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
		return { ok: false, definitionHash, diagnostics };
	}

	const scopeNamespace = await sha256(
		canonicalJson({
			compilerVersion: BRANDING_COMPILER_VERSION,
			definitionHash,
		}),
	);
	const compiledTypography = compileTypography(
		scopeNamespace,
		definition.typography,
	);
	const fontResources = mergeFontResources(compiledTypography.resources);
	const fontNetworkPolicy = compileFontNetworkPolicy(fontResources);
	const modes = Object.fromEntries(
		await Promise.all(
			modeIds.map(async (modeId) => {
				const mode = definition.modes[modeId];
				if (!mode)
					throw new Error(
						`Branding mode '${modeId}' disappeared during compilation`,
					);
				const compiled = compileMode(
					scopeNamespace,
					modeId,
					mode,
					definition.typography,
					compiledTypography,
				);
				const modeHash = await sha256(
					canonicalJson({
						compilerVersion: BRANDING_COMPILER_VERSION,
						definitionHash,
						modeId,
						mode: compiled,
					}),
				);
				return [modeId, Object.freeze({ ...compiled, modeHash })] as const;
			}),
		),
	);
	const fontCss = fontResources.map(fontFaceCss).join("\n\n");
	const fullCss = [
		`/* @lemn-ltd/brand-contract ${BRANDING_COMPILER_VERSION}; definition ${definitionHash} */`,
		fontCss,
		...modeIds.map((modeId) => modes[modeId]?.css ?? ""),
	]
		.filter(Boolean)
		.join("\n\n");
	const assetManifest = Object.fromEntries(
		Object.entries(definition.assets)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([id, asset]) => [
				id,
				{
					storageKey: asset.storageKey,
					sha256: asset.sha256,
					mediaType: asset.mediaType,
					...(asset.width === undefined ? {} : { width: asset.width }),
					...(asset.height === undefined ? {} : { height: asset.height }),
					...(asset.accessibleLabel
						? { accessibleLabel: asset.accessibleLabel }
						: {}),
					...(asset.licenseId ? { licenseId: asset.licenseId } : {}),
					...(asset.variants
						? {
								variants: Object.freeze(
									Object.fromEntries(
										Object.entries(asset.variants).sort(([left], [right]) =>
											left.localeCompare(right),
										),
									),
								),
							}
						: {}),
				},
			]),
	);
	const assetRoles = Object.freeze(
		Object.fromEntries(
			Object.entries(definition.assetRoles ?? {})
				.filter(
					(entry): entry is [string, string] => typeof entry[1] === "string",
				)
				.sort(([left], [right]) => left.localeCompare(right)),
		),
	);
	const selectable = definition.runtimeSelection?.selectable ?? true;
	const allowedModeIds = Object.freeze(
		selectable
			? [...(definition.runtimeSelection?.allowedModeIds ?? modeIds)].sort()
			: [definition.defaultModeId],
	);

	const artifactPayload = {
		schemaVersion: BRANDING_SCHEMA_VERSION,
		compilerVersion: BRANDING_COMPILER_VERSION,
		compatibility: { schema: "1.x", compiler: "1.x" } as const,
		definitionName: definition.name,
		defaultModeId: definition.defaultModeId,
		allowedModeIds,
		definitionHash,
		modes: Object.freeze(modes),
		fontCatalogVersion: FONT_CATALOG_VERSION,
		fontResources: Object.freeze(fontResources),
		estimatedFontBytes: sumUniqueFontBytes(fontResources),
		fontNetworkPolicy,
		fontCss,
		fullCss,
		assetRoles,
		assetManifest: Object.freeze(assetManifest),
	};
	const compiledHash = await sha256(canonicalJson(artifactPayload));

	return {
		ok: true,
		diagnostics,
		artifact: deepFreeze({
			...artifactPayload,
			compiledHash,
		}),
	};
}

export function getCompiledMode(
	artifact: CompiledBrandingArtifact,
	modeId: string = artifact.defaultModeId,
): CompiledBrandingMode {
	if (!artifact.allowedModeIds.includes(modeId)) {
		throw new Error(`Mode '${modeId}' is not allowed for runtime selection`);
	}
	const mode = artifact.modes[modeId];
	if (!mode) throw new Error(`Unknown branding mode: ${modeId}`);
	return mode;
}

export function serializeBrandingBootstrap(
	artifact: CompiledBrandingArtifact,
	modeId: string = artifact.defaultModeId,
): string {
	const mode = getCompiledMode(artifact, modeId);
	return serializeBootstrapJson({
		schemaVersion: artifact.schemaVersion,
		compilerVersion: artifact.compilerVersion,
		definitionHash: artifact.definitionHash,
		compiledHash: artifact.compiledHash,
		modeHash: mode.modeHash,
		modeId: mode.modeId,
		colorScheme: mode.colorScheme,
		scopeId: mode.id,
		attributes: mode.attributes,
		tokens: mode.tokens,
		visualization: {
			recharts: mode.recharts,
			echarts: mode.echarts,
		},
		componentAppearance: definitionAppearance(mode.tokens),
	});
}

export function getCompiledModeCriticalCss(
	artifact: CompiledBrandingArtifact,
	modeId: string = artifact.defaultModeId,
): string {
	const mode = getCompiledMode(artifact, modeId);
	return [artifact.fontCss, mode.css].filter(Boolean).join("\n\n");
}

export function getCompiledModeFontResources(
	artifact: CompiledBrandingArtifact,
	modeId: string = artifact.defaultModeId,
): readonly CompiledFontResource[] {
	const mode = getCompiledMode(artifact, modeId);
	const selected = new Set(mode.fontResourceIds);
	const resources = artifact.fontResources.filter((resource) =>
		selected.has(resource.id),
	);
	if (resources.length !== selected.size) {
		throw new Error(
			`Compiled font resources are incomplete for mode '${mode.modeId}'`,
		);
	}
	return Object.freeze(resources);
}

export function getCompiledModeFontPreloads(
	artifact: CompiledBrandingArtifact,
	modeId: string = artifact.defaultModeId,
): readonly CompiledFontPreload[] {
	const byUrl = new Map<string, CompiledFontPreload>();
	for (const resource of getCompiledModeFontResources(artifact, modeId)) {
		if (!resource.preload || byUrl.has(resource.url)) continue;
		byUrl.set(
			resource.url,
			Object.freeze({
				resourceId: resource.id,
				rel: "preload",
				href: resource.url,
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
				integrity: resource.integrity,
			}),
		);
	}
	return Object.freeze([...byUrl.values()]);
}

export function assertCompatibleBrandingArtifact(
	artifact: CompiledBrandingArtifact,
): void {
	if (artifact.schemaVersion !== BRANDING_SCHEMA_VERSION) {
		throw new Error(
			`Unsupported branding schema version: ${String(artifact.schemaVersion)}`,
		);
	}
	if (
		artifact.compilerVersion.split(".")[0] !==
		BRANDING_COMPILER_VERSION.split(".")[0]
	) {
		throw new Error(
			`Incompatible branding compiler version: ${artifact.compilerVersion}`,
		);
	}
	if (artifact.fontCatalogVersion !== FONT_CATALOG_VERSION) {
		throw new Error(
			`Unsupported font catalog version: ${String(artifact.fontCatalogVersion)}`,
		);
	}
	if (
		!/^[a-f0-9]{64}$/.test(artifact.definitionHash) ||
		!/^[a-f0-9]{64}$/.test(artifact.compiledHash)
	) {
		throw new Error("Branding artifact hashes are invalid");
	}
}

export async function verifyBrandingArtifact(
	artifact: CompiledBrandingArtifact,
): Promise<void> {
	assertCompatibleBrandingArtifact(artifact);
	const { compiledHash, ...payload } = artifact;
	const actualHash = await sha256(canonicalJson(payload));
	if (actualHash !== compiledHash) {
		throw new Error("Branding artifact integrity check failed");
	}
}

export function serializeCompiledBrandingArtifact(
	artifact: CompiledBrandingArtifact,
): string {
	assertCompatibleBrandingArtifact(artifact);
	return canonicalJson(artifact);
}

export async function createCompiledBrandingObject(
	artifact: CompiledBrandingArtifact,
	signer: CompiledBrandingSigner,
): Promise<CompiledBrandingObject> {
	await verifyBrandingArtifact(artifact);
	const byteHash = await sha256(serializeCompiledBrandingArtifact(artifact));
	const signedPayload = compiledObjectSignaturePayload({
		format: "lemn.compiled-branding",
		formatVersion: 1,
		schemaVersion: artifact.schemaVersion,
		compilerVersion: artifact.compilerVersion,
		compiledHash: artifact.compiledHash,
		byteHash,
	});
	const signature = await signer(signedPayload);
	if (
		signature.algorithm !== "Ed25519" ||
		signature.keyId.trim().length === 0 ||
		!/^[A-Za-z0-9_-]+$/.test(signature.value)
	) {
		throw new Error("Compiled branding signer returned an invalid signature");
	}
	return deepFreeze({
		format: "lemn.compiled-branding",
		formatVersion: 1,
		schemaVersion: artifact.schemaVersion,
		compilerVersion: artifact.compilerVersion,
		compiledHash: artifact.compiledHash,
		byteHash,
		artifact,
		signature: { ...signature },
	});
}

export async function verifyCompiledBrandingObject(
	value: CompiledBrandingObject,
	verifier: CompiledBrandingVerifier,
): Promise<void> {
	if (value.format !== "lemn.compiled-branding" || value.formatVersion !== 1) {
		throw new Error("Unsupported compiled branding object format");
	}
	if (
		value.schemaVersion !== value.artifact.schemaVersion ||
		value.compilerVersion !== value.artifact.compilerVersion ||
		value.compiledHash !== value.artifact.compiledHash
	) {
		throw new Error(
			"Compiled branding object metadata does not match its artifact",
		);
	}
	await verifyBrandingArtifact(value.artifact);
	const actualByteHash = await sha256(
		serializeCompiledBrandingArtifact(value.artifact),
	);
	if (actualByteHash !== value.byteHash) {
		throw new Error("Compiled branding object byte hash verification failed");
	}
	const signedPayload = compiledObjectSignaturePayload(value);
	if (!(await verifier(signedPayload, value.signature))) {
		throw new Error("Compiled branding object signature verification failed");
	}
}

function compiledObjectSignaturePayload(
	value: Pick<
		CompiledBrandingObject,
		| "format"
		| "formatVersion"
		| "schemaVersion"
		| "compilerVersion"
		| "compiledHash"
		| "byteHash"
	>,
): string {
	return canonicalJson({
		format: value.format,
		formatVersion: value.formatVersion,
		schemaVersion: value.schemaVersion,
		compilerVersion: value.compilerVersion,
		compiledHash: value.compiledHash,
		byteHash: value.byteHash,
	});
}

function definitionAppearance(
	tokens: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
	return Object.freeze({
		controls: tokens["--lemn-component-controls"] ?? "solid",
		cards: tokens["--lemn-component-cards"] ?? "bordered",
		inputs: tokens["--lemn-component-inputs"] ?? "outlined",
	});
}

type CompiledFontRole = {
	readonly ref: FontCatalogRef;
	readonly source: "system" | "managed";
	readonly stack: string;
	readonly weights: readonly number[];
	readonly styles: readonly FontStyle[];
	readonly fidelity: "preferred" | "required";
	readonly emergencyFallbackRef: FontCatalogRef;
	readonly fontDisplay: "optional" | "block";
};

type CompiledTypography = {
	readonly roles: {
		readonly body: CompiledFontRole;
		readonly heading: CompiledFontRole;
		readonly code: CompiledFontRole;
		readonly label: CompiledFontRole;
	};
	readonly resources: readonly CompiledFontResource[];
};

function compileTypography(
	scopeNamespace: string,
	typography: BrandingTypography,
): CompiledTypography {
	const body = compileDirectFontSelection(
		scopeNamespace,
		typography.body,
		"body",
	);
	const heading =
		typography.heading.source === "inherit"
			? body
			: compileDirectFontSelection(
					scopeNamespace,
					typography.heading,
					"heading",
				);
	const code = compileDirectFontSelection(
		scopeNamespace,
		typography.code,
		"code",
	);
	const label =
		typography.label.source === "inherit"
			? typography.label.role === "heading"
				? heading
				: body
			: compileDirectFontSelection(scopeNamespace, typography.label, "label");
	return Object.freeze({
		roles: Object.freeze({
			body: body.role,
			heading: heading.role,
			code: code.role,
			label: label.role,
		}),
		resources: Object.freeze(
			mergeFontResources([
				...body.resources,
				...heading.resources,
				...code.resources,
				...label.resources,
			]),
		),
	});
}

function compileDirectFontSelection(
	scopeNamespace: string,
	selection: DirectFontSelection,
	role: "body" | "heading" | "code" | "label",
): {
	readonly role: CompiledFontRole;
	readonly resources: readonly CompiledFontResource[];
} {
	const record = getFontCatalogRecord(selection.ref);
	const emergency = getFontCatalogRecord(selection.emergencyFallbackRef);
	if (emergency.source !== "system") {
		throw new Error(
			`Emergency fallback '${selection.emergencyFallbackRef}' is not a system font`,
		);
	}
	const managedFamily =
		record.source === "managed"
			? compiledManagedFamily(record.family, scopeNamespace, selection.fidelity)
			: undefined;
	const primaryStack =
		record.source === "system"
			? record.cssStack.map(formatSystemFamily)
			: [`"${managedFamily}"`];
	const stack = [
		...new Set([
			...primaryStack,
			...emergency.cssStack.map(formatSystemFamily),
		]),
	].join(", ");
	const fontDisplay =
		selection.source === "managed" && selection.fidelity === "required"
			? "block"
			: "optional";
	const compiledRole: CompiledFontRole = Object.freeze({
		ref: selection.ref,
		source: selection.source,
		stack,
		weights: Object.freeze(
			[...selection.weights].sort((left, right) => left - right),
		),
		styles: Object.freeze([...selection.styles].sort()),
		fidelity: selection.fidelity,
		emergencyFallbackRef: selection.emergencyFallbackRef,
		fontDisplay,
	});
	if (record.source === "system") return { role: compiledRole, resources: [] };
	const resources = record.resources
		.filter(
			(resource) =>
				selection.styles.includes(resource.style) &&
				selection.weights.some((weight) => inWeightRange(weight, resource)),
		)
		.map((resource) =>
			compileManagedResource(
				scopeNamespace,
				managedFamily ?? record.family,
				record,
				resource,
				selection,
				role,
				fontDisplay,
			),
		);
	return { role: compiledRole, resources: Object.freeze(resources) };
}

function compileManagedResource(
	scopeNamespace: string,
	family: string,
	record: ManagedFontCatalogRecord,
	resource: FontCatalogResource,
	selection: DirectFontSelection,
	role: "body" | "heading" | "code" | "label",
	fontDisplay: "optional" | "block",
): CompiledFontResource {
	return Object.freeze({
		id: `${scopeNamespace}.${selection.fidelity}.${resource.id}`,
		catalogRef: record.ref,
		family,
		url: resource.url,
		format: resource.format,
		style: resource.style,
		weightRange: resource.weightRange,
		subset: resource.subset,
		unicodeRange: resource.unicodeRange,
		estimatedBytes: resource.estimatedBytes,
		sha256: resource.sha256,
		integrity: resource.integrity,
		immutable: resource.immutable,
		provisional: resource.provisional,
		fidelity: selection.fidelity,
		preload:
			selection.fidelity === "required" &&
			(role === "body" || role === "heading"),
		fontDisplay,
	});
}

function inWeightRange(weight: number, resource: FontCatalogResource): boolean {
	return weight >= resource.weightRange[0] && weight <= resource.weightRange[1];
}

function mergeFontResources(
	resources: readonly CompiledFontResource[],
): CompiledFontResource[] {
	const byId = new Map<string, CompiledFontResource>();
	for (const resource of resources) {
		const existing = byId.get(resource.id);
		if (!existing) {
			byId.set(resource.id, resource);
			continue;
		}
		const required =
			existing.fidelity === "required" || resource.fidelity === "required";
		byId.set(
			resource.id,
			Object.freeze({
				...existing,
				fidelity: required ? "required" : "preferred",
				preload: existing.preload || resource.preload,
				fontDisplay: required ? "block" : "optional",
			}),
		);
	}
	return [...byId.values()].sort((left, right) =>
		left.id.localeCompare(right.id),
	);
}

function sumUniqueFontBytes(
	resources: readonly CompiledFontResource[],
): number {
	const byUrl = new Map<string, number>();
	for (const resource of resources)
		byUrl.set(resource.url, resource.estimatedBytes);
	return [...byUrl.values()].reduce((total, bytes) => total + bytes, 0);
}

function compileFontNetworkPolicy(
	resources: readonly CompiledFontResource[],
): FontNetworkPolicy {
	const origins = [
		...new Set(resources.map((resource) => new URL(resource.url).origin)),
	].sort();
	return Object.freeze({
		mode: resources.length === 0 ? "none" : "managed-immutable-cdn",
		requiresNetwork: resources.length > 0,
		allowedOrigins: Object.freeze(origins),
		emergencyFallbackRequired: true,
	});
}

function fontFaceCss(resource: CompiledFontResource): string {
	return [
		"@font-face {",
		`  font-family: "${resource.family}";`,
		`  src: url("${resource.url}") format("${resource.format}");`,
		`  font-style: ${resource.style};`,
		`  font-weight: ${resource.weightRange[0]} ${resource.weightRange[1]};`,
		`  font-display: ${resource.fontDisplay};`,
		`  unicode-range: ${resource.unicodeRange};`,
		"}",
	].join("\n");
}

function formatSystemFamily(family: string): string {
	const genericFamilies = new Set([
		"system-ui",
		"ui-serif",
		"ui-sans-serif",
		"ui-monospace",
		"sans-serif",
		"serif",
		"monospace",
	]);
	return genericFamilies.has(family) || /^[a-zA-Z-]+$/.test(family)
		? family
		: `"${family}"`;
}

function compiledManagedFamily(
	family: string,
	scopeNamespace: string,
	fidelity: "preferred" | "required",
): string {
	return `${family}--lemn-${scopeNamespace.slice(0, 16)}-${fidelity}`;
}

function validateMode(
	modeId: string,
	mode: BrandingMode,
): BrandingDiagnostic[] {
	const result: BrandingDiagnostic[] = [];
	const normal = mode.accessibility.normalTextContrast;
	const nonText = mode.accessibility.nonTextContrast;
	const pairs: Array<[string, string, string, string, number]> = [
		["text", mode.colors.text, "canvas", mode.colors.canvas, normal],
		["text", mode.colors.text, "surface", mode.colors.surface, normal],
		[
			"textMuted",
			mode.colors.textMuted,
			"surface",
			mode.colors.surface,
			normal,
		],
		[
			"accentForeground",
			mode.colors.accentForeground,
			"accent",
			mode.colors.accent,
			normal,
		],
		["focus", mode.colors.focus, "canvas", mode.colors.canvas, nonText],
		[
			"borderStrong",
			mode.colors.borderStrong,
			"surface",
			mode.colors.surface,
			nonText,
		],
		[
			"success.foreground",
			mode.colors.success.foreground,
			"success.surface",
			mode.colors.success.surface,
			normal,
		],
		[
			"warning.foreground",
			mode.colors.warning.foreground,
			"warning.surface",
			mode.colors.warning.surface,
			normal,
		],
		[
			"danger.foreground",
			mode.colors.danger.foreground,
			"danger.surface",
			mode.colors.danger.surface,
			normal,
		],
		[
			"info.foreground",
			mode.colors.info.foreground,
			"info.surface",
			mode.colors.info.surface,
			normal,
		],
		[
			"visualization.axis",
			mode.visualization.axis,
			"canvas",
			mode.colors.canvas,
			normal,
		],
		[
			"visualization.tooltipText",
			mode.visualization.tooltipText,
			"visualization.tooltipSurface",
			mode.visualization.tooltipSurface,
			normal,
		],
	];
	for (const [
		foregroundName,
		foreground,
		backgroundName,
		background,
		required,
	] of pairs) {
		const actual = contrastRatio(foreground, background);
		if (actual + Number.EPSILON >= required) continue;
		result.push({
			code: "BRANDING_CONTRAST_REQUIRED",
			severity: "error",
			path: `modes.${modeId}.${foregroundName}`,
			message: `${foregroundName} must reach ${required.toFixed(1)}:1 against ${backgroundName}; received ${actual.toFixed(2)}:1`,
			actual,
			required,
			suggestion: bestContrastingColor(background),
		});
	}
	const gridContrast = contrastRatio(
		mode.visualization.grid,
		mode.colors.canvas,
	);
	if (gridContrast < 1.2) {
		result.push({
			code: "BRANDING_CHART_GRID_LOW_CONTRAST",
			severity: "warning",
			path: `modes.${modeId}.visualization.grid`,
			message: "Chart grid may be imperceptible against the canvas",
			actual: gridContrast,
			required: 1.2,
		});
	}
	return result;
}

function compileMode(
	scopeNamespace: string,
	modeId: string,
	mode: BrandingMode,
	typography: BrandingTypography,
	compiledTypography: CompiledTypography,
): Omit<CompiledBrandingMode, "modeHash"> {
	const tokens = compileTokens(mode, typography, compiledTypography);
	const scopeId = `${scopeNamespace}-${modeId}`;
	const selector = `[data-lemn-brand-scope="${scopeId}"]`;
	const fontBody = tokens["--lemn-font-body"] ?? "system-ui, sans-serif";
	const axis = {
		axisLine: { lineStyle: { color: mode.visualization.axis } },
		axisTick: { lineStyle: { color: mode.visualization.axis } },
		axisLabel: { color: mode.visualization.axis, fontFamily: fontBody },
		splitLine: { lineStyle: { color: mode.visualization.grid } },
		nameTextStyle: { color: mode.visualization.axis, fontFamily: fontBody },
	};
	const base = {
		id: scopeId,
		modeId,
		colorScheme: mode.colorScheme,
		selector,
		attributes: Object.freeze({
			"data-lemn-brand-scope": scopeId,
			"data-lemn-branding": scopeNamespace,
			"data-lemn-mode": modeId,
		}),
		fontResourceIds: Object.freeze(
			compiledTypography.resources.map((resource) => resource.id),
		),
		tokens: Object.freeze(tokens),
		recharts: Object.freeze({
			series: Object.freeze([...mode.visualization.categorical]),
			positive: mode.visualization.positive,
			negative: mode.visualization.negative,
			neutral: mode.visualization.neutral,
			axis: mode.visualization.axis,
			grid: mode.visualization.grid,
			cursor: mode.visualization.cursor,
			selection: mode.visualization.selection,
			tooltip: Object.freeze({
				background: mode.visualization.tooltipSurface,
				border: mode.visualization.tooltipBorder,
				text: mode.visualization.tooltipText,
			}),
		}),
		echarts: Object.freeze({
			color: Object.freeze([...mode.visualization.categorical]),
			backgroundColor: "transparent",
			textStyle: { color: mode.colors.text, fontFamily: fontBody },
			legend: {
				textStyle: { color: mode.colors.textMuted, fontFamily: fontBody },
			},
			categoryAxis: axis,
			valueAxis: axis,
			tooltip: {
				backgroundColor: mode.visualization.tooltipSurface,
				borderColor: mode.visualization.tooltipBorder,
				borderWidth: parseFloat(mode.shape.borderWidth),
				textStyle: {
					color: mode.visualization.tooltipText,
					fontFamily: fontBody,
				},
				extraCssText: `border-radius:${mode.shape.radiusControl};box-shadow:${mode.elevation.overlay}`,
			},
		}),
		configuration: structuredClone(mode),
	};
	return Object.freeze({ ...base, css: scopeCss(base) });
}

function compileTokens(
	mode: BrandingMode,
	typography: BrandingTypography,
	compiledTypography: CompiledTypography,
): Record<string, string> {
	const colors = mode.colors;
	const visualization = mode.visualization;
	const accentMix = mode.colorScheme === "dark" ? "#ffffff" : "#000000";
	const seriesTokens = Object.fromEntries(
		Array.from({ length: 8 }, (_, index) => [
			`--lemn-chart-series-${index + 1}`,
			visualization.categorical[index % visualization.categorical.length] ??
				visualization.neutral,
		]),
	);
	const spacing = (pixels: number): string =>
		`${formatTokenNumber(pixels * mode.spacingAndDensity.scale)}px`;
	const bodyWeights = [...compiledTypography.roles.body.weights].sort(
		(left, right) => left - right,
	);
	const headingWeights = [...compiledTypography.roles.heading.weights].sort(
		(left, right) => left - right,
	);
	const closestWeight = (weights: readonly number[], target: number): number =>
		weights.reduce(
			(closest, value) =>
				Math.abs(value - target) < Math.abs(closest - target) ? value : closest,
			weights[0] ?? target,
		);
	return {
		"--lemn-color-canvas": colors.canvas,
		"--lemn-color-surface": colors.surface,
		"--lemn-color-surface-muted": colors.surfaceMuted,
		"--lemn-color-surface-elevated": colors.surfaceElevated,
		"--lemn-color-surface-overlay": colors.surfaceOverlay,
		"--lemn-color-text": colors.text,
		"--lemn-color-text-muted": colors.textMuted,
		"--lemn-color-text-inverse": colors.textInverse,
		"--lemn-color-accent": colors.accent,
		"--lemn-color-accent-foreground": colors.accentForeground,
		"--lemn-color-accent-hover": mixHexColors(colors.accent, accentMix, 0.1),
		"--lemn-color-accent-pressed": mixHexColors(colors.accent, accentMix, 0.18),
		"--lemn-color-accent-soft": translucentHex(
			colors.accent,
			mode.colorScheme === "dark" ? 0.2 : 0.12,
		),
		"--lemn-color-border": colors.border,
		"--lemn-color-border-strong": colors.borderStrong,
		"--lemn-color-focus": colors.focus,
		"--lemn-color-selection": colors.selection,
		"--lemn-color-disabled-surface": colors.disabledSurface,
		"--lemn-color-disabled-text": colors.disabledText,
		"--lemn-color-overlay-scrim": translucentHex(
			colors.text,
			mode.colorScheme === "dark" ? 0.72 : 0.45,
		),
		"--lemn-color-success": colors.success.border,
		"--lemn-color-success-surface": colors.success.surface,
		"--lemn-color-success-foreground": colors.success.foreground,
		"--lemn-color-warning": colors.warning.border,
		"--lemn-color-warning-surface": colors.warning.surface,
		"--lemn-color-warning-foreground": colors.warning.foreground,
		"--lemn-color-danger": colors.danger.border,
		"--lemn-color-danger-surface": colors.danger.surface,
		"--lemn-color-danger-foreground": colors.danger.foreground,
		"--lemn-color-info": colors.info.border,
		"--lemn-color-info-surface": colors.info.surface,
		"--lemn-color-info-foreground": colors.info.foreground,
		"--lemn-font-body": compiledTypography.roles.body.stack,
		"--lemn-font-heading": compiledTypography.roles.heading.stack,
		"--lemn-font-code": compiledTypography.roles.code.stack,
		"--lemn-font-label": compiledTypography.roles.label.stack,
		"--lemn-font-display": compiledTypography.roles.body.fontDisplay,
		"--lemn-font-size-base": `${typography.baseSize}px`,
		"--lemn-font-size-display": `${typography.displaySize}px`,
		"--lemn-font-size-title": `${typography.titleSize}px`,
		"--lemn-font-size-heading": `${Math.round(typography.baseSize * 1.125)}px`,
		"--lemn-font-size-body": `${typography.baseSize}px`,
		"--lemn-font-size-small": `${Math.max(10, typography.baseSize - 1)}px`,
		"--lemn-font-size-caption": `${Math.max(10, typography.baseSize - 2)}px`,
		"--lemn-font-size-mono": `${Math.max(10, typography.baseSize - 1)}px`,
		"--lemn-line-height-body": String(typography.bodyLineHeight),
		"--lemn-line-height-heading": String(typography.headingLineHeight),
		"--lemn-line-height-display": String(typography.headingLineHeight),
		"--lemn-line-height-title": String(typography.headingLineHeight),
		"--lemn-line-height-small": String(typography.bodyLineHeight),
		"--lemn-line-height-caption": String(typography.bodyLineHeight),
		"--lemn-line-height-mono": String(typography.bodyLineHeight),
		"--lemn-letter-spacing": `${typography.tracking}em`,
		"--lemn-font-weight-regular": String(closestWeight(bodyWeights, 400)),
		"--lemn-font-weight-medium": String(closestWeight(bodyWeights, 500)),
		"--lemn-font-weight-semibold": String(closestWeight(headingWeights, 600)),
		"--lemn-border-width": mode.shape.borderWidth,
		"--lemn-border-style": mode.shape.borderStyle,
		"--lemn-radius-small": mode.shape.radiusSmall,
		"--lemn-radius-medium": mode.shape.radiusMedium,
		"--lemn-radius-large": mode.shape.radiusLarge,
		"--lemn-radius-control": mode.shape.radiusControl,
		"--lemn-radius-card": mode.shape.radiusCard,
		"--lemn-radius-pill": mode.shape.radiusPill,
		"--lemn-radius-full": mode.shape.radiusPill,
		"--lemn-outline-treatment": mode.shape.outlineTreatment,
		"--lemn-shadow-raised": mode.elevation.raised,
		"--lemn-shadow-overlay": mode.elevation.overlay,
		"--lemn-shadow-modal": mode.elevation.modal,
		"--lemn-focus-ring-width": mode.elevation.focusRingWidth,
		"--lemn-focus-ring-offset": mode.elevation.focusRingOffset,
		"--lemn-density-scale": String(mode.spacingAndDensity.scale),
		"--lemn-space-0": "0",
		"--lemn-space-1": spacing(4),
		"--lemn-space-2": spacing(8),
		"--lemn-space-3": spacing(12),
		"--lemn-space-4": spacing(16),
		"--lemn-space-5": spacing(20),
		"--lemn-space-6": spacing(24),
		"--lemn-space-8": spacing(32),
		"--lemn-space-10": spacing(40),
		"--lemn-space-12": spacing(48),
		"--lemn-space-16": spacing(64),
		"--lemn-control-height": mode.spacingAndDensity.controlHeight,
		"--lemn-content-gutter": mode.spacingAndDensity.contentGutter,
		"--lemn-duration-fast": mode.motion.durationFast,
		"--lemn-duration-instant": mode.motion.durationFast,
		"--lemn-duration-normal": mode.motion.durationNormal,
		"--lemn-duration-slow": mode.motion.durationSlow,
		"--lemn-easing-standard": mode.motion.easingStandard,
		"--lemn-easing-emphasized": mode.motion.easingEmphasized,
		"--lemn-easing-linear": "linear",
		"--lemn-chart-axis": visualization.axis,
		"--lemn-chart-grid": visualization.grid,
		"--lemn-chart-label": visualization.label ?? visualization.axis,
		"--lemn-chart-crosshair": visualization.crosshair ?? visualization.cursor,
		"--lemn-chart-cursor": visualization.cursor,
		"--lemn-chart-hover": translucentHex(
			colors.accent,
			mode.colorScheme === "dark" ? 0.16 : 0.12,
		),
		"--lemn-chart-selection": visualization.selection,
		"--lemn-chart-tooltip-surface": visualization.tooltipSurface,
		"--lemn-chart-tooltip-border": visualization.tooltipBorder,
		"--lemn-chart-tooltip-text": visualization.tooltipText,
		"--lemn-chart-positive": visualization.positive,
		"--lemn-chart-negative": visualization.negative,
		"--lemn-chart-neutral": visualization.neutral,
		"--lemn-chart-muted-opacity": String(visualization.mutedOpacity),
		"--lemn-chart-inactive-opacity": String(visualization.inactiveOpacity),
		"--lemn-component-controls": mode.componentAppearance.controls,
		"--lemn-component-cards": mode.componentAppearance.cards,
		"--lemn-component-inputs": mode.componentAppearance.inputs,
		"--lemn-shadow-none": "none",
		"--lemn-content-max": "1200px",
		"--lemn-scrollbar-track": colors.surfaceMuted,
		"--lemn-scrollbar-thumb": colors.borderStrong,
		"--lemn-scrollbar-thumb-hover": colors.textMuted,
		"--lemn-scrollbar-size": "10px",
		"--lemn-z-raised": "1",
		"--lemn-z-chrome": "10",
		"--lemn-z-window": "50",
		"--lemn-z-scrim": "100",
		"--lemn-z-drawer": "101",
		"--lemn-z-dropdown": "1000",
		"--lemn-z-modal": "1100",
		"--lemn-z-popover": "1200",
		"--lemn-z-toast": "1300",
		...seriesTokens,
	};
}

function formatTokenNumber(value: number): string {
	return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function scopeCss(
	scope: Pick<CompiledBrandingMode, "selector" | "colorScheme" | "tokens">,
): string {
	const declarations = Object.entries(scope.tokens)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([name, value]) => `  ${name}: ${value};`);
	return [
		`${scope.selector} {`,
		`  color-scheme: ${scope.colorScheme};`,
		...declarations,
		"}",
	].join("\n");
}

function formatPath(path: readonly PropertyKey[]): string {
	return path.map(String).join(".") || "$";
}

function deepFreeze<T>(value: T): T {
	if (value === null || typeof value !== "object") return value;
	for (const child of Object.values(value as Record<string, unknown>))
		deepFreeze(child);
	return Object.freeze(value);
}
