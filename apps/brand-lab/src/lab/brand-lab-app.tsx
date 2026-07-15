import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import {
	applyBrandSnapshotToDocument,
	brandFontCatalog,
	type CompiledBrandSnapshot,
	compileBrandProject,
} from "../branding/compiler";
import {
	type BrandColorKey,
	type BrandProject,
	parseBrandProject,
} from "../branding/contract";
import type { BrandPresetSource } from "../branding/preset-definition";
import {
	brandPresetFamilies,
	brandPresetFamilyByProjectId,
	projectIdForPreset,
} from "../branding/presets";
import { AreaChart } from "../providers/echarts/area-chart";
import { BrandButton } from "../providers/react-aria/button";
import {
	RechartsBarChart,
	RechartsDonutChart,
} from "../providers/recharts/charts";
import { BrandCheckbox } from "../providers/shadcn/checkbox";
import type { BrandLabInitialState, BrandProjectRecord } from "./initial-state";

const STEPS = ["Project", "Colors", "Typography", "Shape", "Review"] as const;
type WizardStep = (typeof STEPS)[number];

const CORE_COLORS: readonly { key: BrandColorKey; label: string }[] = [
	{ key: "accent", label: "Accent" },
	{ key: "accentForeground", label: "On accent" },
	{ key: "background", label: "Background" },
	{ key: "surface", label: "Surface" },
	{ key: "text", label: "Text" },
	{ key: "border", label: "Border" },
];

const ADVANCED_COLORS: readonly { key: BrandColorKey; label: string }[] = [
	{ key: "surfaceMuted", label: "Muted surface" },
	{ key: "textMuted", label: "Muted text" },
	{ key: "focus", label: "Focus ring" },
	{ key: "chartPrimary", label: "Chart 1" },
	{ key: "chartSecondary", label: "Chart 2" },
	{ key: "chartTertiary", label: "Chart 3" },
];

export interface BrandLabAppProps {
	readonly initialState: BrandLabInitialState;
}

interface BrandProjectOption extends BrandProjectRecord {
	readonly snapshot: CompiledBrandSnapshot;
}

