import { z } from "zod";

export const BRAND_PROJECT_SCHEMA_URL =
	"https://schemas.ui.le-mn.com/brand-project/v1.json" as const;

const hexColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hexadecimal color");

export const brandProjectSchema = z
	.object({
		$schema: z.literal(BRAND_PROJECT_SCHEMA_URL),
		schemaVersion: z.literal(1),
		id: z
			.string()
			.min(3)
			.max(40)
			.regex(/^[a-z][a-z0-9-]+$/, "Use a lowercase project id"),
		name: z.string().trim().min(1).max(64),
		appearance: z.enum(["light", "dark"]),
		colors: z
			.object({
				background: hexColorSchema,
				surface: hexColorSchema,
				surfaceMuted: hexColorSchema,
				text: hexColorSchema,
				textMuted: hexColorSchema,
				accent: hexColorSchema,
				accentForeground: hexColorSchema,
				border: hexColorSchema,
				focus: hexColorSchema,
				chartPrimary: hexColorSchema,
				chartSecondary: hexColorSchema,
				chartTertiary: hexColorSchema,
			})
			.strict(),
		typography: z
			.object({
				bodyFamily: z.enum([
					"system-sans",
					"apple-system",
					"humanist",
					"editorial",
					"mono",
				]),
				headingFamily: z.enum([
					"system-sans",
					"apple-system",
					"humanist",
					"editorial",
					"mono",
				]),
				baseSize: z.number().int().min(14).max(18),
				headingWeight: z.number().int().min(500).max(800),
			})
			.strict(),
		shape: z
			.object({
				controlRadius: z.number().int().min(0).max(20),
				cardRadius: z.number().int().min(0).max(28),
				borderWidth: z.number().min(0).max(3),
			})
			.strict(),
		elevation: z.enum(["none", "subtle", "strong"]),
		density: z.enum(["compact", "comfortable", "spacious"]),
	})
	.strict();

export type BrandProject = z.infer<typeof brandProjectSchema>;
export type BrandColorKey = keyof BrandProject["colors"];
export type BrandFontFamily = BrandProject["typography"]["bodyFamily"];

export function parseBrandProject(input: unknown): BrandProject {
	return brandProjectSchema.parse(input);
}
