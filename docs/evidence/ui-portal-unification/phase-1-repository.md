# UI Portal unification: Phase 1 repository evidence

Status: **PASS — repository and build reconciliation complete**
Evidence date: 2026-07-18
Authority: [`UI_PORTAL_UNIFICATION_HANDOFF.md`](../../../UI_PORTAL_UNIFICATION_HANDOFF.md)
Target branch: `main`
Validated implementation-tree capture: `3daee44c95eaf9c182ab83f1f506f461c290faea`
Base commit: `ca24a1482e4b4f09c98d081d6541572d3128268f`

## Evidence boundary

This receipt signs off Phase 1 against the staged pre-commit implementation
tree captured above. Phase 1 proves repository topology, package and application boundaries,
tests, browser behavior, deterministic snapshots, builds, package archives,
Cloudflare buildability, release automation, managed-file reconciliation, and
zero productive repository legacy. The receipt, focused-audit sign-off, and
managed-file lock revision were applied after that capture; they are evidence
metadata only and do not change the validated application, package, build,
test, or release paths.

The capture includes the corrective clean-run release gates added after hosted
validation exposed assumptions hidden by local generated output, nested process
isolation, and Changesets metadata propagation. A contract imported UI package
output before it was built, the original release workflow conflated its main-ref
guard with Cloudflare authorization, and Changesets rewrote private consumer
manifests that were initially outside the governed release commit. Candidate
Portal smoke is now separate from Docs and an integrated post-Docs production
smoke remains mandatory. The release-version child receives only the non-secret
`GITHUB_REF` required to repeat the main-only guard; GitHub SHA and package
credentials remain excluded. Both private consumer manifests are version-pinned
to the prepared public packages and staged as governed release metadata.
Generated `dist` directories were removed before the final root validation to
prove the correction without residual artifacts.

Phase 1 does not claim a GitHub Packages publication, hosted deployment, Cloudflare DNS
or Access mutation, production HTTP/browser behavior, or deletion of old live
resources. Those assertions are `N/A-PHASE-1` and require the separate Phase 2
production receipt. Documentation-only sign-off edits after the staged-tree
capture do not change application, package, test, build, or release behavior.

Status meanings in this file:

| Status | Meaning |
| --- | --- |
| `PASS` | Direct evidence proves the requirement on the exact Phase 1 repository/build tree. |
| `N/A-PHASE-1` | The assertion requires publication or live production infrastructure and is outside this repository/build phase. |

## Pattern applicability and dependency evaluation

Pattern precedence was evaluated from `patterns/pattern-system.md`, the current
profile, and the canonical catalog. No domain `current_level` is inferred by
this focused migration receipt.

| Concern | Material patterns and dependency result |
| --- | --- |
| LEMN UI authority | `PAT-UI-LEMN-001` applies directly and has no dependencies. Public identity, exports, root stylesheet contract, catalog, docs, packages, and consumers use `@lemn-ltd/ui`. |
| Reusable UI system | `PAT-UI-SYSTEM-001` applies; its `PAT-UI-LEMN-001` dependency is satisfied by the package/export/catalog evidence. |
| Blocks | `PAT-UI-BLOCKS-001` applies. Direct dependencies `PAT-UI-LEMN-001`, `PAT-UI-PROVIDER-FIRST-001`, and `PAT-UI-STATES-001` are evaluated. Provider-first is backed by the pinned 131-capability registry and depends on `PAT-CODE-DEPENDENCIES-001` and `PAT-CODE-FRAMEWORK-API-VALIDITY-001`; both pass the dependency and toolchain gates. UI states depend on `PAT-UI-FRONTEND-001`; the Portal state contracts pass. Its `PAT-API-OPENAPI-001` branch is not applicable because this workspace does not introduce a product OpenAPI surface, as declared by the profile. |
| Architecture and boundaries | `PAT-ARCH-MONOLITH-001`, `PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001`, `PAT-ARCH-ENTRYPOINTS-001`, `PAT-ARCH-REPO-BOUNDARIES-001`, `PAT-ARCH-RELEASE-001`. |
| Code and scripts | `PAT-CODE-SCRIPT-GOVERNANCE-001`, `PAT-CODE-DEAD-PLACEHOLDER-001`, and the dependency patterns above. |
| Cloudflare and infrastructure | `PAT-CLOUDFLARE-WRANGLER-CONFIG-001`, `PAT-CLOUDFLARE-BUNDLE-ASSETS-001`, `PAT-CLOUDFLARE-BUNDLE-DEPS-001`, `PAT-INFRA-RESOURCE-NAMING-001`, `PAT-INFRA-RESOURCE-CONTRACT-001`. |
| Security | `PAT-SEC-SECRETS-001`, `PAT-SEC-RISK-001`, `PAT-SEC-AUTHORIZATION-001`, `PAT-SEC-PUBLIC-ERRORS-001`. |
| Testing and evidence | `PAT-TEST-INTEGRITY-001`, `PAT-TEST-MEANINGFUL-001`, `PAT-TEST-CLOUDFLARE-ADAPTERS-001`, `PAT-TEST-EVIDENCE-001`, `PAT-DOCS-PATTERN-AUDIT-001`. |

