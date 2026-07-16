export {
  BRAND_COMPILER_VERSION,
  BRAND_PROJECT_SCHEMA_URL,
  BRAND_SCHEMA_VERSION,
  type BrandAsset,
  type BrandMode,
  type BrandProfileSource,
  type BrandProject,
  type BrandTypography,
  type DirectFontSelection,
  type ManagedFontSelection,
  type SystemFontSelection,
  brandProjectJsonSchema,
  brandProjectSchema,
  parseBrandProject,
  safeParseBrandProject
} from "./contract.js";
export {
  FONT_CATALOG_VERSION,
  MANAGED_FONT_REFS,
  SYSTEM_FONT_REFS,
  type FontCatalogRecord,
  type FontCatalogRef,
  type FontCatalogResource,
  type FontStyle,
  type ManagedFontCatalogRecord,
  type ManagedFontRef,
  type SystemFontCatalogRecord,
  type SystemFontRef,
  fontCatalog,
  getFontCatalogRecord
} from "./font-catalog.js";
export {
  assertCompatibleBrandArtifact,
  brandScopeKey,
  type BrandCompileResult,
  type BrandDiagnostic,
  type CompiledBrandArtifact,
  type CompiledBrandScope,
  type CompiledFontPreload,
  type CompiledFontResource,
  compileBrandProject,
  type EChartsBrandTheme,
  type FontNetworkPolicy,
  getCompiledScope,
  getCompiledScopeFontPreloads,
  getCompiledScopeFontResources,
  type RechartsBrandTheme,
  type ResolvedBrandProfile,
  serializeBrandBootstrap,
  verifyBrandArtifact
} from "./compiler.js";
export { canonicalJson, serializeBootstrapJson, sha256 } from "./canonical-json.js";
export {
  bestContrastingColor,
  contrastRatio,
  mixHexColors,
  normalizeHexColor,
  translucentHex
} from "./color.js";