export function BrandLabApp({ initialState }: BrandLabAppProps) {
	const initialOption = useMemo<BrandProjectOption>(
		() => ({
			project: initialState.activeProject,
			snapshot: initialState.snapshot,
			source: initialState.storageSource,
			degraded: initialState.storageDegraded,
		}),
		[initialState],
	);
	const [projects, setProjects] = useState<readonly BrandProjectOption[]>(() =>
		initialState.projects.map((record) => ({
			...record,
			snapshot:
				record.project.id === initialState.snapshot.projectId
					? initialState.snapshot
					: compileBrandProject(record.project),
		})),
	);
	const [active, setActive] = useState(initialOption);
	const [step, setStep] = useState<WizardStep>("Project");
	const [dirtyProjectIds, setDirtyProjectIds] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const [publishing, setPublishing] = useState(false);
	const [publishMessage, setPublishMessage] = useState<string | null>(null);
	const [checked, setChecked] = useState(true);
	const [pressCount, setPressCount] = useState(0);
	const [copied, setCopied] = useState(false);
	const comparisonCheckboxId = useId();
	const dirty = dirtyProjectIds.has(active.project.id);
	const activePreset = brandPresetFamilyByProjectId(active.project.id);

	const serverChartSvg =
		active.snapshot.hash === initialState.snapshot.hash
			? initialState.initialChartSvg
			: undefined;

	const commitProject = (nextInput: BrandProject) => {
		const project = parseBrandProject(nextInput);
		const snapshot = compileBrandProject(project);

		// The style and root identity move together before React renders the new
		// component props, so every browser frame is either the old or new brand.
		applyBrandSnapshotToDocument(snapshot);

		const nextOption: BrandProjectOption = {
			...active,
			project,
			snapshot,
		};
		setActive(nextOption);
		setProjects((current) =>
			current.map((option) =>
				option.project.id === project.id ? nextOption : option,
			),
		);
		setDirtyProjectIds((current) => new Set(current).add(project.id));
		setPublishMessage(null);
	};

	const switchProject = (projectId: string) => {
		const next = projects.find((option) => option.project.id === projectId);
		if (!next) return;

		applyBrandSnapshotToDocument(next.snapshot);
		setActive(next);
		setPublishMessage(null);

		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			url.searchParams.set("project", projectId);
			window.history.replaceState(null, "", url);
		}
	};

	const updateColor = (key: BrandColorKey, value: string) => {
		commitProject({
			...active.project,
			colors: { ...active.project.colors, [key]: value },
		});
	};

	const publishProject = async () => {
		setPublishing(true);
		setPublishMessage(null);

		try {
			const response = await fetch(
				`/api/projects/${encodeURIComponent(active.project.id)}`,
				{
					method: "PUT",
					credentials: "same-origin",
					headers: {
						"content-type": "application/json",
						"x-brand-lab-csrf": initialState.csrfToken,
					},
					body: JSON.stringify(active.project),
				},
			);
			const body: unknown = await response.json();
			if (!response.ok || !isPublishResponse(body)) {
				throw new Error(publishError(body, response.status));
			}

			const project = parseBrandProject(body.project);
			const snapshot = compileBrandProject(project);
			const next: BrandProjectOption = {
				project,
				snapshot,
				source: "kv",
				degraded: false,
			};
			setActive(next);
			setProjects((current) =>
				current.map((option) =>
					option.project.id === project.id ? next : option,
				),
			);
			setDirtyProjectIds((current) => {
				const next = new Set(current);
				next.delete(project.id);
				return next;
			});
			setPublishMessage(
				"Published. Reload SSR to prove the stored brand is in the first HTML response.",
			);
		} catch (error) {
			setPublishMessage(
				error instanceof Error
					? error.message
					: "The project could not be published.",
			);
		} finally {
			setPublishing(false);
		}
	};

	const copyJson = async () => {
		await navigator.clipboard.writeText(
			JSON.stringify(active.project, null, 2),
		);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1400);
	};

	return (
		<div className="brand-lab-shell">
			<header className="brand-lab-header">
				<div>
					<p className="brand-lab-eyebrow">LEMN UI · architecture MVP</p>
					<h1>Brand Lab</h1>
					<p className="brand-lab-subtitle">
						Explore {brandPresetFamilies.length} brand identities, configure one
						versioned project contract, and watch five selected upstream
						components consume the same server-rendered brand.
					</p>
				</div>
				<section
					className="brand-lab-header__status"
					aria-label="Rendering status"
				>
					<StatusPill tone="success">SSR branded</StatusPill>
					<StatusPill tone={active.degraded ? "warning" : "neutral"}>
						{active.source === "kv" ? "KV published" : "Built-in fallback"}
					</StatusPill>
					<code>{active.snapshot.version}</code>
				</section>
			</header>

			<main className="brand-lab-main">
				<aside
					className="brand-lab-wizard"
					aria-label="Brand configuration wizard"
				>
					<div className="brand-lab-wizard__heading">
						<span>Project contract</span>
						{dirty ? <StatusPill tone="warning">Draft</StatusPill> : null}
					</div>
					<ol className="brand-lab-steps">
						{STEPS.map((item, index) => (
							<li key={item}>
								<button
									type="button"
									className={item === step ? "is-active" : undefined}
									aria-current={item === step ? "step" : undefined}
									onClick={() => setStep(item)}
								>
									<span>{index + 1}</span>
									{item}
								</button>
							</li>
						))}
					</ol>

					<section
						className="brand-lab-fields"
						aria-labelledby="wizard-step-title"
					>
						<h2 id="wizard-step-title">{step}</h2>
						{step === "Project" ? (
							<ProjectFields
								active={active.project}
								onSelect={switchProject}
								onChange={commitProject}
							/>
						) : null}
						{step === "Colors" ? (
							<ColorFields project={active.project} onChange={updateColor} />
						) : null}
						{step === "Typography" ? (
							<TypographyFields
								project={active.project}
								onChange={commitProject}
							/>
						) : null}
						{step === "Shape" ? (
							<ShapeFields project={active.project} onChange={commitProject} />
						) : null}
						{step === "Review" ? (
							<ReviewFields
								project={active.project}
								snapshot={active.snapshot}
								copied={copied}
								publishing={publishing}
								publishMessage={publishMessage}
								onCopy={copyJson}
								onPublish={publishProject}
							/>
						) : null}
					</section>

					<div className="brand-lab-wizard__footer">
						<button
							type="button"
							disabled={step === STEPS[0]}
							onClick={() => setStep(relativeStep(step, -1))}
						>
							Back
						</button>
						<button
							type="button"
							disabled={step === STEPS[STEPS.length - 1]}
							onClick={() => setStep(relativeStep(step, 1))}
						>
							Next
						</button>
					</div>
				</aside>

				<section
					className="brand-lab-preview"
					aria-label="Live branded preview"
				>
					<div className="brand-lab-preview__heading">
						<div>
							<p className="brand-lab-eyebrow">Live project preview</p>
							<h2>{active.project.name}</h2>
						</div>
						<div className="brand-lab-preview__meta">
							{activePreset ? (
								<span>{presetSourceLabel(activePreset.source)}</span>
							) : null}
							<span>{active.project.appearance}</span>
							<span>{active.project.density}</span>
							<span>hash {active.snapshot.hash}</span>
						</div>
					</div>

					<div className="brand-lab-preview__grid">
						<article className="brand-lab-card brand-lab-card--controls">
							<div className="brand-lab-card__heading">
								<div>
									<p className="brand-lab-provider">React Aria</p>
									<h3>Button</h3>
								</div>
								<StatusPill tone="neutral">native onPress</StatusPill>
							</div>
							<p>
								Branding changes only presentation; interaction stays owned
								upstream.
							</p>
							<BrandButton onPress={() => setPressCount((value) => value + 1)}>
								Generate report
							</BrandButton>
							<small aria-live="polite">Pressed {pressCount} times</small>
						</article>

						<article className="brand-lab-card brand-lab-card--controls">
							<div className="brand-lab-card__heading">
								<div>
									<p className="brand-lab-provider">shadcn · Radix</p>
									<h3>Checkbox</h3>
								</div>
								<StatusPill tone="neutral">source-selected</StatusPill>
							</div>
							<p>
								The official structure keeps Radix state and accessibility
								behavior.
							</p>
							<div className="brand-lab-checkbox-row">
								<BrandCheckbox
									id={comparisonCheckboxId}
									checked={checked}
									onCheckedChange={(value) => setChecked(value === true)}
								/>
								<label htmlFor={comparisonCheckboxId}>
									Include period comparison
								</label>
							</div>
							<small aria-live="polite">
								{checked ? "Included" : "Not included"}
							</small>
						</article>

						<article className="brand-lab-card brand-lab-card--chart brand-lab-card--chart-wide">
							<div className="brand-lab-card__heading">
								<div>
									<p className="brand-lab-provider">Apache ECharts</p>
									<h3>Revenue over time</h3>
								</div>
								<ChartTokenPill value={active.project.colors.chartPrimary} />
							</div>
							<AreaChart
								snapshot={active.snapshot}
								initialSvg={serverChartSvg}
								className="brand-lab-area-chart"
							/>
						</article>

						<article className="brand-lab-card brand-lab-card--chart">
							<div className="brand-lab-card__heading">
								<div>
									<p className="brand-lab-provider">Recharts</p>
									<h3>Revenue by month</h3>
								</div>
								<ChartTokenPill value={active.project.colors.chartPrimary} />
							</div>
							<RechartsBarChart snapshot={active.snapshot} />
						</article>

						<article className="brand-lab-card brand-lab-card--chart">
							<div className="brand-lab-card__heading">
								<div>
									<p className="brand-lab-provider">Recharts</p>
									<h3>Revenue by channel</h3>
								</div>
								<ChartTokenPill value={active.project.colors.chartPrimary} />
							</div>
							<RechartsDonutChart snapshot={active.snapshot} />
						</article>
					</div>

					<div className="brand-lab-proof">
						<strong>No unbranded first paint</strong>
						<span>
							HTML, critical CSS and provider containers arrive with the same
							project hash. ECharts also ships its SVG in SSR; Recharts mounts
							only with the already-compiled snapshot.
						</span>
					</div>
				</section>
			</main>
		</div>
	);
}

