import { z } from "zod";

export const BRAND_PROJECT_SCHEMA_URL =
  "https://schemas.ui.le-mn.com/brand-project/v1.json" as const;
export const BRAND_SCHEMA_VERSION = 1 as const;
export const BRAND_COMPILER_VERSION = "1.0.0" as const;

const identifierSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z][a-z0-9_-]*$/, "Use a lowercase slug identifier");

const extensionKeySchema = z
  .string()
  .min(3)
  .max(120)
  .regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)+[a-z][a-z0-9-]*$/, "Use a reverse-domain extension namespace");
const extensionsSchema = z.record(extensionKeySchema, z.unknown());

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, "Use a lowercase SHA-256 digest");
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hexadecimal color");
const cssLengthSchema = z
  .string()
  .max(24)
  .regex(/^(?:0|\d+(?:\.\d+)?(?:px|rem|em))$/, "Use 0, px, rem, or em");
const cssDurationSchema = z
  .string()
  .max(16)
  .regex(/^\d+(?:\.\d+)?(?:ms|s)$/, "Use milliseconds or seconds");
const cssShadowSchema = z
  .string()
  .max(200)
  .refine((value) => value === "none" || !/[{};]/.test(value), "Shadow values cannot contain CSS declarations");
const cssFontNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9 _.-]+$/, "Use a safe font family name");

export const brandAssetSchema = z
  .object({
    id: identifierSchema,
    kind: z.enum(["logo", "icon", "favicon", "font", "illustration"]),
    storageKey: z.string().min(1).max(240).regex(/^[a-zA-Z0-9/_\-.]+$/),
    sha256: sha256Schema,
    mediaType: z.string().min(3).max(80),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    accessibleLabel: z.string().trim().min(1).max(120).optional(),
    licenseId: z.string().trim().min(1).max(80).optional(),
    variants: z.record(identifierSchema, identifierSchema).optional()
  })
  .strict();

const semanticColorSchema = z
  .object({
    surface: hexColorSchema,
    foreground: hexColorSchema,
    border: hexColorSchema
  })
  .strict();

export const brandColorsSchema = z
  .object({
    canvas: hexColorSchema,
    surface: hexColorSchema,
    surfaceMuted: hexColorSchema,
    surfaceElevated: hexColorSchema,
    surfaceOverlay: hexColorSchema,
    text: hexColorSchema,
    textMuted: hexColorSchema,
    textInverse: hexColorSchema,
    accent: hexColorSchema,
    accentForeground: hexColorSchema,
    border: hexColorSchema,
    borderStrong: hexColorSchema,
    focus: hexColorSchema,
    selection: hexColorSchema,
    disabledSurface: hexColorSchema,
    disabledText: hexColorSchema,
    success: semanticColorSchema,
    warning: semanticColorSchema,
    danger: semanticColorSchema,
    info: semanticColorSchema
  })
  .strict();

const fontRoleSchema = z
  .object({
    family: cssFontNameSchema,
    fallbacks: z.array(cssFontNameSchema).min(1).max(8),
    weights: z.array(z.number().int().min(100).max(900)).min(1).max(9),
    assetId: identifierSchema.optional()
  })
  .strict();

export const brandTypographySchema = z
  .object({
    body: fontRoleSchema,
    heading: fontRoleSchema,
    code: fontRoleSchema,
    label: fontRoleSchema.optional(),
    fontDisplay: z.enum(["auto", "block", "swap", "fallback", "optional"]).default("swap"),
    baseSize: z.number().min(12).max(22),
    displaySize: z.number().min(24).max(80),
    titleSize: z.number().min(18).max(48),
    bodyLineHeight: z.number().min(1).max(2),
    headingLineHeight: z.number().min(0.9).max(1.8),
    tracking: z.number().min(-0.08).max(0.2)
  })
  .strict();

export const brandShapeSchema = z
  .object({
    borderWidth: cssLengthSchema,
    borderStyle: z.enum(["solid", "dashed"]),
    radiusSmall: cssLengthSchema,
    radiusMedium: cssLengthSchema,
    radiusLarge: cssLengthSchema,
    radiusControl: cssLengthSchema,
    radiusCard: cssLengthSchema,
    radiusPill: cssLengthSchema,
    outlineTreatment: z.enum(["inside", "outside", "center"]).default("outside")
  })
  .strict();

