# Provider-first UI and project-branding ecosystem: implementation evidence

Date: 2026-07-16

Owner: LEMN

Decision authority: `PROVIDER_BRANDING_ECOSYSTEM_PLAN.md`
Evidence scope: `lemn-ltd/ui`, `lemn-ltd/agentops-branding-simulator`,
`lemn-ltd/agentops-branding-mcp`, and `lemn-ltd/lunaria-care`

## Receipt status

The provider-first architecture, versioned branding contract, controlled Brand
Studio, authoritative simulator, zero-trust branding MCP, private SSR runtime,
and realistic Lunaria consumer are implemented and have current source,
contract, database, and deployed cross-repository evidence.

The final UI source, hosted CI, protected production deployment, package
identity verification, browser matrix, public resource smokes, and authenticated
Showcase Admin health check are complete and tied to the same release identity.

This is a focused implementation receipt, not a claim that all applicable
patterns in all four repositories have received a new full-codebase audit.

## Final ownership model

| Repository | Owns | Must not own |
|---|---|---|
| `lemn-ltd/ui` | Exact public packages, BrandProject schema/compiler, semantic tokens, selected provider adapters, curated blocks, Brand Studio, public Showcase/Docs, protected Showcase Admin, provider registry and release governance | Product persistence, project authorization, application routing/data fetching, production brand publication authority |
| `lemn-ltd/agentops-branding-simulator` | Projects, environments, brands, drafts, immutable revisions, assignments, workload grants, publication, rollback, audit, Postgres authority, immutable artifacts, private runtime and Studio host adapter | UI-provider implementations, product appointment data, generic agent access |
| `lemn-ltd/agentops-branding-mcp` | Eleven typed branding tools, six resources, Streamable HTTP transport, scoped token verification, plan/apply mediation and simulator Service Binding adapter | Independent branding database, generic SQL/filesystem/HTTP/secrets tools, production approval authority |
| `lemn-ltd/lunaria-care` | Appointment business data and workflows, public/staff product surfaces, private runtime consumption, branded SSR and compatible embedded fallback | Branding Postgres/R2/Queue/admin bindings, provider imports, brand publication or assignment authority |

This boundary implements `PAT-ARCH-REPO-BOUNDARIES-001`,
`PAT-ARCH-PORTS-ADAPTERS-001`,
`PAT-UI-FRONTEND-PLATFORM-BOUNDARY-001`, and
`PAT-CLOUDFLARE-SERVICE-BINDINGS-001`.

## UI producer evidence

### Source and released package contracts

- Deployed source: `075aef9d3310f4d5f982c4ecda5705bcfab46c47` on
  pushed `main`, released as `@lemn-ltd/ui@0.3.0` by hosted run `29473617013`.
- Exact package contracts used by the deployed consumers:
  - `@lemn-ltd/brand-contract@0.1.0`
  - `@lemn-ltd/ui@0.3.0`
  - `@lemn-ltd/brand-studio@0.1.1`
- The provider registry contains ten full provider-of-record records. It pins
  runtime dependencies or immutable source snapshots, integrity, license and
  NOTICE evidence, adapters, brand-token roles, conformance paths, and upstream
  status.
- The capability migration matrix classifies all 131 catalog capabilities at
  the `0.3.0` cutover: 32 are `keep-provider-backed` and 99 are
  `native-with-rationale`. Native capabilities retain an explicit rationale
  rather than being silently presented as provider-backed.
- The required source-snapshot proof is Tremor Tracker at full upstream commit
  `ca4d588f47820ff3d514d37fa4ee08a4222dec11`, with captured source closure,
  deterministic transform, explicit semantic patch, Apache-2.0 evidence, SPDX
  inventory, behavior/accessibility/interaction/visual/SSR/bundle evidence,
  and byte-reproducible generated output.
- Runtime provider proofs include Recharts `3.9.2`, Apache ECharts `6.1.0`,
  Radix UI `1.4.3`, and the exact additional provider pins recorded in
  `packages/provider-registry/registry/provider-registry.v1.json`.
