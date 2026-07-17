import type { CompiledBrandingModeObject } from "@lemn-ltd/brand-contract";
import { z } from "zod";
import type {
	EmbeddedBrandingFallback,
	RuntimeBrandingEnvelope,
} from "./types.js";

type JsonValue =
	| null
	| boolean
	| number
	| string
	| JsonValue[]
	| { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
	z.union([
		z.null(),
		z.boolean(),
		z.number().finite(),
		z.string(),
		z.array(jsonValueSchema),
		z.record(z.string(), jsonValueSchema),
	]),
);

const identifierSchema = z
	.string()
	.min(1)
	.max(200)
	.refine(
		(value) => value.trim() === value && !hasControlCharacters(value),
		"Identifier must be canonical and contain no control characters",
	);
const signatureKeyIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,200}$/);
const draftTitleSchema = z
	.string()
	.min(1)
	.max(160)
	.refine(
		(value) => value.trim() === value && !hasControlCharacters(value),
		"Draft title must be canonical and contain no control characters",
	);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const integritySchema = z.string().regex(/^sha256-[A-Za-z0-9+/]+={0,2}$/);
const mediaTypeSchema = z
	.string()
	.min(3)
	.max(80)
	.regex(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i);
const timestampSchema = z.string().datetime({ offset: true });
const stringRecordSchema = z.record(z.string(), z.string());

const signatureSchema = z
	.object({
		algorithm: z.literal("Ed25519"),
		keyId: signatureKeyIdSchema,
		value: z.string().regex(/^[A-Za-z0-9_-]+$/),
	})
	.strict();

const fontPreloadSchema = z
	.object({
		resourceId: identifierSchema,
		rel: z.literal("preload"),
		href: z.string().min(1).max(2048),
		as: z.literal("font"),
		type: z.literal("font/woff2"),
		crossOrigin: z.literal("anonymous"),
		integrity: integritySchema,
	})
	.strict();

const assetReferenceSchema = z
	.object({
		id: identifierSchema,
		roles: z.array(identifierSchema),
		href: z.string().min(1).max(2048),
		sha256: sha256Schema,
		mediaType: mediaTypeSchema,
		integrity: integritySchema,
		width: z.number().int().positive().optional(),
		height: z.number().int().positive().optional(),
		accessibleLabel: z
			.string()
			.min(1)
			.max(120)
			.refine(
				(value) => value.trim() === value && !hasControlCharacters(value),
				"Accessible label must be canonical and contain no control characters",
			)
			.optional(),
		licenseId: z
			.string()
			.min(1)
			.max(80)
			.refine(
				(value) => value.trim() === value && !hasControlCharacters(value),
				"License identifier must be canonical and contain no control characters",
			)
			.optional(),
	})
	.strict();

const bootstrapSchema = z
	.object({
		schemaVersion: z.number().int().positive(),
		compilerVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
		definitionHash: sha256Schema,
		compiledHash: sha256Schema,
		modeHash: sha256Schema,
		modeId: identifierSchema,
		colorScheme: z.enum(["light", "dark"]),
		scopeId: identifierSchema,
		attributes: stringRecordSchema,
		tokens: stringRecordSchema,
		visualization: z
			.object({
				recharts: z.record(z.string(), jsonValueSchema),
				echarts: z.record(z.string(), jsonValueSchema),
			})
			.strict(),
		iconography: z
			.object({
				family: z
					.string()
					.min(1)
					.max(80)
					.refine(
						(value) => value.trim() === value && !hasControlCharacters(value),
						"Icon family must be canonical and contain no control characters",
					),
				style: z.enum(["outline", "filled", "duotone"]),
				strokeWidth: z.number().min(0.5).max(4),
				defaultSize: z
					.string()
					.max(24)
					.regex(/^(?:0|\d+(?:\.\d+)?(?:px|rem|em))$/),
				customSetAssetId: identifierSchema.optional(),
			})
			.strict(),
		componentAppearance: stringRecordSchema,
	})
	.strict();

const modeProjectionSchema = z
	.object({
		workspaceId: identifierSchema,
		brandingVersionId: identifierSchema,
		version: z.number().int().positive().nullable(),
		schemaVersion: z.number().int().positive(),
		compilerVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
		definitionHash: sha256Schema,
		compiledHash: sha256Schema,
		defaultModeId: identifierSchema,
		allowedModeIds: z.array(identifierSchema).min(1),
		modeId: identifierSchema,
		modeHash: sha256Schema,
		colorScheme: z.enum(["light", "dark"]),
		criticalCss: z.string().min(1),
		bootstrap: bootstrapSchema,
		fontPreloads: z.array(fontPreloadSchema),
		fontResourceOrigins: z.array(z.string().url()),
		assetReferences: z.array(assetReferenceSchema),
	})
	.strict();

const modeObjectSchema = z
	.object({
		format: z.literal("lemn.compiled-branding-mode"),
		formatVersion: z.literal(1),
		projectionHash: sha256Schema,
		projection: modeProjectionSchema,
		signature: signatureSchema,
	})
	.strict();

const runtimeEnvelopeBaseSchema = z
	.object({
		modeObject: modeObjectSchema,
		etag: z.string().min(3).max(300).optional(),
	})
	.strict();

const runtimeEnvelopeSchema = z.discriminatedUnion("source", [
	runtimeEnvelopeBaseSchema
		.extend({
			source: z.literal("active"),
		})
		.strict(),
	runtimeEnvelopeBaseSchema
		.extend({
			source: z.literal("preview"),
			previewSessionId: identifierSchema,
			draftTitle: draftTitleSchema,
			expiresAt: timestampSchema,
		})
		.strict(),
]);

const embeddedFallbackSchema = z
	.object({
		format: z.literal("lemn.embedded-branding-fallback"),
		formatVersion: z.literal(1),
		exportedAt: timestampSchema,
		modes: z.record(identifierSchema, modeObjectSchema),
	})
	.strict();

export function parseRuntimeBrandingEnvelope(
	input: unknown,
): RuntimeBrandingEnvelope {
	const parsed = runtimeEnvelopeSchema.parse(input);
	if (
		(parsed.source === "active" &&
			parsed.modeObject.projection.version === null) ||
		(parsed.source === "preview" &&
			parsed.modeObject.projection.version !== null)
	) {
		throw new Error("Runtime branding source has an invalid signed version");
	}
	return {
		...parsed,
		modeObject: parsed.modeObject as unknown as CompiledBrandingModeObject,
	};
}

export function parseEmbeddedBrandingFallback(
	input: unknown,
): EmbeddedBrandingFallback {
	const parsed = embeddedFallbackSchema.parse(input);
	if (Object.keys(parsed.modes).length === 0) {
		throw new Error("Embedded branding fallback must contain a signed mode");
	}
	return {
		...parsed,
		modes: parsed.modes as unknown as Readonly<
			Record<string, CompiledBrandingModeObject>
		>,
	};
}

function hasControlCharacters(value: string): boolean {
	for (const character of value) {
		const codePoint = character.codePointAt(0);
		if (codePoint !== undefined && codePoint < 32) return true;
	}
	return false;
}