export const brandElevationSchema = z
  .object({
    raised: cssShadowSchema,
    overlay: cssShadowSchema,
    modal: cssShadowSchema,
    focusRingWidth: cssLengthSchema,
    focusRingOffset: cssLengthSchema
  })
  .strict();

export const brandSpacingSchema = z
  .object({
    density: z.enum(["compact", "comfortable", "spacious"]),
    scale: z.number().min(0.75).max(1.5),
    controlHeight: cssLengthSchema,
    contentGutter: cssLengthSchema
  })
  .strict();

export const brandMotionSchema = z
  .object({
    durationFast: cssDurationSchema,
    durationNormal: cssDurationSchema,
    durationSlow: cssDurationSchema,
    easingStandard: z.string().min(3).max(80).refine((value) => !/[{};]/.test(value)),
    easingEmphasized: z.string().min(3).max(80).refine((value) => !/[{};]/.test(value)),
    decorativeMotion: z.boolean(),
    reducedMotion: z.enum(["disable", "reduce"])
  })
  .strict();

export const brandVisualizationSchema = z
  .object({
    categorical: z.array(hexColorSchema).min(3).max(16),
    sequential: z.array(hexColorSchema).min(2).max(12),
    diverging: z.array(hexColorSchema).min(3).max(13),
    positive: hexColorSchema,
    negative: hexColorSchema,
    neutral: hexColorSchema,
    axis: hexColorSchema,
    grid: hexColorSchema,
    label: hexColorSchema.optional(),
    crosshair: hexColorSchema.optional(),
    tooltipSurface: hexColorSchema,
    tooltipBorder: hexColorSchema,
    tooltipText: hexColorSchema,
    cursor: hexColorSchema,
    selection: hexColorSchema,
    mutedOpacity: z.number().min(0.1).max(1).default(0.55),
    inactiveOpacity: z.number().min(0.05).max(1).default(0.25)
  })
  .strict();

export const brandIconographySchema = z
  .object({
    family: z.string().trim().min(1).max(80),
    style: z.enum(["outline", "filled", "duotone"]),
    strokeWidth: z.number().min(0.5).max(4),
    defaultSize: cssLengthSchema,
    customSetAssetId: identifierSchema.optional()
  })
  .strict();

export const brandAccessibilitySchema = z
  .object({
    standard: z.literal("WCAG-2.2-AA"),
    normalTextContrast: z.number().min(4.5).max(7),
    largeTextContrast: z.number().min(3).max(7),
    nonTextContrast: z.number().min(3).max(7),
    minimumTargetSize: z.number().int().min(24).max(48),
    forceVisibleFocus: z.boolean(),
    forcedColors: z.enum(["system", "preserve"]),
    automaticCorrections: z.enum(["derived-only", "disabled"]).default("derived-only")
  })
  .strict();

export const brandComponentAppearanceSchema = z
  .object({
    controls: z.enum(["solid", "soft", "outline"]),
    cards: z.enum(["flat", "bordered", "elevated"]),
    inputs: z.enum(["outlined", "filled", "underlined"])
  })
  .strict();

export const brandModeSchema = z
  .object({
    colorScheme: z.enum(["light", "dark"]),
    colors: brandColorsSchema,
    typography: brandTypographySchema,
    shape: brandShapeSchema,
    elevation: brandElevationSchema,
    spacingAndDensity: brandSpacingSchema,
    motion: brandMotionSchema,
    visualization: brandVisualizationSchema,
    iconography: brandIconographySchema,
    accessibility: brandAccessibilitySchema,
    componentAppearance: brandComponentAppearanceSchema,
    extensions: extensionsSchema.optional()
  })
  .strict();

export const brandProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(240).optional(),
    extends: identifierSchema.optional(),
    defaultMode: identifierSchema.optional(),
    modes: z.record(identifierSchema, brandModeSchema),
    assets: z
      .object({
        primaryLogo: identifierSchema.optional(),
        compactLogo: identifierSchema.optional(),
        monochromeLogo: identifierSchema.optional(),
        favicon: identifierSchema.optional(),
        appIcon: identifierSchema.optional()
      })
      .strict()
      .optional(),
    runtimeSelection: z
      .object({
        selectable: z.boolean().default(true),
        allowedModes: z.array(identifierSchema).max(12).optional()
      })
      .strict()
      .default({ selectable: true }),
    extensions: extensionsSchema.optional()
  })
  .strict();

