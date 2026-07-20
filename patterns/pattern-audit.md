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
  DATA:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions:
      - pattern: PAT-DATA-R2-001
        scope: scripts/fonts/** and the public fonts.ui.le-mn.com R2 origin
        owner: UI Platform
        reason: "Immutable public WOFF2 and license release artifacts use a Git-authoritative content-addressed manifest rather than Postgres metadata."
        risk: "The exception would be unsafe if the bucket acquired private, mutable, tenant-scoped, user-uploaded, searchable, or transactional objects."
        follow_up: "Reassess before adding any non-public-static object class; use an authoritative product store and authorized delivery whenever asset ownership or policy becomes mutable."
  CLOUDFLARE:
    current_level: unassessed
    gaps:
      - pattern: PAT-CLOUDFLARE-SERVICE-BINDINGS-001
        scope: packages/brand-runtime Service Binding transport
        detail: "The published BrandingRuntimeRpcBinding contract does not yet carry requestId/traceId across the binding."
    blockers: []
    exceptions: []
  INFRA:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  API:
    current_level: unassessed
    gaps:
      - pattern: PAT-API-OPENAPI-001
        scope: apps/ui-portal protected Admin API and stable machine-readable HTTP surfaces
        detail: "The shipped endpoints have behavior and contract tests but no governed OpenAPI contract or recorded temporary exception."
    blockers: []
    exceptions: []
  ERROR:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  AUTH:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions:
      - pattern: PAT-AUTH-LEMN-001
        scope: Portal Admin and protected deep-health operational identity only
        owner: UI Platform Security
        reason: "Cloudflare Access is the zero-trust operational perimeter for this internal Portal; it is not a parallel commercial auth, organization, tenant, billing, or entitlement authority."
        risk: "The boundary would become a parallel product identity system if it gained Workspace data, product mutations, tenant policy, or reusable application sessions."
        follow_up: "Reassess and integrate the approved LEMN identity boundary before adding product data, AgentOps mutations, tenant RBAC, billing, or entitlements."
  SEC:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  ASYNC:
    current_level: unassessed
    gaps:
      - pattern: PAT-ASYNC-IDEMPOTENCY-001
        scope: Branding Runtime HTTPS resolution and preview exchange transports
        detail: "The audit must distinguish retry-safe active resolution from one-time preview exchange and record the allowed retry/idempotency policy for each operation."
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
        follow_up: "Evaluate any repository-wide test-layout migration separately; application E2E, fixtures, helpers, and snapshots remain under apps/ui-portal/tests."
  UI:
    current_level: unassessed
    gaps: []
    blockers: []
    exceptions: []
  OBS:
    current_level: unassessed
    gaps:
      - pattern: PAT-OBS-TRACE-CONTEXT-001
        scope: Branding Runtime HTTPS and Service Binding transports
        detail: "Portal requests have correlation IDs, but the published cross-runtime contract does not yet propagate requestId/traceId."
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
| PATTERN-PROFILE-REASSESSMENT-2026-07-20 | 2026-07-20 | Current package, Portal, runtime transport, Cloudflare Access, public API, and font R2 ownership inventory | **PROFILE UPDATED; FULL PRECEDENCE AUDIT PENDING** — target domains now include operational identity, controlled cross-runtime effects, public-static R2 ownership, and the existing Service Binding contract without claiming domain completion |
| UI-PORTAL-UNIFICATION-2026-07-18 | 2026-07-18 | Single Portal Worker, public Catalog, protected Admin, schema/docs, package release boundaries, and zero-legacy policy | **PHASE 1 PASS; PHASE 2 PENDING** — repository/build receipt: `docs/evidence/ui-portal-unification/phase-1-repository.md`; production cutover requires its separate receipt |

### Intended repository boundary

- `@lemn-ltd/brand-contract` owns the source schema, deterministic compiler,
  immutable System branding catalog, compatibility, diagnostics, hashes, and
  signed compiled-object contract.
- `@lemn-ltd/brand-runtime` owns server-only runtime adapters, verification,
  selected-mode projection, SSR helpers, preview selection contracts, and one
  embedded branded fallback, including typed Service Binding and authenticated
  HTTPS transport clients.
- `@lemn-ltd/brand-studio` remains controlled and persistence-free; the host
  supplies catalog/preview data and executes typed intents.
- `@lemn-ltd/ui` consumes semantic variables and provider adapters only.
- This repository owns the public immutable font R2 origin and its
  Git-authoritative artifact manifest; it does not own AgentOps private branding
  publication storage.
- AgentOps owns Workspace state, BrandingVersions, Postgres, private R2,
  publication, human activation, preview sessions, MCP, authorization, and
  audit. Those responsibilities do not move into this repository.

### Phase 1 repository/build evidence

The validated staged implementation-tree capture is
`fba0d072d8e50e542ca2f571b89711d7397b51c6`. The requirement-level receipt at
`docs/evidence/ui-portal-unification/phase-1-repository.md` records:

- frozen installation and credential-free rebuild pass;
- root check `11/11`, root tests `784/784`, and root build `7/7` pass;
- the test distribution is Brand Contract `41`, Brand Runtime `28`, Brand
  Studio `8`, provider registry `31`, UI `602`, and Portal `74`;
- provider governance verifies `131/131` capabilities, one immutable source
  snapshot, and one deterministic output;
- complete Portal E2E passes `341/341`: `43` behavior, `208` accessibility,
  and `90` visual/responsive tests, with zero failures, retries, or skips;
- the deterministic visual inventory is `180` PNGs: `90` Darwin and `90`
  Linux;
- release contracts pass `175/175`, including nested main-ref propagation
  without registry credentials, exhaustive private-consumer governance, and
  pre-commit rejection of omitted generated output plus a network-free execution
  of the exact install argv against pinned pnpm `11.8.0`; Portal dist boundaries pass
  `7/7`, and zero legacy passes over `1257` active tracked files and `210`
  reachable Portal modules;
- package smoke verifies four archives, `918` entries, `154` CSS files, zero
  `src` leaks, eight UI public entrypoints, and strict TypeScript consumption;
- production audit reports zero known vulnerabilities and the staged secret
  scan reports zero findings across `1284` tracked / `1103` text files;
- Portal Cloudflare type generation and production dry run pass with `618`
  assets and Worker upload `323.87 KiB` / `72.08 KiB gzip`;
- docs production dry run passes with `24` pages, `110` assets, and Worker
  upload `0.38 KiB` / `0.27 KiB gzip`;
- local Portal smoke returns HTTP `200` for health, home, and a built asset;
- final clean-dist `pnpm validate` passes with release contracts `175/175`
  after the UI package contract dependency is built explicitly;
- package preparation/publication use a main-only ref guard without receiving
  Cloudflare credentials, while actual Cloudflare mutations retain the scoped
  Cloudflare preflight;
- transactional Portal smoke no longer depends on the not-yet-deployed Docs
  identity; the workflow deploys Portal, then Docs, then runs the integrated
  production smoke;
- hosted run `29655221671` prepared and pushed release commit
  `0cbd8d643e4d91eee0c715ea47a99575dedaa5d6`, then stopped before package
  publication or Cloudflare mutation because private consumer manifests were
  initially outside the governed metadata set; the capture governs all current
  and future private internal consumers and rejects omitted output before
  commit/push;
- hosted run `29656712010` completed the immutable four-package registry set,
  then stopped before Portal/Docs deployment because pnpm `11.8.0` rejected the
  removed `--prefer-online` option in the clean-consumer smoke; capture
  `fba0d072d8e50e542ca2f571b89711d7397b51c6` removes that option and validates
  the production argv with the real pinned CLI;
- the only observed concurrent shared-dist race was resolved by an isolated
  Portal rebuild and a successful complete rerun.

Material UI applicability includes `PAT-UI-LEMN-001`,
`PAT-UI-SYSTEM-001`, and `PAT-UI-BLOCKS-001`. The Blocks dependency chain was
evaluated through `PAT-UI-PROVIDER-FIRST-001`, `PAT-CODE-DEPENDENCIES-001`,
`PAT-CODE-FRAMEWORK-API-VALIDITY-001`, `PAT-UI-STATES-001`, and
`PAT-UI-FRONTEND-001`. At that Phase 1 gate,
`PAT-API-OPENAPI-001` was treated as not applicable because the review scoped
only product API surfaces. The 2026-07-20 profile reassessment supersedes that
classification for the shipped Portal endpoints and records the unresolved
contract gap above without rewriting the historical gate result.

AgentOps status was checked before mutation for organization `lemn`, the
workspace declared in `.agentops/project.json`, and environment `development`.
All five managed files were byte-equal locally, remotely, and in the manifest
at the gate capture. The committed `.agentops/project.json` is the checksum and
revision authority; this managed file intentionally does not embed its own
current checksum because doing so would be recursively unstable:

- `AGENTS.md`: `sha256:b36c288a9c6f7cd86d45a58614061de49fef43ebd8d8b253abe7ef73f926f075`,
  organization revision `12`;
- `patterns/pattern-audit.md`: current checksum and project revision are
  recorded in `.agentops/project.json` and verified by `pnpm validate:agentops`;
- `patterns/pattern-profile.md`:
  `sha256:b319f7d694404eb361ecb52c204dc1ed8ca8ba539dedcc6e93afe97ee6d6b879`,
  project revision `8`;
- `patterns/pattern-system.md`:
  `sha256:9e9b238a3cd1ea40ff787a905d9159ffa11df389219ee6ad1875fe75f2c72052`,
  organization revision `2`, project revision `1`;
- `patterns/patterns.md`:
  `sha256:3fad04e4c722da256fb633c277a0b7ea7db1a52c172094f570743143fd437df9`,
  organization revision `13`, project revision `8`.

`pnpm validate:agentops` and the final root validation pass. This focused Phase
1 result does not calculate or change any domain `current_level`; those remain
`unassessed` until a full precedence audit.

### Focused external identity exception

The AgentOps workspace slug recorded only in `.agentops/project.json` is
retained because AgentOps does not currently support a safe workspace rename.
Owner: AgentOps. It is a
non-product control-plane identity and creates no runtime compatibility alias,
package name, route, Worker, domain, redirect, or visible product vocabulary.
Review and remove it when AgentOps supports rename while preserving managed-file
identity and history.

### Phase 2 boundary

Production DNS, Cloudflare Access, service credentials, GitHub environment
inputs, package publication, governed deploy, authenticated/anonymous/service
HTTP and browser proof, and ordered deletion of exclusive legacy resources are
not repository/build assertions. `pnpm validate:release-hosts` honestly reports
`ENOTFOUND` for the intentionally unprovisioned `portal.ui.le-mn.com`; it is a
Phase 2 pre-provision gate, not a Phase 1 failure. Phase 2 must retain the
`PENDING` status above until `phase-2-production.md` contains exact live
inventory, deployment, access, deletion, and negative-legacy evidence.