function ProjectFields({
	active,
	onSelect,
	onChange,
}: {
	readonly active: BrandProject;
	readonly onSelect: (projectId: string) => void;
	readonly onChange: (project: BrandProject) => void;
}) {
	const activeFamily = brandPresetFamilyByProjectId(active.id);
	const codexFamilies = brandPresetFamilies.filter(
		(family) => family.source === "codex-open-source",
	);
	const originalFamilies = brandPresetFamilies.filter(
		(family) => family.source === "lemn-original",
	);
	const referenceFamilies = brandPresetFamilies.filter(
		(family) => family.source === "visual-reference",
	);

	const selectFamily = (familyId: string) => {
		const projectId = projectIdForPreset(familyId, active.appearance);
		if (projectId) onSelect(projectId);
	};

	const selectAppearance = (appearance: BrandProject["appearance"]) => {
		const projectId = activeFamily
			? projectIdForPreset(activeFamily.id, appearance)
			: undefined;
		if (projectId) {
			onSelect(projectId);
			return;
		}
		onChange({ ...active, appearance });
	};

	return (
		<div className="brand-lab-field-stack">
			<label>
				<span>
					Brand preset
					<small className="brand-lab-preset-count">
						{brandPresetFamilies.length} identities
					</small>
				</span>
				<select
					aria-label="Brand preset"
					value={activeFamily?.id ?? ""}
					onChange={(event) => selectFamily(event.target.value)}
				>
					<optgroup label={`Codex open source · ${codexFamilies.length}`}>
						{codexFamilies.map((family) => (
							<option key={family.id} value={family.id}>
								{family.name.replace("Codex · ", "")}
							</option>
						))}
					</optgroup>
					<optgroup label={`LEMN originals · ${originalFamilies.length}`}>
						{originalFamilies.map((family) => (
							<option key={family.id} value={family.id}>
								{family.name}
							</option>
						))}
					</optgroup>
					<optgroup label={`Visual references · ${referenceFamilies.length}`}>
						{referenceFamilies.map((family) => (
							<option key={family.id} value={family.id}>
								{family.name}
							</option>
						))}
					</optgroup>
				</select>
			</label>
			{activeFamily ? (
				<div className="brand-lab-preset-summary">
					<div className="brand-lab-preset-summary__heading">
						<strong>{activeFamily.name}</strong>
						<span>{presetSourceLabel(activeFamily.source, true)}</span>
					</div>
					<p>{activeFamily.description}</p>
					<div
						className="brand-lab-preset-swatches"
						role="img"
						aria-label="Active palette"
					>
						{[
							active.colors.background,
							active.colors.surface,
							active.colors.accent,
							active.colors.chartSecondary,
							active.colors.chartTertiary,
						].map((color, index) => (
							<span
								key={`${color}-${index}`}
								title={color}
								style={{ backgroundColor: color }}
							/>
						))}
					</div>
				</div>
			) : null}
			<label>
				<span>Name</span>
				<input
					value={active.name}
					maxLength={64}
					onChange={(event) => {
						const name = event.target.value.trimStart();
						if (name.length > 0) onChange({ ...active, name });
					}}
				/>
			</label>
			<fieldset>
				<legend>Appearance</legend>
				<div className="brand-lab-segmented">
					{(["light", "dark"] as const).map((appearance) => (
						<label key={appearance}>
							<input
								type="radio"
								name="appearance"
								value={appearance}
								checked={active.appearance === appearance}
								onChange={() => selectAppearance(appearance)}
							/>
							<span>{appearance}</span>
						</label>
					))}
				</div>
			</fieldset>
			<p className="brand-lab-help">
				Each identity has a complete light and dark contract. The project ID and
				schema version stay stable; styles are swappable snapshots, not
				component forks.
			</p>
		</div>
	);
}

