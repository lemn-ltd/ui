# Lemn UI Portal Unification Handoff

Status: approved implementation handoff  
Date: 2026-07-18  
Repository: `/Users/aweaxiecy/Workspaces/ui`  
Target branch: `main`  

## 1. Outcome

Replace the repository's two current showcase applications with one production
application whose visible product name is **Lemn UI**.

Canonical identities:

| Concern | Target |
|---|---|
| Application | `apps/ui-portal` |
| Private workspace package | `@lemn-ltd/ui-portal` |
| Production Worker | `lemn-ui-portal` |
| Production domain | `portal.ui.le-mn.com` |
| Public product zone | Catalog |
| Protected product zone | Admin |

`apps/ui-portal` is the only portal deployable. It serves the public Catalog and
the Cloudflare Access-protected Admin from one modular application, router,
shell system, catalog authority, search model, branding runtime, Worker, release
pipeline, and production domain.

This is a zero-legacy migration for the productive current state. There must be
no active aliases, redirects, proxy shells, duplicate applications, duplicate
Workers, old domains, old Access applications, old scripts, dead compatibility
code, or current documentation that presents Showcase as a product.

Zero legacy does **not** authorize rewriting Git history, deleting historical
releases, or changing immutable package versions already published.

The owner confirms there are no external consumers requiring migration. The
delivery therefore updates this repository, its active documentation and
automation, and the Cloudflare/GitHub resources it owns; it does not expand into
an organization-wide compatibility campaign.

## 2. Product intent

Lemn UI is the operational portal for the `@lemn-ltd/ui` ecosystem:

- Catalog publicly documents and demonstrates foundations, components,
  visualizations, blocks, patterns, and provider provenance.
- Playground publicly allows safe interaction with components, blocks, and
  approved System branding presets.
- Admin provides protected governance and experimentation tools without
  becoming a new system of record.
- AgentOps remains the source of truth for persisted project branding,
  authorization, publication, activation, and audit.
- Git remains the source of truth for provider mappings and conformance
  declarations.
- `@lemn-ltd/ui` remains the source of truth for public UI exports.

The portal must not absorb product data fetching, general application routing,
authentication frameworks, global state, internationalization, or AgentOps
persistence responsibilities into the shared UI packages.

## 3. Approved decisions and implications

### 3.1 One deployable, two security surfaces

Public and protected routes live in one app and Worker, but not in one trust
zone.

- Catalog routes and public machine-readable endpoints are anonymous and
  read-only.
- `/admin`, `/admin/*`, `/api/admin/*`, and browser assets used exclusively by
  Admin require Cloudflare Access.
- React route guards are UX only and are never an authorization authority.
- The Worker validates the Access assertion at origin: issuer, allowed
  audience, RS256 signature, expiry, required claims, subject, and normalized
  human or service identity.
- Every `/api/admin/*` endpoint is protected, including reads.
- The browser receives only the minimum normalized session/capability model. It
  never receives or stores the Access JWT, service credentials, provider
  secrets, or Cloudflare credentials.
- All Access-approved human identities receive the same `portal-admin`
  capability. There is no invented role hierarchy in this migration.
- Service-token identity is least privilege and may only call the protected
  operational health capability required by release verification.
- Admin modules are lazy loaded. Their browser chunks must be emitted under a
  protected asset namespace such as `/admin-assets/*`; they must not appear in
  the anonymous public network graph.

Model the UI and API as one logical Admin policy. If Cloudflare requires more
than one path-scoped Access application to protect `/admin/*` and
`/api/admin/*`, create the minimum required technical resources, reuse the same
human policy semantics, validate the explicit audience set at origin, and
document the topology. Do not protect the entire hostname and do not add public
bypass policies as a shortcut.

### 3.2 Catalog information architecture

Canonical public routes:

- `/`
- `/foundations`
- `/foundations/:slug`
- `/components`
- `/components/:slug`
- `/visualizations`
- `/visualizations/:slug`
- `/blocks`
- `/blocks/:slug`
- `/patterns`
- `/patterns/:slug`
- `/providers`
- `/playground`

