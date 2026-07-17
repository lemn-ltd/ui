import { serializeBootstrapJson } from "@lemn-ltd/brand-contract";
import { BrandingRuntimeError } from "./errors.js";
import type { ResolvedBranding } from "./types.js";

export type BrandingSsrParts = {
	readonly htmlAttributes: Readonly<Record<string, string>>;
	readonly headMarkup: string;
	readonly bootstrapMarkup: string;
	readonly hydrationIdentity: BrandingHydrationIdentity;
};

export type BrandingHydrationDocument = {
	readonly projectionHash: string;
	readonly bootstrap: ResolvedBranding["bootstrap"];
};

export type BrandingHydrationIdentity = {
	readonly projectionHash: string;
	readonly compiledHash: string;
	readonly modeId: string;
	readonly modeHash: string;
	readonly colorScheme: "light" | "dark";
};

export function createBrandingSsrParts(
	branding: ResolvedBranding,
	options: { readonly nonce?: string } = {},
): BrandingSsrParts {
	assertResolvedBrandingIdentity(branding);
	const nonce = options.nonce
		? ` nonce="${escapeAttribute(validateNonce(options.nonce))}"`
		: "";
	const preloadMarkup = branding.fontPreloads
		.map(
			(preload) =>
				`<link rel="preload" href="${escapeAttribute(preload.href)}" as="font" type="font/woff2" crossorigin="anonymous" integrity="${escapeAttribute(preload.integrity)}">`,
		)
		.join("");
	const styleMarkup = `<style data-lemn-critical-branding="${branding.projectionHash}"${nonce}>${escapeStyleText(branding.criticalCss)}</style>`;
	const colorSchemeMarkup = `<meta name="color-scheme" content="${branding.colorScheme}">`;
	const hydrationDocument: BrandingHydrationDocument = {
		projectionHash: branding.projectionHash,
		bootstrap: branding.bootstrap,
	};
	const hydrationIdentity: BrandingHydrationIdentity = Object.freeze({
		projectionHash: branding.projectionHash,
		compiledHash: branding.compiledHash,
		modeId: branding.modeId,
		modeHash: branding.bootstrap.modeHash,
		colorScheme: branding.colorScheme,
	});
	const bootstrap = serializeBootstrapJson(hydrationDocument);
	const bootstrapMarkup = `<script id="lemn-branding-bootstrap" type="application/json" data-lemn-branding-bootstrap="${branding.projectionHash}"${nonce}>${bootstrap}</script>`;
	return Object.freeze({
		htmlAttributes: Object.freeze({
			...branding.bootstrap.attributes,
			"data-lemn-branding-version": branding.brandingVersionId,
			"data-lemn-branding-hash": branding.compiledHash,
			"data-lemn-branding-projection-hash": branding.projectionHash,
			"data-lemn-branding-mode-hash": branding.bootstrap.modeHash,
			"data-lemn-branding-source": branding.source,
			"data-lemn-color-scheme": branding.colorScheme,
		}),
		headMarkup: `${colorSchemeMarkup}${preloadMarkup}${styleMarkup}`,
		bootstrapMarkup,
		hydrationIdentity,
	});
}

export function assertBrandingHydrationIdentity(
	expected: BrandingHydrationIdentity,
	document: unknown,
): asserts document is BrandingHydrationDocument {
	if (
		!/^[a-f0-9]{64}$/.test(expected.projectionHash) ||
		!/^[a-f0-9]{64}$/.test(expected.compiledHash) ||
		!/^[a-f0-9]{64}$/.test(expected.modeHash) ||
		!isRecord(document) ||
		!isRecord(document.bootstrap) ||
		document.projectionHash !== expected.projectionHash ||
		document.bootstrap.compiledHash !== expected.compiledHash ||
		document.bootstrap.modeId !== expected.modeId ||
		document.bootstrap.modeHash !== expected.modeHash ||
		document.bootstrap.colorScheme !== expected.colorScheme
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"Server branding and hydration bootstrap do not match",
		);
	}
}

export function brandingContentSecurityPolicySources(
	branding: ResolvedBranding,
): {
	readonly fontSrc: readonly string[];
	readonly imageSrc: readonly string[];
} {
	const fontSrc = new Set<string>();
	const imageSrc = new Set<string>();
	for (const origin of branding.fontResourceOrigins) {
		fontSrc.add(parseExactHttpsOrigin(origin, "font resource"));
	}
	for (const preload of branding.fontPreloads) {
		const preloadOrigin = parseHttpsResourceOrigin(
			preload.href,
			"font preload",
		);
		if (!fontSrc.has(preloadOrigin)) {
			throw new BrandingRuntimeError(
				"BRANDING_RUNTIME_INTEGRITY_FAILED",
				"A font preload origin is missing from the verified resource policy",
			);
		}
	}
	for (const asset of branding.assetReferences) addOrigin(asset.href, imageSrc);
	return Object.freeze({
		fontSrc: Object.freeze([...fontSrc].sort()),
		imageSrc: Object.freeze([...imageSrc].sort()),
	});
}

function parseExactHttpsOrigin(value: string, label: string): string {
	const origin = parseHttpsResourceOrigin(value, label);
	if (origin !== value) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			`The verified ${label} origin is invalid`,
		);
	}
	return origin;
}

function parseHttpsResourceOrigin(value: string, label: string): string {
	if (hasControlCharacters(value) || value.includes("\\")) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			`The verified ${label} URL is invalid`,
		);
	}
	let url: URL;
	try {
		url = new URL(value);
	} catch (error) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			`The verified ${label} URL is invalid`,
			error,
		);
	}
	if (
		url.protocol !== "https:" ||
		url.username.length > 0 ||
		url.password.length > 0
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			`The verified ${label} URL must use credential-free HTTPS`,
		);
	}
	return url.origin;
}

function hasControlCharacters(value: string): boolean {
	for (const character of value) {
		const codePoint = character.codePointAt(0);
		if (codePoint !== undefined && codePoint < 32) return true;
	}
	return false;
}

function assertResolvedBrandingIdentity(branding: ResolvedBranding): void {
	if (
		!/^[a-f0-9]{64}$/.test(branding.projectionHash) ||
		branding.bootstrap.compiledHash !== branding.compiledHash ||
		branding.bootstrap.definitionHash !== branding.definitionHash ||
		branding.bootstrap.modeId !== branding.modeId ||
		branding.bootstrap.colorScheme !== branding.colorScheme
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_INTEGRITY_FAILED",
			"Resolved branding identity is inconsistent",
		);
	}
}

function escapeStyleText(value: string): string {
	return value.replaceAll("<", "\\3C ");
}

function escapeAttribute(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function validateNonce(value: string): string {
	if (
		value.length < 8 ||
		value.length > 256 ||
		!/^[A-Za-z0-9+/_=-]+$/.test(value)
	) {
		throw new BrandingRuntimeError(
			"BRANDING_RUNTIME_CONFIGURATION_INVALID",
			"The CSP nonce is invalid",
		);
	}
	return value;
}

function addOrigin(value: string, target: Set<string>): void {
	if (value.startsWith("/")) {
		target.add("'self'");
		return;
	}
	target.add(new URL(value).origin);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