function ColorFields({
	project,
	onChange,
}: {
	readonly project: BrandProject;
	readonly onChange: (key: BrandColorKey, value: string) => void;
}) {
	return (
		<div className="brand-lab-field-stack">
			<div className="brand-lab-color-grid">
				{CORE_COLORS.map(({ key, label }) => (
					<ColorField
						key={key}
						label={label}
						value={project.colors[key]}
						onChange={(value) => onChange(key, value)}
					/>
				))}
			</div>
			<details>
				<summary>Advanced semantic colors</summary>
				<div className="brand-lab-color-grid brand-lab-color-grid--advanced">
					{ADVANCED_COLORS.map(({ key, label }) => (
						<ColorField
							key={key}
							label={label}
							value={project.colors[key]}
							onChange={(value) => onChange(key, value)}
						/>
					))}
				</div>
			</details>
		</div>
	);
}

function ColorField({
	label,
	value,
	onChange,
}: {
	readonly label: string;
	readonly value: string;
	readonly onChange: (value: string) => void;
}) {
	const id = useId();
	const [draft, setDraft] = useState(value);

	useEffect(() => setDraft(value), [value]);

	const commit = () => {
		if (/^#[0-9a-fA-F]{6}$/.test(draft)) onChange(draft.toLowerCase());
		else setDraft(value);
	};

	return (
		<div className="brand-lab-color-field">
			<label htmlFor={`${id}-text`}>{label}</label>
			<div>
				<input
					id={`${id}-color`}
					type="color"
					value={value}
					aria-label={`${label} color picker`}
					onInput={(event) => onChange(event.currentTarget.value)}
				/>
				<input
					id={`${id}-text`}
					value={draft}
					spellCheck={false}
					onChange={(event) => setDraft(event.target.value)}
					onBlur={commit}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							commit();
						}
					}}
				/>
			</div>
		</div>
	);
}

