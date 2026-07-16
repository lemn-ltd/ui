# Provider-First UI And Project Branding Ecosystem

## Document status

- Decision authority: accepted product and architecture decisions from the current project discussion.
- Implementation posture: zero legacy; replace incompatible foundations instead of preserving aliases or parallel runtimes.
- Delivery posture: implement directly on `main`, with independently useful commits, push every repository, deploy every runnable surface, and finish with an end-to-end demonstration.
- Primary workspace: `/Users/aweaxiecy/Workspaces/ui`.
- Additional workspaces to create:
  - `/Users/aweaxiecy/Workspaces/agentops-branding-simulator`
  - `/Users/aweaxiecy/Workspaces/agentops-branding-mcp`
  - `/Users/aweaxiecy/Workspaces/lunaria-care`
- This document is the implementation authority for the goal. It is intentionally not a `write-spec` artifact.

## 1. Product objective

Build an internal UI ecosystem that lets a two-person team assemble production applications from selected, battle-tested open-source providers while LEMN owns only:

1. a stable, provider-neutral public API;
2. a minimal branding and theming layer;
3. a curated component and block catalog;
4. deterministic provider ingestion and update governance;
5. project-level branding authoring, publication, runtime delivery, and agent tooling;
6. evidence that the model works in real consumers.

The ecosystem must stop treating generated local rewrites as the default source of component behavior. Functional behavior remains upstream-owned wherever possible. LEMN adapters may normalize APIs and apply semantic tokens, but must not reimplement interaction logic already provided by an accepted provider.

## 2. Non-negotiable principles

### 2.1 Provider-first, not provider-dependent

- Select individual capabilities from providers; never import every component from a provider automatically.
- Maintain one provider of record for each public capability. There must not be two public `Button` implementations merely because two providers offer buttons.
- Multiple providers are allowed within a category when they solve materially different capabilities. Recharts and Apache ECharts may coexist for charts, but each chart capability has one canonical implementation.
- Consumers import only LEMN packages. Direct provider imports in product code are forbidden unless the provider is explicitly classified as a frontend-platform dependency outside the UI package.
- Provider implementation details never appear in the project branding JSON.

### 2.2 Upstream behavior remains upstream-owned

- Do not rewrite provider interaction, accessibility, keyboard handling, chart engine behavior, or lifecycle logic to make it look local.
- Branding adapters may supply CSS variables, provider-native theme objects, class names, slots, and documented configuration.
- Any unavoidable functional patch is explicit, minimal, tested, attributed, and tracked against an immutable upstream revision.
- Upstream updates are proposed through reviewable pull requests; they never flow directly into production.

### 2.3 Minimal branding, complete identity

Branding controls visual identity: fonts, semantic colors, surfaces, borders, radii, shadows, spacing density, motion, icons/assets, focus treatment, and visualization palettes. It must not change a component's functional contract.

### 2.4 Server-first branding

- No browser may render an unbranded first frame.
- The selected project, environment, profile, mode, and published revision are resolved before HTML is emitted.
- Critical compiled CSS is present in `<head>` before branded markup.
- Hydration receives and verifies the same compiled hash used by the server.
- Runtime failure uses a compatible embedded branded fallback, never raw provider defaults or an unbranded page.

### 2.5 Project branding is data; components consume compiled output

- A versioned JSON contract is the human/tool authoring format.
- Components never parse raw branding JSON.
- A deterministic compiler validates the source contract, derives safe semantic values, emits a resolved contract, CSS, provider adapters, asset references, diagnostics, and cryptographic hashes.
- Semantic token names are reusable and scoped. Project identity belongs to the scope and compiled artifact, not to project-specific CSS variable names.

### 2.6 UI is not the frontend platform

Data fetching, routing, authentication, global application state, and internationalization are frontend-platform concerns. They may be centralized later in separate packages, but must not inflate `@lemn-ltd/ui` or the branding contract.

### 2.7 Exact, reproducible supply chain

- Never use `latest`.
- Published consumers use exact package versions, not ranges, `workspace:*`, `link:`, or relative cross-repository imports.
- Source-copy providers use a full immutable upstream commit SHA, deterministic transforms, explicit patches, provenance, and license records.
- Runtime providers use exact versions in the lockfile and registry.
- Every selected capability records origin, version/commit, license, ingestion mode, local adapter, upstream source path, transforms, patches, conformance tests, and last sync.

### 2.8 Zero trust and least privilege

- Network location, Cloudflare account membership, Service Bindings, and a valid edge identity do not by themselves authorize a business operation.
- Authentication and resource authorization are evaluated at every boundary.
- Agents receive typed, scoped branding tools, never generic SQL, filesystem, HTTP, secret, or provider access.
- Mutations use plan/apply, idempotency, expected revision, audit, and environment restrictions.
- Agents cannot approve a production publication or production rollback.
- Production publication and rollback require a different authorized human approver from the requester.

### 2.9 Zero legacy at cutover

- No permanent compatibility aliases.
- No parallel legacy token/runtime path.
- No retired pre-LEMN domain, package namespace, product name, or redundant documentation label.
- No old Brand Lab KV runtime after the new control plane and Studio are proven.
- No stale docs, examples, package commands, catalog counts, or release metadata.
- Temporary migration code must be removed before the goal is complete.

## 3. Current-state findings that the implementation must resolve

1. `@lemn-ltd/ui@0.2.5` exposes 130 components, but the implementation is a mixture of Radix, Recharts, XYFlow, cmdk, Sonner, and locally written behavior.
2. The component catalog lacks provider provenance, exact upstream identity, license, patch, transform, and resync information.
3. The package uses global `--bg`, `--surface`, `--accent`, and related tokens, while Brand Lab uses a separate `--brand-*` compiler/runtime. These are incompatible parallel authorities.
4. Brand Lab proves useful concepts but is isolated from the published package, Showcase, Docs, release, and CI E2E. Its KV namespace is local-only and cannot be the authoritative production model.
5. Brand Lab models light and dark as separate projects, compiles only a root scope, and lacks Brands, Profiles, revisions, assignments, authorization, publication, rollback, and audit.
6. Showcase is currently public and read-only. Administrative mutation must use a separate protected deployment boundary.
7. The package and Brand Lab currently reach Radix Checkbox through two version paths. The final registry must have one owner/version for that capability.
8. Existing visualization and provider documentation contains stale statements and must be regenerated from the final registry.
9. Existing release mechanics—Changesets, exact tarball verification, clean-consumer install, Cloudflare rollout, smoke, and rollback—are valuable and must remain enforced.

## 4. Ecosystem boundaries

### 4.1 `lemn-ltd/ui`

Owns reusable, publishable, product-neutral assets:

