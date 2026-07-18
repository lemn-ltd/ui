# Visualization system

Lemn UI exposes renderer-neutral chart APIs and owns their appearance,
accessibility, empty states, loading states, and responsive behavior. Consumers
never import renderer configuration or provider types through the public API.

## Renderer decision

Recharts 3.9.2 is the primary renderer for declarative React dashboard charts.
It is an exact direct dependency of `@lemn-ltd/ui` and is confined to
`packages/ui/src/visualizations/`. `react-is` is pinned to the compatible React
version required by that renderer.

Apache ECharts 6.1.0 is the evaluated future secondary renderer. It is not
installed, exported, bundled, or represented in public types. It may only be
adopted when an approved component needs high-density canvas rendering, a
specialized chart form, geospatial behavior, or an advanced interaction that
Recharts cannot provide cleanly, and an empirical benchmark demonstrates a
material benefit. A future adoption must use a small internal lifecycle wrapper;
it must not introduce a public `engine` prop or a generic renderer adapter.

Direct D3 use and additional chart engines are outside the current contract.

## Renderer by component

| Renderer | Components |
| --- | --- |
| Recharts | `LineChart`, `AreaChart`, `BarChart`, `ComboChart`, `DonutChart`, `SparkChart` |
| Tremor source snapshot (`ca4d588f47820ff3d514d37fa4ee08a4222dec11`) | `Tracker` |
| Native React and CSS/SVG | `BarList`, `CategoryBar`, `ProgressCircle`, `ProgressBar`, `Sparkline`, `Meter` |
| Renderer-independent frame | `ChartFrame` |

Native components must not import Recharts. Tracker preserves Tremor's Radix HoverCard lifecycle
through a deterministic source-snapshot transform, without importing a chart engine. Importing
`Button`, `ChartFrame`, Tracker, or a native visualization must not pull a chart engine into the
consumer bundle.

## Public API boundary

Every public component accepts minimal Lemn-owned data and configuration types.
Provider props, event types, payloads, axis types, tooltip types, and renderer
instances stay internal. This keeps consumers independent from provider
upgrades and leaves room for a specialized renderer without changing the public
contract.

`ChartFrame` owns the shared title, description, legend location, state surface,
and accessible labeling. It does not own rendering-engine lifecycle or data
normalization.

Cartesian charts share provider-neutral configuration types:

- `ChartXAxisOptions` controls visibility, label, tick interval, start/end-only
  rendering, and minimum tick gap;
- `ChartYAxisOptions` controls visibility, label, width, domain, decimal policy,
  and tick formatting;
- `ChartLegendPosition` and `ChartLegendOverflow` align legends and switch long
  legends between wrapping and keyboard-scrollable behavior;
- `ChartSelection<TDatum>` normalizes mark selection and clear events;
- `ChartTooltipContext<TDatum>` normalizes tooltip entries for lifecycle
  callbacks and custom React content without exposing Recharts payloads.

`AreaChart` and `BarChart` support default, stacked, and percent modes.
`ComboChart` supports declared primary/secondary axes and grouped or stacked
bars. `DonutChart` supports donut and pie geometry. `SparkChart` supports one or
more declared series while retaining its original one-series compatibility
props. Native progress, list, category, and tracker components expose the same
motion and semantic-token posture without importing a chart engine.

The source-by-source capability comparison and deliberate Lemn differences are
recorded in the [Tremor parity audit](./tremor-parity-audit.md).

## Tokens and themes

All visualization color and chrome use the chart tokens defined in
`packages/ui/src/foundations/tokens.css` and mirrored exactly in
`packages/ui/src/tokens.ts`:

- series colors 1 through 8;
- grid, axis, cursor, hover, and selection;
- tooltip surface and border;
- positive and negative semantic values.

Renderers consume CSS variables. Public APIs may select a semantic series token,
but must not make raw provider palettes the default contract. Light and dark
themes use the same token names and are verified independently.

## Accessibility

- Every chart has an accessible name through `aria-label` or its frame title.
- Data encoded only by color also has text, values, patterns, or accessible
  summaries appropriate to the component.
- Interactive legends and data points are keyboard reachable and expose state.
- Tooltips are supplementary; the underlying values remain understandable
  without hover.
- Empty, loading, and error states are explicit and do not render misleading
  geometry.
- Motion respects `prefers-reduced-motion`.
- `animation="auto"` animates only when motion is allowed and at most 200 SVG
  marks would render; `animation="none"` always disables renderer animation.
- `BarChart` value labels render only for at most 24 marks whose formatted
  labels are at most 12 characters, preventing dense and long-label collisions
  in both orientations. Tooltip, legend, and accessible summary remain present.

## Performance and bundles

Bundle fixtures prove three boundaries: a button-only import contains no chart
engine; a `LineChart` import contains Recharts and no secondary engine; the
catalog remains data-only and independently tree-shakeable. The boundary checker
rejects Recharts imports outside the visualization family.

The reproducible benchmark is `pnpm --filter @lemn-ltd/ui-portal run
benchmark:visualizations`. It measures the production dashboard pattern with
four charts across desktop/mobile, Light/Dark, normal/reduced motion, and
representative/240-row stress data. It records ready time, legend interaction
latency, layout shift, and a full-page screenshot hash. The current environment
and results are stored under `docs/visualization-system/benchmarks/`.

The 2026-07-14 ARM64 baseline for commit `1ecf754` contains 16 distinct visual
receipts. Ready time was 739.5–824 ms, legend response was 26.5–47.4 ms, and
maximum cumulative layout shift was 0.0099. See the
[raw benchmark receipt](./benchmarks/2026-07-14-1ecf754.json) for every scenario,
environment metadata, and screenshot checksum.

Before adding a dense or specialized chart, rerun that benchmark and compare
render time, interaction latency, bundle impact, and visual stability. A large
SVG data set is a reason to benchmark alternatives, not permission to bypass the
adoption threshold.

## Adding a chart

1. Define the user capability, representative data sizes, states, and accessible
   alternative before choosing a renderer.
2. Prefer a native implementation for simple progress, list, status, or compact
   geometry. Otherwise use Recharts directly inside the component.
3. Define a small Lemn-owned public API. Do not export provider types or accept a
   generic provider options object.
4. Reuse chart tokens and `ChartFrame`; keep provider helpers private to the
   visualization folder.
5. Add meaningful unit and interaction tests, a bundle fixture when the import
   boundary changes, and a live Portal page with at most three examples.
6. Verify light and dark themes at 1280x900, 768x1024, and 375x812, including
   keyboard behavior, empty/loading/error states, and console cleanliness.
7. Update the catalog, exports, package guide, public docs, changeset, and pattern
   evidence in the same change.