function TypographyFields({
	project,
	onChange,
}: {
	readonly project: BrandProject;
	readonly onChange: (project: BrandProject) => void;
}) {
	const updateTypography = (patch: Partial<BrandProject["typography"]>) =>
		onChange({ ...project, typography: { ...project.typography, ...patch } });

	return (
		<div className="brand-lab-field-stack">
			<FontSelect
				label="Body family"
				value={project.typography.bodyFamily}
				onChange={(bodyFamily) => updateTypography({ bodyFamily })}
			/>
			<FontSelect
				label="Heading family"
				value={project.typography.headingFamily}
				onChange={(headingFamily) => updateTypography({ headingFamily })}
			/>
			<RangeField
				label="Base size"
				value={project.typography.baseSize}
				min={14}
				max={18}
				suffix="px"
				onChange={(baseSize) => updateTypography({ baseSize })}
			/>
			<label>
				<span>Heading weight</span>
				<select
					value={project.typography.headingWeight}
					onChange={(event) =>
						updateTypography({ headingWeight: Number(event.target.value) })
					}
				>
					{[500, 600, 700, 800].map((weight) => (
						<option key={weight} value={weight}>
							{weight}
						</option>
					))}
				</select>
			</label>
		</div>
	);
}

function FontSelect({
	label,
	value,
	onChange,
}: {
	readonly label: string;
	readonly value: BrandProject["typography"]["bodyFamily"];
	readonly onChange: (value: BrandProject["typography"]["bodyFamily"]) => void;
}) {
	return (
		<label>
			<span>{label}</span>
			<select
				value={value}
				onChange={(event) =>
					onChange(
						event.target.value as BrandProject["typography"]["bodyFamily"],
					)
				}
			>
				{brandFontCatalog.map((font) => (
					<option key={font.id} value={font.id}>
						{font.id}
					</option>
				))}
			</select>
		</label>
	);
}

function ShapeFields({
	project,
	onChange,
}: {
	readonly project: BrandProject;
	readonly onChange: (project: BrandProject) => void;
}) {
	const updateShape = (patch: Partial<BrandProject["shape"]>) =>
		onChange({ ...project, shape: { ...project.shape, ...patch } });

	return (
		<div className="brand-lab-field-stack">
			<RangeField
				label="Control radius"
				value={project.shape.controlRadius}
				min={0}
				max={20}
				suffix="px"
				onChange={(controlRadius) => updateShape({ controlRadius })}
			/>
			<RangeField
				label="Card radius"
				value={project.shape.cardRadius}
				min={0}
				max={28}
				suffix="px"
				onChange={(cardRadius) => updateShape({ cardRadius })}
			/>
			<RangeField
				label="Border width"
				value={project.shape.borderWidth}
				min={0}
				max={3}
				suffix="px"
				onChange={(borderWidth) => updateShape({ borderWidth })}
			/>
			<label>
				<span>Elevation</span>
				<select
					value={project.elevation}
					onChange={(event) =>
						onChange({
							...project,
							elevation: event.target.value as BrandProject["elevation"],
						})
					}
				>
					{(["none", "subtle", "strong"] as const).map((value) => (
						<option key={value}>{value}</option>
					))}
				</select>
			</label>
			<label>
				<span>Density</span>
				<select
					value={project.density}
					onChange={(event) =>
						onChange({
							...project,
							density: event.target.value as BrandProject["density"],
						})
					}
				>
					{(["compact", "comfortable", "spacious"] as const).map((value) => (
						<option key={value}>{value}</option>
					))}
				</select>
			</label>
		</div>
	);
}