- `@lemn-ltd/brand-contract`
  - source and resolved JSON schemas;
  - TypeScript types and Zod validation;
  - deterministic compiler;
  - contrast and accessibility diagnostics;
  - CSS and provider-adapter compilation;
  - cryptographic source and compiled hashes;
  - compatibility/version rules.
- `@lemn-ltd/ui`
  - provider-neutral public components;
  - selected upstream capability adapters;
  - semantic tokens and scoped brand application;
  - provider-backed charts;
  - curated blocks;
  - catalog and provenance metadata.
- `@lemn-ltd/brand-studio`
  - reusable branding wizard and preview UI;
  - JSON contract editor and diagnostics;
  - no project persistence, publication authority, credentials, or environment ownership.
- public Showcase and Docs;
- protected Showcase Admin/Sandbox;
- provider synchronization, conformance, licenses, release, and migration documentation.

### 4.2 AgentOps branding simulator

Temporarily owns the AgentOps/platform responsibilities needed to prove the full model before migration into AgentOps:

- Projects and Environments;
- Brands and Profiles;
- Brand-level Drafts and immutable BrandRevisions;
- environment/profile Assignments;
- RuntimeBindings and WorkloadGrants;
- preview sessions;
- validation, plan/apply, publication, and rollback;
- production approval separation;
- audit trail and revocation;
- authoritative persistence and publication outbox;
- private runtime resolution for SSR consumers;
- hosting `@lemn-ltd/brand-studio` through adapters.

The simulator must not fork UI contracts. It consumes exact published `@lemn-ltd/brand-contract`, `@lemn-ltd/brand-studio`, and `@lemn-ltd/ui` versions.

### 4.3 Branding MCP project

Owns only the MCP transport and typed tool/resource surface planned for AgentOps:

- delegates all policy and state transitions to the simulator services/API;
- exposes no generic storage or network tools;
- enforces scopes, audience, project/environment grants, expected revisions, plan/apply, idempotency, and audit correlation;
- is designed to migrate into AgentOps without changing tool contracts.

### 4.4 Lunaria Care

Is a realistic appointment-scheduling consumer used to prove the ecosystem:

- SSR application with public booking and staff operations;
- own Postgres business database for patients, clinicians, availability, appointments, waitlist, and operational metrics;
- no access to branding Postgres, R2, Queue, publication, or admin credentials;
- obtains branding through a private runtime binding with a project/environment-scoped workload grant;
- consumes exact published LEMN package versions;
- ships an embedded compatible branded fallback;
- never imports a UI provider directly.

## 5. Canonical domain model

```text
Organization
  ├── Project
  │     ├── Environment
  │     ├── BrandBinding ──────┐
  │     ├── RuntimeBinding     │
  │     └── WorkloadGrant      │
  └── Brand                    │
        ├── Draft              │
        ├── BrandRevision      │
        │     ├── Profile      │
        │     └── CompiledArtifact
        └── Assignment <───────┘
              (Project + Environment + Slot + BrandRevision + Profile)
```

Rules:

- A Brand is a reusable identity family owned by an Organization.
- A BrandRevision is the atomic versioned document and contains every Profile for that Brand. Profiles are intentional brand expressions such as Core, Pediatrics, Executive, Campaign, or White-label Partner.
- A Profile contains all supported modes, initially `light` and `dark`, and can add named modes through a versioned extension mechanism.
- A Project binds to a Brand and may permit a subset of its Profiles.
- An Assignment selects one published BrandRevision plus a default and allowed Profile set for a Project, Environment, and named slot.
- A BrandRevision is immutable. Editing any Profile creates a Brand-level Draft; publishing creates a new complete BrandRevision and later atomically moves an Assignment after artifact verification.
- The active assignment is never represented by a mutable JSON blob.
- Rollback creates a new publication event/assignment sequence pointing to a previously valid immutable BrandRevision; history is never rewritten.

The full-Brand revision is intentional: one JSON contract, compiler invocation, compatibility decision, and cryptographic artifact captures all switchable Profiles. A profile-only edit still creates a new complete BrandRevision, avoiding mixed revisions when a server switches Profiles at runtime.

## 6. Brand contract

### 6.1 Identity and evolution

Canonical schema URI:

```json
{
  "$schema": "https://schemas.ui.le-mn.com/brand-project/v2.json",
  "schemaVersion": 2,
  "brandId": "brand_lunaria",
  "profiles": {
    "lunaria_core": { "modes": ["light", "dark"] },
    "lunaria_pediatrics": { "modes": ["light", "dark"] }
  }
}
```

Evolution rules:

- additive fields may be introduced under the same major schema version when defaults preserve behavior;
- incompatible meaning or removal requires a new schema major and explicit migration;
- unknown top-level fields are rejected except under namespaced `extensions`;
- `extensions` keys use reverse-domain or organization namespaces and cannot override standard semantics;
- source contracts remain author-friendly; resolved contracts are explicit and inheritance-free;
- every compiler result records `schemaVersion`, `compilerVersion`, `sourceHash`, `compiledHash`, diagnostics, and compatibility range.

### 6.2 Contract sections

The source JSON supports:

1. `metadata`
   - display name, description, tags, ownership, locale-neutral attribution, and optional external reference IDs.
2. `assets`
   - primary/compact/monochrome logos, favicons, app icons, approved illustrations, light/dark variants, intrinsic dimensions, content hashes, and accessible labels.
   - only managed assets or allowlisted immutable origins; no arbitrary font/logo URLs.
3. `profiles`
   - profile metadata, supported modes, base profile inheritance limited to one acyclic parent, defaults, and allowed runtime selection policy.
4. `colors`
   - canvas, background, surfaces, elevated/overlay surfaces, text, muted text, inverse text, accent, accent contrast, borders, focus, selection, disabled, semantic states, and data-visualization palettes.
5. `typography`
   - font families, safe fallbacks, managed font assets, weights, sizes, line heights, tracking, heading/body/label/code roles, and font-display policy.
6. `shape`
   - border widths/styles, radii scale, control radius, card radius, pill policy, and outline treatment.
7. `elevation`
   - shadow scale, overlays, focus rings, and light/dark adaptation.
8. `spacingAndDensity`
   - spacing scale multiplier, compact/comfortable density, control heights, content rhythm, and layout gutters.
9. `motion`
   - duration scale, easing roles, reduced-motion behavior, and whether decorative motion is enabled.
10. `visualization`
    - categorical, sequential, diverging, positive/negative/neutral series; axes, grids, labels, tooltip, crosshair, selection, and opacity defaults.
11. `iconography`
    - icon family, stroke weight, filled/outline preference, size scale, and approved custom icon set references.
12. `accessibility`
    - target contrast policy, focus visibility, minimum target size, forced-colors policy, high-contrast behavior, and compiler severity thresholds.
13. `componentAppearance`
    - narrowly constrained appearance roles for documented slots; no behavior flags and no raw arbitrary CSS.
14. `extensions`
    - namespaced future settings with schema references.

