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
| PROVIDER-BRANDING-ECOSYSTEM-2026-07-16 | 2026-07-16 | Four-repository provider-first UI, branding control plane, typed MCP, private SSR runtime, and realistic appointment consumer | `docs/evidence/provider-branding-ecosystem-implementation-2026-07-16.md`; repository audits, hosted runs, PostgreSQL receipts, deployed UI/MCP/SSR/business receipts, full browser/accessibility matrix, and exact production smokes | PASS (focused audit) |
| TRACKER-SOURCE-SNAPSHOT-2026-07-16 | 2026-07-16 | Tremor Tracker source snapshot, deterministic codegen, script governance, package evidence, and focused conformance | Full SHA/raw hash checks, registry tests, TypeScript checks, bundle/tarball gates, targeted behavior/Axe, and Darwin/Linux visual evidence described below | PASS (focused audit) |
| UI-CAPABILITY-2026-07-14 | 2026-07-14 | Component catalog expansion, report visualizations, advanced inputs, showcase, docs, release candidate | Commits `c56fc6f` through `4655aab`; commands and artifacts below | PASS (focused audit; Playwright exception recorded) |

## PROVIDER-BRANDING-ECOSYSTEM-2026-07-16

This focused audit records the implemented cross-repository architecture and
its exact evidence. It does not change any domain `current_level` from
`unassessed` and does not replace a full profile-driven audit. The final UI
deployment, protected Admin health, and browser matrix are now exact evidence.

Detailed evidence, limitations, repository ownership, deployed versions,
commands, run IDs, and the final marker replacement rule live in
`docs/evidence/provider-branding-ecosystem-implementation-2026-07-16.md`.

### Repository snapshot

| Repository | Evidence state | Result |
|---|---|---|
| `lemn-ltd/ui` | Deployed source `075aef9d3310f4d5f982c4ecda5705bcfab46c47`; hosted run `29473617013` passed Validate, 131 E2E tests, 266 accessibility tests, immutable package verification, Docs/Admin deploys and transactional Showcase rollout; Workers `9a7487fe...`, `949c6f68...`, and `3868bd2e...`; public/schema and authenticated Admin smokes passed | COMPLETE (focused implementation evidence) |
| `lemn-ltd/agentops-branding-simulator` | Clean pushed HEAD `20da773`; source-bearing hosted CI run `29471479619` passed; five migrations and 4/4 PostgreSQL 17 receipt; private runtime and control Workers deployed | COMPLETE (focused implementation evidence) |
| `lemn-ltd/agentops-branding-mcp` | Clean pushed HEAD `dbb9b7f`; hosted CI run `29471467450` passed; deployed Worker exercised all 11 tools and 32 protocol/security/publication/materialization scenarios | COMPLETE (focused implementation evidence) |
| `lemn-ltd/lunaria-care` | Clean pushed HEAD `62907b6`; source-bearing CI/deploy runs `29472832444`/`29472832477` passed; 23 files/121 tests; nine-scenario sanitized business receipt and authoritative SSR revalidation evidence retained | COMPLETE (focused implementation evidence) |

### Pattern evidence

| Pattern | Evidence | Result |
|---|---|---|
| `PAT-ARCH-REPO-BOUNDARIES-001`, `PAT-ARCH-PORTS-ADAPTERS-001` | UI owns reusable packages; Simulator owns branding state/publication/runtime; MCP owns only typed transport; Lunaria owns appointment state and consumes the private runtime | COMPLETE |
| `PAT-ARCH-ADAPTER-REGISTRY-001`, `PAT-UI-PROVIDER-FIRST-001` | Git manifest records one provider of record for ten fully governed provider capabilities; the migration matrix classifies all 131 catalog capabilities; exact pins/full SHA, license/NOTICE, SPDX, transforms, patches and conformance are checked | COMPLETE (focused registry scope) |
| `PAT-UI-FRONTEND-PLATFORM-BOUNDARY-001`, `PAT-UI-BRAND-CONTRACT-001` | Brand Contract and Studio remain controlled/persistence-free; components consume compiled scoped semantic tokens/adapters rather than project JSON; platform and product state remain in hosts | COMPLETE |
| `PAT-UI-SSR-BRANDING-001` | Lunaria resolves and verifies the assigned artifact through a private binding before HTML and uses only a signed compatible embedded branded fallback on actual runtime failure | COMPLETE |
| `PAT-UI-BLOCKS-001`, `PAT-UI-LEMN-001` | Three public controlled blocks exist; Lunaria uses exact published LEMN packages and proves dashboard/schedule blocks under real host workflows without provider imports | COMPLETE |
| `PAT-CLOUDFLARE-SERVICE-BINDINGS-001`, `PAT-SEC-AUTHORIZATION-001`, `PAT-SEC-TENANT-ISOLATION-001` | Private runtime, MCP bridge, workload grants, exact project/environment/slot/profile intersection, and independent human/service origin verification fail closed | COMPLETE (focused implementation scope) |
| `PAT-API-MCP-001`, `PAT-SEC-AUDIT-EVENTS-001` | Eleven typed scoped tools and six resources enforce plan/apply, expected revision, idempotency, revocation and agent production-approval denial with sanitized durable evidence | COMPLETE |
| `PAT-SEC-SECRETS-001` | Credentials remain in approved stores/Worker secrets; strict ephemeral fixture files are destroyed; retained receipts contain no credential values | COMPLETE |
| `PAT-OPS-LEAST-PRIVILEGE-001` | Runtime/MCP/service identities are narrow and environment-scoped; Lunaria still uses an account-wide Cloudflare Global API key | GAP: replace with a resource-scoped API token |
| `PAT-TEST-EVIDENCE-001` | Current local, hosted, PostgreSQL, 131-test E2E, 266-test accessibility, deployed UI/MCP/SSR and business evidence is exact and tied to delivered SHAs | COMPLETE |
| `PAT-DOCS-PATTERN-AUDIT-001` | This projection and its detailed receipt preserve evidence, ownership, gaps and non-claims in-repository | COMPLETE (focused audit only) |