The old route families, including `/catalog`, `/brand-studio`, `/core/*`, and
`/agents/*`, are removed without redirects.

The registry is the single authority for navigation, routes, search, category
pages, command palette results, public JSON, `llms.txt`, and `llms-full.txt`.
Route category and canonical slug must be derived from registry metadata rather
than duplicated switch statements.

Core is the only enabled catalog area in this delivery. Agent components and
agent patterns must remain in source control but be disabled at the registry
composition boundary:

- do not delete their source, tests, or reusable `@lemn-ltd/ui` exports;
- do not import them into the active portal registry;
- do not expose them in routes, navigation, search, command palette, public
  catalogs, LLM discovery documents, or generated browser chunks;
- direct requests to old or guessed Agent routes return the regular 404 state;
- add a focused gate proving that the active catalog contains Core only;
- retain a clear compile-time catalog-area configuration so Agents can be
  deliberately re-enabled later without reconstructing deleted code.

### 3.3 Playground and branding

The Lemn UI shell uses a stable Lemn branding and supports light/dark theme.
Experimental branding never changes the portal chrome; it is isolated to the
preview canvas so invalid contrast or incomplete experiments cannot make the
portal itself unusable.

Public `/playground` supports:

- interactive public components and blocks;
- light/dark preview;
- approved System branding presets;
- reset and deterministic deep-linkable preview state where safe;
- no free-form publication or persistence.

Protected `/admin/brand-studio` is the free-form, controlled,
persistence-free contract laboratory. It may validate, compare, preview,
archive/restore in local memory, and generate typed intents. It must not claim
that local checkpoints are durable and must not call AgentOps in this
migration. Any future persistence or publication must enter through a typed
server-side host adapter; AgentOps remains authoritative.

### 3.4 Admin responsibilities

Canonical protected routes:

- `/admin`
- `/admin/registry`
- `/admin/conformance`
- `/admin/brand-studio`
- `/admin/releases`
- `/admin/settings`

Responsibilities:

- **Registry** reads the Git-authoritative provider mapping and generates real,
  hashed proposal bundles. Proposal generation does not mutate the manifest;
  it belongs inside Registry rather than a separate top-level route.
- **Conformance** presents immutable evidence generated by repository/CI gates.
  It does not pretend that a Cloudflare Worker can execute Playwright or local
  package tests.
- **Brand Studio** is the protected ephemeral laboratory defined above.
- **Releases** presents exact deployed version, Git SHA, build time, Worker
  identity, package/catalog version, and available release receipts. It cannot
  trigger deployments from the browser; GitHub Actions remains release
  authority.
- **Settings** presents effective portal configuration, security boundary,
  enabled catalog areas, masked operational configuration, and local UI
  preferences. It is not a generic Cloudflare administration console and has
  no undocumented writes.

Every administrative surface implements applicable loading, empty, error,
permission denied, pending, conflict, success, and retry states. Do not add
fake data or show a success state for an operation that did not occur.

### 3.5 Schema host

Keep `schemas.ui.le-mn.com` as a secondary custom domain on
`lemn-ui-portal`. It serves only the canonical, immutable, machine-readable
BrandingDefinition JSON Schema and its expected CORS/cache headers.

This host is necessary because BrandingDefinition documents reference it in
`$schema`; editors, agents, validators, and runtimes use it to discover and
validate the contract. It is not a second UI application.

The portal UI is served only from `portal.ui.le-mn.com`.

### 3.6 Package boundaries

- Rename/move `apps/showcase` to `apps/ui-portal` and set its private package
  identity to `@lemn-ltd/ui-portal`.
- Migrate valid code from `apps/showcase-admin` into protected modules and the
  Worker boundary of `apps/ui-portal`.