### 6.3 Scoped token model

The compiler emits one stable semantic token vocabulary, for example:

```css
[data-lemn-brand-scope="<compiled-hash>"] {
  --lemn-color-canvas: ...;
  --lemn-color-surface: ...;
  --lemn-color-text: ...;
  --lemn-color-accent: ...;
  --lemn-radius-control: ...;
  --lemn-shadow-overlay: ...;
}
```

The vocabulary scales because values are scoped to a compiled artifact. Project IDs are not encoded into variable names. Multiple brand/profile scopes may coexist in one document, and switching a scope changes the complete atomic artifact rather than mutating a handful of root variables.

### 6.4 Contrast and impossible combinations

- Authors select intent and preferred colors; the compiler owns safe derived states.
- The default publication policy is WCAG 2.2 AA for applicable text, controls, focus indicators, and non-text UI semantics; a stricter project policy may raise but not lower required checks without a separately approved policy version.
- Every text/surface, accent/on-accent, semantic/on-semantic, border/surface, focus/surface, and chart-label combination is checked for its declared use.
- The wizard provides live diagnostics and recommended corrections.
- Automatic correction may adjust derived on-colors, hover/pressed tones, borders, and chart label tones within declared limits; it never silently changes the primary authored brand color.
- A profile cannot publish when required combinations remain below policy.
- Warnings are allowed for decorative/non-text combinations only when the policy classifies them as non-blocking.
- Preview includes common UI, dense tables, forms, overlays, charts, disabled states, focus states, and color-vision simulations.

## 7. Provider registry and catalog

### 7.1 Capability record

Every public component/block has a machine-readable record with:

- stable LEMN capability ID and public export;
- category and maturity (`experimental`, `beta`, `stable`, `deprecated`);
- provider of record;
- ingestion mode (`runtime_dependency`, `source_snapshot`, `native_lemn`);
- exact package version or full upstream commit SHA;
- upstream repository and exact source paths;
- license SPDX ID, copyright/NOTICE requirements, and captured license files;
- deterministic transforms and their versions;
- explicit patch files and reasons;
- public API adapter and provider-theme adapter;
- supported brand token roles;
- conformance, accessibility, interaction, visual, SSR, and bundle tests;
- upstream update status and last successful sync;
- replacement/deprecation metadata.

The version-controlled registry manifest in the UI repository is the only authority for provider mappings and public capability status. Public Showcase and protected Admin consume read models derived from the exact released manifest. Admin may create a proposal bundle and request an AgentOps/GitHub-sync plan; only a least-privilege GitHub App or AgentOps GitHub-sync apply operation may create the branch/PR. Admin never receives a personal token and never writes the active manifest directly.

Each capability uses a stable semantic ID independent of provider and export spelling. A registry lint requires exactly one active implementation and one public export for each ID. Changing provider of record requires an ADR, API/behavior/visual delta, migration notes, and an appropriate semantic-version change.

`native_lemn` is allowed only for uniquely LEMN-specific composition or behavior with no suitable accepted upstream capability. It requires an explicit rationale and a higher maintenance warning.

### 7.2 Initial provider families

- Accessible primitives and interactions: Radix UI and React Aria, selected per capability.
- Component recipes/source snapshots: shadcn/ui, selected item by item.
- Common composable charts: Recharts.
- Advanced, large, statistical, and highly interactive charts: Apache ECharts.
- Dashboard-oriented source patterns and blocks: Tremor/Tremor Raw, selected item by item.
- Headless data tables: TanStack Table when a provider capability is adopted.
- Command palette: cmdk.
- Toasts: Sonner.
- Graph/workflow canvas: XYFlow.
- Code/JSON editing: CodeMirror.
- Syntax rendering: Shiki.
- Markdown: react-markdown/remark ecosystem.

This list is an allowlist of candidates, not an instruction to ingest every component.

Recharts and ECharts adapters share a deterministic visualization contract: `seriesKey -> semantic series slot -> color`, plus axes, grid, label, tooltip, legend, hover, selected, muted, disabled, positive/negative, and light/dark roles. The same dataset must preserve series identity across engines. Provider-specific options cannot remove mandatory brand and accessibility behavior.

Chart SSR must produce a branded, size-stable shell and an accessible data summary/table before client mounting. SVG may be rendered server-side where the chosen engine and performance budget support it; otherwise the branded shell is replaced during hydration without layout shift. Canvas/client-only defaults may never expose an empty unbranded first frame.

### 7.3 License policy

Initial automatic allowlist:

- MIT
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- ISC

Manual legal review is required for MPL, LGPL, dual licensing, trademark-heavy assets, unusual font licenses, or license exceptions. GPL, AGPL, SSPL, BUSL, Commons Clause, source-available-only, and proprietary code are denied unless LEMN explicitly approves a separate distribution strategy.

Each release must ship required license and NOTICE material in both repository and package artifacts. Provider code, transitive source-snapshot closure, runtime dependency graph, visual assets, fonts, examples, and copied documentation are reviewed independently; an OSS code license does not automatically license trademarks or third-party assets. The release emits an SBOM, records SPDX expressions and LICENSE/NOTICE hashes per artifact/dependency, preserves required source headers, and fails on an unknown or denied obligation.

### 7.4 Update workflow

1. Detect a new upstream release/commit.
2. Create a proposal without mutating the active registry.
3. Fetch only selected source paths or update only selected exact runtime packages.
4. Resolve the complete transitive source closure: registry item, helpers, styles, assets, sibling registry dependencies, and npm dependencies. Reject imports outside the declared closure.
5. Verify per-file checksums, headers, licenses, notices, provenance, SBOM, and upstream API.
6. Run deterministic transforms twice and require byte-identical output. Apply explicit patches without fuzz.
7. Build a semantic/API delta and visual/interaction delta.
8. Run conformance, accessibility, SSR, type, bundle, and consumer tests.
9. Preview in Showcase Admin.
10. Open a version-controlled PR.
11. Merge under branch/release policy and publish an exact LEMN package version.

Provider updates never edit production directly from Showcase Admin.

## 8. Public API and blocks

### 8.1 Components

- Public APIs describe LEMN capabilities, not provider internals.
- Adapters should be thin enough that upstream semantics remain visible and supportable.
- When a provider offers important documented configuration, expose it when it is provider-neutral or map it explicitly through a stable LEMN option.
- Do not promise a lowest-common-denominator API that hides capabilities required by real consumers.
- Provider types are forbidden from the stable entrypoint. An unavoidable escape hatch lives under an explicit unstable provider entrypoint such as `@lemn-ltd/ui/provider/echarts`, uses exact dependencies, and carries no portability guarantee.

For every provider package, the registry declares whether it is bundled, an exact runtime dependency, or an exact peer dependency. Published manifests may not contain `^`, `~`, `*`, tags, or open-ended provider peer ranges. A clean-consumer gate inspects the actual installed tree and fails when it differs from the released provider manifest.