### Final UI delivery evidence

- GitHub Actions run `29473617013` completed `success` on exact SHA
  `075aef9d3310f4d5f982c4ecda5705bcfab46c47`.
- Validate passed, all three E2E shards passed 131 tests, and all four
  accessibility shards passed 266 tests.
- Exact immutable package identities were verified for Brand Contract `0.1.0`,
  UI `0.3.0`, and Brand Studio `0.1.1` without republishing.
- Docs Worker `9a7487fe-3873-4b6f-a2dc-0203e3fb4a5f`, protected Admin Worker
  `949c6f68-976f-49a3-902b-9c8403dffcf8`, and Showcase Worker
  `3868bd2e-7c90-4d19-a003-ca7147cd00c1` were deployed.
- Showcase was staged at 0%, resource/identity/Admin smokes passed, and the
  same candidate was activated at 100% with exact release identity
  `@lemn-ltd/ui@0.3.0#075aef9d3310f4d5f982c4ecda5705bcfab46c47`.
- Public checks independently confirmed Docs/Showcase `200`, exact version/SHA,
  ten provider records, three blocks, schema JSON, and the exact Access tenant
  redirect. Protected CI confirmed Admin health HTTP `200`, production
  environment, and configured simulator before and after activation.

### Honest residual limitations

- No full UI pattern audit has been completed; all global levels remain
  `unassessed`.
- Simulator and MCP cannot register their local project profile/audit with the
  current read/sync-only workspace grant.
- Lunaria's scoped Cloudflare token migration, complete stable-JSON OpenAPI,
  patient notifications, and production-grade MFA/dual-human Access remain
  explicit follow-up rather than fabricated completion.
- The UI AgentOps workspace still carries its pre-migration external
  identifier/name; no rename capability exists in the available MCP. The
  legacy value remains confined to the managed manifest allowlist.

## TRACKER-SOURCE-SNAPSHOT-2026-07-16

This focused audit proves the source-snapshot and script-governance slice only;
it does not claim a full-codebase pattern audit.

| Pattern | Evidence | Result |
|---|---|---|
| PAT-CODE-SCRIPT-GOVERNANCE-001 | `@lemn-ltd/provider-registry` exposes package-local `check:snapshots` and `sync:snapshots` commands. Its README catalogs category, owner, scope, environment, mutability, secrets, dry-run/apply behavior, CI use, and removal condition. The check path is offline/read-only; mutation requires the explicit `--write` path and remains restricted to manifest-declared files. | PASS |
| PAT-CODE-TYPESCRIPT-SOURCE-001 | Both the snapshot CLI and hash-loaded deterministic transform are maintained `.ts` sources; the registry pins the transform path and SHA-256, and `check:snapshots` proves the checked-in generated adapter is byte-for-byte reproducible. | PASS |
| PAT-CODE-DEPENDENCIES-001 | The raw upstream manifest remains byte-identical but is stored as `package.json.snapshot`, so GitHub cannot misclassify inert provenance as an installable workspace. Exact pnpm overrides move the two vulnerable development-only transitives to `js-yaml@3.15.0` and `ws@8.21.1`; `pnpm audit` reports zero known vulnerabilities. | PASS |
| PAT-UI-PROVIDER-FIRST-001 | `ui.core.tracker` has one active Tremor provider of record at full commit `ca4d588f47820ff3d514d37fa4ee08a4222dec11`, a complete captured closure, byte-identical Apache-2.0 evidence, one deterministic transform, one explicit semantic patch, SPDX inventory, public adapter, token roles, and behavior/accessibility/interaction/visual/SSR/bundle evidence. | PASS |
| PAT-TEST-EVIDENCE-001 | Registry validation and artifact checks, Tracker unit/SSR tests, real browser HoverCard lifecycle, Light/Dark Axe checks, bundle isolation, release-artifact packaging, and reviewed Darwin and pinned-Playwright Linux Light/Dark responsive baselines exercise the current worktree. | PASS (focused scope) |

### Focused verification evidence

- Raw `package.json` (stored locally as `package.json.snapshot`), `Tracker.tsx`, `cx.ts`, and `LICENSE` were compared to
  `raw.githubusercontent.com/tremorlabs/tremor` at the full pinned commit and
  matched byte-for-byte and by SHA-256.
- `check:snapshots` verified one immutable source snapshot and one deterministic
  generated output; the provider registry suite passed 31 tests.
- Tracker unit/SSR coverage passed 3 tests; its real Showcase HoverCard
  lifecycle passed in Chromium; targeted Axe passed in Light and Dark.
- The Tracker bundle retained Radix HoverCard behavior, excluded Recharts and
  ECharts, and stayed independently measurable. The UI build copied the Tremor
  license, raw closure, patch, transform, registry, and SBOM into the release
  package, and the tarball smoke requires those exact paths.
- Darwin and Linux visual baselines cover Light/Dark at 375, 768, and 1280
  pixels after lazy syntax highlighting is ready. Linux was generated and
  passed 6/6 in `mcr.microsoft.com/playwright:v1.60.0-noble`, the exact CI
  runtime, and the contract verifies 96-file platform parity.

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
