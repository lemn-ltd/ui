import { serializeBootstrapJson } from "@lemn-ltd/brand-contract";
import { BrandingRuntimeError } from "./errors.js";
import type { ResolvedBranding } from "./types.js";

export type BrandingSsrParts = {
	readonly htmlAttributes: Readonly<Record<string, string>>;
	readonly headMarkup: string;
	readonly bootstrapMarkup: string;
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
	const styleMarkup = `<style data-lemn-critical-branding="${branding.compiledHash}"${nonce}>${escapeStyleText(branding.criticalCss)}</style>`;
	const colorSchemeMarkup = `<meta name="color-scheme" content="${branding.colorScheme}">`;
	const bootstrap = serializeBootstrapJson(branding.bootstrap);
	const bootstrapMarkup = `<script id="lemn-branding-bootstrap" type="application/json" data-lemn-branding-bootstrap="${branding.compiledHash}"${nonce}>${bootstrap}</script>`;
	return Object.freeze({
		htmlAttributes: Object.freeze({
			...branding.bootstrap.attributes,
			"data-lemn-branding-version": branding.brandingVersionId,
			"data-lemn-branding-hash": branding.compiledHash,
			"data-lemn-branding-source": branding.source,
			"data-lemn-color-scheme": branding.colorScheme,
		}),
		headMarkup: `${colorSchemeMarkup}${preloadMarkup}${styleMarkup}`,
		bootstrapMarkup,
	});
}

export function assertBrandingHydrationIdentity(
	serverCompiledHash: string,
	bootstrap: unknown,
): asserts bootstrap is ResolvedBranding["bootstrap"] {
	if (
		!isRecord(bootstrap) ||
		bootstrap.compiledHash !== serverCompiledHash ||
		!/^[a-f0-9]{64}$/.test(serverCompiledHash)
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
	for (const preload of branding.fontPreloads) addOrigin(preload.href, fontSrc);
	for (const asset of branding.assetReferences) addOrigin(asset.href, imageSrc);
	return Object.freeze({
		fontSrc: Object.freeze([...fontSrc].sort()),
		imageSrc: Object.freeze([...imageSrc].sort()),
	});
}

function assertResolvedBrandingIdentity(branding: ResolvedBranding): void {
	if (
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
