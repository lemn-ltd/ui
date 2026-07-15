import {
	bestContrastingColor,
	compileBrandProject,
	getCompiledScope,
	type BrandDiagnostic,
	type BrandProject,
	type CompiledBrandArtifact,
	type CompiledBrandScope,
} from "@lemn-ltd/brand-contract";
import {
	brandPresets,
	createBrandFromPreset,
} from "@lemn-ltd/brand-studio";
import {
	createContext,
	type ReactElement,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";

export interface ShowcaseBrandRuntime {
	readonly artifact: CompiledBrandArtifact;
	readonly compiling: boolean;
	readonly diagnostics: readonly BrandDiagnostic[];
	readonly modeId: string;
	readonly profileId: string;
	readonly project: BrandProject;
	readonly scope: CompiledBrandScope;
	readonly presetId: string;
	readonly setAccentColor: (value: string) => Promise<boolean>;
	readonly setModeByColorScheme: (mode: "light" | "dark") => void;
	readonly setModeId: (modeId: string) => void;
	readonly setPresetId: (presetId: string) => Promise<void>;
	readonly setProfileId: (profileId: string) => void;
	readonly updateProject: (project: BrandProject) => void;
}

const BrandRuntimeContext = createContext<ShowcaseBrandRuntime | undefined>(
	undefined,
);

export interface BrandRuntimeProviderProps {
	readonly children: ReactNode;
	readonly initialArtifact: CompiledBrandArtifact;
	readonly initialProject: BrandProject;
}

function defaultModeId(project: BrandProject, profileId: string): string {
	const profile = project.profiles[profileId];
	return profile?.defaultMode ?? Object.keys(profile?.modes ?? {})[0] ?? "light";
}

function resolveScope(
	artifact: CompiledBrandArtifact,
	profileId: string,
	modeId: string,
): CompiledBrandScope {
	try {
		return getCompiledScope(artifact, profileId, modeId);
	} catch {
		const fallbackProfileId = artifact.defaultProfileId;
		const fallbackProfile = artifact.profiles[fallbackProfileId];
		return getCompiledScope(
			artifact,
			fallbackProfileId,
			fallbackProfile?.defaultMode ?? "light",
		);
	}
}

export function BrandRuntimeProvider({
	children,
	initialArtifact,
	initialProject,
}: BrandRuntimeProviderProps): ReactElement {
	const [project, setProject] = useState(initialProject);
	const [artifact, setArtifact] = useState(initialArtifact);
	const [profileId, setProfileIdState] = useState(
		initialProject.defaultProfileId,
	);
	const [modeId, setModeIdState] = useState(() =>
		defaultModeId(initialProject, initialProject.defaultProfileId),
	);
	const [presetId, setPresetIdState] = useState("verdant-ledger");
	const [diagnostics, setDiagnostics] = useState<readonly BrandDiagnostic[]>([]);
	const [compiling, setCompiling] = useState(false);
	const compilationSequence = useRef(0);

	const scope = useMemo(
		() => resolveScope(artifact, profileId, modeId),
		[artifact, modeId, profileId],
	);

	const compileDraft = useCallback(async (next: BrandProject) => {
		const sequence = compilationSequence.current + 1;
		compilationSequence.current = sequence;
		setCompiling(true);
		const result = await compileBrandProject(next);
		if (compilationSequence.current !== sequence) return result;
		setDiagnostics(result.diagnostics);
		setCompiling(false);
		if (result.ok) setArtifact(result.artifact);
		return result;
	}, []);

	const updateProject = useCallback(
		(next: BrandProject): void => {
			setProject(next);
			void compileDraft(next);
		},
		[compileDraft],
	);

	const selectProfile = useCallback(
		(nextProfileId: string): void => {
			if (!project.profiles[nextProfileId]) return;
			setProfileIdState(nextProfileId);
			setModeIdState(defaultModeId(project, nextProfileId));
		},
		[project],
	);

	const selectMode = useCallback(
		(nextModeId: string): void => {
			if (!project.profiles[profileId]?.modes[nextModeId]) return;
			setModeIdState(nextModeId);
		},
		[profileId, project],
	);

	const setModeByColorScheme = useCallback(
		(colorScheme: "light" | "dark"): void => {
			const profile = project.profiles[profileId];
			const match = Object.entries(profile?.modes ?? {}).find(
				([, mode]) => mode.colorScheme === colorScheme,
			);
			if (match) setModeIdState(match[0]);
		},
		[profileId, project],
	);

	const setPresetId = useCallback(
		async (nextPresetId: string): Promise<void> => {
			if (!brandPresets.some((preset) => preset.id === nextPresetId)) return;
			const next = createBrandFromPreset(nextPresetId);
			const result = await compileDraft(next);
			if (!result.ok) return;
			setProject(next);
			setPresetIdState(nextPresetId);
			setProfileIdState(next.defaultProfileId);
			setModeIdState(defaultModeId(next, next.defaultProfileId));
		},
		[compileDraft],
	);

	const setAccentColor = useCallback(
		async (value: string): Promise<boolean> => {
			const next = structuredClone(project);
			const mode = next.profiles[profileId]?.modes[modeId];
			if (!mode) return false;
			mode.colors.accent = value;
			mode.colors.accentForeground = bestContrastingColor(value);
			mode.colors.focus = value;
			mode.visualization.categorical[0] = value;
			mode.visualization.cursor = value;
			mode.visualization.crosshair = value;
			const result = await compileDraft(next);
			if (!result.ok) return false;
			setProject(next);
			return true;
		},
		[compileDraft, modeId, profileId, project],
	);

	const value = useMemo<ShowcaseBrandRuntime>(
		() => ({
			artifact,
			compiling,
			diagnostics,
			modeId,
			profileId,
			project,
			scope,
			presetId,
			setAccentColor,
			setModeByColorScheme,
			setModeId: selectMode,
			setPresetId,
			setProfileId: selectProfile,
			updateProject,
		}),
		[
			artifact,
			compiling,
			diagnostics,
			modeId,
			presetId,
			profileId,
			project,
			scope,
			selectMode,
			selectProfile,
			setAccentColor,
			setModeByColorScheme,
			setPresetId,
			updateProject,
		],
	);

	return (
		<BrandRuntimeContext.Provider value={value}>
			<style data-lemn-brand-critical="showcase">{artifact.criticalCss}</style>
			<div
				{...scope.attributes}
				className="showcase-brand-scope"
				data-brand-runtime-state={compiling ? "compiling" : "ready"}
			>
				{children}
			</div>
		</BrandRuntimeContext.Provider>
	);
}

export function useShowcaseBrand(): ShowcaseBrandRuntime {
	const context = useContext(BrandRuntimeContext);
	if (!context) {
		throw new Error("useShowcaseBrand must be used within BrandRuntimeProvider");
	}
	return context;
}