### 8.2 Blocks

Blocks are curated, purposeful compositions of stable components, similar in product role to Tremor Blocks:

- dashboards and KPI layouts;
- chart/report panels;
- filterable data views;
- settings and resource managers;
- appointment booking steps;
- staff schedule and queue views;
- approval and agent-operation surfaces.

Blocks may manage local presentation state and accessibility coordination. They receive data, state, and callbacks from consumers; they do not own application fetching, routing, authentication, global state, or business persistence.

Blocks are exported from an explicit tree-shakeable surface and have their own provenance, responsive, accessibility, empty/loading/error, and interaction contracts.

## 9. Brand Studio and Showcase experiences

### 9.1 Brand Studio wizard

`@lemn-ltd/brand-studio` provides simple defaults first and progressive advanced controls:

1. Project/brand identity and starting preset.
2. Logos, icons, and managed assets.
3. Light/dark base surfaces and semantic palette.
4. Typography and managed fonts.
5. Shape, borders, radii, and elevation.
6. Spacing and density.
7. Motion and reduced-motion policy.
8. Charts/data visualization palette.
9. Iconography.
10. Accessibility diagnostics and contrast repair.
11. Profiles, inheritance, modes, and assignment intent.
12. Review: source JSON, resolved JSON, compiled output, hashes, diagnostics, and change summary.

Requirements:

- defaults produce a complete valid contract;
- simple controls do not prevent advanced editing;
- advanced JSON editing round-trips through validation without losing supported fields;
- catalogs are searchable and show license/source information where applicable;
- every control updates a real component/chart/block preview;
- preview can display two profiles or modes side by side;
- host adapters own create/update/plan/apply/publish actions;
- Studio itself performs no fetch, persistence, authentication, or authorization.

### 9.2 Public Showcase

- Remains public and read-only.
- Shows the stable/preview catalog, provider provenance, documentation, interactive examples, blocks, responsive states, and source/API guidance.
- Supports selecting published demonstration brand profiles without granting mutation authority.
- Renders code examples in a consistently dark code surface while the page can remain light.

### 9.3 Protected Showcase Admin/Sandbox

- Runs as a separate application/deployment boundary behind Cloudflare Access.
- Reuses Showcase chrome and `@lemn-ltd/brand-studio`.
- Provides:
  - provider/capability registry inventory;
  - side-by-side upstream and LEMN conformance previews;
  - mapping/provenance/license/patch visibility;
  - update proposals and version-controlled patch/PR generation;
  - stable/beta/experimental catalog administration;
  - block gallery and variant testing;
  - temporary non-authoritative Studio sessions for experimentation, or persistent sandbox Projects only through Simulator host adapters;
  - real source/resolved/compiled brand contract inspection.
- It cannot directly modify a production provider mapping or publish a UI release.
- Ephemeral Admin sessions have no Project identity, Assignment, runtime publication, or independent persistence authority.

### 9.4 Brand Lab disposition

The existing `apps/brand-lab` is a disposable proof source. Reusable contract/compiler/provider tests and presets are migrated into their final packages and Studio/Admin surfaces. Its parallel CSS, direct provider examples, local KV store, and standalone runtime are deleted before completion.

## 10. Simulator architecture

### 10.1 Runtime topology

```text
Cloudflare Access
  -> Simulator Admin UI/API Worker
       -> thin Hono routes
       -> application services
       -> repositories/ports
       -> Hyperdrive -> Neon Postgres
       -> transactional outbox
       -> Cloudflare Queue + DLQ
       -> private R2 immutable artifacts

Consumer Worker
  -> private Service Binding
       -> Brand Runtime Worker
            -> validate workload grant and assignment scope
            -> active assignment from Postgres/Hyperdrive
            -> immutable compiled artifact from R2
```

### 10.2 Storage decisions

- Neon Postgres is authoritative for organizations, projects, environments, brands, profiles, drafts, revisions, assignments, grants, approvals, idempotency, and audit references.
- Schema changes use migrations; no runtime DDL.
- R2 stores immutable compiled artifacts, managed brand assets, evidence, and snapshots by cryptographic hash.
- Publication uses two explicit transactions. Transaction A creates the immutable BrandRevision, publication request, pending assignment intent, and outbox record without changing the active assignment. A Queue worker materializes and verifies the R2 artifact. Transaction B uses compare-and-swap on the expected active sequence to move the active Assignment and mark the publication Ready/Assigned.
- R2 is suitable for immutable artifact reads and has strong consistency; KV is not part of the correctness-critical SSR path.
- KV may be introduced later only as a discardable cache/compatibility projection with revision/hash validation and no authority.
- Durable Objects are not required initially. Add one only if a measured coordination or single-writer requirement cannot be met by Postgres transactions, idempotency, and outbox processing.

Crashes before artifact creation, after artifact creation, before Transaction B, and after Transaction B are all retryable/reconcilable without duplicate Revisions or ambiguous active assignments. Orphan immutable artifacts are safe and garbage-collected only after a retention window proves no Revision references them.

### 10.3 Publication states

```text
Draft
  -> Validated
  -> Planned
  -> ApprovalPending (production only)
  -> Accepted
  -> Materializing
  -> Ready
  -> Assigned

Failure branches:
  Rejected | Expired | MaterializationFailed | ReconciliationPending
```

Rules:

- plan binds source hash, base revision, target project/environment/profile/slot, actor, expiry, and intended effects;
- apply requires the exact plan, expected revision, idempotency key, and current authorization;
- production requires distinct requester and approver and fresh authorization;
- a changed draft/base revision invalidates the plan;
- active assignment moves only in Transaction B after artifact validation succeeds and the expected sequence still matches;
- retries are idempotent and do not create multiple revisions or publications;
- rollback follows the same governed flow and produces a new assignment sequence;
- every mutation emits an audit event with correlation and causation.

### 10.4 Runtime contract

Input:

- workload identity/grant;
- organization/project/environment/slot;
- optional allowed profile selection;
- mode and conditional `If-None-Match`/known compiled hash.

Output:

- assignment sequence and immutable revision IDs;
- resolved profile/mode;
- compiled hash and source hash;
- critical CSS;
- typed provider theme adapters;
- managed asset manifest;
- cache/compatibility metadata;
- no drafts, administrative metadata, RBAC graph, secrets, or unrelated project data.

### 10.5 Workload authentication