The existing `PAT-TEST-PLACEMENT-001` colocated package-test exception is
preserved in `patterns/pattern-audit.md` and is not broadened here.

## Exact gate report

All results below belong to the captured Phase 1 implementation tree. The final root reruns took
place after managed-file reconciliation.

| Gate | Status | Exact result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | `PASS` | Eight workspaces, lockfile unchanged, up to date; `0.29s`. |
| Credential-free `pnpm rebuild --pending` | `PASS` | Ran with `NODE_AUTH_TOKEN`, `NPM_TOKEN`, `GH_TOKEN`, and `GITHUB_TOKEN` removed; `0.31s`. |
| `pnpm check` | `PASS` | `11/11` tasks; final post-sync rerun `1.17s`; provider matrix `131/131`; docs `0` errors, `0` warnings, `0` hints. |
| `pnpm test` | `PASS` | `10/10` tasks and `784/784` tests: Brand Contract `41`, Brand Runtime `28`, Brand Studio `8`, provider registry `31`, UI `602`, Portal `74`; final cached post-sync replay `1.02s`. |
| `pnpm build` | `PASS` | `7/7` tasks; Portal dist contracts `7/7`; docs `24` pages; Worker `331.64 kB` / `74.18 kB gzip`, source map `741.39 kB`; final cached post-sync rerun `1.12s`. |
| Provider registry check | `PASS` | `131/131` capabilities, one source snapshot, one deterministic output; `1.84s`. |
| Provider registry test | `PASS` | `31/31`; command `1.51s`, Vitest duration `309ms`. |
| `pnpm audit --prod` | `PASS` | Zero known production vulnerabilities; `0.65s`. |
| `pnpm pack:packages` | `PASS` | Four packages, `918` entries, `154` CSS files, zero `src` leaks, eight UI public entrypoints, strict TypeScript with `skipLibCheck: false`; `31.16s`. |
| `pnpm changeset:status` | `PASS` | No pending patch, minor, or major bump after hosted preparation produced release commit `0cbd8d643e4d91eee0c715ea47a99575dedaa5d6`; `0.8s`. |
| Direct validators | `PASS` | Script catalog `4/4`; identity, domains, package identity, brand neutrality, Branding vNext, release, boundaries, and bundles all pass. |
| Zero-legacy validator | `PASS` | `1257` active tracked repository files, `210` reachable Portal modules, Portal `74/74`, dist boundaries `7/7`. |
| Release contracts | `PASS` | `174/174`, including clean package-output ordering, nested main-ref propagation without registry credentials, governed private-consumer discovery, pre-commit worktree fail-closed behavior, least-privilege release guards, candidate-versus-Docs smoke separation, and final cross-surface smoke. |
| Final clean-dist `pnpm validate` | `PASS` | `packages/ui/dist` and `apps/ui-portal/dist` were removed first; five AgentOps files, script catalog `4/4`, Portal `74/74`, dist `7/7`, release contracts `174/174`, zero legacy `1257/210`. |
| Portal `cf:types` | `PASS` | Generated types unchanged; `1.44s`. |
| Portal production Wrangler dry run | `PASS` | `618` assets; Worker upload `323.87 KiB` / `72.08 KiB gzip`; `3.45s`. |
| Docs production Wrangler dry run | `PASS` | `24` pages, `110` assets; Worker upload `0.38 KiB` / `0.27 KiB gzip`; `3.71s`. |
| Local Portal smoke | `PASS` | Health `200`, home `200`, built asset `200`; `9.01s`. |
| Secret/residue scan | `PASS` | `1284` tracked files, `1103` text files, zero private-key/JWT/provider-token/auth findings; `.env` remains ignored and untracked. |
| Diff and worktree checks | `PASS` | Both cached and uncached `git diff --check` pass; zero unstaged tracked drift at gate capture. |
| Structural old-root check | `PASS` | `apps/showcase`, `apps/showcase-admin`, and `packages/showcase-kit` are absent with zero tracked files; workspace has eight manifests. |

