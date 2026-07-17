import type {
	BrandingCompileResult,
	BrandingDefinition,
	BrandingDiagnostic,
	CompiledBrandingArtifact,
} from "@lemn-ltd/brand-contract";
import type { SystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";

export type BrandStudioStepId =
	| "identity"
	| "system-brandings"
	| "assets"
	| "modes"
	| "colors"
	| "typography"
	| "shape"
	| "density-motion"
	| "visualization"
	| "accessibility"
	| "components"
	| "review";

export type BrandStudioIntent =
	| {
			readonly type: "validate";
			readonly definition: BrandingDefinition;
			readonly compileResult: BrandingCompileResult;
	  }
	| {
			readonly type: "save-draft";
			readonly brandingVersionId: string;
			readonly title: string;
			readonly definition: BrandingDefinition;
			readonly expectedDefinitionHash: string;
			readonly idempotencyKey: string;
	  }
	| {
			readonly type: "compare-draft";
			readonly brandingVersionId: string;
			readonly definitionHash: string;
	  }
	| {
			readonly type: "create-preview";
			readonly brandingVersionId: string;
			readonly definitionHash: string;
			readonly targetId: string;
			readonly initialModeId: string;
	  }
	| {
			readonly type: "archive-draft" | "restore-draft" | "publish-draft";
			readonly brandingVersionId: string;
			readonly expectedDefinitionHash: string;
			readonly idempotencyKey: string;
	  }
	| {
			readonly type: "select-system-branding";
			readonly templateId: string;
			readonly templateVersion: number;
			readonly definitionHash: string;
	  };

export type BrandStudioDraftContext = {
	readonly brandingVersionId: string;
	readonly title: string;
	readonly definitionHash: string;
	readonly state: "draft" | "publishing" | "published";
	readonly archived: boolean;
};

export type BrandStudioPreviewTarget = {
	readonly id: string;
	readonly name: string;
	readonly origin: string;
	readonly status: "active" | "disabled";
};

export type BrandStudioHostStatus = {
	readonly state:
		| "idle"
		| "dirty"
		| "saving"
		| "saved"
		| "validating"
		| "invalid"
		| "previewing"
		| "preview-ready"
		| "publishing"
		| "published"
		| "archived"
		| "conflict"
		| "permission-denied"
		| "expired"
		| "error";
	readonly message?: string;
};

export type BrandStudioHostAdapter = {
	readonly status: BrandStudioHostStatus;
	readonly dispatch: (intent: BrandStudioIntent) => void | Promise<void>;
};

export type BrandStudioProps = {
	readonly value: BrandingDefinition;
	readonly draft: BrandStudioDraftContext;
	readonly onChange: (next: BrandingDefinition) => void;
	readonly onDraftTitleChange?: (title: string) => void;
	readonly onIntent?: (intent: BrandStudioIntent) => void | Promise<void>;
	readonly hostStatus?: BrandStudioHostStatus;
	readonly hostAdapter?: BrandStudioHostAdapter;
	readonly systemBrandings?: readonly SystemBrandingTemplate[];
	readonly previewTargets?: readonly BrandStudioPreviewTarget[];
	readonly initialStep?: BrandStudioStepId;
	readonly initialModeId?: string;
	readonly readOnly?: boolean;
	readonly className?: string;
};

export type BrandStudioSnapshot = {
	readonly artifact?: CompiledBrandingArtifact;
	readonly diagnostics: readonly BrandingDiagnostic[];
	readonly compiling: boolean;
};