- Delete `apps/showcase-admin` completely after migration.
- `@lemn-ltd/showcase-kit` has only one application consumer. Fold its useful
  source, styles, registry helpers, and tests into app-local modules under
  `apps/ui-portal`; then delete `packages/showcase-kit` and its package identity.
- `@lemn-ltd/ui-portal` remains `private: true`; it is never published and does
  not receive a changeset merely for application changes.
- Add a changeset only if this migration materially changes a public published
  package contract.
- Keep dependency versions exact or on the repository's pinned catalog. Never
  introduce `latest` or an unbounded provider dependency.
- Keep `apps/docs` and `ui.le-mn.com` as separate deployables. Update their
  active links to the portal, but do not merge them into this application.

Use portal/catalog vocabulary in current code:

- `UiPortal`, `PortalShell`, `CatalogRegistry`, `CatalogEntry`, and equivalent
  names replace `Showcase*` types and symbols;
- visible branding is exactly `Lemn UI`;
- no current product copy may say `Showcase - UI` or `Showcase Admin`.

### 3.7 Operational endpoints

- Keep a minimal anonymous liveness/readiness response containing no sensitive
  topology or configuration.
- Protect deep status, release diagnostics, and Admin health with Cloudflare
  Access service identity.
- Remove the bespoke `STATUS_TOKEN`, `PRODUCTION_STATUS_TOKEN`, and
  `ROLLBACK_STATUS_TOKEN` mechanism from code, Wrangler configuration, CI,
  documentation, and active GitHub Environment configuration when no longer
  referenced.
- Preserve catalog, provider registry, blocks, schema, and LLM discovery
  endpoints as public read-only contracts, updated to the new portal URL and
  vocabulary.
- Return safe Problem Details-style errors for administrative API failures and
  avoid leaking whether protected resources exist.

### 3.8 Production environments

There is one deployed environment: production.

- Production Worker: `lemn-ui-portal`.
- Production UI domain: `portal.ui.le-mn.com`.
- Schema domain: `schemas.ui.le-mn.com` on the same Worker.
- Local development uses the established local port and global Lemn dev
  tunnel; do not create a deployed development or staging Worker.
- Rollback uses Cloudflare Worker versions/deployments of `lemn-ui-portal`, not
  a permanent staging Worker or either old Worker.

## 4. Required module shape

The exact folders may follow established conventions, but the resulting
dependency direction must be equivalent to:

```text
apps/ui-portal/
  src/
    client/
      app/
        router.tsx
        providers.tsx
      shell/
      modules/
        catalog/
        foundations/
        components/
        visualizations/
        blocks/
        patterns/
        providers/
        playground/
        admin/
          registry/
          conformance/
          brand-studio/
          releases/
          settings/
      shared/
    worker/
      access/
      public/
      admin/
      security/
      index.ts
    catalog/
    app-descriptor.ts
  tests/
```

Rules:

- one browser entrypoint and one Worker entrypoint;
- one React router and shared shell primitives;
- public modules never import Admin modules;
- Admin modules may consume public read models through stable module surfaces;
- Worker code never imports browser-only modules;
- registry and catalog helpers folded from `showcase-kit` remain app-local;
- use dynamic imports at the Admin route boundary;
- no app-root mega component or mega route switch;
- no duplicate catalogs, navigation arrays, search indexes, or route maps.

## 5. Cloudflare migration and deletion

Before mutation, inventory the actual Lemn DEV account and compare it with
Wrangler, release scripts, GitHub Environment configuration, and documentation.
Never infer that a configured resource still exists, and never delete a shared
credential without proving ownership.

Create/configure:

- Worker `lemn-ui-portal`;
- custom domain `portal.ui.le-mn.com`;
- custom domain `schemas.ui.le-mn.com` attached to the new Worker;
- path-scoped Access resources for Admin UI, Admin API, and protected Admin
  assets using one logical human policy;
- a fresh least-privilege service identity for protected release health if the
  deployment smoke requires it;
- production GitHub Environment secrets/variables using `UI_PORTAL` naming.