- Each deployed consumer/environment receives a unique opaque workload client ID and rotatable client secret through Worker Secrets. Only a salted credential hash and grant metadata live in Postgres.
- Over the private Service Binding, the consumer exchanges that credential for a signed five-minute runtime capability token.
- Token claims bind `iss`, `aud`, `sub`, `organizationId`, `projectId`, `environmentId`, `slot`, allowed profiles, `grantEpoch`, `jti`, `iat`, and `exp`.
- Runtime requests present the signed token; the runtime validates signature/key rotation, audience, expiry, grant epoch/status, assignment scope, and replay policy.
- Revocation increments the grant epoch or disables the credential, invalidating subsequent exchange/request attempts. Rotation supports an explicitly bounded overlap window.
- The Service Binding remains the private transport, while the signed capability is the logical workload identity. Neither is accepted alone.

## 11. Zero-trust model

### 11.1 Human surfaces

- Public Docs/Showcase are read-only.
- Simulator Admin and Showcase Admin use separate Cloudflare Access applications, default deny, approved identity provider, and MFA policy.
- Deployed origin validates Access issuer, audience, signature, expiry, and identity before applying application RBAC/ABAC.
- Local development may use an explicit `DEV_ACTOR`, but only when a local-development environment flag and loopback/dev host are both true. Production fails closed if dev identity configuration is present.

### 11.2 Roles

- `BrandViewer`
- `BrandEditor`
- `BrandPublisherNonProd`
- `BrandProductionRequester`
- `BrandProductionApprover`
- `UIRegistryMaintainer`
- `UIReleaseApprover`
- `Auditor`
- `SecurityAdministrator`

Authorization intersects organization, project, environment, brand/profile, slot, action, actor type, grant status, base revision, and approval policy. Cross-tenant requests do not disclose whether a resource exists.

### 11.3 Workloads and SSR

- Same-account consumers use a private Service Binding plus an application-level workload grant scoped to project/environment/slot.
- A binding is a route capability, not sufficient resource authorization.
- External-account consumers use a dedicated, revocable workload identity such as Access Service Auth/mTLS plus a short-lived scoped runtime grant.
- Credentials are unique per application/environment and never reach the browser.
- Lunaria cannot enumerate projects or select an unauthorized profile/revision.

### 11.4 Preview sessions

- Opaque, one-use, short-lived code.
- Server exchange to an HttpOnly, Secure, SameSite cookie.
- Immediate redirect to a clean URL.
- Bound to actor, organization, project, revision, audience, and allowed origin.
- Replay, expiry, revocation, wrong origin, and wrong audience are rejected and audited.
- CSP, `frame-ancestors`, iframe sandboxing, and exact-origin `postMessage` validation protect embedded previews.

### 11.5 Audit and secret custody

- No secret values in repository, browser, URLs, logs, audit payloads, screenshots, or evidence.
- AgentOps/secret manager remains the credential authority; only names/metadata may be recorded.
- Audit records actor, actor type, organization, project, environment, resource, action, decision, reason code, plan/hash, expected/actual revision, idempotency key, correlation, and result.
- Revocation of human, MCP, or workload credentials is independently testable.

## 12. Branding MCP contract

The simulator MCP uses MCP Streamable HTTP with protocol version `2025-11-25`. Version 1 authenticates with a managed, signed MCP access token issued by the simulator/AgentOps-compatible token authority. The endpoint validates issuer JWKS/key rotation, `aud=branding-mcp`, expiry, `jti`, actor type, organization/project/environment grants, scopes, and revocation state. Access/Service Auth may protect the edge, but the application token remains mandatory. Tokens are short-lived (maximum 15 minutes); the long-lived bootstrap credential, when required by a client, is stored only in the approved secret manager and exchanged server-side. The contract may later add OAuth authorization-code/PKCE issuance without changing resource/tool semantics; OAuth is not an implementation alternative for this goal.

### 12.1 Tools

- `list_projects`
- `get_project_brand`
- `list_project_brand_revisions`
- `validate_project_brand`
- `plan_project_brand_update`
- `apply_project_brand_update`
- `create_project_brand_preview`
- `plan_project_brand_publish`
- `apply_project_brand_publish`
- `plan_project_brand_rollback`
- `apply_project_brand_rollback`

Every mutating tool is typed, resource-specific, scope-aware, expected-revision-aware, idempotent, and audited. Apply tools accept an immutable unexpired plan; they do not accept arbitrary diffs or hidden provider operations.

### 12.2 Resources

- current project/environment/slot brand assignment;
- source and resolved published contract;
- immutable revision history metadata;
- brand schema and compiler compatibility;
- provider/component/block catalog read model;
- preview metadata without reusable credentials.

### 12.3 Scopes

- `branding:read`
- `branding:draft:write`
- `branding:validate`
- `branding:preview:create`
- `branding:publish:nonprod`
- `branding:publish:production:request`
- `branding:rollback:request`
- `ui_catalog:read`
- `audit:read`

Approval scopes remain human-only and are not issued to agents.

## 13. Lunaria Care demonstration product

### 13.1 Product theme

Lunaria Care is a family and wellness clinic. It demonstrates calm consumer booking plus information-dense staff operations.

Profiles:

- `Lunaria Core`: general clinic identity.
- `Lunaria Pediatrics`: warmer family-oriented expression.
- `Lunaria Executive`: restrained premium expression.

Each profile supports light and dark modes and shares the same application deployment.

### 13.2 Public experience

- clinic/service discovery;
- clinician selection;
- location and appointment type;
- timezone-aware date/time availability;
- patient/contact details;
- confirmation and reference;
- reschedule and cancel with secure reference flow;
- waitlist when slots are full;
- responsive, accessible loading/empty/error/expired/conflict/success states.

Public reschedule/cancel links use opaque, single-purpose, expiring references and never expose sequential patient/appointment identifiers. All demonstration patient data is synthetic.

### 13.3 Staff experience

- daily/weekly schedule;
- appointment queue and status transitions;
- filters, search, tables, cards, badges, dialogs, forms, toasts, and command actions;
- patient/appointment detail without pretending to be a full medical record;
- capacity and utilization KPIs;
- common Recharts visualizations and at least one advanced ECharts visualization using the same compiled palette;
- waitlist and cancellation analytics;
- profile switch for authorized demonstration contexts.

`/staff` is protected by its own Cloudflare Access application and origin JWT validation, followed by application roles such as `Scheduler`, `ClinicianViewer`, and `OperationsManager`. The public booking surface cannot call staff queries or enumerate patient/appointment data.

### 13.4 Business correctness

- Postgres is authoritative.
- Slot booking is transactional and prevents double booking under concurrency.
- Idempotent booking requests return the existing result.
- Reschedule atomically releases and acquires capacity.
- Cancel is safe to retry.
- Waitlist promotion is ordered and conflict-safe.
- No synthetic confirmation without a durable appointment row.

### 13.5 Deterministic SSR profile and fallback contract