function RangeField({
	label,
	value,
	min,
	max,
	suffix,
	onChange,
}: {
	readonly label: string;
	readonly value: number;
	readonly min: number;
	readonly max: number;
	readonly suffix: string;
	readonly onChange: (value: number) => void;
}) {
	return (
		<label>
			<span>
				{label}{" "}
				<output>
					{value}
					{suffix}
				</output>
			</span>
			<input
				type="range"
				value={value}
				min={min}
				max={max}
				onInput={(event) => onChange(Number(event.currentTarget.value))}
			/>
		</label>
	);
}

function ReviewFields({
	project,
	snapshot,
	copied,
	publishing,
	publishMessage,
	onCopy,
	onPublish,
}: {
	readonly project: BrandProject;
	readonly snapshot: CompiledBrandSnapshot;
	readonly copied: boolean;
	readonly publishing: boolean;
	readonly publishMessage: string | null;
	readonly onCopy: () => Promise<void>;
	readonly onPublish: () => Promise<void>;
}) {
	return (
		<div className="brand-lab-review">
			<div className="brand-lab-review__meta">
				<span>Schema v{project.schemaVersion}</span>
				<span>{snapshot.hash}</span>
			</div>
			<pre>{JSON.stringify(project, null, 2)}</pre>
			<div className="brand-lab-review__actions">
				<BrandButton className="brand-lab-button--secondary" onPress={onCopy}>
					{copied ? "Copied" : "Copy JSON"}
				</BrandButton>
				<BrandButton isPending={publishing} onPress={onPublish}>
					{publishing ? "Publishing…" : "Publish to local KV"}
				</BrandButton>
			</div>
			{publishMessage ? <p role="status">{publishMessage}</p> : null}
			<a href={`/?project=${encodeURIComponent(project.id)}`}>
				Reload SSR proof
			</a>
		</div>
	);
}

function StatusPill({
	children,
	tone,
}: {
	readonly children: ReactNode;
	readonly tone: "success" | "warning" | "neutral";
}) {
	return (
		<span className={`brand-lab-pill brand-lab-pill--${tone}`}>{children}</span>
	);
}

function ChartTokenPill({ value }: { readonly value: string }) {
	return (
		<span className="brand-lab-chart-token">
			<span aria-hidden="true" style={{ backgroundColor: value }} />
			Chart 1
		</span>
	);
}

function relativeStep(current: WizardStep, offset: -1 | 1): WizardStep {
	const currentIndex = STEPS.indexOf(current);
	const next = STEPS[currentIndex + offset];
	return next ?? current;
}

function isPublishResponse(
	value: unknown,
): value is { readonly project: unknown; readonly snapshot: unknown } {
	return (
		typeof value === "object" &&
		value !== null &&
		"project" in value &&
		"snapshot" in value
	);
}

function presetSourceLabel(source: BrandPresetSource, compact = false): string {
	switch (source) {
		case "codex-open-source":
			return compact ? "Codex OSS" : "Codex open source";
		case "lemn-original":
			return "LEMN original";
		case "visual-reference":
			return compact ? "Visual study" : "Public visual reference";
	}
}

function publishError(value: unknown, status: number): string {
	if (
		typeof value === "object" &&
		value !== null &&
		"error" in value &&
		typeof value.error === "string"
	) {
		return value.error;
	}
	return `Publish failed with HTTP ${status}.`;
}