### Package archives and public boundaries

The package smoke covered these exact prepared package versions:

| Package | Version | Result |
| --- | --- | --- |
| `@lemn-ltd/brand-contract` | `1.0.0` | `PASS` |
| `@lemn-ltd/ui` | `0.4.0` | `PASS` |
| `@lemn-ltd/brand-runtime` | `0.1.1` | `PASS` |
| `@lemn-ltd/brand-studio` | `2.0.0` | `PASS` |

Bundle measurements are exact raw/gzip bytes:

| Public boundary | Raw | Gzip | Modules |
| --- | ---: | ---: | ---: |
| Button | `666` | `360` | `3` |
| Line chart | `534259` | `127920` | `368` |
| Tracker | `58435` | `17909` | `25` |
| Catalog | `29917` | `7703` | `9` |
| Core catalog | `22041` | `5795` | `6` |
| Core blocks | `653` | `390` | `2` |
| Core block catalog | `653` | `390` | `2` |

## Browser, accessibility, and deterministic visual evidence

The complete Portal Playwright suite passed against the same Portal runtime
tree. Subsequent changes before the staged gate capture affected release/docs
contracts and managed evidence, not Portal runtime source.

| Browser group | Status | Exact result |
| --- | --- | --- |
| Behavior | `PASS` | `43/43`. |
| Accessibility | `PASS` | `208/208`, including keyboard and axe coverage. |
| Visual and responsive | `PASS` | `90/90`, covering desktop/mobile and light/dark behavior. |
| Complete Portal E2E | `PASS` | `341/341`; zero failures, retries, or skips; approximately `28.9` minutes. |
| Snapshot inventory | `PASS` | Exactly `180` PNGs: `90` Darwin and `90` Linux. |

The browser suite proves canonical routes and ordinary 404s for removed/guessed
routes, responsive navigation, theme behavior, shell/preview branding
isolation, safe deterministic Playground history, component interactions,
accessibility, and the anonymous/Admin bundle boundary.

## Requirement-level reconciliation

### Repository, identity, and authority

| Requirement | Status | Evidence |
| --- | --- | --- |
| `apps/ui-portal` is the sole Portal app and `@lemn-ltd/ui-portal` is private. | `PASS` | Old roots have zero files; workspace, identity, graph, build, and zero-legacy validators pass. |
| Worker/domain/schema identities are `lemn-ui-portal`, `portal.ui.le-mn.com`, and `schemas.ui.le-mn.com`. | `PASS` | Wrangler, descriptor, release scripts, docs, tests, and both dry runs use only canonical identities. Live attachment is Phase 2. |
| Catalog is public; Admin is the protected product zone. | `PASS` | Separate client/Worker modules, dynamic Admin boundary, `7/7` dist contracts, Worker auth tests, and browser coverage pass. |
| AgentOps remains persistence/publication/audit authority. | `PASS` | Portal and packages contain no branding persistence authority; Studio uses typed, controlled host intents. |
| Git remains provider mapping/conformance authority. | `PASS` | Pinned registry verifies `131/131` capabilities and deterministic provenance outputs. |
| `@lemn-ltd/ui` remains public UI authority. | `PASS` | Package identity, archive/public-entrypoint, Core catalog, blocks, docs, and bundle gates pass. |
| Shared UI excludes product fetching, routing, authentication, global state, i18n, and persistence. | `PASS` | Package boundaries and source/bundle contracts pass. |