- Three curated blocks are published from the public package:
  `DashboardOverviewBlock`, `AppointmentScheduleBlock`, and
  `ApprovalQueueBlock`. Product fetching, routing, authorization, and
  persistence remain host responsibilities.
- `@lemn-ltd/brand-studio` is controlled and persistence-free. Its host adapter
  expresses authoring/publication intentions without owning network,
  credential, project, or environment authority. The Studio exposes twelve
  ordered authoring/review steps and fifteen original editable presets that
  compile for both light and dark modes.

### Current local verification

The following local gates were run against deployed source `075aef9` before
the hosted release:

- `pnpm validate`: 121 contract tests passed, including identity, domains,
  package identity, brand neutrality, boundaries, bundles, release contracts,
  Cloudflare deployment contracts, and the exact Showcase Admin health Access
  application audience.
- `pnpm check`: 13/13 Turborepo tasks passed.
- `pnpm test`: UI 598/598 tests, Brand Contract 17/17, Provider Registry 31/31,
  Brand Studio 18/18, Showcase Kit 18/18, Showcase 41/41, and Showcase Admin
  10/10 passed.
- Showcase Admin production Wrangler dry-run passed and resolved distinct
  human and exact-path health audiences plus its narrow simulator binding.
- `git diff --check` passed before the source commit.

### Showcase Admin Access correction

The failed authenticated Admin smoke had a concrete two-application audience
mismatch: Cloudflare Access accepted the health-only service identity for the
exact `/health` application, but the Worker verified only the parent human
application audience. Deployed source `075aef9` now selects the health
audience only for production `GET /health`; every business path and every other
method continues to require the parent human audience.

The dedicated health service token was rotated transactionally. The exact-path
policy remains one `non_identity` service policy, GitHub Environment
`production` received only the two dedicated client credential secrets, the
retired token was deleted, and the parent human Access policy was not changed.
The replacement credential crossed Access and reached the previously deployed
origin; that old origin correctly returned `401 access-invalid`. After deploying
the audience-aware Worker, the protected smoke passed twice with HTTP `200`,
`ok: true`, `service: ui-showcase-admin`, `environment: production`, and
`simulatorConfigured: true`.

### Final UI delivery evidence

| Evidence | Final value |
|---|---|
| Hosted CI run and conclusion | GitHub Actions `29473617013`: `success` on exact SHA `075aef9d3310f4d5f982c4ecda5705bcfab46c47` |
| Exact final deployed source SHA | `075aef9d3310f4d5f982c4ecda5705bcfab46c47`; release `@lemn-ltd/ui@0.3.0#075aef9d3310f4d5f982c4ecda5705bcfab46c47` |
| Package release decision/result | Existing immutable tarballs verified byte-for-byte for `@lemn-ltd/brand-contract@0.1.0`, `@lemn-ltd/ui@0.3.0`, and `@lemn-ltd/brand-studio@0.1.1`; no republish |
| Docs deployment/run/version | Run `29473617013`; Worker `9a7487fe-3873-4b6f-a2dc-0203e3fb4a5f`; custom domain `ui.le-mn.com` |
| Public Showcase deployment/run/version | Candidate Worker `3868bd2e-7c90-4d19-a003-ca7147cd00c1`, staged at 0%, verified, then activated at 100%; custom domains `showcase.ui.le-mn.com` and `schemas.ui.le-mn.com` |
| Protected Showcase Admin deployment/run/version | Worker `949c6f68-976f-49a3-902b-9c8403dffcf8`; custom domain `admin.showcase.ui.le-mn.com` |
| Docs current-build smoke | Home `200`; `/release.json` `200` with version `0.3.0`, exact SHA `075aef9...`, build time `2026-07-16T09:20:04+04:00` |
| Showcase health, readiness, catalog, provider, block and branding smoke | Home/health/readiness/catalog/provider registry/blocks/schema all passed; health is `0.3.0`/exact SHA, registry has 10 governed records, blocks has 3 entries, schema is `application/schema+json` |
| Anonymous Admin Access redirect to exact tenant | `/health` returns `302` to `lemn-dev.cloudflareaccess.com/cdn-cgi/access/login/...` |
| Authenticated Admin `/health` returns production/simulator readiness | Protected release smoke returned HTTP `200`, `ok: true`, `environment: production`, `simulatorConfigured: true` before and after activation |
| Final full browser/accessibility/visual result for deployed UI SHA | Validate passed; E2E 3/3 shards with 131 tests; accessibility 4/4 shards with 266 tests; all on run `29473617013` |

