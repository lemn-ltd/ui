import {
  compileBrandProject,
  fontCatalog,
  getFontCatalogRecord,
  getCompiledScope,
  safeParseBrandProject,
  type BrandMode,
  type BrandProject,
  type BrandTypography,
  type DirectFontSelection,
  type FontCatalogRecord,
  type FontCatalogRef,
  type CompiledBrandArtifact
} from "@lemn-ltd/brand-contract";
import {
  Alert,
  AreaChart,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  SelectNative,
  Textarea
} from "@lemn-ltd/ui";
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useState
} from "react";
import { brandStudioSteps } from "./catalog.js";
import { brandPresets, createBrandFromPreset } from "./presets.js";
import type { BrandStudioProps, BrandStudioStepId } from "./types.js";
import "./styles.css";

const PREVIEW_DATA = [
  { month: "Jan", bookings: 38, completed: 31 },
  { month: "Feb", bookings: 52, completed: 44 },
  { month: "Mar", bookings: 48, completed: 43 },
  { month: "Apr", bookings: 66, completed: 59 },
  { month: "May", bookings: 72, completed: 64 }
] as const;

export function BrandStudio({
  value,
  onChange,
  onIntent,
  hostStatus = { state: "idle" },
  hostAdapter,
  initialStep = "identity",
  initialProfileId,
  initialModeId,
  readOnly = false,
  className
}: BrandStudioProps): ReactElement {
  const resolvedHostStatus = hostAdapter?.status ?? hostStatus;
  const dispatchIntent = hostAdapter?.dispatch ?? onIntent;
  const [step, setStep] = useState<BrandStudioStepId>(initialStep);
  const [profileId, setProfileId] = useState(initialProfileId ?? value.defaultProfileId);
  const initialProfile = value.profiles[profileId] ?? value.profiles[value.defaultProfileId];
  const [modeId, setModeId] = useState(initialModeId ?? initialProfile?.defaultMode ?? "light");
  const [artifact, setArtifact] = useState<CompiledBrandArtifact>();
  const [diagnostics, setDiagnostics] = useState<readonly { code: string; severity: "error" | "warning"; path: string; message: string }[]>([]);
  const [compiling, setCompiling] = useState(true);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(value, null, 2));
  const [jsonError, setJsonError] = useState<string>();

  useEffect(() => {
    setJsonText(JSON.stringify(value, null, 2));
  }, [value]);

  useEffect(() => {
    let active = true;
    setCompiling(true);
    void compileBrandProject(value).then((result) => {
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
    if (value.profiles[profileId]) return;
    setProfileId(value.defaultProfileId);
  }, [profileId, value.defaultProfileId, value.profiles]);

  const profile = value.profiles[profileId] ?? value.profiles[value.defaultProfileId];
  const resolvedProfile = artifact?.profiles[profileId];
  const availableModes = resolvedProfile?.modes ?? profile?.modes ?? {};
  const resolvedModeId = availableModes[modeId] ? modeId : (profile?.defaultMode ?? resolvedProfile?.defaultMode ?? Object.keys(availableModes)[0] ?? "light");
  const mode = profile?.modes[resolvedModeId] ?? resolvedProfile?.modes[resolvedModeId];
  const typography = profile?.typography ?? resolvedProfile?.typography;
  const scope = artifact ? safeScope(artifact, profileId, resolvedModeId) : undefined;
  const currentStep = brandStudioSteps.find((entry) => entry.id === step) ?? brandStudioSteps[0];
  const profileOptions = Object.entries(value.profiles).map(([id, entry]) => ({ value: id, label: entry.name }));
  const modeOptions = Object.keys(availableModes).map((id) => ({ value: id, label: id }));
  const errorCount = diagnostics.filter((entry) => entry.severity === "error").length;
  const warningCount = diagnostics.length - errorCount;
  const css = artifact?.criticalCss ?? "";

  const replaceMode = (mutate: (next: BrandMode) => void): void => {
    if (readOnly || !mode) return;
    const next = structuredClone(value);
    const nextMode = next.profiles[profileId]?.modes[resolvedModeId];
    if (!nextMode) return;
    mutate(nextMode);
    const parsed = safeParseBrandProject(next);
    if (parsed.success) onChange(parsed.data);
  };

  const replaceProject = (mutate: (next: BrandProject) => void): void => {
    if (readOnly) return;
    const next = structuredClone(value);
    mutate(next);
    const parsed = safeParseBrandProject(next);
    if (parsed.success) onChange(parsed.data);
  };

  const replaceTypography = (mutate: (next: BrandTypography) => void): void => {
    if (readOnly || !profile || !typography) return;
    const next = structuredClone(value);
    const nextProfile = next.profiles[profileId];
    if (!nextProfile) return;
    nextProfile.typography = structuredClone(typography);
    mutate(nextProfile.typography);
    const parsed = safeParseBrandProject(next);
    if (parsed.success) onChange(parsed.data);
  };

  const applyJson = (): void => {
    if (readOnly) return;
    try {
      const parsedJson: unknown = JSON.parse(jsonText);
      const parsed = safeParseBrandProject(parsedJson);
      if (!parsed.success) {
        setJsonError(parsed.error.issues.map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`).join("\n"));
        return;
      }
      setJsonError(undefined);
      onChange(parsed.data);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const emitValidate = (): void => {
    void compileBrandProject(value).then((result) => dispatchIntent?.({ type: "validate", draft: value, compileResult: result }));
  };

  return (
    <section className={["lemn-brand-studio", className].filter(Boolean).join(" ")} aria-label="Brand Studio">
      {css ? <style data-lemn-brand-critical="true">{css}</style> : null}
      <header className="lemn-brand-studio__header">
        <div>
          <p className="lemn-brand-studio__eyebrow">Brand Studio</p>
          <h1>{value.name}</h1>
          <p>Author one versioned brand with switchable profiles and modes.</p>
        </div>
        <div className="lemn-brand-studio__selectors">
          <Labeled label="Profile">
            <SelectNative aria-label="Profile" options={profileOptions} value={profileId} onValueChange={(next) => {
              setProfileId(next);
              const nextProfile = value.profiles[next];
              if (nextProfile) setModeId(nextProfile.defaultMode ?? Object.keys(nextProfile.modes)[0] ?? "light");
            }} />
          </Labeled>
          <Labeled label="Mode">
            <SelectNative aria-label="Mode" options={modeOptions} value={resolvedModeId} onValueChange={setModeId} />
          </Labeled>
        </div>
      </header>

      <div className="lemn-brand-studio__layout">
        <nav aria-label="Brand configuration steps" className="lemn-brand-studio__steps">
          {brandStudioSteps.map((entry, index) => (
            <button aria-current={entry.id === step ? "step" : undefined} key={entry.id} onClick={() => setStep(entry.id)} type="button">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span><strong>{entry.label}</strong><small>{entry.advanced ? "Advanced" : entry.description}</small></span>
            </button>
          ))}
        </nav>

        <main className="lemn-brand-studio__editor">
          <div className="lemn-brand-studio__section-heading">
            <div><p>Step {brandStudioSteps.findIndex((entry) => entry.id === step) + 1}</p><h2>{currentStep?.label}</h2><span>{currentStep?.description}</span></div>
            <div className="lemn-brand-studio__health" aria-live="polite">
              <Badge tone={errorCount ? "danger" : "success"}>{compiling ? "Compiling" : errorCount ? `${errorCount} errors` : "Valid"}</Badge>
              {warningCount ? <Badge tone="warn">{warningCount} warnings</Badge> : null}
            </div>
          </div>

          {mode ? renderEditor({ step, value, mode, typography, profileId, modeId: resolvedModeId, readOnly, replaceMode, replaceTypography, replaceProject, onChange, setProfileId, setModeId }) : (
            <Alert variant="error" title="No mode available" message="This profile must resolve at least one complete mode." />
          )}

          {step === "review" ? (
            <div className="lemn-brand-studio__json">
              <Labeled label="Source contract JSON">
                <Textarea aria-label="Source contract JSON" invalid={Boolean(jsonError)} onChange={(event) => setJsonText(event.currentTarget.value)} readOnly={readOnly} rows={20} spellCheck={false} value={jsonText} />
              </Labeled>
              {jsonError ? <pre className="lemn-brand-studio__json-error" role="alert">{jsonError}</pre> : null}
              <Button disabled={readOnly} onClick={applyJson} variant="secondary">Apply valid JSON</Button>
              {artifact ? (
                <details><summary>Compiled artifact</summary><pre>{JSON.stringify(artifact, null, 2)}</pre></details>
              ) : null}
            </div>
          ) : null}

          {diagnostics.length ? (
            <div className="lemn-brand-studio__diagnostics" aria-label="Brand diagnostics">
              {diagnostics.map((entry) => (
                <Alert key={`${entry.code}-${entry.path}`} variant={entry.severity === "error" ? "error" : "warning"} title={entry.code} message={`${entry.path}: ${entry.message}`} />
              ))}
            </div>
          ) : null}

          <footer className="lemn-brand-studio__actions">
            <Button onClick={emitValidate} variant="secondary">Validate</Button>
            <Button disabled={!artifact || readOnly} onClick={() => artifact && void dispatchIntent?.({ type: "plan-publication", draft: value, artifact })}>Plan publication</Button>
            <Button disabled={!artifact || readOnly || resolvedHostStatus.expectedRevision === undefined} onClick={() => artifact && void dispatchIntent?.({
              type: "apply-publication",
              draft: value,
              artifact,
              expectedRevision: resolvedHostStatus.expectedRevision ?? 0,
              idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${artifact.compiledHash.slice(0, 12)}`
            })}>Apply approved plan</Button>
            {resolvedHostStatus.message ? <span data-state={resolvedHostStatus.state}>{resolvedHostStatus.message}</span> : null}
          </footer>
        </main>

        <aside className="lemn-brand-studio__preview" aria-label="Live brand preview">
          <div className="lemn-brand-studio__preview-sticky">
            <p className="lemn-brand-studio__eyebrow">Live compiled preview</p>
            {scope ? (
              <div className="lemn-brand-studio__preview-scope" {...scope.attributes}>
                <Card elevated title={<><span>Appointment overview</span> <Badge tone="success">Live</Badge></>}>
                  <div aria-label="Typography specimen" className="lemn-brand-studio__type-specimen">
                    <span>Heading specimen</span>
                    <h2>Care that feels unmistakably yours.</h2>
                    <p>Body text stays readable across product surfaces, profiles, and color modes.</p>
                    <code>appointment.status = &quot;confirmed&quot;</code>
                  </div>
                  <p>Every control below consumes the same compiled semantic scope.</p>
                  <div className="lemn-brand-studio__preview-actions"><Button>Book appointment</Button><Button variant="secondary">View schedule</Button></div>
                  <label className="lemn-brand-studio__check"><Checkbox aria-label="Send reminder" defaultChecked /><span>Send appointment reminder</span></label>
                  <AreaChart aria-label="Bookings and completed visits" animation="none" data={PREVIEW_DATA} height={220} index="month" series={[
                    { dataKey: "bookings", name: "Bookings", color: "var(--lemn-chart-series-1)" },
                    { dataKey: "completed", name: "Completed", color: "var(--lemn-chart-series-2)" }
                  ]} />
                </Card>
              </div>
            ) : <Alert variant="error" title="Preview unavailable" message="Resolve blocking diagnostics to compile this profile." />}
          </div>
        </aside>
      </div>
    </section>
  );
}

type EditorContext = {
  readonly step: BrandStudioStepId;
  readonly value: BrandProject;
  readonly mode: BrandMode;
  readonly typography: BrandTypography | undefined;
  readonly profileId: string;
  readonly modeId: string;
  readonly readOnly: boolean;
  readonly replaceMode: (mutate: (mode: BrandMode) => void) => void;
  readonly replaceTypography: (mutate: (typography: BrandTypography) => void) => void;
  readonly replaceProject: (mutate: (project: BrandProject) => void) => void;
  readonly onChange: (next: BrandProject) => void;
  readonly setProfileId: (id: string) => void;
  readonly setModeId: (id: string) => void;
};

function renderEditor(context: EditorContext): ReactElement | null {
  const { step, value, mode, typography, profileId, modeId, readOnly, replaceMode, replaceTypography, replaceProject, onChange, setProfileId, setModeId } = context;
  if (step === "identity") return (
    <FieldGrid>
      <Labeled label="Brand name"><Input defaultValue={value.name} disabled={readOnly} key={value.name} onBlur={(event) => replaceProject((next) => { next.name = event.currentTarget.value.trim() || next.name; })} /></Labeled>
      <Labeled label="Brand ID"><Input defaultValue={value.brandId} disabled={readOnly} key={value.brandId} onBlur={(event) => replaceProject((next) => { next.brandId = event.currentTarget.value.trim() || next.brandId; })} /></Labeled>
      <Labeled label="Owner"><Input defaultValue={value.metadata.owner ?? ""} disabled={readOnly} key={value.metadata.owner} onBlur={(event) => replaceProject((next) => { next.metadata.owner = event.currentTarget.value.trim() || undefined; })} /></Labeled>
      <Labeled label="Description"><Textarea defaultValue={value.metadata.description ?? ""} disabled={readOnly} key={value.metadata.description} onBlur={(event) => replaceProject((next) => { next.metadata.description = event.currentTarget.value.trim() || undefined; })} /></Labeled>
    </FieldGrid>
  );
  if (step === "presets") return (
    <div className="lemn-brand-studio__preset-grid">
      {brandPresets.map((preset) => <button disabled={readOnly} key={preset.id} onClick={() => {
        const next = createBrandFromPreset(preset.id, { brandId: value.brandId, name: value.name });
        onChange(next);
        setProfileId(next.defaultProfileId);
        setModeId(next.profiles[next.defaultProfileId]?.defaultMode ?? "light");
      }} type="button"><span style={{ background: `linear-gradient(135deg, ${preset.light.accent}, ${preset.dark.accent})` }} /><strong>{preset.name}</strong><small>{preset.description}</small></button>)}
    </div>
  );
  if (step === "assets") return (
    <div className="lemn-brand-studio__info"><Alert variant="info" title={`${Object.keys(value.assets).length} managed assets`} message="Hosts upload immutable assets and provide their storage key, media type and SHA-256. Studio never fetches or persists files." /><pre>{JSON.stringify(value.assets, null, 2)}</pre></div>
  );
  if (step === "profiles") return (
    <div className="lemn-brand-studio__profiles">
      {Object.entries(value.profiles).map(([id, entry]) => <Card key={id} title={entry.name}><p><code>{id}</code> · {Object.keys(entry.modes).join(", ") || "inherits modes"}</p><Button onClick={() => { setProfileId(id); setModeId(entry.defaultMode ?? Object.keys(entry.modes)[0] ?? modeId); }} variant={id === profileId ? "primary" : "secondary"}>Edit profile</Button></Card>)}
      <Button disabled={readOnly} onClick={() => {
        const id = nextProfileId(value);
        replaceProject((next) => {
          const base = next.profiles[profileId];
          if (!base) return;
          next.profiles[id] = { ...structuredClone(base), name: `Profile ${Object.keys(next.profiles).length + 1}`, extends: undefined };
        });
        setProfileId(id);
      }} variant="secondary">Duplicate current profile</Button>
    </div>
  );
  if (step === "colors") return <ColorEditor mode={mode} readOnly={readOnly} replaceMode={replaceMode} />;
  if (step === "typography") return typography
    ? <TypographyEditor readOnly={readOnly} replaceTypography={replaceTypography} typography={typography} />
    : <Alert variant="error" title="Typography unavailable" message="A root profile must define typography before it can be edited." />;
  if (step === "shape") return (
    <FieldGrid>
      {(["radiusSmall", "radiusMedium", "radiusLarge", "radiusControl", "radiusCard", "radiusPill"] as const).map((key) => <Labeled key={key} label={humanize(key)}><Input defaultValue={mode.shape[key]} disabled={readOnly} key={`${key}-${mode.shape[key]}`} onBlur={(event) => replaceMode((next) => { next.shape[key] = event.currentTarget.value; })} /></Labeled>)}
      {(["raised", "overlay", "modal"] as const).map((key) => <Labeled key={key} label={`${humanize(key)} shadow`}><Input defaultValue={mode.elevation[key]} disabled={readOnly} key={`${key}-${mode.elevation[key]}`} onBlur={(event) => replaceMode((next) => { next.elevation[key] = event.currentTarget.value; })} /></Labeled>)}
    </FieldGrid>
  );
  if (step === "density-motion") return (
    <FieldGrid>
      <Labeled label="Density"><SelectNative disabled={readOnly} onValueChange={(value) => replaceMode((next) => { next.spacingAndDensity.density = value as BrandMode["spacingAndDensity"]["density"]; })} options={["compact", "comfortable", "spacious"].map((value) => ({ value, label: value }))} value={mode.spacingAndDensity.density} /></Labeled>
      <NumberField label="Spacing scale" value={mode.spacingAndDensity.scale} onCommit={(value) => replaceMode((next) => { next.spacingAndDensity.scale = value; })} readOnly={readOnly} step={0.05} />
      <Labeled label="Normal duration"><Input defaultValue={mode.motion.durationNormal} disabled={readOnly} key={mode.motion.durationNormal} onBlur={(event) => replaceMode((next) => { next.motion.durationNormal = event.currentTarget.value; })} /></Labeled>
      <Labeled label="Decorative motion"><span className="lemn-brand-studio__boolean"><Checkbox checked={mode.motion.decorativeMotion} disabled={readOnly} onCheckedChange={(value) => replaceMode((next) => { next.motion.decorativeMotion = value === true; })} /><span>Allow non-essential animation</span></span></Labeled>
    </FieldGrid>
  );
  if (step === "visualization") return (
    <FieldGrid>
      {mode.visualization.categorical.map((color, index) => <ColorField key={`series-${index}`} label={`Series ${index + 1}`} value={color} disabled={readOnly} onChange={(value) => replaceMode((next) => { next.visualization.categorical[index] = value; })} />)}
      {(["axis", "grid", "label", "cursor", "crosshair", "selection"] as const).map((key) => <ColorField key={key} label={humanize(key)} value={mode.visualization[key] ?? mode.visualization.axis} disabled={readOnly} onChange={(value) => replaceMode((next) => { next.visualization[key] = value; })} />)}
    </FieldGrid>
  );
  if (step === "accessibility") return (
    <FieldGrid>
      <NumberField label="Normal text contrast" value={mode.accessibility.normalTextContrast} onCommit={(value) => replaceMode((next) => { next.accessibility.normalTextContrast = value; })} readOnly={readOnly} step={0.1} />
      <NumberField label="Non-text contrast" value={mode.accessibility.nonTextContrast} onCommit={(value) => replaceMode((next) => { next.accessibility.nonTextContrast = value; })} readOnly={readOnly} step={0.1} />
      <NumberField label="Minimum target size" value={mode.accessibility.minimumTargetSize} onCommit={(value) => replaceMode((next) => { next.accessibility.minimumTargetSize = Math.round(value); })} readOnly={readOnly} />
      <Labeled label="Visible focus"><span className="lemn-brand-studio__boolean"><Checkbox checked={mode.accessibility.forceVisibleFocus} disabled={readOnly} onCheckedChange={(value) => replaceMode((next) => { next.accessibility.forceVisibleFocus = value === true; })} /><span>Always preserve focus indicators</span></span></Labeled>
    </FieldGrid>
  );
  if (step === "components") return (
    <FieldGrid>
      <EnumField label="Controls" value={mode.componentAppearance.controls} values={["solid", "soft", "outline"]} disabled={readOnly} onChange={(value) => replaceMode((next) => { next.componentAppearance.controls = value as BrandMode["componentAppearance"]["controls"]; })} />
      <EnumField label="Cards" value={mode.componentAppearance.cards} values={["flat", "bordered", "elevated"]} disabled={readOnly} onChange={(value) => replaceMode((next) => { next.componentAppearance.cards = value as BrandMode["componentAppearance"]["cards"]; })} />
      <EnumField label="Inputs" value={mode.componentAppearance.inputs} values={["outlined", "filled", "underlined"]} disabled={readOnly} onChange={(value) => replaceMode((next) => { next.componentAppearance.inputs = value as BrandMode["componentAppearance"]["inputs"]; })} />
    </FieldGrid>
  );
  return null;
}

type EditableFontRole = "body" | "heading" | "code";
type EditableFontSelection = BrandTypography[EditableFontRole];

const INHERIT_BODY_FONT = "inherit.body" as const;

function TypographyEditor({
  typography,
  replaceTypography,
  readOnly
}: {
  readonly typography: BrandTypography;
  readonly replaceTypography: (mutate: (typography: BrandTypography) => void) => void;
  readonly readOnly: boolean;
}): ReactElement {
  return (
    <div className="lemn-brand-studio__typography-editor">
      <Alert
        variant="info"
        title="Profile-level typography"
        message="These font roles apply to every light and dark mode in this profile. System fonts download 0 KB; managed fonts load only when selected."
      />
      <div className="lemn-brand-studio__font-role-grid">
        <FontRoleEditor readOnly={readOnly} replaceTypography={replaceTypography} role="body" selection={typography.body} typography={typography} />
        <FontRoleEditor readOnly={readOnly} replaceTypography={replaceTypography} role="heading" selection={typography.heading} typography={typography} />
        <FontRoleEditor readOnly={readOnly} replaceTypography={replaceTypography} role="code" selection={typography.code} typography={typography} />
      </div>
      <FieldGrid>
        <NumberField label="Base size" value={typography.baseSize} onCommit={(value) => replaceTypography((next) => { next.baseSize = value; })} readOnly={readOnly} />
        <NumberField label="Display size" value={typography.displaySize} onCommit={(value) => replaceTypography((next) => { next.displaySize = value; })} readOnly={readOnly} />
        <NumberField label="Body line height" value={typography.bodyLineHeight} onCommit={(value) => replaceTypography((next) => { next.bodyLineHeight = value; })} readOnly={readOnly} step={0.05} />
        <NumberField label="Tracking" value={typography.tracking} onCommit={(value) => replaceTypography((next) => { next.tracking = value; })} readOnly={readOnly} step={0.01} />
      </FieldGrid>
    </div>
  );
}

function FontRoleEditor({
  role,
  selection,
  typography,
  replaceTypography,
  readOnly
}: {
  readonly role: EditableFontRole;
  readonly selection: EditableFontSelection;
  readonly typography: BrandTypography;
  readonly replaceTypography: (mutate: (typography: BrandTypography) => void) => void;
  readonly readOnly: boolean;
}): ReactElement {
  const inherited = selection.source === "inherit";
  const directSelection = inherited ? typography.body : selection;
  const record = getFontCatalogRecord(directSelection.ref);
  const selectedBytes = selectedFontBytes(record, directSelection);
  const roleLabel = humanize(role);

  return (
    <section className="lemn-brand-studio__font-role" aria-label={`${roleLabel} font settings`}>
      <Labeled label={`${roleLabel} font`}>
        <SelectNative
          aria-label={`${roleLabel} font`}
          disabled={readOnly}
          onValueChange={(value) => replaceTypography((next) => {
            if (role === "heading" && value === INHERIT_BODY_FONT) {
              next.heading = { source: "inherit", role: "body" };
              return;
            }
            const previous = getDirectSelection(next, role);
            setFontSelection(next, role, createFontSelection(value as FontCatalogRef, role, previous));
          })}
          options={fontOptions(role)}
          value={inherited ? INHERIT_BODY_FONT : selection.ref}
        />
      </Labeled>

      <div className="lemn-brand-studio__font-summary">
        <div className="lemn-brand-studio__font-summary-title">
          <Badge tone={record.source === "managed" ? "info" : "success"}>{record.source === "managed" ? "Managed" : "System"}</Badge>
          <strong>{inherited ? `Same as Body · ${record.label}` : record.label}</strong>
          <span>{selectedBytes === 0 ? "0 KB" : `≈ ${formatBytes(selectedBytes)}`}</span>
        </div>
        <p>{inherited ? `Heading inherits the complete Body selection. ${record.description}` : record.description}</p>
        <dl>
          <div><dt>Type</dt><dd>{record.category}</dd></div>
          <div><dt>Weights</dt><dd>{directSelection.weights.join(", ")}</dd></div>
          <div><dt>Styles</dt><dd>{directSelection.styles.join(", ")}</dd></div>
          <div>
            <dt>License</dt>
            <dd>{record.source === "managed" ? <a href={record.licenseArtifactUrl} rel="noreferrer" target="_blank">{record.licenseId}</a> : "OS-provided"}</dd>
          </div>
          {record.source === "managed" ? <>
            <div><dt>Source</dt><dd><a href={record.sourceUrl} rel="noreferrer" target="_blank">Pinned Google Fonts source</a></dd></div>
            <div><dt>Attribution</dt><dd>{record.copyrightNotice}</dd></div>
          </> : null}
        </dl>
      </div>

      {!inherited && selection.source === "managed" ? (
        <div className="lemn-brand-studio__font-policy">
          <Labeled label="Fidelity">
            <SelectNative
              aria-label={`${roleLabel} fidelity`}
              disabled={readOnly}
              onValueChange={(value) => replaceTypography((next) => {
                const current = getDirectSelection(next, role);
                if (current?.source === "managed") current.fidelity = value as "preferred" | "required";
              })}
              options={[
                { value: "preferred", label: "Preferred · fallback accepted" },
                { value: "required", label: "Required · preload and block initial fallback paint" }
              ]}
              value={selection.fidelity}
            />
          </Labeled>
          <Labeled label="Emergency fallback">
            <SelectNative
              aria-label={`${roleLabel} emergency fallback`}
              disabled={readOnly}
              onValueChange={(value) => replaceTypography((next) => {
                const current = getDirectSelection(next, role);
                if (current) current.emergencyFallbackRef = value as DirectFontSelection["emergencyFallbackRef"];
              })}
              options={systemFallbackOptions()}
              value={selection.emergencyFallbackRef}
            />
          </Labeled>
        </div>
      ) : null}
    </section>
  );
}

function fontOptions(role: EditableFontRole) {
  const records = fontCatalog.filter((record) => role === "code" ? record.category === "mono" : record.category !== "mono");
  const options = [
    ...(role === "heading" ? [{ label: "Inheritance", options: [{ value: INHERIT_BODY_FONT, label: "Same as Body · recommended" }] }] : []),
    {
      label: "System · 0 KB",
      options: records.filter((record) => record.source === "system").map((record) => ({ value: record.ref, label: record.label }))
    },
    {
      label: "Managed · Cloudflare CDN",
      options: records.filter((record) => record.source === "managed").map((record) => ({ value: record.ref, label: `${record.label} · ${formatBytes(record.estimatedBytes)}` }))
    }
  ];
  return options.filter((group) => group.options.length > 0);
}

function systemFallbackOptions() {
  return fontCatalog
    .filter((record) => record.source === "system")
    .map((record) => ({ value: record.ref, label: `${record.label} · 0 KB` }));
}

function createFontSelection(
  ref: FontCatalogRef,
  role: EditableFontRole,
  previous?: DirectFontSelection
): DirectFontSelection {
  const record = getFontCatalogRecord(ref);
  const roleWeights = role === "heading" ? [600, 700] : role === "code" ? [400, 600] : [400, 500, 600];
  const weights = roleWeights.filter((weight) => record.supportedWeights.includes(weight));
  const validWeights = weights.length > 0 ? weights : [record.supportedWeights[0] ?? 400];
  const defaultStyle: DirectFontSelection["styles"][number] = record.supportedStyles.includes("normal")
    ? "normal"
    : (record.supportedStyles[0] ?? "normal");
  const styles: DirectFontSelection["styles"] = [defaultStyle];
  const common = {
    fidelity: record.source === "managed" && previous?.source === "managed" ? previous.fidelity : "preferred" as const,
    emergencyFallbackRef: defaultSystemFallback(record.category),
    weights: validWeights,
    styles
  };
  return record.source === "managed"
    ? { source: "managed", ref: record.ref, ...common }
    : { source: "system", ref: record.ref, ...common, fidelity: "preferred" };
}

function defaultSystemFallback(category: FontCatalogRecord["category"]): DirectFontSelection["emergencyFallbackRef"] {
  if (category === "mono") return "system.mono";
  if (category === "serif") return "system.serif";
  return "system.ui";
}

function getDirectSelection(typography: BrandTypography, role: EditableFontRole): DirectFontSelection | undefined {
  const selection = typography[role];
  return selection.source === "inherit" ? undefined : selection;
}

function setFontSelection(typography: BrandTypography, role: EditableFontRole, selection: DirectFontSelection): void {
  if (role === "body") typography.body = selection;
  else if (role === "heading") typography.heading = selection;
  else typography.code = selection;
}

function selectedFontBytes(record: FontCatalogRecord, selection: DirectFontSelection): number {
  if (record.source === "system") return 0;
  return record.resources
    .filter((resource) => selection.styles.includes(resource.style) && selection.weights.some((weight) => weight >= resource.weightRange[0] && weight <= resource.weightRange[1]))
    .reduce((total, resource) => total + resource.estimatedBytes, 0);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

function ColorEditor({ mode, readOnly, replaceMode }: { readonly mode: BrandMode; readonly readOnly: boolean; readonly replaceMode: (mutate: (mode: BrandMode) => void) => void }): ReactElement {
  const keys = ["canvas", "surface", "surfaceMuted", "surfaceElevated", "surfaceOverlay", "text", "textMuted", "textInverse", "accent", "accentForeground", "border", "borderStrong", "focus", "selection", "disabledSurface", "disabledText"] as const;
  return <FieldGrid>{keys.map((key) => <ColorField disabled={readOnly} key={key} label={humanize(key)} onChange={(value) => replaceMode((next) => { next.colors[key] = value; })} value={mode.colors[key]} />)}</FieldGrid>;
}

function ColorField({ label, value, onChange, disabled }: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void; readonly disabled: boolean }): ReactElement {
  return <Labeled label={label}><span className="lemn-brand-studio__color"><input aria-label={`${label} color`} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value)} type="color" value={value} /><Input aria-label={`${label} hex`} disabled={disabled} onKeyDown={(event) => {
    if (event.key === "Enter" && /^#[0-9a-fA-F]{6}$/.test(event.currentTarget.value)) onChange(event.currentTarget.value);
  }} defaultValue={value} key={value} /></span></Labeled>;
}

