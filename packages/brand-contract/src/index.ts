export {
  BRAND_COMPILER_VERSION,
  BRAND_PROJECT_SCHEMA_URL,
  BRAND_SCHEMA_VERSION,
  type BrandAsset,
  type BrandMode,
  type BrandProfileSource,
  type BrandProject,
  brandProjectJsonSchema,
  brandProjectSchema,
  parseBrandProject,
  safeParseBrandProject
} from "./contract.js";
export {
  assertCompatibleBrandArtifact,
  brandScopeKey,
  type BrandCompileResult,
  type BrandDiagnostic,
  type CompiledBrandArtifact,
  type CompiledBrandScope,
  compileBrandProject,
  type EChartsBrandTheme,
  getCompiledScope,
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
