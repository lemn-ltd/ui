# @lemn-ltd/ui

## 0.4.2

### Patch Changes

- 84e643e: Keep `ScreenShell` aligned with the live visual viewport after browser chrome or an embedding webview changes height, while retaining the legacy viewport fallback.

## 0.4.1

### Patch Changes

- fc0a8b9: Refresh the packaged installation guidance for the current compatible release set.

## 0.4.0

### Minor Changes

- cf5bf3d: Expose Core-only component and React-free block metadata catalog projections so Node and browser catalog consumers can exclude disabled Agent metadata and component CSS without duplicating the package authority.

  Update Brand Studio's exact `@lemn-ltd/ui` peer to the new minor. Because the Studio contract intentionally pins that peer, this compatibility boundary is an explicit major release rather than an implicit dependent bump.

## 0.3.1

### Patch Changes

- 27cee3a: Replace the previous branding contract with `BrandingDefinition` v1, immutable
  versioned System brandings, deterministic complete-mode artifacts, and a
  persistence-free Studio driven only by controlled values and typed host intents.
  Add the server-only runtime package for signed active/preview resolution,
  verified preview draft metadata, canonical per-mode projection hashes, signed
  Workspace/publication identity, public asset references, a bounded multimode
  branded fallback, and first-byte SSR integration. Full compiled artifacts,
  source definitions, private storage keys, other-mode configuration, and
  credentials remain outside runtime envelopes. Selected-mode font origins are
  verified for CSP without preloading preferred fonts. SSR markup and hydration
  are bound to the exact signed `projectionHash` and mode identity, not the
  cross-mode `compiledHash`.
  Publish the extended semantic appearance-token vocabulary without reusing the
  immutable `@lemn-ltd/ui@0.3.0` tarball.

## 0.3.0

### Minor Changes

- Adopt the provider-first branding architecture and unified `--lemn-*` token
  contract across components, Recharts, ECharts, and blocks.
- Add provider-neutral visualization axes, domains, legends, tooltips,
  selection, percent, pie, multi-series spark, marker, sorting, semantic
  progress, tracker interaction, and ECharts heatmap capabilities.
- Publish the curated blocks entrypoint and complete provider-backed component
  catalog used by Brand Studio and clean external consumers.

## 0.2.5

### Patch Changes

- 90ddc6d: Prepare the current `0.2.4` package for projected release `0.2.5` by reconciling
  the published source with its canonical Lemn identity, strict public exports,
  immutable package verification, and resumable fail-closed release contracts.
  Make package publication resumable by immutable tarball integrity, and stage
  the protected showcase token inside an inactive Worker version before traffic
  activation.

## 0.2.4

### Patch Changes

- 1fc6030: Apply custom AccentColorPicker values exactly to accent-backed surfaces and derive an accessible foreground token for content rendered on them.

## 0.2.3

### Patch Changes

- 22f9d34: Render AccentColorPicker swatches with the exact selected color while keeping contrast-adjusted theme tokens for product UI.

## 0.2.2

### Patch Changes

- ff4dd1e: Keep AccentColorPicker palette dragging live across pointer-capture differences and add validated hexadecimal entry applied with Enter.

## 0.2.1

### Patch Changes

- e7184b7: Make the AccentColorPicker hue control an explicit interactive color spectrum and cover live hue selection with a regression test.

## 0.2.0

### Minor Changes

- d737406: Expand the catalog to 130 components, add accessible report
  visualizations and date controls, complete Tabs and InfoBanner semantics, and
  introduce the explicit Core and Agents area-family catalog contract. Add the
  public AccentColorPicker theme companion and harden chart motion, dense value
  labels, Slider uncontrolled state, and complete showcase API references.
- Expand the catalog to 130 components across 14 explicit Core and Agents
  families, including 18 new visualization, input, navigation, and layout
  components.
- Add renderer-neutral report visualizations backed by an isolated exact
  Recharts dependency, shared chart tokens, accessible states, and bundle
  boundary checks.
- Extend Calendar with range and multi-month behavior, Tabs with accessible
  panels and mounting strategies, and InfoBanner with structured content,
  actions, dismissal, and urgency semantics.
- Replace the broad catalog group contract with the discriminated
  `ComponentArea`, `CoreComponentGroup`, `AgentComponentGroup`, and
  `ComponentCatalogEntry` types. Catalog consumers must read `entry.area`
  explicitly instead of inferring it from `group`.
- Keep `Field` as the accessible form-label solution; no standalone Label
  component is introduced.
- Add the public `AccentColorPicker` theme companion with controlled and
  uncontrolled color selection, pointer and keyboard input, live semantic
  accent tokens, and optional root persistence.
- Make chart `animation="auto"` honor reduced-motion preferences and a 200-mark
  SVG density limit; suppress BarChart value labels when mark count or label
  length would cause collisions.
- Keep uncontrolled Slider values, visible output, and ARIA values synchronized
  after keyboard or pointer changes.
- Complete public API tables for the expanded controls and visualizations, and
  keep showcase code surfaces dark independently from the page theme.

## 0.1.2

### Patch Changes

- 089bff0: Add documentation, changelog, and release automation for the UI design system.

## 0.1.1

- Publish the current shared component catalog, docs, CSS assets, and public package surface.
- Deploy the showcase as the interactive catalog for visual, responsive, and agent-facing review.
