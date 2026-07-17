import {
	type BrandingDefinition,
	type BrandingMode,
	type BrandingTypography,
	type CompiledBrandingArtifact,
	compileBrandingDefinition,
	type DirectFontSelection,
	type FontCatalogRecord,
	type FontCatalogRef,
	fontCatalog,
	getCompiledMode,
	getFontCatalogRecord,
	safeParseBrandingDefinition,
} from "@lemn-ltd/brand-contract";
import type { SystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";
import {
	Alert,
	AreaChart,
	Badge,
	Button,
	Card,
	Checkbox,
	Input,
	SelectNative,
	Textarea,
} from "@lemn-ltd/ui";
import {
	cloneElement,
	type ReactElement,
	type ReactNode,
	useEffect,
	useId,
	useState,
} from "react";
import { brandStudioSteps } from "./catalog.js";
import type {
	BrandStudioIntent,
	BrandStudioProps,
	BrandStudioStepId,
} from "./types.js";
import "./styles.css";

const PREVIEW_DATA = [
	{ month: "Jan", bookings: 38, completed: 31 },
	{ month: "Feb", bookings: 52, completed: 44 },
	{ month: "Mar", bookings: 48, completed: 43 },
	{ month: "Apr", bookings: 66, completed: 59 },
	{ month: "May", bookings: 72, completed: 64 },
] as const;

export function BrandStudio({
	value,
	draft,
	onChange,
	onDraftTitleChange,
	onIntent,
	hostStatus = { state: "idle" },
	hostAdapter,
	systemBrandings = [],
	previewTargets = [],
	initialStep = "identity",
	initialModeId,
	readOnly = false,
	className,
}: BrandStudioProps): ReactElement {
	const resolvedHostStatus = hostAdapter?.status ?? hostStatus;
	const dispatchIntent = hostAdapter?.dispatch ?? onIntent;
	const [step, setStep] = useState<BrandStudioStepId>(initialStep);
	const [modeId, setModeId] = useState(initialModeId ?? value.defaultModeId);
	const [previewTargetId, setPreviewTargetId] = useState(
		previewTargets.find((target) => target.status === "active")?.id ?? "",
	);
	const [artifact, setArtifact] = useState<CompiledBrandingArtifact>();
	const [diagnostics, setDiagnostics] = useState<
		readonly {
			code: string;
			severity: "error" | "warning";
			path: string;
			message: string;
		}[]
	>([]);
	const [compiling, setCompiling] = useState(true);
	const [jsonText, setJsonText] = useState(() =>
		JSON.stringify(value, null, 2),
	);
	const [jsonError, setJsonError] = useState<string>();

	useEffect(() => setJsonText(JSON.stringify(value, null, 2)), [value]);

	useEffect(() => {
		let active = true;
		setCompiling(true);
		void compileBrandingDefinition(value).then((result) => {
			if (!active) return;
			setArtifact(result.ok ? result.artifact : undefined);
			setDiagnostics(result.diagnostics);
			setCompiling(false);
		});
		return () => {
			active = false;
		};
	}, [value]);

	useEffect(() => {
		if (value.modes[modeId]) return;
		setModeId(value.defaultModeId);
	}, [modeId, value.defaultModeId, value.modes]);

	useEffect(() => {
		const activeTargets = previewTargets.filter(
			(target) => target.status === "active",
		);
		setPreviewTargetId((current) =>
			activeTargets.some((target) => target.id === current)
				? current
				: (activeTargets[0]?.id ?? ""),
		);
	}, [previewTargets]);

	const effectiveReadOnly =
		readOnly || draft.archived || draft.state !== "draft";
	const resolvedModeId = value.modes[modeId] ? modeId : value.defaultModeId;
	const mode = value.modes[resolvedModeId];
	const compiledMode = artifact
		? safeCompiledMode(artifact, resolvedModeId)
		: undefined;
	const currentStep =
		brandStudioSteps.find((entry) => entry.id === step) ?? brandStudioSteps[0];
	const modeOptions = Object.keys(value.modes)
		.sort()
		.map((id) => ({ value: id, label: humanize(id) }));
	const targetOptions = previewTargets
		.filter((target) => target.status === "active")
		.map((target) => ({
			value: target.id,
			label: `${target.name} · ${target.origin}`,
		}));
	const errorCount = diagnostics.filter(
		(entry) => entry.severity === "error",
	).length;
	const warningCount = diagnostics.length - errorCount;
	const dirty = Boolean(
		artifact && artifact.definitionHash !== draft.definitionHash,
	);
	const idempotencyKey = (): string =>
		globalThis.crypto?.randomUUID?.() ??
		`${Date.now()}-${draft.brandingVersionId}`;

	const replaceDefinition = (
		mutate: (next: BrandingDefinition) => void,
	): void => {
		if (effectiveReadOnly) return;
		const next = structuredClone(value);
		mutate(next);
		const parsed = safeParseBrandingDefinition(next);
		if (parsed.success) onChange(parsed.data);
	};

	const replaceMode = (mutate: (next: BrandingMode) => void): void => {
		replaceDefinition((next) => {
			const nextMode = next.modes[resolvedModeId];
			if (nextMode) mutate(nextMode);
		});
	};

	const replaceTypography = (
		mutate: (next: BrandingTypography) => void,
	): void => {
		replaceDefinition((next) => mutate(next.typography));
	};

	const emit = (intent: BrandStudioIntent): void => {
		void dispatchIntent?.(intent);
	};

	const applyJson = (): void => {
		if (effectiveReadOnly) return;
		try {
			const parsed = safeParseBrandingDefinition(
				JSON.parse(jsonText) as unknown,
			);
			if (!parsed.success) {
				setJsonError(
					parsed.error.issues
						.map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`)
						.join("\n"),
				);
				return;
			}
			setJsonError(undefined);
			onChange(parsed.data);
		} catch (error) {
			setJsonError(error instanceof Error ? error.message : "Invalid JSON");
		}
	};

	return (
		<section
			className={["lemn-brand-studio", className].filter(Boolean).join(" ")}
			aria-label="Brand Studio"
		>
			{artifact ? (
				<style data-lemn-brand-critical="true">{artifact.fullCss}</style>
			) : null}
			<header className="lemn-brand-studio__header">
				<div>
					<p className="lemn-brand-studio__eyebrow">Brand Studio</p>
					<h1>{draft.title}</h1>
					<p>
						Edit one complete BrandingDefinition with server-selected visual
						modes.
					</p>
				</div>
				<div className="lemn-brand-studio__selectors">
					<Labeled label="Mode">
						<SelectNative
							aria-label="Mode"
							options={modeOptions}
							value={resolvedModeId}
							onValueChange={setModeId}
						/>
					</Labeled>
					<Badge
						tone={
							draft.archived
								? "warn"
								: draft.state === "published"
									? "success"
									: "info"
						}
					>
						{draft.archived ? "Archived" : humanize(draft.state)}
					</Badge>
				</div>
			</header>

			<div className="lemn-brand-studio__layout">
				<nav
					aria-label="Brand configuration steps"
					className="lemn-brand-studio__steps"
				>
					{brandStudioSteps.map((entry, index) => (
						<button
							aria-current={entry.id === step ? "step" : undefined}
							key={entry.id}
							onClick={() => setStep(entry.id)}
							type="button"
						>
							<span>{String(index + 1).padStart(2, "0")}</span>
							<span>
								<strong>{entry.label}</strong>
								<small>{entry.advanced ? "Advanced" : entry.description}</small>
							</span>
						</button>
					))}
				</nav>

				<main className="lemn-brand-studio__editor">
					<div className="lemn-brand-studio__section-heading">
						<div>
							<p>
								Step{" "}
								{brandStudioSteps.findIndex((entry) => entry.id === step) + 1}
							</p>
							<h2>{currentStep?.label}</h2>
							<span>{currentStep?.description}</span>
						</div>
						<div className="lemn-brand-studio__health" aria-live="polite">
							<Badge tone={errorCount ? "danger" : dirty ? "warn" : "success"}>
								{compiling
									? "Compiling"
									: errorCount
										? `${errorCount} errors`
										: dirty
											? "Unsaved"
											: "Saved hash"}
							</Badge>
							{warningCount ? (
								<Badge tone="warn">{warningCount} warnings</Badge>
							) : null}
						</div>
					</div>

					{mode ? (
						renderEditor({
							step,
							value,
							draftTitle: draft.title,
							mode,
							modeId: resolvedModeId,
							readOnly: effectiveReadOnly,
							systemBrandings,
							replaceMode,
							replaceTypography,
							replaceDefinition,
							onDraftTitleChange,
							emit,
							setModeId,
						})
					) : (
						<Alert
							variant="error"
							title="No mode available"
							message="BrandingDefinition must contain at least one complete mode."
						/>
					)}

					{step === "review" ? (
						<div className="lemn-brand-studio__json">
							<Labeled label="BrandingDefinition JSON">
								<Textarea
									aria-label="BrandingDefinition JSON"
									invalid={Boolean(jsonError)}
									onChange={(event) => setJsonText(event.currentTarget.value)}
									readOnly={effectiveReadOnly}
									rows={20}
									spellCheck={false}
									value={jsonText}
								/>
							</Labeled>
							{jsonError ? (
								<pre className="lemn-brand-studio__json-error" role="alert">
									{jsonError}
								</pre>
							) : null}
							<Button
								disabled={effectiveReadOnly}
								onClick={applyJson}
								variant="secondary"
							>
								Apply valid JSON
							</Button>
							{artifact ? (
								<details>
									<summary>Compiled artifact</summary>
									<pre>{JSON.stringify(artifact, null, 2)}</pre>
								</details>
							) : null}
						</div>
					) : null}

					{diagnostics.length ? (
						<section
							className="lemn-brand-studio__diagnostics"
							aria-label="Branding diagnostics"
						>
							{diagnostics.map((entry) => (
								<Alert
									key={`${entry.code}-${entry.path}`}
									variant={entry.severity === "error" ? "error" : "warning"}
									title={entry.code}
									message={`${entry.path}: ${entry.message}`}
								/>
							))}
						</section>
					) : null}

					<div className="lemn-brand-studio__preview-controls">
						<Labeled label="Preview target">
							<SelectNative
								aria-label="Preview target"
								disabled={targetOptions.length === 0 || effectiveReadOnly}
								onValueChange={setPreviewTargetId}
								options={
									targetOptions.length
										? targetOptions
										: [{ value: "", label: "No active targets" }]
								}
								value={previewTargetId}
							/>
						</Labeled>
					</div>

					<footer className="lemn-brand-studio__actions">
						<Button
							onClick={() =>
								void compileBrandingDefinition(value).then((compileResult) =>
									emit({ type: "validate", definition: value, compileResult }),
								)
							}
							variant="secondary"
						>
							Validate
						</Button>
						<Button
							disabled={!artifact || effectiveReadOnly || !dirty}
							onClick={() =>
								artifact &&
								emit({
									type: "save-draft",
									brandingVersionId: draft.brandingVersionId,
									title: draft.title,
									definition: value,
									expectedDefinitionHash: draft.definitionHash,
									idempotencyKey: idempotencyKey(),
								})
							}
						>
							Save draft
						</Button>
						<Button
							disabled={!artifact}
							onClick={() =>
								artifact &&
								emit({
									type: "compare-draft",
									brandingVersionId: draft.brandingVersionId,
									definitionHash: artifact.definitionHash,
								})
							}
							variant="secondary"
						>
							Compare
						</Button>
						<Button
							disabled={!artifact || effectiveReadOnly || !previewTargetId}
							onClick={() =>
								artifact &&
								emit({
									type: "create-preview",
									brandingVersionId: draft.brandingVersionId,
									definitionHash: artifact.definitionHash,
									targetId: previewTargetId,
									initialModeId: resolvedModeId,
								})
							}
							variant="secondary"
						>
							Open preview
						</Button>
						<Button
							disabled={draft.state !== "draft" || dirty || errorCount > 0}
							onClick={() =>
								emit({
									type: "publish-draft",
									brandingVersionId: draft.brandingVersionId,
									expectedDefinitionHash: draft.definitionHash,
									idempotencyKey: idempotencyKey(),
								})
							}
						>
							Publish
						</Button>
						<Button
							disabled={draft.state !== "draft"}
							onClick={() =>
								emit({
									type: draft.archived ? "restore-draft" : "archive-draft",
									brandingVersionId: draft.brandingVersionId,
									expectedDefinitionHash: draft.definitionHash,
									idempotencyKey: idempotencyKey(),
								})
							}
							variant="secondary"
						>
							{draft.archived ? "Restore" : "Archive"}
						</Button>
						{resolvedHostStatus.message ? (
							<span data-state={resolvedHostStatus.state}>
								{resolvedHostStatus.message}
							</span>
						) : null}
					</footer>
				</main>

				<aside
					className="lemn-brand-studio__preview"
					aria-label="Live branding preview"
				>
					<div className="lemn-brand-studio__preview-sticky">
						<p className="lemn-brand-studio__eyebrow">Live compiled preview</p>
						{compiledMode ? (
							<div
								className="lemn-brand-studio__preview-scope"
								{...compiledMode.attributes}
							>
								<Card
									elevated
									title={
										<>
											<span>Appointment overview</span>{" "}
											<Badge tone="success">Live</Badge>
										</>
									}
								>
									<fieldset
										aria-label="Typography specimen"
										className="lemn-brand-studio__type-specimen"
									>
										<span>Heading specimen</span>
										<h2>Care that feels unmistakably yours.</h2>
										<p>
											Body text stays readable across product surfaces and
											complete visual modes.
										</p>
										<code>appointment.status = &quot;confirmed&quot;</code>
									</fieldset>
									<div className="lemn-brand-studio__preview-actions">
										<Button>Book appointment</Button>
										<Button variant="secondary">View schedule</Button>
									</div>
									<div className="lemn-brand-studio__check">
										<Checkbox defaultChecked id="brand-studio-send-reminder" />
										<label htmlFor="brand-studio-send-reminder">
											Send appointment reminder
										</label>
									</div>
									<AreaChart
										aria-label="Bookings and completed visits"
										animation="none"
										data={PREVIEW_DATA}
										height={220}
										index="month"
										series={[
											{
												dataKey: "bookings",
												name: "Bookings",
												color: "var(--lemn-chart-series-1)",
											},
											{
												dataKey: "completed",
												name: "Completed",
												color: "var(--lemn-chart-series-2)",
											},
										]}
									/>
								</Card>
							</div>
						) : (
							<Alert
								variant="error"
								title="Preview unavailable"
								message="Resolve blocking diagnostics to compile this mode."
							/>
						)}
					</div>
				</aside>
			</div>
		</section>
	);
}

type EditorContext = {
	readonly step: BrandStudioStepId;
	readonly value: BrandingDefinition;
	readonly draftTitle: string;
	readonly mode: BrandingMode;
	readonly modeId: string;
	readonly readOnly: boolean;
	readonly systemBrandings: readonly SystemBrandingTemplate[];
	readonly replaceMode: (mutate: (mode: BrandingMode) => void) => void;
	readonly replaceTypography: (
		mutate: (typography: BrandingTypography) => void,
	) => void;
	readonly replaceDefinition: (
		mutate: (definition: BrandingDefinition) => void,
	) => void;
	readonly onDraftTitleChange?: (title: string) => void;
	readonly emit: (intent: BrandStudioIntent) => void;
	readonly setModeId: (modeId: string) => void;
};

function renderEditor(context: EditorContext): ReactElement | null {
	const {
		step,
		value,
		draftTitle,
		mode,
		modeId,
		readOnly,
		systemBrandings,
		replaceMode,
		replaceTypography,
		replaceDefinition,
		onDraftTitleChange,
		emit,
		setModeId,
	} = context;
	if (step === "identity")
		return (
			<FieldGrid>
				<Labeled label="Draft title">
					<Input
						defaultValue={draftTitle}
						disabled={readOnly || !onDraftTitleChange}
						key={draftTitle}
						onBlur={(event) =>
							onDraftTitleChange?.(
								event.currentTarget.value.trim() || draftTitle,
							)
						}
					/>
				</Labeled>
				<Labeled label="Branding name">
					<Input
						defaultValue={value.name}
						disabled={readOnly}
						key={value.name}
						onBlur={(event) =>
							replaceDefinition((next) => {
								next.name = event.currentTarget.value.trim() || next.name;
							})
						}
					/>
				</Labeled>
				<Labeled label="Owner">
					<Input
						defaultValue={value.metadata.owner ?? ""}
						disabled={readOnly}
						key={value.metadata.owner}
						onBlur={(event) =>
							replaceDefinition((next) => {
								next.metadata.owner =
									event.currentTarget.value.trim() || undefined;
							})
						}
					/>
				</Labeled>
				<Labeled label="Description">
					<Textarea
						defaultValue={value.metadata.description ?? ""}
						disabled={readOnly}
						key={value.metadata.description}
						onBlur={(event) =>
							replaceDefinition((next) => {
								next.metadata.description =
									event.currentTarget.value.trim() || undefined;
							})
						}
					/>
				</Labeled>
			</FieldGrid>
		);
	if (step === "system-brandings")
		return systemBrandings.length ? (
			<div className="lemn-brand-studio__preset-grid">
				{systemBrandings.map((template) => (
					<button
						disabled={readOnly || template.status !== "available"}
						key={`${template.id}@${template.version}`}
						onClick={() =>
							emit({
								type: "select-system-branding",
								templateId: template.id,
								templateVersion: template.version,
								definitionHash: template.definitionHash,
							})
						}
						type="button"
					>
						<span
							style={{
								background: `linear-gradient(135deg, ${template.definition.modes.light?.colors.accent ?? "#64748b"}, ${template.definition.modes.dark?.colors.accent ?? "#0f172a"})`,
							}}
						/>
						<strong>
							{template.name} · v{template.version}
						</strong>
						<small>{template.description}</small>
					</button>
				))}
			</div>
		) : (
			<Alert
				variant="info"
				title="No System brandings supplied"
				message="The host owns catalog retrieval and passes exact immutable template versions to Studio."
			/>
		);
	if (step === "assets")
		return (
			<div className="lemn-brand-studio__info">
				<Alert
					variant="info"
					title={`${Object.keys(value.assets).length} managed assets`}
					message="The host uploads immutable assets and supplies storage keys and SHA-256 values. Studio never fetches or persists files."
				/>
				<pre>
					{JSON.stringify(
						{ assets: value.assets, assetRoles: value.assetRoles ?? {} },
						null,
						2,
					)}
				</pre>
			</div>
		);
	if (step === "modes")
		return (
			<div className="lemn-brand-studio__modes">
				{Object.entries(value.modes)
					.sort(([left], [right]) => left.localeCompare(right))
					.map(([id, entry]) => (
						<Card key={id} title={humanize(id)}>
							<p>
								<code>{id}</code> · {entry.colorScheme} ·{" "}
								{id === value.defaultModeId ? "default" : "selectable"}
							</p>
							<Button
								onClick={() => setModeId(id)}
								variant={id === modeId ? "primary" : "secondary"}
							>
								Edit mode
							</Button>
						</Card>
					))}
				<Labeled label="Default mode">
					<SelectNative
						disabled={readOnly}
						onValueChange={(id) =>
							replaceDefinition((next) => {
								next.defaultModeId = id;
							})
						}
						options={Object.keys(value.modes).map((id) => ({
							value: id,
							label: humanize(id),
						}))}
						value={value.defaultModeId}
					/>
				</Labeled>
				<Labeled label="Runtime mode selection">
					<span className="lemn-brand-studio__boolean">
						<Checkbox
							checked={value.runtimeSelection?.selectable ?? true}
							disabled={readOnly}
							onCheckedChange={(checked) =>
								replaceDefinition((next) => {
									next.runtimeSelection = {
										...next.runtimeSelection,
										selectable: checked === true,
									};
								})
							}
						/>
						<span>Allow the host to select an allowed mode</span>
					</span>
				</Labeled>
			</div>
		);
	if (step === "colors")
		return (
			<ColorEditor mode={mode} readOnly={readOnly} replaceMode={replaceMode} />
		);
	if (step === "typography")
		return (
			<TypographyEditor
				readOnly={readOnly}
				replaceTypography={replaceTypography}
				typography={value.typography}
			/>
		);
	if (step === "shape")
		return (
			<FieldGrid>
				<EnumField
					label="Border style"
					value={mode.shape.borderStyle}
					values={["solid", "dashed"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.shape.borderStyle =
								nextValue as BrandingMode["shape"]["borderStyle"];
						})
					}
				/>
				{(
					[
						"borderWidth",
						"radiusSmall",
						"radiusMedium",
						"radiusLarge",
						"radiusControl",
						"radiusCard",
						"radiusPill",
					] as const
				).map((key) => (
					<TextField
						key={key}
						label={humanize(key)}
						value={mode.shape[key]}
						disabled={readOnly}
						onCommit={(nextValue) =>
							replaceMode((next) => {
								next.shape[key] = nextValue;
							})
						}
					/>
				))}
				{(
					[
						"raised",
						"overlay",
						"modal",
						"focusRingWidth",
						"focusRingOffset",
					] as const
				).map((key) => (
					<TextField
						key={key}
						label={humanize(key)}
						value={mode.elevation[key]}
						disabled={readOnly}
						onCommit={(nextValue) =>
							replaceMode((next) => {
								next.elevation[key] = nextValue;
							})
						}
					/>
				))}
			</FieldGrid>
		);
	if (step === "density-motion")
		return (
			<FieldGrid>
				<EnumField
					label="Density"
					value={mode.spacingAndDensity.density}
					values={["compact", "comfortable", "spacious"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.spacingAndDensity.density =
								nextValue as BrandingMode["spacingAndDensity"]["density"];
						})
					}
				/>
				<NumberField
					label="Spacing scale"
					value={mode.spacingAndDensity.scale}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.spacingAndDensity.scale = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.05}
				/>
				{(["controlHeight", "contentGutter"] as const).map((key) => (
					<TextField
						key={key}
						label={humanize(key)}
						value={mode.spacingAndDensity[key]}
						disabled={readOnly}
						onCommit={(nextValue) =>
							replaceMode((next) => {
								next.spacingAndDensity[key] = nextValue;
							})
						}
					/>
				))}
				{(
					[
						"durationFast",
						"durationNormal",
						"durationSlow",
						"easingStandard",
						"easingEmphasized",
					] as const
				).map((key) => (
					<TextField
						key={key}
						label={humanize(key)}
						value={mode.motion[key]}
						disabled={readOnly}
						onCommit={(nextValue) =>
							replaceMode((next) => {
								next.motion[key] = nextValue;
							})
						}
					/>
				))}
				<EnumField
					label="Reduced motion"
					value={mode.motion.reducedMotion}
					values={["disable", "reduce"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.motion.reducedMotion =
								nextValue as BrandingMode["motion"]["reducedMotion"];
						})
					}
				/>
				<BooleanField
					label="Decorative motion"
					checked={mode.motion.decorativeMotion}
					disabled={readOnly}
					onChange={(checked) =>
						replaceMode((next) => {
							next.motion.decorativeMotion = checked;
						})
					}
				/>
			</FieldGrid>
		);
	if (step === "visualization")
		return (
			<VisualizationEditor
				mode={mode}
				readOnly={readOnly}
				replaceMode={replaceMode}
			/>
		);
	if (step === "accessibility")
		return (
			<FieldGrid>
				<NumberField
					label="Normal text contrast"
					value={mode.accessibility.normalTextContrast}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.accessibility.normalTextContrast = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.1}
				/>
				<NumberField
					label="Large text contrast"
					value={mode.accessibility.largeTextContrast}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.accessibility.largeTextContrast = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.1}
				/>
				<NumberField
					label="Non-text contrast"
					value={mode.accessibility.nonTextContrast}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.accessibility.nonTextContrast = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.1}
				/>
				<NumberField
					label="Minimum target size"
					value={mode.accessibility.minimumTargetSize}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.accessibility.minimumTargetSize = Math.round(nextValue);
						})
					}
					readOnly={readOnly}
				/>
				<EnumField
					label="Forced colors"
					value={mode.accessibility.forcedColors}
					values={["system", "preserve"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.accessibility.forcedColors =
								nextValue as BrandingMode["accessibility"]["forcedColors"];
						})
					}
				/>
				<EnumField
					label="Automatic corrections"
					value={mode.accessibility.automaticCorrections}
					values={["derived-only", "disabled"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.accessibility.automaticCorrections =
								nextValue as BrandingMode["accessibility"]["automaticCorrections"];
						})
					}
				/>
				<BooleanField
					label="Visible focus"
					checked={mode.accessibility.forceVisibleFocus}
					disabled={readOnly}
					onChange={(checked) =>
						replaceMode((next) => {
							next.accessibility.forceVisibleFocus = checked;
						})
					}
				/>
			</FieldGrid>
		);
	if (step === "components")
		return (
			<FieldGrid>
				<EnumField
					label="Controls"
					value={mode.componentAppearance.controls}
					values={["solid", "soft", "outline"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.componentAppearance.controls =
								nextValue as BrandingMode["componentAppearance"]["controls"];
						})
					}
				/>
				<EnumField
					label="Cards"
					value={mode.componentAppearance.cards}
					values={["flat", "bordered", "elevated"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.componentAppearance.cards =
								nextValue as BrandingMode["componentAppearance"]["cards"];
						})
					}
				/>
				<EnumField
					label="Inputs"
					value={mode.componentAppearance.inputs}
					values={["outlined", "filled", "underlined"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.componentAppearance.inputs =
								nextValue as BrandingMode["componentAppearance"]["inputs"];
						})
					}
				/>
				<TextField
					label="Icon family"
					value={mode.iconography.family}
					disabled={readOnly}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.iconography.family = nextValue;
						})
					}
				/>
				<EnumField
					label="Icon style"
					value={mode.iconography.style}
					values={["outline", "filled", "duotone"]}
					disabled={readOnly}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.iconography.style =
								nextValue as BrandingMode["iconography"]["style"];
						})
					}
				/>
				<NumberField
					label="Icon stroke width"
					value={mode.iconography.strokeWidth}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.iconography.strokeWidth = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.1}
				/>
				<TextField
					label="Icon size"
					value={mode.iconography.defaultSize}
					disabled={readOnly}
					onCommit={(nextValue) =>
						replaceMode((next) => {
							next.iconography.defaultSize = nextValue;
						})
					}
				/>
			</FieldGrid>
		);
	return null;
}

type EditableFontRole = "body" | "heading" | "code";
const INHERIT_BODY_FONT = "inherit.body" as const;

function TypographyEditor({
	typography,
	replaceTypography,
	readOnly,
}: {
	readonly typography: BrandingTypography;
	readonly replaceTypography: (
		mutate: (typography: BrandingTypography) => void,
	) => void;
	readonly readOnly: boolean;
}): ReactElement {
	return (
		<div className="lemn-brand-studio__typography-editor">
			<Alert
				variant="info"
				title="Branding-level typography"
				message="Font roles apply to every mode. System fonts download 0 KB; managed fonts load only when selected."
			/>
			<div className="lemn-brand-studio__font-role-grid">
				{(["body", "heading", "code"] as const).map((role) => (
					<FontRoleEditor
						key={role}
						readOnly={readOnly}
						replaceTypography={replaceTypography}
						role={role}
						typography={typography}
					/>
				))}
			</div>
			<FieldGrid>
				<NumberField
					label="Base size"
					value={typography.baseSize}
					onCommit={(nextValue) =>
						replaceTypography((next) => {
							next.baseSize = nextValue;
						})
					}
					readOnly={readOnly}
				/>
				<NumberField
					label="Display size"
					value={typography.displaySize}
					onCommit={(nextValue) =>
						replaceTypography((next) => {
							next.displaySize = nextValue;
						})
					}
					readOnly={readOnly}
				/>
				<NumberField
					label="Title size"
					value={typography.titleSize}
					onCommit={(nextValue) =>
						replaceTypography((next) => {
							next.titleSize = nextValue;
						})
					}
					readOnly={readOnly}
				/>
				<NumberField
					label="Body line height"
					value={typography.bodyLineHeight}
					onCommit={(nextValue) =>
						replaceTypography((next) => {
							next.bodyLineHeight = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.05}
				/>
				<NumberField
					label="Heading line height"
					value={typography.headingLineHeight}
					onCommit={(nextValue) =>
						replaceTypography((next) => {
							next.headingLineHeight = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.05}
				/>
				<NumberField
					label="Tracking"
					value={typography.tracking}
					onCommit={(nextValue) =>
						replaceTypography((next) => {
							next.tracking = nextValue;
						})
					}
					readOnly={readOnly}
					step={0.01}
				/>
			</FieldGrid>
		</div>
	);
}

function FontRoleEditor({
	role,
	typography,
	replaceTypography,
	readOnly,
}: {
	readonly role: EditableFontRole;
	readonly typography: BrandingTypography;
	readonly replaceTypography: (
		mutate: (typography: BrandingTypography) => void,
	) => void;
	readonly readOnly: boolean;
}): ReactElement {
	const selection = typography[role];
	const inherited = selection.source === "inherit";
	const directSelection = inherited ? typography.body : selection;
	const record = getFontCatalogRecord(directSelection.ref);
	const roleLabel = humanize(role);
	return (
		<section
			className="lemn-brand-studio__font-role"
			aria-label={`${roleLabel} font settings`}
		>
			<Labeled label={`${roleLabel} font`}>
				<SelectNative
					aria-label={`${roleLabel} font`}
					disabled={readOnly}
					onValueChange={(fontRef) =>
						replaceTypography((next) => {
							if (role === "heading" && fontRef === INHERIT_BODY_FONT) {
								next.heading = { source: "inherit", role: "body" };
								return;
							}
							setFontSelection(
								next,
								role,
								createFontSelection(
									fontRef as FontCatalogRef,
									role,
									getDirectSelection(next, role),
								),
							);
						})
					}
					options={fontOptions(role)}
					value={inherited ? INHERIT_BODY_FONT : selection.ref}
				/>
			</Labeled>
			<div className="lemn-brand-studio__font-summary">
				<div className="lemn-brand-studio__font-summary-title">
					<Badge tone={record.source === "managed" ? "info" : "success"}>
						{record.source === "managed" ? "Managed" : "System"}
					</Badge>
					<strong>
						{inherited ? `Same as Body · ${record.label}` : record.label}
					</strong>
					<span>
						{record.source === "system"
							? "0 KB"
							: `≈ ${formatBytes(selectedFontBytes(record, directSelection))}`}
					</span>
				</div>
				<p>{record.description}</p>
				<dl>
					<div>
						<dt>Weights</dt>
						<dd>{directSelection.weights.join(", ")}</dd>
					</div>
					<div>
						<dt>Styles</dt>
						<dd>{directSelection.styles.join(", ")}</dd>
					</div>
					<div>
						<dt>License</dt>
						<dd>
							{record.source === "managed" ? (
								<a
									href={record.licenseArtifactUrl}
									rel="noreferrer"
									target="_blank"
								>
									{record.licenseId}
								</a>
							) : (
								"OS-provided"
							)}
						</dd>
					</div>
				</dl>
			</div>
			{!inherited && selection.source === "managed" ? (
				<div className="lemn-brand-studio__font-policy">
					<Labeled label="Fidelity">
						<SelectNative
							aria-label={`${roleLabel} fidelity`}
							disabled={readOnly}
							onValueChange={(nextValue) =>
								replaceTypography((next) => {
									const current = getDirectSelection(next, role);
									if (current?.source === "managed")
										current.fidelity = nextValue as "preferred" | "required";
								})
							}
							options={[
								{ value: "preferred", label: "Preferred · fallback accepted" },
								{
									value: "required",
									label: "Required · preload before render",
								},
							]}
							value={selection.fidelity}
						/>
					</Labeled>
					<Labeled label="Emergency fallback">
						<SelectNative
							aria-label={`${roleLabel} emergency fallback`}
							disabled={readOnly}
							onValueChange={(nextValue) =>
								replaceTypography((next) => {
									const current = getDirectSelection(next, role);
									if (current)
										current.emergencyFallbackRef =
											nextValue as DirectFontSelection["emergencyFallbackRef"];
								})
							}
							options={systemFallbackOptions()}
							value={selection.emergencyFallbackRef}
						/>
					</Labeled>
				</div>
			) : null}
		</section>
	);
}

function ColorEditor({
	mode,
	readOnly,
	replaceMode,
}: {
	readonly mode: BrandingMode;
	readonly readOnly: boolean;
	readonly replaceMode: (mutate: (mode: BrandingMode) => void) => void;
}): ReactElement {
	const baseKeys = [
		"canvas",
		"surface",
		"surfaceMuted",
		"surfaceElevated",
		"surfaceOverlay",
		"text",
		"textMuted",
		"textInverse",
		"accent",
		"accentForeground",
		"border",
		"borderStrong",
		"focus",
		"selection",
		"disabledSurface",
		"disabledText",
	] as const;
	const statusKeys = ["success", "warning", "danger", "info"] as const;
	return (
		<div className="lemn-brand-studio__color-sections">
			<FieldGrid>
				{baseKeys.map((key) => (
					<ColorField
						disabled={readOnly}
						key={key}
						label={humanize(key)}
						onChange={(nextValue) =>
							replaceMode((next) => {
								next.colors[key] = nextValue;
							})
						}
						value={mode.colors[key]}
					/>
				))}
			</FieldGrid>
			{statusKeys.map((status) => (
				<section key={status}>
					<h3>{humanize(status)}</h3>
					<FieldGrid>
						{(["surface", "foreground", "border"] as const).map((key) => (
							<ColorField
								disabled={readOnly}
								key={`${status}-${key}`}
								label={`${humanize(status)} ${humanize(key)}`}
								onChange={(nextValue) =>
									replaceMode((next) => {
										next.colors[status][key] = nextValue;
									})
								}
								value={mode.colors[status][key]}
							/>
						))}
					</FieldGrid>
				</section>
			))}
		</div>
	);
}

function VisualizationEditor({
	mode,
	readOnly,
	replaceMode,
}: {
	readonly mode: BrandingMode;
	readonly readOnly: boolean;
	readonly replaceMode: (mutate: (mode: BrandingMode) => void) => void;
}): ReactElement {
	const palette = (key: "categorical" | "sequential" | "diverging") =>
		mode.visualization[key].map((color, index) => (
			<ColorField
				disabled={readOnly}
				key={`${key}-${color}`}
				label={`${humanize(key)} ${index + 1}`}
				onChange={(nextValue) =>
					replaceMode((next) => {
						next.visualization[key][index] = nextValue;
					})
				}
				value={color}
			/>
		));
	return (
		<FieldGrid>
			{palette("categorical")}
			{palette("sequential")}
			{palette("diverging")}
			{(
				[
					"positive",
					"negative",
					"neutral",
					"axis",
					"grid",
					"label",
					"crosshair",
					"tooltipSurface",
					"tooltipBorder",
					"tooltipText",
					"cursor",
					"selection",
				] as const
			).map((key) => (
				<ColorField
					disabled={readOnly}
					key={key}
					label={humanize(key)}
					onChange={(nextValue) =>
						replaceMode((next) => {
							next.visualization[key] = nextValue;
						})
					}
					value={mode.visualization[key] ?? mode.visualization.axis}
				/>
			))}
			<NumberField
				label="Muted opacity"
				value={mode.visualization.mutedOpacity}
				onCommit={(nextValue) =>
					replaceMode((next) => {
						next.visualization.mutedOpacity = nextValue;
					})
				}
				readOnly={readOnly}
				step={0.05}
			/>
			<NumberField
				label="Inactive opacity"
				value={mode.visualization.inactiveOpacity}
				onCommit={(nextValue) =>
					replaceMode((next) => {
						next.visualization.inactiveOpacity = nextValue;
					})
				}
				readOnly={readOnly}
				step={0.05}
			/>
		</FieldGrid>
	);
}

function fontOptions(role: EditableFontRole) {
	const records = fontCatalog.filter((record) =>
		role === "code" ? record.category === "mono" : record.category !== "mono",
	);
	return [
		...(role === "heading"
			? [
					{
						label: "Inheritance",
						options: [
							{ value: INHERIT_BODY_FONT, label: "Same as Body · recommended" },
						],
					},
				]
			: []),
		{
			label: "System · 0 KB",
			options: records
				.filter((record) => record.source === "system")
				.map((record) => ({ value: record.ref, label: record.label })),
		},
		{
			label: "Managed · Cloudflare CDN",
			options: records
				.filter((record) => record.source === "managed")
				.map((record) => ({
					value: record.ref,
					label: `${record.label} · ${formatBytes(record.estimatedBytes)}`,
				})),
		},
	].filter((group) => group.options.length > 0);
}

function systemFallbackOptions() {
	return fontCatalog
		.filter((record) => record.source === "system")
		.map((record) => ({ value: record.ref, label: `${record.label} · 0 KB` }));
}

function createFontSelection(
	ref: FontCatalogRef,
	role: EditableFontRole,
	previous?: DirectFontSelection,
): DirectFontSelection {
	const record = getFontCatalogRecord(ref);
	const targets =
		role === "heading"
			? [600, 700]
			: role === "code"
				? [400, 600]
				: [400, 500, 600];
	const weights = targets.filter((weight) =>
		record.supportedWeights.includes(weight),
	);
	const style = record.supportedStyles.includes("normal")
		? "normal"
		: (record.supportedStyles[0] ?? "normal");
	const common = {
		fidelity:
			record.source === "managed" && previous?.source === "managed"
				? previous.fidelity
				: ("preferred" as const),
		emergencyFallbackRef: defaultSystemFallback(record.category),
		weights: weights.length ? weights : [record.supportedWeights[0] ?? 400],
		styles: [style],
	};
	return record.source === "managed"
		? { source: "managed", ref: record.ref, ...common }
		: { source: "system", ref: record.ref, ...common, fidelity: "preferred" };
}

function defaultSystemFallback(
	category: FontCatalogRecord["category"],
): DirectFontSelection["emergencyFallbackRef"] {
	if (category === "mono") return "system.mono";
	if (category === "serif") return "system.serif";
	return "system.ui";
}

function getDirectSelection(
	typography: BrandingTypography,
	role: EditableFontRole,
): DirectFontSelection | undefined {
	const selection = typography[role];
	return selection.source === "inherit" ? undefined : selection;
}

function setFontSelection(
	typography: BrandingTypography,
	role: EditableFontRole,
	selection: DirectFontSelection,
): void {
	if (role === "body") typography.body = selection;
	else if (role === "heading") typography.heading = selection;
	else typography.code = selection;
}

function selectedFontBytes(
	record: FontCatalogRecord,
	selection: DirectFontSelection,
): number {
	if (record.source === "system") return 0;
	return record.resources
		.filter(
			(resource) =>
				selection.styles.includes(resource.style) &&
				selection.weights.some(
					(weight) =>
						weight >= resource.weightRange[0] &&
						weight <= resource.weightRange[1],
				),
		)
		.reduce((total, resource) => total + resource.estimatedBytes, 0);
}

function formatBytes(bytes: number): string {
	return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
}

function safeCompiledMode(artifact: CompiledBrandingArtifact, modeId: string) {
	try {
		return getCompiledMode(artifact, modeId);
	} catch {
		return undefined;
	}
}

function ColorField({
	label,
	value,
	onChange,
	disabled,
}: {
	readonly label: string;
	readonly value: string;
	readonly onChange: (value: string) => void;
	readonly disabled: boolean;
}): ReactElement {
	return (
		<Labeled label={label}>
			<span className="lemn-brand-studio__color">
				<input
					aria-label={`${label} color`}
					disabled={disabled}
					onChange={(event) => onChange(event.currentTarget.value)}
					type="color"
					value={value}
				/>
				<Input
					aria-label={`${label} hex`}
					disabled={disabled}
					onKeyDown={(event) => {
						if (
							event.key === "Enter" &&
							/^#[0-9a-fA-F]{6}$/.test(event.currentTarget.value)
						)
							onChange(event.currentTarget.value);
					}}
					defaultValue={value}
					key={value}
				/>
			</span>
		</Labeled>
	);
}

function TextField({
	label,
	value,
	onCommit,
	disabled,
}: {
	readonly label: string;
	readonly value: string;
	readonly onCommit: (value: string) => void;
	readonly disabled: boolean;
}): ReactElement {
	return (
		<Labeled label={label}>
			<Input
				defaultValue={value}
				disabled={disabled}
				key={`${label}-${value}`}
				onBlur={(event) => onCommit(event.currentTarget.value)}
			/>
		</Labeled>
	);
}

function NumberField({
	label,
	value,
	onCommit,
	readOnly,
	step = 1,
}: {
	readonly label: string;
	readonly value: number;
	readonly onCommit: (value: number) => void;
	readonly readOnly: boolean;
	readonly step?: number;
}): ReactElement {
	return (
		<Labeled label={label}>
			<Input
				defaultValue={value}
				disabled={readOnly}
				key={`${label}-${value}`}
				onBlur={(event) => {
					const nextValue = Number(event.currentTarget.value);
					if (Number.isFinite(nextValue)) onCommit(nextValue);
				}}
				step={step}
				type="number"
			/>
		</Labeled>
	);
}

function EnumField({
	label,
	value,
	values,
	onChange,
	disabled,
}: {
	readonly label: string;
	readonly value: string;
	readonly values: readonly string[];
	readonly onChange: (value: string) => void;
	readonly disabled: boolean;
}): ReactElement {
	return (
		<Labeled label={label}>
			<SelectNative
				disabled={disabled}
				onValueChange={onChange}
				options={values.map((entry) => ({
					value: entry,
					label: humanize(entry),
				}))}
				value={value}
			/>
		</Labeled>
	);
}

function BooleanField({
	label,
	checked,
	onChange,
	disabled,
}: {
	readonly label: string;
	readonly checked: boolean;
	readonly onChange: (checked: boolean) => void;
	readonly disabled: boolean;
}): ReactElement {
	return (
		<Labeled label={label}>
			<span className="lemn-brand-studio__boolean">
				<Checkbox
					checked={checked}
					disabled={disabled}
					onCheckedChange={(value) => onChange(value === true)}
				/>
				<span>{checked ? "Enabled" : "Disabled"}</span>
			</span>
		</Labeled>
	);
}

function Labeled({
	label,
	children,
}: {
	readonly label: string;
	readonly children: ReactElement<{ readonly id?: string }>;
}): ReactElement {
	const generatedId = useId();
	const id = children.props.id ?? generatedId;
	return (
		<label className="lemn-brand-studio__field" htmlFor={id}>
			<span>{label}</span>
			{cloneElement(children, { id })}
		</label>
	);
}

function FieldGrid({
	children,
}: {
	readonly children: ReactNode;
}): ReactElement {
	return <div className="lemn-brand-studio__field-grid">{children}</div>;
}

function humanize(value: string): string {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replaceAll("-", " ")
		.replace(/^./, (letter) => letter.toUpperCase());
}