export const brandProjectSchema = z
  .object({
    $schema: z.literal(BRAND_PROJECT_SCHEMA_URL),
    schemaVersion: z.literal(BRAND_SCHEMA_VERSION),
    brandId: identifierSchema,
    name: z.string().trim().min(1).max(100),
    metadata: z
      .object({
        description: z.string().trim().max(500).optional(),
        tags: z.array(identifierSchema).max(20).default([]),
        owner: z.string().trim().min(1).max(120).optional(),
        externalReferences: z.record(identifierSchema, z.string().trim().min(1).max(240)).default({})
      })
      .strict()
      .default({ tags: [], externalReferences: {} }),
    assets: z.record(identifierSchema, brandAssetSchema).default({}),
    defaultProfileId: identifierSchema,
    profiles: z.record(identifierSchema, brandProfileSchema),
    extensions: extensionsSchema.optional()
  })
  .strict()
  .superRefine((project, context) => {
    const profileEntries = Object.entries(project.profiles);
    if (profileEntries.length === 0) {
      context.addIssue({ code: "custom", path: ["profiles"], message: "At least one profile is required" });
      return;
    }
    if (!(project.defaultProfileId in project.profiles)) {
      context.addIssue({ code: "custom", path: ["defaultProfileId"], message: "Default profile must exist" });
    }
    for (const [profileId, profile] of profileEntries) {
      if (profile.extends === profileId) {
        context.addIssue({ code: "custom", path: ["profiles", profileId, "extends"], message: "A profile cannot extend itself" });
      }
      if (profile.extends && !(profile.extends in project.profiles)) {
        context.addIssue({ code: "custom", path: ["profiles", profileId, "extends"], message: "Base profile must exist" });
      }
      if (!profile.extends && Object.keys(profile.modes).length === 0) {
        context.addIssue({ code: "custom", path: ["profiles", profileId, "modes"], message: "A root profile requires at least one mode" });
      }
    }
    const assetIds = new Set(Object.keys(project.assets));
    for (const [assetKey, asset] of Object.entries(project.assets)) {
      if (assetKey !== asset.id) {
        context.addIssue({ code: "custom", path: ["assets", assetKey, "id"], message: "Asset key and id must match" });
      }
      for (const [variant, assetId] of Object.entries(asset.variants ?? {})) {
        if (!assetIds.has(assetId)) {
          context.addIssue({ code: "custom", path: ["assets", assetKey, "variants", variant], message: "Referenced asset variant must exist" });
        }
      }
    }
    for (const [profileId, profile] of profileEntries) {
      for (const [role, assetId] of Object.entries(profile.assets ?? {})) {
        if (assetId && !assetIds.has(assetId)) {
          context.addIssue({ code: "custom", path: ["profiles", profileId, "assets", role], message: "Referenced asset must exist" });
        }
      }
      for (const [modeId, mode] of Object.entries(profile.modes)) {
        for (const [fontRole, font] of Object.entries(mode.typography)) {
          if (typeof font !== "object" || font === null || !("assetId" in font)) continue;
          const assetId = font.assetId;
          if (typeof assetId === "string" && !assetIds.has(assetId)) {
            context.addIssue({ code: "custom", path: ["profiles", profileId, "modes", modeId, "typography", fontRole, "assetId"], message: "Referenced font asset must exist" });
          }
        }
      }
      for (const modeId of profile.runtimeSelection.allowedModes ?? []) {
        if (!(modeId in profile.modes) && !profile.extends) {
          context.addIssue({ code: "custom", path: ["profiles", profileId, "runtimeSelection", "allowedModes"], message: "Allowed mode must exist on the profile or its inherited modes" });
        }
      }
    }
  });

export type BrandAsset = z.infer<typeof brandAssetSchema>;
export type BrandMode = z.infer<typeof brandModeSchema>;
export type BrandProfileSource = z.infer<typeof brandProfileSchema>;
export type BrandProject = z.infer<typeof brandProjectSchema>;

export const brandProjectJsonSchema = z.toJSONSchema(brandProjectSchema, {
  target: "draft-2020-12",
  unrepresentable: "any"
});

export function parseBrandProject(input: unknown): BrandProject {
  return brandProjectSchema.parse(input);
}

export function safeParseBrandProject(input: unknown) {
  return brandProjectSchema.safeParse(input);
}