- Profile resolution precedence is: authorized server route/host mapping, then a server-readable signed profile cookie constrained by the Assignment's allowed Profiles, then the Assignment default. An invalid or unauthorized value falls back to the Assignment default and is audited without exposing another Profile.
- Mode resolution is a server-readable signed preference cookie (`light`, `dark`, or allowed named mode), then the Profile default. Client-only system preference may be applied only after a branded initial mode; it cannot create an unbranded frame.
- HTML cache keys include project, environment, slot, BrandRevision, Profile, and mode. Responses emit the required `Vary`/private-cache policy so one identity's selection is never served to another incorrectly.
- The serialized bootstrap is JSON-escaped/XSS-safe and contains only public resolved branding metadata and the compiled hash.
- Lunaria's release build fetches the exact active BrandRevision artifact through an authorized build workload, verifies schema/compiler compatibility and cryptographic hash, and embeds all allowed Profiles/modes as the fallback bundle.
- The fallback records its BrandRevision, compiled hashes, generated time, and compatibility range. Release fails if it is corrupt or older than the configured maximum age.
- Runtime assignment changes take effect immediately for healthy runtime reads without an application redeploy. The embedded artifact remains the last-known-good fallback until the next Lunaria release refreshes it; operations surface this drift, but runtime outage still renders the branded compatible fallback.

## 14. Patterns to add or strengthen

The managed pattern catalog/profile/audit must be updated and synchronized for at least these reusable rules:

1. Provider capability selection and one provider-of-record.
2. Exact version/full-SHA pinning; `latest` forbidden.
3. Source snapshot provenance, deterministic transforms, explicit patches, and resync PRs.
4. License/NOTICE capture and deny/allow policy.
5. Consumers import LEMN capabilities, not UI providers.
6. Branding source/resolved/compiled contract separation.
7. Components consume scoped compiled tokens/adapters, never raw JSON.
8. SSR critical branding and branded fallback; no unbranded first paint.
9. Project/Brand/BrandRevision/Profile/Assignment lifecycle.
10. Private runtime binding plus workload grant authorization.
11. Branding MCP typed plan/apply tools and human-only production approval.
12. Blocks remain UI composition; frontend-platform concerns remain separate.
13. Showcase public read-only; registry/admin mutation protected and PR-governed.
14. Exact published-package consumer verification without cross-repo links.

Material existing authorities include `PAT-ARCH-CLOUDFLARE-FIRST-001`, `PAT-ARCH-DECISION-PATH-001`, `PAT-ARCH-BINDINGS-ADAPTERS-001`, `PAT-ARCH-REPO-BOUNDARIES-001`, `PAT-ARCH-RELEASE-001`, `PAT-ARCH-SHARED-KERNEL-001`, `PAT-CODE-FRAMEWORK-API-VALIDITY-001`, `PAT-CODE-DEPENDENCIES-001`, `PAT-DATA-POSTGRES-001`, `PAT-DATA-MIGRATIONS-001`, `PAT-DATA-KV-001`, `PAT-DATA-R2-001`, `PAT-CLOUDFLARE-SERVICE-BINDINGS-001`, `PAT-API-CONTRACTS-001`, `PAT-API-VERSIONING-001`, `PAT-API-MCP-001`, `PAT-SEC-AUTHORIZATION-001`, `PAT-SEC-TENANT-ISOLATION-001`, `PAT-SEC-AUDIT-EVENTS-001`, `PAT-ASYNC-IDEMPOTENCY-001`, `PAT-ASYNC-OUTBOX-001`, `PAT-ASYNC-QUEUES-001`, `PAT-TEST-INTEGRITY-001`, `PAT-TEST-EVIDENCE-001`, `PAT-UI-LEMN-001`, `PAT-UI-STATES-001`, `PAT-UI-SYSTEM-001`, and `PAT-OPS-LEAST-PRIVILEGE-001`.

## 15. Implementation plan

### Phase 0: Preserve baseline and establish repositories

1. Record the clean UI baseline and current successful gates.
2. Commit this plan on `main` and push it.
3. Create the three new workspace repositories with their own `AGENTS.md`, managed pattern profile, package identity, exact toolchain, CI, and Cloudflare-first structure.
4. Initialize/link them with AgentOps when available; do not copy secrets.
5. Verify GitHub organization/repository authority, package registry access, Cloudflare Lemn DEV account/zone, Neon authority, and safe secret metadata before mutations.
6. Reserve deterministic resource and domain names.

### Phase 1: Brand contract and compiler in UI

1. Create publishable `@lemn-ltd/brand-contract`.
2. Implement versioned source/resolved schemas and canonical fixtures.
3. Implement deterministic compilation, cryptographic hashing, diagnostics, contrast rules, scoped CSS, asset manifest, Recharts adapter, ECharts adapter, and SSR serialization.
4. Support multiple profiles/modes in one document and atomic scope switching.
5. Add tamper, determinism, contrast, inheritance-cycle, unknown-field, compatibility, and server/client hash tests.
6. Publish an exact package version for downstream integration.

### Phase 2: Provider registry, components, charts, and blocks

1. Introduce the machine-readable capability/provider registry.
2. Produce an exhaustive checked-in migration matrix for every one of the 130 current exports. Each row records `keep-provider-backed`, `replace`, `native-with-rationale`, or `remove`, the final capability ID/export, provider/version/SHA, consumer migration, public-version effect, and conformance proof. No export may remain unclassified at cutover.
3. Establish one provider/version per capability; resolve the duplicate Radix Checkbox path. The required source-snapshot proof is the selected shadcn/Radix Checkbox closure, and the required runtime-provider proof upgrades one chosen Recharts visualization against its exact upstream version and configuration matrix.
4. Implement source-snapshot and runtime-dependency ingestion with provenance/license/patch records.
5. Migrate selected provider behavior without local functional rewrites.
6. Apply compiled brand tokens/adapters to primitives, forms, overlays, navigation, data display, agent surfaces, Recharts, ECharts, and XYFlow where applicable.
7. Add initial curated blocks and their states.
8. Add conformance, keyboard, accessibility, SSR, responsive, visual, performance, and package-consumer tests.
9. Ship complete third-party license/NOTICE content.

### Phase 3: Brand Studio

1. Create publishable `@lemn-ltd/brand-studio` using the final UI and brand-contract packages.
2. Implement the progressive wizard, catalogs, advanced JSON mode, diagnostics, comparison preview, source/resolved/compiled inspectors, and host adapter contract.
3. Migrate valuable Brand Lab color/shape research into newly named original presets that are not marketed as, named after, or confusingly similar to third-party trade dress. Trademarks, proprietary fonts, icons, layouts, and assets require a separate explicit rights review before distribution.
4. Prove Studio has no persistence/auth/data-fetch ownership.
5. Publish an exact version.

### Phase 4: Showcase, Admin, Docs, and Brand Lab cutover