## AgentOps branding simulator evidence

- Repository HEAD: `20da773` on clean, pushed `main`; the latest source-bearing
  CI SHA recorded by the repository audit is
  `41e621cc6ba064fe00d91a47c7c04b3cb01b31bd`, followed only by documentation
  closure.
- Hosted CI run `29471479619` passed frozen exact package installation,
  validation, production build, OpenAPI validation/code generation, control
  and runtime Worker type generation, architecture/zero-legacy gates, and both
  Wrangler dry-runs.
- Five ordered migrations were applied to fresh PostgreSQL 17. Four
  authoritative integration cases passed, including exact replay with one
  materialization outbox effect.
- The current audit records 28 mounted OpenAPI operations, 52 strict schemas,
  172 passing local tests, 155 source files, and five migrations for the
  source-bearing CI state.
- Runtime Worker version `4ebff971-4598-4245-ba30-ffee1eb54873` and control
  Worker version `df56a026-c18b-4c41-a615-5ec711416ad2` are recorded as deployed
  in Lemn DEV. The runtime has no public route and is reached through the
  reviewed Service Binding.
- The publication path uses immutable revisions, plan/apply, expected
  revision, idempotency, Queue materialization, verified immutable artifact,
  and compare-and-swap assignment. Replay does not duplicate revisions or
  outbox effects.
- Human, MCP, and workload identities remain separate. Plaintext workload
  issuance is restricted to the approved server-side service identity;
  redacted DTOs, audit, and idempotency records do not retain credentials.

Authoritative detailed evidence remains in
`lemn-ltd/agentops-branding-simulator:patterns/pattern-audit.md`.

## Branding MCP evidence

- Repository HEAD: `dbb9b7ffe88239e4983961a927532321c4154878` on
  clean, pushed `main`.
- Hosted CI run `29471467450` passed for that HEAD. The previous source audit
  also records complete local validation, 99 tests and coverage above the
  configured thresholds before the final deployed-receipt changes.
- Worker version `cc7beaff-476d-452d-a33c-38c8d83323ec` is recorded as deployed
  with only the private `SIMULATOR` Service Binding.
- A real MCP client exercised protocol `2025-11-25`, all 11 curated tools, 23
  protocol/security checks, five development publication checks, and four
  materialization checks: 32 deployed scenarios total.
- Missing/invalid/expired/revoked/wrong-audience tokens, cross-grant access,
  stale plans, conflicting idempotency, and agent production-approval attempts
  failed closed.
- Update and publish plans are independently created before apply. Exact replay
  returns the original result; a consumed plan with a new key is stale; a
  second pre-created plan cannot reuse the first publication idempotency key.
- The retained receipt contains counts and stable identifiers only. Ephemeral
  mode-`0600` Access/MCP fixture files were consumed and removed.

Authoritative detailed evidence remains in
`lemn-ltd/agentops-branding-mcp:patterns/pattern-audit.md`.

## Lunaria Care consumer evidence

- Repository HEAD: `62907b6` on clean, pushed `main`; the latest source-bearing
  SHA is `8e94e56c96e2d62d6e0f80d02e08d8b86b848301`, followed only by
  documentation closure.
- Hosted CI run `29472832444` passed 23 files and 121 tests. Deployment run
  `29472832477` published Worker version
  `c6ec65a2-9b2d-49a6-8211-c9df3cdc4123` and its release smoke passed.
- Ten separate uncached public requests returned `200`, authoritative runtime
  branding, assignment sequence `7`, and the same active revision. Conditional
  `304` revalidation remains `runtime`; last-known-good is emitted only from
  the actual failure path.
- The committed fallback is a signed, compatible active-revision export. Its
  transactional importer verifies JWK and artifact integrity before changing
  either target, serializes imports, and restores both targets if the second
  write fails.