After the new portal is deployed and both unauthenticated and authenticated
smokes pass, delete every exclusive old active resource:

- Worker `dev-lemn-ui-showcase` if it exists;
- Worker `lemn-ui-showcase`;
- Worker `lemn-ui-showcase-admin-development` if it exists;
- Worker `lemn-ui-showcase-admin-staging` if it exists;
- Worker `lemn-ui-showcase-admin`;
- custom domain and DNS for `showcase.ui.le-mn.com`;
- custom domain and DNS for `admin.showcase.ui.le-mn.com`;
- old Showcase Admin Access applications, health application, policies,
  audience configuration, and exclusive service credentials;
- obsolete GitHub Environment secrets and variables after proving the new
  release path no longer reads them.

Do not create redirects or tombstone Workers for the old domains. At final
state, negative verification must prove that the old domains/resources no
longer resolve to an active LEMN UI deployment.

If an apparently old token or policy is shared, stop deletion of that one
resource, prove the dependency, replace the consumer with a scoped credential,
then resume. Do not weaken zero trust to complete cleanup.

## 6. Scripts, CI, documentation, and patterns

Rename or replace every active command and job so the portal is the only
concept:

- root development, build, check, test, smoke, deploy, rollout, tail, and kill
  commands;
- Make targets;
- Wrangler type generation and configuration;
- production preflight, deployment smoke, rollback, release metadata, and
  asset smoke scripts;
- GitHub Actions jobs, environment variable names, artifact names, cache keys,
  and visual-baseline paths;
- Playwright configuration, snapshots, deterministic helpers, and reports;
- package identity and repository identity validators;
- architecture and package-boundary tests;
- README files, docs, diagrams, runbooks, package references, `llms.txt`, and
  machine-readable endpoints.

Update the managed pattern authority to describe the new inventory:

- `patterns/pattern-profile.md` must describe one Portal deployable with public
  Catalog and protected Admin, not two showcases;
- `patterns/pattern-audit.md` must record exact migration evidence, remaining
  gaps, and the final verification results;
- change `patterns/patterns.md` only if a canonical reusable rule truly changes,
  not merely to encode this app-specific migration;
- follow `patterns/pattern-system.md` ordering and evidence rules;
- synchronize every modified managed file through AgentOps and verify local and
  remote checksums.

Material patterns include at minimum:

- `PAT-ARCH-MONOLITH-001`
- `PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001`
- `PAT-ARCH-ENTRYPOINTS-001`
- `PAT-ARCH-REPO-BOUNDARIES-001`
- `PAT-ARCH-RELEASE-001`
- `PAT-CODE-SCRIPT-GOVERNANCE-001`
- `PAT-CODE-DEAD-PLACEHOLDER-001`
- `PAT-CLOUDFLARE-WRANGLER-CONFIG-001`
- `PAT-CLOUDFLARE-BUNDLE-ASSETS-001`
- `PAT-CLOUDFLARE-BUNDLE-DEPS-001`
- `PAT-INFRA-RESOURCE-NAMING-001`
- `PAT-INFRA-RESOURCE-CONTRACT-001`
- `PAT-SEC-SECRETS-001`
- `PAT-SEC-RISK-001`
- `PAT-SEC-AUTHORIZATION-001`
- `PAT-SEC-PUBLIC-ERRORS-001`
- `PAT-TEST-INTEGRITY-001`
- `PAT-TEST-MEANINGFUL-001`
- `PAT-TEST-CLOUDFLARE-ADAPTERS-001`
- `PAT-TEST-EVIDENCE-001`
- `PAT-UI-FRONTEND-MODULAR-MONOLITH-001`
- `PAT-UI-STATES-001`
- `PAT-DOCS-PATTERN-AUDIT-001`

## 7. Zero-legacy automated gates

Add a deterministic repository gate that fails when the current productive
tree reintroduces any of the following:

- directories `apps/showcase`, `apps/showcase-admin`, or
  `packages/showcase-kit`;
