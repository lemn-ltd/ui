import type { CompiledBrandingObject } from "@lemn-ltd/brand-contract";
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

const identifierSchema = z.string().trim().min(1).max(200);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const timestampSchema = z.string().datetime({ offset: true });

const compiledObjectSchema = z
	.object({
		format: z.literal("lemn.compiled-branding"),
		formatVersion: z.literal(1),
		schemaVersion: z.number().int().positive(),
		compilerVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
		compiledHash: sha256Schema,
		byteHash: sha256Schema,
		artifact: z.record(z.string(), jsonValueSchema),
		signature: z
			.object({
				algorithm: z.literal("Ed25519"),
				keyId: identifierSchema,
				value: z.string().regex(/^[A-Za-z0-9_-]+$/),
			})
			.strict(),
	})
	.strict();

const assetDeliverySchema = z
	.object({
		href: z.string().min(1).max(2048),
		integrity: z.string().min(1).max(300).optional(),
	})
	.strict();

const runtimeEnvelopeBaseSchema = z
	.object({
		workspaceId: identifierSchema,
		brandingVersionId: identifierSchema,
		modeId: identifierSchema,
		definitionHash: sha256Schema,
		compiledHash: sha256Schema,
		byteHash: sha256Schema,
		compiledObject: compiledObjectSchema,
		assetDeliveries: z.record(z.string(), assetDeliverySchema).default({}),
		etag: z.string().min(3).max(300).optional(),
	})
	.strict();

const runtimeEnvelopeSchema = z.discriminatedUnion("source", [
	runtimeEnvelopeBaseSchema
		.extend({
			source: z.literal("active"),
			version: z.number().int().positive(),
		})
		.strict(),
	runtimeEnvelopeBaseSchema
		.extend({
			source: z.literal("preview"),
			version: z.null(),
			previewSessionId: identifierSchema,
			expiresAt: timestampSchema,
		})
		.strict(),
	runtimeEnvelopeBaseSchema
		.extend({
			source: z.literal("embedded-fallback"),
			version: z.number().int().positive(),
			exportedAt: timestampSchema,
		})
		.strict(),
]);

export function parseRuntimeBrandingEnvelope(
	input: unknown,
): RuntimeBrandingEnvelope {
	const parsed = runtimeEnvelopeSchema.parse(input);
	return {
		...parsed,
		compiledObject: parsed.compiledObject as unknown as CompiledBrandingObject,
	};
}

export function parseEmbeddedBrandingFallback(
	input: unknown,
): EmbeddedBrandingFallback {
	const envelope = parseRuntimeBrandingEnvelope(input);
	if (envelope.source !== "embedded-fallback" || !envelope.exportedAt) {
		throw new Error("Embedded branding fallback has an invalid source");
	}
	return {
		...envelope,
		source: "embedded-fallback",
		exportedAt: envelope.exportedAt,
	};
}