### Public Catalog, Playground, and retained Agents

| Requirement | Status | Evidence |
| --- | --- | --- |
| One React-free registry drives routes, navigation, search, commands, categories, JSON, and LLM documents. | `PASS` | Registry/duplicate-authority contracts, Worker tests, build, and E2E pass. |
| Foundations, components, visualizations, blocks, patterns, provenance, and Playground are documented and interactive. | `PASS` | Catalog manifest/machine projections, public bindings, unit tests, and E2E pass. |
| Core is the only enabled area while Agent source/tests/exports remain retained and inactive. | `PASS` | Enabled-area, source-retention, registry, route, chunk, and zero-legacy contracts pass. |
| Removed route families and guessed Agent routes return ordinary 404s without redirects. | `PASS` | Route contracts and browser suite pass. |
| Playground branding is isolated, supports System presets and light/dark, and does not persist/publish. | `PASS` | Runtime isolation, URL/history, package-boundary, and browser suites pass. |

### Admin and security

| Requirement | Status | Evidence |
| --- | --- | --- |
| `/admin`, `/admin/*`, `/api/admin/*`, and `/admin-assets/*` share one origin authorization boundary. | `PASS` | Worker authorization and route families are covered by unit/adversarial contracts. |
| Origin validates issuer, audience, RS256, expiry, claims, subject, and normalized identity. | `PASS` | Missing/malformed/expired/wrong-issuer/wrong-audience tests pass; raw JWT/credentials are never sent to the client. |
| Human and service identities remain separate. | `PASS` | Human receives only `portal-admin`; service identity reaches only deep health; cross-boundary requests return explicit `403` responses. |
| Admin code is absent from anonymous HTML/public graph and emitted only under `/admin-assets/*`. | `PASS` | Source boundaries, dist `7/7`, and browser network assertions pass. |
| Registry, Conformance, Brand Studio, Releases, and Settings expose only their approved read/plan responsibilities. | `PASS` | Admin unit/read-model contracts cover immutable Git evidence, hashed proposals, controlled Studio, read-only release metadata, masked settings, and real UX states. |
| Anonymous health is minimal; deep diagnostics require service identity; bespoke status token is absent. | `PASS` | Worker/local smoke, authorization, release, and zero-legacy contracts pass. |
| Schema host serves only the immutable canonical BrandingDefinition schema. | `PASS` | Host routing, `$id`, CORS/cache, and unknown-path tests pass. |

### Modules, packages, scripts, docs, and release automation

| Requirement | Status | Evidence |
| --- | --- | --- |
| Client and Worker have one entrypoint each, one router, shared shell primitives, and explicit module direction. | `PASS` | Architecture/source/import/build contracts pass; Worker does not import browser-only modules. |
| Folded catalog helpers are app-local and old package/app identities are absent. | `PASS` | Structural, package graph, archive, identity, and zero-legacy gates pass. |
| Core catalog and block changes are versioned through the material public packages only. | `PASS` | Hosted Changesets preparation consumed the UI minor and Brand Studio major changesets into `0.4.0` and `2.0.0`; Portal remains private/unpublished. |
| Dependencies are exact or pinned catalog references; no `latest` contract is active. | `PASS` | Lockfile, provider, package, release, and dependency validators pass. |
| Docs remain separately deployable at `ui.le-mn.com`. | `PASS` | Docs check/build/dry-run pass with `24` pages and `110` assets. |
| Scripts, Make targets, workflows, artifacts, caches, types, smoke, rollback, metadata, and docs use Portal vocabulary. | `PASS` | Script catalog, release contracts `174/174`, identity, domains, docs, and zero-legacy checks pass. |
| Release workflow rebuilds and validates the exact release SHA, deploys Portal transactionally before docs, and verifies exact published packages in a clean consumer. | `PASS` | Package operations use a main-only ref guard without Cloudflare credentials; Cloudflare mutations retain the scoped Cloudflare guard. Release preparation refuses any dirty starting tree, unstaged/untracked generated output, or staged path outside its governed metadata set before commit/push. Candidate Portal/schema/Access smoke precedes activation, Docs deploys after Portal, and an integrated production smoke follows Docs. Static workflow/security/release contracts are part of `174/174`; the token-backed execution belongs to Phase 2. |

