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
        follow_up: "Evaluate any repository-wide test-layout migration separately; application E2E, fixtures, helpers, and snapshots remain under apps/ui-portal/tests."
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
| UI-PORTAL-UNIFICATION-2026-07-18 | 2026-07-18 | Single Portal Worker, public Catalog, protected Admin, schema/docs, package release boundaries, and zero-legacy policy | **PHASE 1 PASS; PHASE 2 PENDING** — repository/build receipt: `docs/evidence/ui-portal-unification/phase-1-repository.md`; production cutover requires its separate receipt |

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

### Phase 1 repository/build evidence

The validated staged implementation-tree capture is
`b2ec2f42871bae2a6beaf8086c3a022ac04750e7`. The requirement-level receipt at
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
- release contracts pass `171/171`, including nested main-ref propagation
  without registry credentials; Portal dist boundaries pass `7/7`, and
  zero legacy passes over `1258` active tracked files and `210` reachable
  Portal modules;
- package smoke verifies four archives, `918` entries, `154` CSS files, zero
  `src` leaks, eight UI public entrypoints, and strict TypeScript consumption;
- production audit reports zero known vulnerabilities and the staged secret
  scan reports zero findings across `1284` tracked / `1103` text files;
- Portal Cloudflare type generation and production dry run pass with `618`
  assets and Worker upload `323.87 KiB` / `72.08 KiB gzip`;
- docs production dry run passes with `24` pages, `110` assets, and Worker
  upload `0.38 KiB` / `0.27 KiB gzip`;
- local Portal smoke returns HTTP `200` for health, home, and a built asset;
- final clean-dist `pnpm validate` passes with release contracts `171/171`
  after the UI package contract dependency is built explicitly;
- package preparation/publication use a main-only ref guard without receiving
  Cloudflare credentials, while actual Cloudflare mutations retain the scoped
  Cloudflare preflight;
- transactional Portal smoke no longer depends on the not-yet-deployed Docs
  identity; the workflow deploys Portal, then Docs, then runs the integrated
  production smoke;
- the only observed concurrent shared-dist race was resolved by an isolated
  Portal rebuild and a successful complete rerun.

Material UI applicability includes `PAT-UI-LEMN-001`,
`PAT-UI-SYSTEM-001`, and `PAT-UI-BLOCKS-001`. The Blocks dependency chain was
evaluated through `PAT-UI-PROVIDER-FIRST-001`, `PAT-CODE-DEPENDENCIES-001`,
`PAT-CODE-FRAMEWORK-API-VALIDITY-001`, `PAT-UI-STATES-001`, and
`PAT-UI-FRONTEND-001`. `PAT-API-OPENAPI-001` is not applicable because this
workspace introduces no product OpenAPI surface, consistent with the profile.

AgentOps status was checked before mutation for organization `lemn`, the
workspace declared in `.agentops/project.json`, and environment `development`. All five managed files were
byte-equal locally, remotely, and in the manifest at the gate capture:

- `AGENTS.md`: `sha256:b36c288a9c6f7cd86d45a58614061de49fef43ebd8d8b253abe7ef73f926f075`,
  organization revision `12`;
- `patterns/pattern-audit.md`:
  `sha256:e6ca148e7cf7fdd623665b2bb4677407e6a3b4ba7aad6fd33a8371ae884a2cce`,
  project revision `10`;
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
