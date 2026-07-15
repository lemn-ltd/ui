import type {
  BrandCompileResult,
  BrandDiagnostic,
  BrandProject,
  CompiledBrandArtifact
} from "@lemn-ltd/brand-contract";

export type BrandStudioStepId =
  | "identity"
  | "presets"
  | "assets"
  | "profiles"
  | "colors"
  | "typography"
  | "shape"
  | "density-motion"
  | "visualization"
  | "accessibility"
  | "components"
  | "review";

export type BrandStudioIntent =
  | { readonly type: "validate"; readonly draft: BrandProject; readonly compileResult: BrandCompileResult }
  | { readonly type: "plan-publication"; readonly draft: BrandProject; readonly artifact: CompiledBrandArtifact }
  | { readonly type: "apply-publication"; readonly draft: BrandProject; readonly artifact: CompiledBrandArtifact; readonly expectedRevision: number; readonly idempotencyKey: string };

export type BrandStudioHostStatus = {
  readonly state: "idle" | "pending" | "success" | "error";
  readonly message?: string;
  readonly expectedRevision?: number;
};

export type BrandStudioHostAdapter = {
  readonly status: BrandStudioHostStatus;
  readonly dispatch: (intent: BrandStudioIntent) => void | Promise<void>;
};

export type BrandStudioProps = {
  readonly value: BrandProject;
  readonly onChange: (next: BrandProject) => void;
  readonly onIntent?: (intent: BrandStudioIntent) => void | Promise<void>;
  readonly hostStatus?: BrandStudioHostStatus;
  readonly hostAdapter?: BrandStudioHostAdapter;
  readonly initialStep?: BrandStudioStepId;
  readonly initialProfileId?: string;
  readonly initialModeId?: string;
  readonly readOnly?: boolean;
  readonly className?: string;
};

export type BrandStudioSnapshot = {
  readonly artifact?: CompiledBrandArtifact;
  readonly diagnostics: readonly BrandDiagnostic[];
  readonly compiling: boolean;
};