function NumberField({ label, value, onCommit, readOnly, step = 1 }: { readonly label: string; readonly value: number; readonly onCommit: (value: number) => void; readonly readOnly: boolean; readonly step?: number }): ReactElement {
  return <Labeled label={label}><Input defaultValue={value} disabled={readOnly} key={`${label}-${value}`} onBlur={(event) => {
    const next = Number(event.currentTarget.value);
    if (Number.isFinite(next)) onCommit(next);
  }} step={step} type="number" /></Labeled>;
}

function EnumField({ label, value, values, onChange, disabled }: { readonly label: string; readonly value: string; readonly values: readonly string[]; readonly onChange: (value: string) => void; readonly disabled: boolean }): ReactElement {
  return <Labeled label={label}><SelectNative disabled={disabled} onValueChange={onChange} options={values.map((entry) => ({ value: entry, label: humanize(entry) }))} value={value} /></Labeled>;
}

function Labeled({ label, children }: { readonly label: string; readonly children: ReactElement }): ReactElement {
  return <label className="lemn-brand-studio__field"><span>{label}</span>{children}</label>;
}

function FieldGrid({ children }: { readonly children: ReactNode }): ReactElement {
  return <div className="lemn-brand-studio__field-grid">{children}</div>;
}

function humanize(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function nextProfileId(project: BrandProject): string {
  let index = Object.keys(project.profiles).length + 1;
  while (project.profiles[`profile-${index}`]) index += 1;
  return `profile-${index}`;
}

function safeScope(artifact: CompiledBrandArtifact, profileId: string, modeId: string) {
  try {
    return getCompiledScope(artifact, profileId, modeId);
  } catch {
    return undefined;
  }
}