- The consumer imports exact published LEMN packages and one stylesheet. It
  contains no direct UI-provider import and has no branding database, R2,
  Queue, publication, or admin binding.
- The nine-scenario sanitized deployed receipt proves:
  - Access-protected staff surface and workload mutation denial;
  - Core, Pediatrics, and Executive profiles in light and dark without app
    redeploy;
  - branded no-JavaScript SSR before browser execution;
  - matching non-empty Recharts and ECharts semantic projections;
  - durable booking, exactly-one-winner capacity race, same-key replay,
    reference-safe reschedule/cancel, FIFO waitlist promotion, staff blocks,
    filters, tables, KPIs, and charts;
  - deterministic cleanup of three public appointments while preserving the
    receipt's intentionally isolated promotion.
- Live Postgres recorded 11 correlated audit rows for the closure window.

The retained sanitized receipt is
`lemn-ltd/lunaria-care:docs/evidence/development-business-smoke-2026-07-16.json`;
detailed evidence is in that repository's `patterns/pattern-audit.md`.

## Cross-repository demonstration

The deployed path exercised the intended responsibility chain:

1. UI compiles one versioned BrandProject into immutable, scoped semantic CSS,
   provider adapters, hashes, compatibility metadata, and diagnostics.
2. The simulator persists the draft/revision/assignment lifecycle in Postgres,
   materializes the immutable artifact, and exposes only a typed private
   runtime projection.
3. The MCP delegates scoped plan/apply operations to the simulator and cannot
   approve production or access generic infrastructure.
4. Lunaria authenticates as a workload over a private Service Binding, resolves
   the allowed assignment before HTML, verifies the artifact, emits branded
   SSR, and hydrates the same compiled identity.
5. A real update/publish advanced revision history exactly once and became
   observable through the consumer without application redeploy.
6. Runtime failure uses the verified embedded branded artifact; it never emits
   a provider-default or unbranded first frame.

## Security and trust evidence

- Secrets remain in Worker/GitHub Environment/approved secret stores; retained
  receipts contain no values or reusable credentials (`PAT-SEC-SECRETS-001`).
- Access identity and application authorization are independent. Service
  Bindings are transport capabilities, not business authorization
  (`PAT-SEC-AUTHORIZATION-001`, `PAT-SEC-TENANT-ISOLATION-001`).
- Branding mutations are typed, scoped, revision-aware, idempotent and audited;
  no generic SQL, filesystem, network, or secret tool exists
  (`PAT-API-MCP-001`, `PAT-SEC-AUDIT-EVENTS-001`).
- Agents can request non-production plans but cannot approve production. The
  current implementation does not fabricate a second human approver.
- Consumers receive only project/environment/slot/profile-scoped runtime data;
  drafts, RBAC graphs, credentials, and unrelated projects are excluded.

## Honest limitations and remaining operational work

1. The UI `pattern_audit` remains a focused evidence projection. Domain
   `current_level` values stay `unassessed`; no full audit is inferred from
   passing implementation gates.
2. Simulator and MCP audits record that their workspace tokens can read/sync
   organization-managed pattern files but cannot register project
   `pattern-profile.md`/`pattern-audit.md`; local tracked files remain their
   evidence authority until that grant is added.
3. Lunaria's available Cloudflare credential is still a Global API key. Its
   account/Environment custody is controlled, but replacement with a
   resource-scoped API token remains an explicit `PAT-OPS-LEAST-PRIVILEGE-001`
   gap.
4. Lunaria's stable JSON API OpenAPI coverage is not yet exhaustive; patient
   notification delivery is intentionally outside the MVP; development human
   Access uses owner email OTP rather than an MFA/dual-human production model.
5. The UI AgentOps workspace still has its pre-migration external
   identifier/name; the available MCP has no rename tool. The legacy value is
   confined to the managed manifest allowlist and is not repeated in product,
   package, domain, runtime, or public documentation contracts.