1. Integrate brand profile selection and compiled theming into public Showcase.
2. Add provider provenance, stable capability catalog, blocks, variants, and interactive real-component examples.
3. Create protected Showcase Admin as a distinct deployment boundary.
4. Implement registry proposals, mapping/provenance review, provider update previews, block gallery, ephemeral non-authoritative Studio sessions, and persistent sandbox Projects only through Simulator adapters.
5. Integrate Brand Studio through host adapters.
6. Update Docs for architecture, install/use, providers, contracts, SSR, profiles, blocks, licensing, migrations, and exact pinned examples.
7. Remove standalone Brand Lab runtime/KV and all parallel legacy tokens after migrated tests pass.
8. Update patterns/profile/audit and synchronize managed files with AgentOps.

### Phase 5: AgentOps branding simulator

1. Implement modular vertical slices for Projects, Environments, Brands, Brand-level Drafts/Revisions containing Profiles, Assignments, Publication, RuntimeBindings/Grants, Preview, Approvals, and Audit.
2. Add Neon migrations and Kysely repositories behind ports.
3. Add Hono/OpenAPI routes with Zod validation and Problem Details errors.
4. Add transactional outbox, Queue/DLQ worker, immutable R2 artifacts, and reconciliation.
5. Add Cloudflare Access origin validation, local-only dev actor, RBAC/ABAC, cross-tenant isolation, revocation, and production dual control.
6. Host `@lemn-ltd/brand-studio` as the branding editor.
7. Implement private Brand Runtime Worker and Service Binding contract.
8. Deploy and seed demonstration organization/projects/brands/profiles without fake production paths.

### Phase 6: Branding MCP

1. Implement the typed tools/resources in this document.
2. Reuse the simulator API/application services; no independent database authority.
3. Implement the defined Streamable HTTP `2025-11-25` transport and managed signed MCP access-token validation, including issuer keys, exact audience, short expiry, grants, scopes, and revocation.
4. Add plan/apply, expected revision, idempotency, denial, revocation, audit, and secret-nonexposure tests.
5. Deploy behind its intended Zero Trust boundary and exercise it through a real MCP client.

### Phase 7: Lunaria Care

1. Build the SSR public/staff application with its own Postgres migrations and real business state.
2. Consume exact published LEMN packages from a clean install.
3. Resolve project branding through the private runtime binding before HTML render and bundle an exact compatible branded fallback.
4. Implement public booking, conflict-safe appointment lifecycle, waitlist, reschedule/cancel, and staff operations.
5. Use broad UI coverage, curated blocks, Recharts, and ECharts.
6. Demonstrate three profiles and light/dark without application redeploy.
7. Deploy under the LEMN DEV account.

### Phase 8: Zero-legacy closure, release, and evidence

1. Remove legacy tokens/runtime, compatibility aliases, stale Brand Lab, obsolete docs, invalid commands, direct provider imports, unpinned references, and old identity/domain strings.
2. Add repository and packed-artifact gates that scan forbidden identities/domains, tags/ranges, provider imports outside approved adapter paths, legacy token/KV code, and cross-repository filesystem references. The allowlist is checked in, path-specific, reasoned, and limited to UI-monorepo private workspace development links plus required third-party attribution text; published manifests/tarballs and independent consumers receive no workspace-link exception.
3. Resolve or supersede the pending visualization changeset under the final public contract.
4. Run full repository gates and clean-consumer exact-package installation.
5. Publish required packages, then update simulator and Lunaria to exact released versions.
6. Commit and push every repository on `main`.
7. Deploy Docs, Showcase, Showcase Admin, Simulator, MCP, and Lunaria.
8. Run final browser, API, MCP, SSR, security, failure, rollback, accessibility, responsive, and performance verification against deployed URLs.
9. Retain a final implementation receipt with commits, package versions, migrations, resources, domains, test commands/results, screenshots, audit events, and known operational ownership.

## 16. Planned deployment surfaces

- `https://ui.le-mn.com` — public Docs.
- `https://showcase.ui.le-mn.com` — public read-only Showcase.
- `https://admin.showcase.ui.le-mn.com` — Access-protected Showcase Admin/Sandbox.
- `https://branding.agentops.le-mn.com` — Access-protected simulator control plane.
- `https://branding-mcp.agentops.le-mn.com` — Zero Trust MCP endpoint when an HTTP route is required.
- private Brand Runtime Worker — no public route; Service Binding first.
- `https://lunaria-care.le-mn.com` — deployed consumer application.
- `https://schemas.ui.le-mn.com/brand-project/v2.json` — immutable public schema artifact.

All exact Worker, Queue, R2, Hyperdrive, Access, database, and domain names must follow deterministic environment-qualified naming and be verified against the Lemn DEV account before creation.

## 17. Verification and final demonstration

Completion requires all of the following through real entrypoints and authoritative state.

### 17.1 Provider and package proof

- Add/sync one selected source-snapshot component from an immutable upstream SHA.
- Upgrade one exact runtime provider dependency.
- Show provenance/license/patch/conformance in Admin.
- Show that a duplicate public capability is rejected.
- Install exact published LEMN packages in a clean consumer with no workspace links.
- Verify no product imports a forbidden provider directly.

### 17.2 Branding authoring proof

- Create a Brand and at least two Profiles in Studio.
- Configure light/dark, typography, surfaces, radius, borders, shadows, density, motion, and chart palette.
- Demonstrate invalid contrast blocked and corrected.
- Inspect source JSON, resolved JSON, scoped CSS, provider adapters, and hashes.
- Render the same artifact across components, Recharts, ECharts, and blocks.

### 17.3 Publication and rollback proof

- Create/validate a draft, generate a plan, apply in development, and observe an immutable BrandRevision.
- Reload a consumer and observe the new assignment without redeploy.
- Reject stale base revision and replayed/altered plan.
- Request a production publish; prove requester cannot approve it and an agent cannot approve it.
- Apply a distinct approval in a controlled demonstration identity setup.
- Roll back to an older compatible BrandRevision and prove a new assignment sequence and complete audit history.

### 17.4 SSR and profile proof

- Fetch Lunaria with JavaScript disabled and prove branded HTML/CSS is present before rendering.
- Verify server/client compiled hashes match after hydration.
- Switch among Core, Pediatrics, and Executive profiles without redeploy.
- Switch light/dark within each profile.
- Deny a profile/project/environment outside the workload grant.
- Disable/fail the runtime path and prove the embedded compatible branded fallback with no flash of defaults.

### 17.5 MCP proof

- Read current brand and revision history through MCP.
- Validate and plan a development update.
- Apply the exact plan, reload Lunaria, and observe the change.
- Reject wrong project, wrong environment, wrong audience, insufficient scope, expired plan, duplicate conflicting idempotency key, and production approval attempt.
- Revoke the MCP identity and prove the next request is denied and audited.

### 17.6 Lunaria business proof

