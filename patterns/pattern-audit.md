# Pattern Audit

Current derived audit state for Lemn UI.

Source system: `patterns/pattern-system.md`
Pattern profile: `patterns/pattern-profile.md`
Pattern catalog: `patterns/patterns.md`

## Audit State

Required domains and target levels live in `patterns/pattern-profile.md`.
`current_level` and pattern statuses require concrete evidence from the exact
delivered revision; green tests or implementation intent alone are not enough.

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
        reason: "Component unit tests remain colocated with their owning source modules, following the established package convention."
        follow_up: "Evaluate any repository-wide test-layout migration separately; application E2E, fixtures, helpers, and snapshots remain under apps/showcase/tests."
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

## Current focused audit

| Audit ID | Date | Scope | Result |
|---|---|---|---|
| BRANDING-AUTHORITY-VNEXT-2026-07-17 | 2026-07-17 | BrandingDefinition v1, System brandings, compiler/envelope, Studio, server runtime, Showcase/schema/docs, package release and zero-legacy policy | IN PROGRESS; final delivery evidence must replace this marker |

### Intended repository boundary

- `@lemn-ltd/brand-contract` owns the source schema, deterministic compiler,
  immutable System branding catalog, compatibility, diagnostics, hashes, and
  signed compiled-object contract.
- `@lemn-ltd/brand-runtime` owns server-only runtime adapters, verification,
  selected-mode projection, SSR helpers, preview selection contracts, and one
  embedded branded fallback.
- `@lemn-ltd/brand-studio` remains controlled and persistence-free; the host
  supplies catalog/preview data and executes typed intents.
- `@lemn-ltd/ui` consumes semantic variables and provider adapters only.
- AgentOps owns Workspace state, BrandingVersions, Postgres, private R2,
  publication, human activation, preview sessions, MCP, authorization, and
  audit. Those responsibilities do not move into this repository.

### Evidence recorded during implementation

- Brand Contract typecheck passes and its focused suite passes 34 tests,
  including deterministic compilation, immutable catalog versions, complete
  light/dark modes, bootstrap identity, signed object tamper rejection, fonts,
  JSON-only extensions, and package entrypoint isolation.
- Brand Studio typecheck passes and its focused suite passes 5 tests covering
  controlled authoring, root typography, host-supplied templates, typed intents,
  preview, and read-only lifecycle states.
- Public Showcase and protected Showcase Admin TypeScript checks pass after
  removing obsolete branding contracts and persistence routes.

These checks are implementation evidence, not a completed audit or release
receipt. The final exact revision still requires repository validation, package
build/pack/install, policy checks, Cloudflare dry-runs, consumer SSR evidence,
accessibility/browser evidence, deployment smokes, and managed-file checksum
verification.

### Final marker replacement rule

Before delivery, replace `IN PROGRESS` with an evidence-backed result containing
the exact commit, package versions and integrity, commands, hosted runs, Worker
versions, public/protected/schema smokes, SSR first-byte/hydration/fallback
evidence, accessibility results, remaining exceptions, and managed-file sync
checksums. If any gate is not run or fails, record it as a gap; never infer a
pass from earlier revisions.