6. Existing non-failing tool advisories remain visible: GitHub Actions' Node 20
   deprecation notice for current v4 actions, Vitest's deprecated
   `esbuild` option, the Showcase chunk-size advisory, and the known chart
   zero-layout warning in Brand Studio's DOM test environment. No warning is
   represented as a failed gate or silently suppressed.

## Pattern traceability

| Pattern | Implemented evidence | Status |
|---|---|---|
| `PAT-ARCH-REPO-BOUNDARIES-001` | Four repositories separate package producer, control plane, MCP transport, and product consumer | COMPLETE |
| `PAT-ARCH-PORTS-ADAPTERS-001` | Provider, Postgres, R2, Access, MCP and Service Binding details remain behind typed adapters | COMPLETE |
| `PAT-ARCH-ADAPTER-REGISTRY-001` | Git provider registry selects one active provider of record per registered capability | COMPLETE (focused registry scope) |
| `PAT-UI-PROVIDER-FIRST-001` | Exact pins/full SHA, selected capabilities, provenance, licenses, deterministic transforms, patches and conformance | COMPLETE |
| `PAT-UI-FRONTEND-PLATFORM-BOUNDARY-001` | UI/Studio remain presentational; persistence/auth/routing/data ownership stays in hosts | COMPLETE |
| `PAT-UI-BRAND-CONTRACT-001` | Versioned multi-profile contract compiles deterministically to scoped semantic artifacts and provider projections | COMPLETE |
| `PAT-UI-SSR-BRANDING-001` | Lunaria resolves verified branding before HTML and has a compatible branded fallback | COMPLETE |
| `PAT-UI-BLOCKS-001` | Three public controlled blocks; Lunaria proves two under real host workflows | COMPLETE |
| `PAT-CLOUDFLARE-SERVICE-BINDINGS-001` | Simulator runtime is private; MCP and Lunaria use narrow typed bindings with application authorization | COMPLETE |
| `PAT-API-MCP-001` | Eleven typed tools, six resources, scoped plan/apply, real client and denial matrix | COMPLETE |
| `PAT-SEC-SECRETS-001` | No retained credential values; ephemeral inputs are strict and destroyed | COMPLETE |
| `PAT-SEC-AUTHORIZATION-001` | Human, MCP, workload and health-smoke identities remain distinct and origin-verified | COMPLETE (focused implementation scope) |
| `PAT-SEC-TENANT-ISOLATION-001` | Organization/project/environment/brand/slot/profile grants fail closed cross-scope | COMPLETE |
| `PAT-SEC-AUDIT-EVENTS-001` | State changes and denials retain sanitized, correlated durable evidence | COMPLETE |
| `PAT-OPS-LEAST-PRIVILEGE-001` | Scoped runtime/MCP/service identities are proven; Lunaria Global API key replacement remains explicit | GAP (external Cloudflare credential) |
| `PAT-TEST-EVIDENCE-001` | Current local, hosted, PostgreSQL, browser, accessibility, deployed UI/MCP/SSR and business receipts are exact and tied to their delivered SHAs | COMPLETE |
| `PAT-DOCS-PATTERN-AUDIT-001` | This receipt and repository audits record evidence, gaps, ownership and non-claims | COMPLETE (focused audit only) |

## Evidence sources

- `PROVIDER_BRANDING_ECOSYSTEM_PLAN.md`
- `packages/provider-registry/registry/provider-registry.v1.json`
- `packages/provider-registry/registry/capability-migration-matrix.v1.json`
- `packages/provider-registry/third-party/sbom.spdx.json`
- `patterns/pattern-audit.md`
- `lemn-ltd/agentops-branding-simulator:patterns/pattern-audit.md`
- `lemn-ltd/agentops-branding-mcp:patterns/pattern-audit.md`
- `lemn-ltd/lunaria-care:patterns/pattern-audit.md`
- `lemn-ltd/lunaria-care:docs/evidence/development-business-smoke-2026-07-16.json`

## Final closure rule

All temporary UI delivery markers were replaced with exact run, SHA, Worker,
domain, browser, package-identity, and smoke evidence. A future receipt must
preserve the same evidence-first rule and must not infer deployment success
from source state alone.
