# Pattern Audit

Current derived audit state for Lemn UI.

Source system: `patterns/pattern-system.md`
Pattern profile: `patterns/pattern-profile.md`
Pattern catalog: `patterns/patterns.md`

## Audit State

This file stores audit state only. Required domains and target levels live in
`patterns/pattern-profile.md`. `current_level` and pattern statuses must be
calculated from concrete evidence during an audit; this initial projection does
not mark any pattern complete from repository intent alone.

```yaml
pattern_audit:
  ARCH:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  CODE:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  CLOUDFLARE:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  INFRA:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  API:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  ERROR:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  SEC:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  TEST:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions:
      - pattern: PAT-TEST-PLACEMENT-001
        scope: packages/ui/src/**/tests
        reason: "Component unit tests remain colocated with their owning source modules, following the established package convention during this capability expansion."
        follow_up: "Evaluate any repository-wide test-layout migration as a separate scoped change; e2e, fixtures, helpers, and snapshots remain under apps/showcase/tests."
      - pattern: PAT-TEST-EVIDENCE-001
        scope: commit 4655aab and later delivery commits
        reason: "The user explicitly deferred the full Playwright behavior, Axe, responsive, and visual-snapshot suite because of its duration. No Playwright result from an earlier SHA is counted as current evidence."
        follow_up: "Run the complete Playwright matrix against the delivered SHA; review and refresh the known-stale InfoBanner dark-desktop baseline before treating browser and visual coverage as current."
  UI:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  OBS:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  OPS:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  DOCS:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
```

## Audit Runs

No full pattern audit has been completed for this workspace yet.

| Audit ID | Date | Scope | Evidence | Result |
|---|---|---|---|---|
| UI-CAPABILITY-2026-07-14 | 2026-07-14 | Component catalog expansion, report visualizations, advanced inputs, showcase, docs, release candidate | Commits `c56fc6f` through `4655aab`; commands and artifacts below | PASS (focused audit; Playwright exception recorded) |

## UI-CAPABILITY-2026-07-14

This focused audit does not claim that every applicable pattern in every domain
has been assessed. It records concrete evidence for the patterns materially
applied by the component capability expansion.

| Pattern | Evidence | Result |
|---|---|---|
| PAT-ARCH-CHANGE-SCOPE-001 | Implementation changes are confined to the UI package, showcase, docs, validation tooling, release metadata, and this audit. Source publication and Cloudflare deployment are separate, explicitly authorized delivery steps. | PASS |
| PAT-CODE-FRAMEWORK-API-VALIDITY-001 | Recharts 3.9.2 and React 19-compatible `react-is` 19.2.4 are fixed in the workspace catalog; unit, build, bundle, and the 16-scenario dashboard benchmark execute the real APIs. | PASS |
| PAT-CODE-DEPENDENCIES-001 | Recharts is direct and confined to six renderer-backed modules under `packages/ui/src/visualizations`; ECharts is absent from manifests and lockfile; public declaration imports contain no Recharts, ECharts, or D3 provider types. | PASS |
| PAT-UI-LEMN-001 | Chart, interaction, state, light, and dark styling consume Lemn tokens; CSS and typed token mirrors have exact parity; the package remains brand-neutral and exports only Lemn-owned public contracts. | PASS |
| PAT-UI-SYSTEM-001 | The catalog has exactly 130 entries: 101 Core and 29 Agents across 14 valid area-family combinations. All entries have public exports, written guidance, and live showcase routes. | PASS |
| PAT-UI-STATES-001 | `ChartFrame` and report visualizations expose explicit loading, empty, error, and success rendering where applicable; tests cover zero, null, negative, disabled, and controlled/uncontrolled cases. | PASS |
| PAT-TEST-PLACEMENT-001 | E2E, fixtures, helpers, and snapshots live under `apps/showcase/tests`; existing package unit tests remain colocated under `packages/ui/src/**/tests` under the scoped exception above. | EXCEPTION RECORDED |
| PAT-TEST-EVIDENCE-001 | Checks, unit tests, builds, bundle gates, audit, and the benchmark are current for the implementation SHA. Full Playwright behavior/Axe/responsive/visual evidence is explicitly deferred and is not represented as current. | EXCEPTION RECORDED |
| PAT-DOCS-PATTERN-AUDIT-001 | Package guides, public English and Spanish docs, visualization-system decision record, migration guidance, changelog, changeset, and this audit were updated together. | PASS |

### Verification evidence

- `pnpm validate`: identity, public domains, brand neutrality, root and package
  boundaries, bundles, and release-doc synchronization passed.
- `pnpm check`, `pnpm test`, and `pnpm build`: all four workspace packages
  passed. The UI suite passed 144 files and 595 tests; the showcase-kit suite
  passed 6 files and 15 tests; the showcase suite passed 4 files and 12 tests;
  Astro reported zero diagnostics and built 14 routes.
- Full Playwright behavior, Axe, responsive, and visual-snapshot execution was
  explicitly deferred by the user for duration and was not run against
  `4655aab`. Browser navigation, the full Light/Dark viewport matrix, and the
  known-stale InfoBanner dark-desktop baseline remain residual validation risk;
  earlier-SHA Playwright results are not counted here.
- The reproducible visualization benchmark ran 16 desktop/mobile, Light/Dark,
  normal/reduced-motion, representative/stress scenarios against commit
  `1ecf754`. It produced 16 distinct screenshot hashes, 739.5–824 ms ready time,
  26.5–47.4 ms legend response, and maximum layout shift 0.0099. Later commits
  only add its receipt/docs and the AccentColorPicker controlled-reset fix.
- Bundle fixtures passed: Button 666 bytes / 368 gzip / 3 modules; LineChart
  527,940 bytes / 125,817 gzip / 365 modules; catalog 29,490 bytes / 7,586 gzip /
  7 modules. Button and the data-only catalog do not include a chart renderer;
  LineChart includes Recharts and no secondary engine.
- `pnpm audit --prod` reported no known vulnerabilities. `pnpm changeset status`
  reports a minor bump for `@lemn-ltd/ui`, targeting the 0.2.0 release candidate.
- External benchmark-brand references are zero outside ignored build and lock
  artifacts. The exact catalog receipt is 130 total, 101 Core, 29 Agents, with
  family counts 9/17/9/13/18/6/10/10/9 and 6/6/3/6/8 respectively.

### Non-blocking tool warnings

- Vitest reports its existing `esbuild` option deprecation in favor of `oxc`.
- The showcase build reports its existing chunk-size advisory and CSS parser
  warnings. Bundle boundary fixtures and all non-Playwright release gates still
  pass; no warning was suppressed or converted into a false success.