- package identities `@lemn-ltd/ui-showcase`,
  `@lemn-ltd/ui-showcase-admin`, or `@lemn-ltd/showcase-kit`;
- active Worker names containing `ui-showcase`;
- active domains `showcase.ui.le-mn.com` or
  `admin.showcase.ui.le-mn.com`;
- visible strings `Showcase - UI` or `Showcase Admin`;
- active scripts, CI jobs, artifact names, environment variables, or types
  using Showcase as the application identity;
- an Admin endpoint without origin authorization;
- an Admin-only browser chunk reachable anonymously;
- Agent catalog entries in the active registry;
- the old public route families.

Scope the textual gate to the current productive tree, tests, current docs,
configuration, and automation. Explicitly exclude `.git`, dependency caches,
immutable historical changelogs/releases, generated test output, and this
handoff document, which necessarily names the resources being removed. Keep
the allowlist exact and minimal.

## 8. Implementation sequence

1. Re-read `AGENTS.md`, pattern system/profile, applicable PAT entries, and
   pattern audit. Confirm the worktree and preserve unrelated changes.
2. Capture a baseline inventory of code, routes, packages, bundles, Cloudflare
   Workers/domains/Access resources, GitHub release inputs, and production
   behavior without mutating infrastructure.
3. Establish `apps/ui-portal`, its private package identity, descriptor,
   modular client, router, and Worker.
4. Fold `showcase-kit` into app-local Catalog modules and migrate its meaningful
   tests before deleting the package.
5. Build the canonical public route taxonomy and disable Agents at registry
   composition.
6. Implement public Playground with isolated branding preview.
7. Migrate valid Admin registry, conformance, proposal, and Brand Studio
   behavior; implement real Releases and Settings read models.
8. Add Access origin verification, normalized identity/capabilities, protected
   APIs, protected Admin chunks, safe errors, and service-health capability.
9. Remove the status bearer-token mechanism.
10. Replace scripts, tests, CI, release automation, documentation, generated
    types, patterns, and evidence paths with Portal vocabulary.
11. Delete the three old code/package roots and run the zero-legacy gate.
12. Run all local validation and the mandatory Phase 1 plan reconciliation.
13. Commit and push the implementation to `main` only when Phase 1 passes.
14. Create the new Cloudflare Access boundary, deploy `lemn-ui-portal`, attach
    the two intended domains, and run public/protected production smokes.
15. Delete exclusive old Cloudflare/GitHub resources only after the new portal
    is proven healthy.
16. Run the mandatory Phase 2 plan reconciliation, repeat residue scans, update
    evidence/pattern audit, commit/push any resulting evidence changes, and
    prove the final tree is clean.

## 9. Validation requirements

At minimum, run and record:

- formatting/lint and TypeScript checks;
- unit and integration tests;
- Worker authorization and JWT-verification tests;
- Worker build and Wrangler dry run;
- package-boundary and repository-identity checks;
- zero-legacy and disabled-Agents gates;
- browser bundle analysis proving anonymous routes do not fetch Admin chunks;
- public route, category, search, command palette, and deep-link tests;
- responsive desktop/mobile navigation tests;
- light/dark theme and fixed-shell/isolated-preview tests;
- keyboard navigation and axe accessibility tests;
- real Playwright tests for Catalog and authenticated Admin;
- release script and rollback contract tests;
- public machine endpoint tests, including schema headers and `$id`;
- production smoke and Cloudflare inventory verification.

Required production assertions:

- `https://portal.ui.le-mn.com/` returns the built Lemn UI portal without
  authentication;
- every canonical public route returns or hydrates successfully;
- `/admin` and `/admin/*` enter Cloudflare Access without an authenticated
  session;
- `/api/admin/*` rejects missing, invalid, expired, wrong-issuer, and
  wrong-audience identities at origin;
- an authorized human reaches every Admin route and receives only normalized
  identity/capability data;