- Book a real slot and retrieve the durable confirmation.
- Race two bookings for one remaining slot; exactly one succeeds.
- Retry the winning idempotency key without creating a second appointment.
- Reschedule and cancel safely.
- Fill a slot, join waitlist, release capacity, and promote without conflict.
- Show staff schedule, KPIs, filters, tables, Recharts, and ECharts under all three profiles.

### 17.7 Security and isolation proof

- Reject malformed, expired, wrong-issuer, and wrong-audience identity assertions.
- Reject cross-tenant/project/environment/slot access without revealing resource existence.
- Reject preview replay and wrong origin.
- Prove consumer has no branding DB/R2/Queue/admin bindings.
- Prove no secrets or reusable preview credentials appear in HTML, browser storage, logs, evidence, URLs, or repository.
- Verify Access and application authorization independently.

## 18. Definition of done

The goal is complete only when:

- all four repositories are clean on `main`, committed, and pushed;
- all public LEMN packages needed by consumers are published and consumed at exact versions;
- all planned deployable surfaces are live in Lemn DEV or an explicit infrastructure blocker is proven with safe evidence and no implementable work remains;
- the private runtime binding and authorization work in deployed SSR;
- the final demonstration passes the scenarios above;
- current Docs and Showcase explain the final system accurately;
- managed patterns/profile/audit describe the final ownership and evidence;
- standalone Brand Lab and incompatible legacy branding paths are removed;
- automated zero-legacy gates pass across source trees and packed artifacts: no retired domain/namespace/product identity, unpinned published provider/package reference, cross-repo filesystem link, legacy runtime/token/KV path, or direct consumer provider import remains outside the explicit narrow allowlist described in Phase 8;
- no TODO, stub, fake success path, skipped required test, or secret is left in production paths;
- a final receipt identifies commits, package versions, deployed URLs, infrastructure, tests, evidence, and any explicitly accepted operational limitation.

## 19. Known prerequisites and execution rules

### 19.1 Preflight matrix

| Prerequisite | Current safe evidence | Owner | Phase-0 action | Blocking condition |
|---|---|---|---|---|
| UI repository and `lemn-ltd` GitHub authority | UI `main`/origin are synchronized; GitHub CLI can read repo/workflows/packages | LEMN | verify create/push rights before creating three repositories | no authority to create/push required repos |
| GitHub Packages namespace and publish | versions through `0.2.5` are visible; a recent CI release succeeded; local `NODE_AUTH_TOKEN` is absent | LEMN release | use approved CI/secret flow, verify exact package creation/install without exposing token | no safe publish path for brand packages |
| Cloudflare Lemn DEV account and `le-mn.com` zone | recent UI CI deploy/preflight succeeded for existing Workers/domains; local Wrangler is not authenticated | LEMN infrastructure | read AgentOps secret metadata, verify account/zone with `wrangler whoami`, then provision least-privilege Workers/R2/Queues/Hyperdrive/Access/domains | account/zone mismatch or missing required permissions |
| Neon Postgres for simulator | not yet verified in this repo | LEMN infrastructure | locate/provision development database/branch and migration credential through secret manager | no authoritative Postgres target |
| Neon Postgres for Lunaria | not yet verified in this repo | LEMN infrastructure | provision a distinct database/branch and credential; never share simulator database roles | no isolated consumer database target |
| Cloudflare Access human identities | existing admin identity context is not sufficient proof of two humans | LEMN security | verify two distinct real human identities/groups with MFA and requester/approver roles | production dual-control PASS cannot be claimed; DEV request/denial may still be demonstrated |
| Workload/MCP signing keys and bootstrap credentials | design is fixed; values not yet provisioned | LEMN security | create/rotate through approved secret manager; record only secret names and key IDs | cannot run deployed SSR/MCP auth proof |
| AgentOps managed files/MCP | project config and local ignored token are known; live metadata probe must be repeated without printing values | LEMN | verify managed-file status/secrets and synchronize updated patterns | managed authorities cannot be safely updated |
| Browser/Playwright and public tunnel | existing UI E2E infrastructure and Lemn dev tunnel are available | implementation | run fast gates first; use final deployed URLs for acceptance | final browser evidence cannot be produced |

Phase 0 must turn every prerequisite needed for a mutation into `verified`, record safe evidence, and stop only the dependent mutation when an external owner action is genuinely required. It does not justify skipping implementable local work. The production dual-control acceptance specifically requires two real, distinct Access identities; an agent, duplicated fixture, or one person using two labels is not evidence.

### 19.2 Execution rules

- GitHub organization/repository and package authority must be verified before creating or publishing new repositories/packages.
- Cloudflare credentials must be obtained only through approved AgentOps secret metadata/value flow, verified with the expected account/zone, and removed from the process after use.
- Neon credentials/branches must be provisioned for simulator and Lunaria; neither belongs in the UI repository.
- Cloudflare Access identities/policies and the distinct-approver demonstration must be provisioned before production-approval acceptance.
- The current UI release/deploy pipeline has recent successful evidence and must be extended rather than bypassed.
- Destructive tests run only in isolated development resources with deterministic cleanup.
- Playwright is run after faster unit/type/build/contract gates, then against deployed surfaces for final acceptance.
- Existing user changes in any repository must be preserved; an unexpected dirty tree is investigated before edits.

## 20. Decision log

1. Use multiple Profiles per Brand, not a 1:1 Project/theme model.
2. Keep project branding persistence and publication in AgentOps/platform, not in UI packages.
3. Use Postgres as authority and R2 for immutable artifacts; do not use KV in the correctness-critical SSR path.
4. Use private Service Binding delivery plus application-level workload grants.
5. Keep the public Showcase read-only; use a separate protected Admin boundary.
6. Make Brand Studio reusable and persistence-agnostic; AgentOps hosts it through adapters.
7. Permit multiple chart providers, with one provider of record per chart capability.
8. Select provider components individually; never ingest all provider components by default.
9. Keep branding minimal and visual; preserve upstream functional behavior.
10. Compile branding server-side and guarantee a branded fallback.
11. Keep frontend-platform concerns out of UI.
12. Govern provider updates through exact pins, conformance, provenance, PR review, and release.
13. Use Zero Trust, plan/apply, idempotency, audit, and human-only production approval.
14. Prove the architecture with a simulator, a dedicated branding MCP, and a realistic Lunaria Care consumer before migrating responsibilities into AgentOps.
15. Perform a zero-legacy cutover rather than maintaining the current parallel token and Brand Lab runtimes.
16. Version the entire Brand, including every Profile and mode, as one immutable BrandRevision; Assignments choose a BrandRevision plus allowed/default Profiles.
17. Use two-transaction publication: materialize and verify before compare-and-swap activation.
18. Use managed signed Streamable HTTP MCP tokens for this implementation; defer OAuth issuance without deferring current security.
19. Keep Git manifests as provider-registry authority; Admin creates proposals through least-privilege AgentOps/GitHub-sync PR flow.
