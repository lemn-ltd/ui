import {
	type BrandingDefinition,
	type BrandingDiagnostic,
	bestContrastingColor,
	type CompiledBrandingArtifact,
	type CompiledBrandingMode,
	compileBrandingDefinition,
	getCompiledMode,
	getCompiledModeCriticalCss,
} from "@lemn-ltd/brand-contract";
import {
	getSystemBrandingTemplate,
	systemBrandingTemplates,
} from "@lemn-ltd/brand-contract/system-brandings";
import {
	createContext,
	type ReactElement,
	type ReactNode,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

const THEME_STORAGE_KEY = "color-theme";

export interface PortalBrandRuntime {
	readonly artifact: CompiledBrandingArtifact;
	readonly compiling: boolean;
	readonly definition: BrandingDefinition;
	readonly diagnostics: readonly BrandingDiagnostic[];
	readonly mode: CompiledBrandingMode;
	readonly modeId: string;
	readonly systemBrandingId: string;
	readonly setAccentColor: (value: string) => Promise<boolean>;
	readonly setDefinition: (definition: BrandingDefinition) => void;
	readonly setModeByColorScheme: (mode: "light" | "dark") => void;
	readonly setModeId: (modeId: string) => void;
	readonly setSystemBrandingId: (templateId: string) => Promise<void>;
}

const BrandRuntimeContext = createContext<PortalBrandRuntime | undefined>(
	undefined,
);

export interface BrandRuntimeProviderProps {
	readonly children: ReactNode;
	readonly initialArtifact: CompiledBrandingArtifact;
	readonly initialDefinition: BrandingDefinition;
}

interface BrandRuntimeStateProviderProps extends BrandRuntimeProviderProps {
	readonly criticalCssId: "portal" | "playground-preview";
	readonly scopeClassName?: string;
	readonly synchronizeDocumentTheme: boolean;
	readonly usePersistedTheme: boolean;
}

function initialModeId(
	definition: BrandingDefinition,
	usePersistedTheme: boolean,
): string {
	if (!usePersistedTheme || typeof window === "undefined") {
		return definition.defaultModeId;
	}
	let persistedTheme: string | null = null;
	try {
		persistedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
	} catch {
		return definition.defaultModeId;
	}
	if (persistedTheme !== "light" && persistedTheme !== "dark") {
		return definition.defaultModeId;
	}
	const matchingMode = Object.entries(definition.modes).find(
		([, mode]) => mode.colorScheme === persistedTheme,
	);
	return matchingMode?.[0] ?? definition.defaultModeId;
}

function resolveMode(
	artifact: CompiledBrandingArtifact,
	modeId: string,
): CompiledBrandingMode {
	try {
		return getCompiledMode(artifact, modeId);
	} catch {
		return getCompiledMode(artifact, artifact.defaultModeId);
	}
}

function BrandRuntimeStateProvider({
	children,
	criticalCssId,
	initialArtifact,
	initialDefinition,
	scopeClassName,
	synchronizeDocumentTheme,
	usePersistedTheme,
}: BrandRuntimeStateProviderProps): ReactElement {
	const [definition, setDefinitionState] = useState(initialDefinition);
	const [artifact, setArtifact] = useState(initialArtifact);
	const [modeId, setModeIdState] = useState(() =>
		initialModeId(initialDefinition, usePersistedTheme),
	);
	const [systemBrandingId, setSystemBrandingIdState] =
		useState("verdant-ledger");
	const [diagnostics, setDiagnostics] = useState<readonly BrandingDiagnostic[]>(
		[],
	);
	const [compiling, setCompiling] = useState(false);
	const compilationSequence = useRef(0);

	const mode = useMemo(() => resolveMode(artifact, modeId), [artifact, modeId]);

	useLayoutEffect(() => {
		if (!synchronizeDocumentTheme) return;
		document.documentElement.dataset.theme = mode.colorScheme;
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, mode.colorScheme);
		} catch {
			// Runtime selection remains authoritative when storage is unavailable.
		}
	}, [mode.colorScheme, synchronizeDocumentTheme]);

	const compileDraft = useCallback(async (next: BrandingDefinition) => {
		const sequence = compilationSequence.current + 1;
		compilationSequence.current = sequence;
		setCompiling(true);
		const result = await compileBrandingDefinition(next);
		if (compilationSequence.current !== sequence) return result;
		setDiagnostics(result.diagnostics);
		setCompiling(false);
		if (result.ok) setArtifact(result.artifact);
		return result;
	}, []);

	const setDefinition = useCallback(
		(next: BrandingDefinition): void => {
			setDefinitionState(next);
			if (!next.modes[modeId]) setModeIdState(next.defaultModeId);
			void compileDraft(next);
		},
		[compileDraft, modeId],
	);

	const selectMode = useCallback(
		(nextModeId: string): void => {
			if (!artifact.allowedModeIds.includes(nextModeId)) return;
			setModeIdState(nextModeId);
		},
		[artifact.allowedModeIds],
	);

	const setModeByColorScheme = useCallback(
		(colorScheme: "light" | "dark"): void => {
			const match = Object.entries(definition.modes).find(
				([id, candidate]) =>
					artifact.allowedModeIds.includes(id) &&
					candidate.colorScheme === colorScheme,
			);
			if (match) setModeIdState(match[0]);
		},
		[artifact.allowedModeIds, definition.modes],
	);

	const setSystemBrandingId = useCallback(
		async (templateId: string): Promise<void> => {
			const catalogEntry = systemBrandingTemplates.find(
				(template) =>
					template.id === templateId && template.status === "available",
			);
			if (!catalogEntry) return;
			const template = getSystemBrandingTemplate(
				catalogEntry.id,
				catalogEntry.version,
			);
			const next = structuredClone(template.definition);
			const result = await compileDraft(next);
			if (!result.ok) return;
			setDefinitionState(next);
			setSystemBrandingIdState(template.id);
			setModeIdState(initialModeId(next, usePersistedTheme));
		},
		[compileDraft, usePersistedTheme],
	);

	const setAccentColor = useCallback(
		async (value: string): Promise<boolean> => {
			const next = structuredClone(definition);
			const nextMode = next.modes[modeId];
			if (!nextMode) return false;
			nextMode.colors.accent = value;
			nextMode.colors.accentForeground = bestContrastingColor(value);
			nextMode.colors.focus = value;
			nextMode.visualization.categorical[0] = value;
			nextMode.visualization.cursor = value;
			nextMode.visualization.crosshair = value;
			const result = await compileDraft(next);
			if (!result.ok) return false;
			setDefinitionState(next);
			return true;
		},
		[compileDraft, definition, modeId],
	);

	const value = useMemo<PortalBrandRuntime>(
		() => ({
			artifact,
			compiling,
			definition,
			diagnostics,
			mode,
			modeId: mode.modeId,
			systemBrandingId,
			setAccentColor,
			setDefinition,
			setModeByColorScheme,
			setModeId: selectMode,
			setSystemBrandingId,
		}),
		[
			artifact,
			compiling,
			definition,
			diagnostics,
			mode,
			selectMode,
			setAccentColor,
			setDefinition,
			setModeByColorScheme,
			setSystemBrandingId,
			systemBrandingId,
		],
	);

	const scopedChildren = scopeClassName ? (
		<div
			{...mode.attributes}
			className={scopeClassName}
			data-brand-runtime-state={compiling ? "compiling" : "ready"}
		>
			{children}
		</div>
	) : (
		children
	);

	return (
		<BrandRuntimeContext.Provider value={value}>
			<style data-lemn-brand-critical={criticalCssId}>
				{getCompiledModeCriticalCss(artifact, mode.modeId)}
			</style>
			{scopedChildren}
		</BrandRuntimeContext.Provider>
	);
}

