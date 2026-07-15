# Tremor visualization parity audit

Status: implementation baseline, 2026-07-14

This audit compares the public behavior of the eleven visualization families in
the current Tremor documentation with the corresponding Lemn UI components. It
is a capability benchmark, not a source-code migration: Lemn keeps its own
tokens, accessibility contract, state model, and renderer-neutral public API.

## Evidence

- Official references: [Area Chart](https://www.tremor.so/docs/visualizations/area-chart),
  [Bar Chart](https://www.tremor.so/docs/visualizations/bar-chart),
  [Combo Chart](https://www.tremor.so/docs/visualizations/combo-chart),
  [Bar List](https://www.tremor.so/docs/visualizations/barlist),
  [Category Bar](https://www.tremor.so/docs/visualizations/category-bar),
  [Donut Chart](https://www.tremor.so/docs/visualizations/donut-chart),
  [Line Chart](https://www.tremor.so/docs/visualizations/line-chart),
  [Progress Bar](https://www.tremor.so/docs/visualizations/progress-bar),
  [Progress Circle](https://www.tremor.so/docs/visualizations/progress-circle),
  [Spark Chart](https://www.tremor.so/docs/visualizations/spark-chart), and
  [Tracker](https://www.tremor.so/docs/visualizations/tracker).
- Responsive captures: `tmp/component-capture/tremor-visualizations/` contains
  desktop (1280x900), tablet (768x1024), and mobile (375x812) captures plus the
  observed page structure. The directory is intentionally git-ignored.
- Lemn baseline: the package source, package tests, showcase pages, and
  `docs/visualization-system/README.md` on `main` before this migration.

## Product brief

The target is a report-ready visualization catalog that feels immediate under
pointer and keyboard input, exposes the configuration needed for real dashboard
layouts, remains legible at all supported viewports, and does not leak Recharts
or any other rendering engine into the public package contract.

The target user can:

- configure axes, domains, labels, grids, legends, tooltips, and chart modes;
- inspect and select a datum, clear the selection, and observe a stable callback;
- use long legends without wrapping the chart into an unusable layout;
- use semantic progress and status visuals without giving up accessible text;
- render responsive dashboard variants without reimplementing chart internals;
- preserve loading, empty, error, reduced-motion, and dense-data behavior.

## Shared delta

| Capability | Lemn baseline | Tremor reference | Migration decision |
| --- | --- | --- | --- |
| Axis visibility | Axes always visible on Cartesian charts | X/Y axes independently configurable | Add shared `xAxis` and `yAxis` configuration. |
| Axis domain | Renderer defaults only | automatic minimum, explicit min/max, decimal policy | Add numeric-domain options without renderer types. |
| Axis labels/ticks | No labels; default ticks | labels, start/end ticks, tick gap, interval policy, width | Add provider-neutral labels and tick policy. |
| Chart mode | Boolean stacking only | grouped/default, stacked, and percent | Add `mode`; retain `stacked` as a compatible alias. |
| Legend layout | Wrapping toggle buttons below the chart | position plus optional horizontal slider | Add position and scroll mode with keyboard scroll controls. |
| Tooltip extension | Built-in formatter only | lifecycle callback and custom content | Add normalized tooltip context, callback, and render prop. |
| Datum selection | No chart-level callback | click/toggle selection and clear outside | Add normalized selection callback and selected visual state. |
| Animation | reduced-motion and density-aware `auto` | configurable animation on supported components | Keep the stronger Lemn policy and expose `none` explicitly. |
| Responsive use | Fluid container only | examples change axis/tick density by viewport | Make every new option composable so consumers can switch configs responsively. |

The shared migration is an extension of the current Recharts-backed internal
adapter. The public types stay in Lemn UI and contain only values, callbacks,
and React content owned by the consumer. No Recharts payload, event, component,
or axis type crosses the package boundary.

## Component deltas and chosen path

### AreaChart — extend

- Present: multiple series, normal/stacked geometry, solid/gradient fill,
  tooltip, interactive visibility legend, loading/empty/error states.
- Missing: percent mode, no-fill mode, axis configuration, domains, axis labels,
  start/end ticks, tooltip lifecycle/content, datum selection, legend position
  and slider, and `connectNulls`.
- Target: shared Cartesian configuration plus `mode`, `fill="none"`, and
  `connectNulls`. Maximum three showcase examples: default, percent/fill, and
  selection/custom-tooltip configuration.

### BarChart — extend

- Present: grouped/stacked, horizontal/vertical orientation, optional safe data
  labels, tooltip, visibility legend, and common states.
- Missing: percent mode, category gap, complete axis/domain configuration,
  tooltip lifecycle/content, selection, and long-legend scrolling/position.
- Target: shared Cartesian configuration plus `mode` and `barCategoryGap`.

### ComboChart — extend

- Present: declared bar/line series, primary/secondary axes, one legend and
  tooltip.
- Missing: explicit bar/line groups, independently configurable axes, optional
  biaxial rendering, stacking of bar series, line null connection, shared
  selection, tooltip extension, and legend configuration.
- Target: keep the existing flat series declaration for compatibility; extend
  each series with provider-neutral axis and geometry options and apply the
  shared configuration at chart/axis level.

### BarList — extend

- Present: native CSS bars, optional link/button semantics, formatted values.
- Missing: component-level selection callback, ascending/descending/input
  ordering, and explicit animation control.
- Target: add `sortOrder`, `animation`, and `onValueChange`; retain item-native
  `href`/`onSelect` so links stay links and actions stay buttons.

### CategoryBar — extend

- Present: labelled segments, values, patterns, and a visible legend.
- Missing: a positioned marker, marker tooltip, marker motion, and compact
  cumulative labels.
- Target: add a typed marker, label visibility, and an accessible native marker
  whose position is clamped to the distribution domain.

### DonutChart — extend

- Present: labelled segments, zero-total handling, center label, tooltip, and
  visibility legend.
- Missing: pie variant, segment selection, tooltip lifecycle/content, and
  optional central value labeling independent of ring geometry.
- Target: add `variant`, normalized selection and tooltip extension while
  retaining the simpler typed datum contract.

### LineChart — extend

- Present: multiple series, line curves, dots, `connectNulls`, tooltip, legend,
  and common states.
- Missing: complete axis/domain/tick configuration, selection, tooltip
  lifecycle/content, and long-legend position/scrolling.
- Target: adopt the shared Cartesian contract without changing curve semantics.

### ProgressBar — extend compatibly

- Present: determinate, indeterminate, and route modes; optional percent label;
  reduced-motion handling.
- Missing: semantic tones, arbitrary maximum, consumer label, and explicit
  animation policy.
- Target: preserve `variant` as the established progress mode and add `tone`,
  `max`, `label`, and `animation`. This avoids repurposing a public prop.

### ProgressCircle — extend compatibly

- Present: determinate/indeterminate native SVG, maximum, size, stroke width,
  centered label, and reduced-motion CSS.
- Missing: semantic tones and explicit animation policy; Tremor calls geometry
  `radius` while Lemn already exposes the more direct `size`.
- Target: add `tone`, `animation`, and `children` while retaining `label` and
  `size` as compatible aliases/contracts.

### SparkChart — extend

- Present: one line/area/bar series, tooltip, formatter, and compact states.
- Missing: multiple series, area mode/fill, explicit domain, null connection,
  and bar category gap.
- Target: add a `series` declaration while keeping `dataKey`, `name`, `color`,
  and `valueFormatter` as a one-series compatibility path.

### Tracker — extend

- Present: semantic status blocks and hidden status text.
- Missing: custom token color, default background color, explicit hover effect,
  and tooltip content independent from the hidden description.
- Target: add token color/tooltip per item plus default color and hover effect;
  retain semantic statuses as the accessible default.

## Non-negotiable Lemn behavior

- `PAT-UI-LEMN-001`: public styling uses Lemn tokens and every interactive
  control has a visible focus state.
- `PAT-UI-STATES-001`: chart frames keep explicit loading, empty, error, retry,
  reduced-motion, and success behavior.
- `PAT-UI-SYSTEM-001`: consumers never receive renderer-specific APIs.
- `PAT-TEST-MEANINGFUL-001`: tests assert callbacks, sorting, selection,
  accessibility values, modes, and responsive behavior rather than snapshots
  alone.
- Each showcase page contains no more than three examples.
- Selection is optional. Without a callback, charts remain presentational and do
  not manufacture click semantics.
- Legend series visibility and datum selection are separate interactions.
- Motion follows `animation="auto"` and becomes static under reduced motion or
  the established dense-mark threshold.

## Acceptance evidence

The migration is complete only when:

1. every delta above is represented by a public type and working behavior, or is
   explicitly documented as a deliberate Lemn difference;
2. package exports, generated declarations, catalog metadata, showcase API
   tables, and the visualization guide agree;
3. focused component tests cover each new capability and existing compatibility;
4. the showcase is verified in light and dark modes at 1280x900, 768x1024, and
   375x812, including pointer and keyboard interactions;
5. package checks, builds, relevant Playwright tests, and the visualization
   benchmark pass with evidence recorded in the pattern audit.