## AgentOps managed-file reconciliation

The AgentOps identity was verified as organization `lemn`, the workspace
declared in `.agentops/project.json`, and environment `development`. `prompt_file_status` was
called before mutation; only locally modified workspace files were replaced,
synchronized, and compared byte for byte. `pnpm validate:agentops` and the
final root validation passed for all five files.

| Managed path | Effective checksum after Phase 1 sign-off sync | Revisions |
| --- | --- | --- |
| `AGENTS.md` | `sha256:b36c288a9c6f7cd86d45a58614061de49fef43ebd8d8b253abe7ef73f926f075` | organization `12` |
| `patterns/pattern-audit.md` | `sha256:b01aa54dca65e4ee38b18fe2ab65b7a785d2d2cfb43bb1761986750229965431` | project `16` |
| `patterns/pattern-profile.md` | `sha256:b319f7d694404eb361ecb52c204dc1ed8ca8ba539dedcc6e93afe97ee6d6b879` | project `8` |
| `patterns/pattern-system.md` | `sha256:9e9b238a3cd1ea40ff787a905d9159ffa11df389219ee6ad1875fe75f2c72052` | organization `2`, project `1` |
| `patterns/patterns.md` | `sha256:3fad04e4c722da256fb633c277a0b7ea7db1a52c172094f570743143fd437df9` | organization `13`, project `8` |

The externally retained AgentOps workspace slug recorded only in
`.agentops/project.json` is an unavoidable non-product identity exception owned by AgentOps. It creates no
runtime alias, package compatibility surface, route, Worker, domain, or public
product vocabulary. Review and remove it when AgentOps supports workspace
rename without breaking managed-file identity/history.

## Non-blocking warnings and disposition

| Warning | Owner | Risk | Disposition / follow-up |
| --- | --- | --- | --- |
| First full validation overlapped a concurrent Portal build and transiently missed `accordion.page-*.js.map` in shared `apps/ui-portal/dist`. | UI tooling | Concurrent writers can invalidate shared generated output. | Isolated Portal rebuild passed `7/7`, then the complete validation rerun passed. Keep build/validation jobs serialized when sharing `dist`. |
| Hosted run `29653726997` for commit `cf5bf3d` found that a release contract relied on pre-existing UI `dist`, and review found the package guard and smoke sequence defects before production approval. | Release tooling | A clean runner would fail before E2E, while an approved release could fail before deployment. | The failed run performed no production mutation. The corrected tree builds the UI contract dependency from a clean `dist`, splits ref and Cloudflare guards, keeps Portal-before-Docs, and adds the final integrated smoke. |
| The first production-approved run of commit `b6e19e3` passed all eight upstream jobs and Cloudflare preflight, then stopped before versioning because the sanitized nested Changesets environment omitted `GITHUB_REF`. | Release tooling | The outer main guard passed, but the deliberately repeated child guard could not prove the same ref. | Run `29654120028` performed no package or production mutation. The capture explicitly forwards only `GITHUB_REF` to release versioning, keeps `GITHUB_SHA` and `NODE_AUTH_TOKEN` excluded, and adds the exact nested guard regression contract. |
| The next approved run of commit `a921fef` prepared and pushed release commit `0cbd8d643e4d91eee0c715ea47a99575dedaa5d6`, then the exact-revision clean install detected unstaged private consumer manifests. | Release tooling | Changesets correctly aligned Docs and Portal workspace dependencies, but the release transaction initially governed only public package metadata. | Run `29655221671` published no package and performed no Cloudflare production mutation. Capture `3daee44c95eaf9c182ab83f1f506f461c290faea` pins the private consumers to UI `0.4.0` and Brand Studio `2.0.0`, discovers every future private internal consumer, governs both current manifests, and fails before commit/push on omitted output; all `174/174` release contracts pass. |
| Provider-registry Vitest reports `esbuild` deprecated in favor of `oxc`. | UI tooling | Future Vitest removal of the option. | Tests pass `31/31`; migrate with a dedicated toolchain update rather than suppressing the warning. |
| Brand Studio Recharts reports width/height `0` in four tests. | Brand Studio | Test-environment layout lacks real dimensions. | All assertions pass; retain visibility and use explicit measured containers when revising those fixtures. |
| Lightning CSS emits two warnings for the valid CSS Custom Highlight API `::highlight`. | UI CSS | Parser/minifier support warning only. | Build output is valid; re-evaluate on Lightning CSS upgrade. |
| Vite reports the ECharts chunk at `1118.14 kB` raw / `371.00 kB` gzip, above `500 kB`. | Visualization owner | Performance cost for visualization consumers. | Public boundary is measured separately at `534259` / `127920` bytes; keep as an explicit performance follow-up. |
| Wrangler `4.103.0` reports `4.112.0` available. | Release tooling | No current functional failure. | Upgrade only through the pinned dependency/update process with dry-run evidence. |
| Changesets' vendored macOS `term-size` prints `Bad CPU type in executable`. | Release tooling | Nonfunctional terminal-size probe noise. | Changeset status exits `0` and correctly reports no pending patch, minor, or major bump; retain until upstream/toolchain update removes it. |