export function BrandRuntimeProvider(
	props: BrandRuntimeProviderProps,
): ReactElement {
	return (
		<BrandRuntimeStateProvider
			{...props}
			criticalCssId="portal"
			scopeClassName="portal-brand-scope"
			synchronizeDocumentTheme
			usePersistedTheme
		/>
	);
}

/** Local compiler/runtime state whose tokens apply only to BrandPreviewCanvas. */
export function IsolatedBrandRuntimeProvider(
	props: BrandRuntimeProviderProps,
): ReactElement {
	return (
		<BrandRuntimeStateProvider
			{...props}
			criticalCssId="playground-preview"
			synchronizeDocumentTheme={false}
			usePersistedTheme={false}
		/>
	);
}

export function BrandPreviewCanvas({ children }: { readonly children: ReactNode }): ReactElement {
	const { compiling, mode } = usePortalBrand();
	return (
		<div
			{...mode.attributes}
			className="portal-brand-preview"
			data-brand-runtime-state={compiling ? "compiling" : "ready"}
		>
			{children}
		</div>
	);
}

export function usePortalBrand(): PortalBrandRuntime {
	const context = useContext(BrandRuntimeContext);
	if (!context) {
		throw new Error(
			"usePortalBrand must be used within BrandRuntimeProvider",
		);
	}
	return context;
}