- the release service identity can call only its health capability;
- anonymous requests cannot retrieve Admin-only chunks;
- `https://schemas.ui.le-mn.com/branding/v1.json` returns the canonical schema
  with immutable cache and CORS headers;
- public health and catalogs contain the new service identity and URLs;
- the active Worker is `lemn-ui-portal`;
- old Workers, domains, Access resources, and exclusive credentials are gone.

## 10. Two mandatory final verification phases

These are release gates, not optional review suggestions. The implementation is
not complete until both phases reconcile the delivered result line by line
against this handoff and store evidence.

### Phase 1 — Repository and build reconciliation

Run after implementation is complete and before production mutation.

1. Convert every requirement in this handoff into a checked reconciliation
   table with evidence path or command output.
2. Inspect `git diff`, the full tracked file inventory, dependency graph,
   package graph, routes, registry, bundles, scripts, workflows, docs, diagrams,
   tests, Wrangler configuration, generated types, patterns, and audit.
3. Run both exact-name and case-insensitive residue searches, plus structural
   checks for deleted roots and duplicate implementations.
4. Prove Agents is retained in source but absent from the active registry and
   browser bundles.
5. Prove Admin source and chunks are absent from the anonymous public bundle
   graph.
6. Run the complete local validation suite and Wrangler production dry run.
7. Record every failed, skipped, or not-applicable item honestly. Fix all
   blockers and repeat the entire phase; do not waive residue findings.

Store the signed-off result under a durable repository evidence path such as:

```text
docs/evidence/ui-portal-unification/phase-1-repository.md
```

### Phase 2 — Production, infrastructure, and repeated residue reconciliation

Run after deployment, authenticated browser verification, and old-resource
deletion.

1. Repeat the Phase 1 repository residue gate against the exact deployed commit
   to catch cleanup regressions introduced during cutover.
2. Compare live Cloudflare Workers, custom domains, DNS, Access applications,
   policies, audiences, service credentials, Worker secrets, and routes against
   the target inventory in this handoff.
3. Run anonymous, invalid-identity, authorized-human, and least-privilege
   service-identity smokes against the real domain.
4. Use a real browser to verify routes, search, responsive navigation,
   accessibility, light/dark mode, Playground isolation, all Admin states, deep
   links, and protected chunk behavior.
5. Verify `schemas.ui.le-mn.com` and all public machine contracts.
6. Prove old domains and old named resources are absent rather than redirected.
7. Reconcile every handoff requirement again. Fix findings, redeploy if needed,
   and rerun the whole phase until it passes without unexplained residue.

Store the result under:

```text
docs/evidence/ui-portal-unification/phase-2-production.md
```

The final delivery summary must link both evidence files and state the exact
commit, Worker version, domains, Access topology, validation commands, deleted
resources, and any genuine remaining exception. An exception is allowed only
when it is externally unavoidable, explicitly owned, risk-assessed, recorded in
`patterns/pattern-audit.md`, and does not preserve Showcase compatibility.

## 11. Completion definition

The goal is complete only when:

- `apps/ui-portal` is the sole portal application and deployable;
- the visible product is Lemn UI;
- Catalog is public and read-only;
- Admin is origin-authorized and its code is lazy/protected;
- Core is the only active area while Agent source remains intact and disabled;
- Playground and Brand Studio respect their approved authority boundaries;
- `schemas.ui.le-mn.com` is served by the new Worker;
- old code roots, packages, routes, scripts, names, domains, Workers, Access
  resources, and exclusive credentials are removed;
- current docs, patterns, audit, CI, tests, and release automation describe the
  new reality;
- both mandatory verification phases pass against the exact final plan;
- changes are committed and pushed to `main`;
- production is deployed and verified through real HTTP and browser checks;
- the final worktree is clean.

Do not stop at local green checks, a successful deploy command, or a partial
cleanup. Do not leave TODOs, stubs, skipped gates, fake evidence, untracked
artifacts, or a compatibility path for the former Showcase products.