## Phase 2 exclusions at the Phase 1 gate

This table records the historical scope boundary when Phase 1 was signed off.
Any subsequently provisioned live resource still requires exact Phase 2 proof
before the overall migration can be marked complete.

| Live assertion | Status | Reason / required Phase 2 proof |
| --- | --- | --- |
| `pnpm validate:release-hosts` | `N/A-PHASE-1` | Honest pre-provision probe reports `ENOTFOUND` for both A and AAAA of `portal.ui.le-mn.com`. DNS intentionally does not exist yet; this is a Phase 2 pre-provision/cutover prerequisite and is not part of root `pnpm validate`. |
| Create/deploy `lemn-ui-portal` and attach Portal/schema domains. | `N/A-PHASE-1` | At the Phase 1 gate this required live Cloudflare mutation and a deployed-version receipt. |
| Create path-scoped human Access and isolated service-health identity. | `N/A-PHASE-1` | At the Phase 1 gate this required live policies, audiences, credentials, anonymous denial, human browser, and service-only deep-health proof. |
| Populate canonical production GitHub environment inputs. | `N/A-PHASE-1` | At the Phase 1 gate this required production environment mutation and secret/variable inventory evidence. |
| Publish packages and run the clean registry consumer smoke. | `N/A-PHASE-1` | At the Phase 1 gate, the exact versions did not yet exist in GitHub Packages. Publication and the scoped-token consumer proof remain Phase 2; static lifecycle/security contracts pass within `174/174`. |
| Deploy docs and Portal through the governed workflow. | `N/A-PHASE-1` | Requires the final correction commit/push, hosted run, environment review, deployment receipts, and HTTP/browser proof. |
| Delete exclusive old Workers, domains, DNS, Access resources, service credentials, GitHub inputs, workflows, and artifacts. | `N/A-PHASE-1` | Deletion may occur only after canonical production proof and ownership confirmation; no redirect or tombstone is allowed. |
| Negative proof that legacy live hosts/resources are unavailable. | `N/A-PHASE-1` | Must be captured after ordered deletion in `phase-2-production.md`. |

## Phase 1 sign-off

**PASS.** The exact staged pre-commit tree satisfies the repository/build phase:
all applicable local gates are green, complete Portal E2E is `341/341`, the
snapshot inventory is deterministic across Darwin/Linux, publishable archives
and public entrypoints pass, both Cloudflare applications dry-run, AgentOps
managed files reconcile, the secret scan has zero findings, and productive
repository legacy is absent.

This sign-off authorizes progression to the separately evidenced Phase 2
cutover. It does not represent publication, production deployment, Access/DNS
proof, live-resource deletion, or final production completion.
