# Pattern Profile

Project-specific required domains and target levels for Lemn UI.

Source system: `patterns/pattern-system.md`
Pattern catalog: `patterns/patterns.md`
Derived audit-state projection: `patterns/pattern-audit.md`

## Inventory Basis

This profile is based on the Lemn UI repository inventory as of
2026-07-18.

Lemn UI is not a product backend or the full AgentOps control plane. It is
the shared graphical UI system and release workspace for LEMN products,
with:

- a Node.js 22+, pnpm, and Turborepo workspace
- the published `@lemn-ltd/ui` React package, including provider-backed
  components, curated blocks, semantic tokens, styles, catalog metadata,
  package docs, and public exports
- published `@lemn-ltd/brand-contract`, `@lemn-ltd/brand-runtime`, and
  `@lemn-ltd/brand-studio` packages for deterministic complete-mode branding,
  first-byte server resolution, and controlled authoring
- a Git-authoritative provider registry with exact pins, source provenance,
  licenses, notices, SBOM, conformance, and update status
- the private `@lemn-ltd/ui-portal` application, which serves one public
  Catalog and one path-scoped Cloudflare Access-protected Admin surface from
  the `lemn-ui-portal` Worker
- an Astro/Starlight documentation site deployed through Cloudflare
- Vitest, React Testing Library, Playwright, axe, and fidelity-capture coverage
- brand-neutrality and package-boundary validation scripts
- Changesets, GitHub Packages publishing, changelog synchronization, and
  coordinated docs/Portal release automation

The profile therefore targets the highest relevant rigor for reusable UI,
public package contracts, release evidence, documentation, and the Cloudflare
surfaces this repository actually owns. It does not import backend product
requirements merely because they exist in the organization-wide catalog.

## Applicability Rules

- Apply every pattern in a listed domain with
  `precedence_level <= target_level` only when its `applies_when` condition
  matches this repository inventory.
- Treat this repository as the producer and source of truth for
  `@lemn-ltd/ui`. Apply organization-level `PAT-UI-LEMN-001` and
  `PAT-UI-SYSTEM-001` through that exact package identity across the manifest,
  registry, workspace, catalog, docs, Portal, tests, and release automation.
  Compatibility aliases are not part of the public package contract.
- Treat package exports, tokens, CSS, component props, catalog metadata,
  changesets, and published versions as public contracts. HTTP-specific Hono,
  OpenAPI, Problem Details, CORS, webhook, and MCP requirements are not
  applicable unless this repository introduces those product API surfaces.
- Apply Cloudflare patterns to `apps/ui-portal` and `apps/docs`, their Wrangler
  configuration, bundled assets, runtime dependencies, deploy commands, and
  production verification. Portal Admin may use one typed least-privilege
  server adapter to the external branding control plane. Durable Objects,
  Sandbox, Queues, and Workflows are not required inside this repository.
- Keep components and Brand Studio controlled, presentational,
  provider-neutral, and persistence-free. Consuming applications own product
  data fetching, authorization, persistence, routing, telemetry, and workflow
  policy.
- Do not import AgentOps assumptions about Neon, Kysely, product data,
  multi-tenant auth, billing, durable agent runs, or LLM infrastructure unless
  a concrete future change adds those responsibilities to this workspace.

## Pattern Profile

`pattern_profile` lists only domains required for this project. Each domain's
`target_level` is the maximum precedence level currently required by the
project inventory.

```yaml
pattern_profile:
  ARCH:
    target_level: 5
    reason:
      - "The workspace owns one shared UI kernel consumed by multiple products plus separate package, Portal, and documentation surfaces."
      - Public/private package boundaries, stable catalog vocabulary, and dependency direction must remain explicit across packages and apps.
      - Component, token, style, and catalog decisions must stay identical across the published package, Portal, docs, and consumers.
      - Provider authority, BrandingDefinition compilation, server runtime, Blocks, public Catalog, and protected Admin remain separate explicit module and trust boundaries.
      - Changesets, package publishing, docs deployment, and Portal deployment require a coherent compatibility-first release model.

  CODE:
    target_level: 4
    reason:
      - The maintained inventory is TypeScript, TSX, CSS, JSON, Astro configuration, and Node tooling.
      - pnpm, Turborepo, TypeScript, Vite, Vitest, Playwright, Wrangler, and Biome are repository contracts and must remain pinned and reproducible.
      - Components, catalogs, build scripts, validation scripts, and test helpers require file-scope, readability, type, placeholder, suppression, and dependency discipline.

  CLOUDFLARE:
    target_level: 4
    reason:
      - The single Portal Worker, its protected Admin paths, and the documentation application are deployed through Wrangler to Cloudflare.
      - Worker configuration, bundled static assets, runtime dependencies, generated types, dry runs, and production deploy commands must remain reviewable and reproducible.
      - Durable Objects and Sandbox are not applicable; any Admin Service Binding remains narrow, typed, and server-only.

  INFRA:
    target_level: 4
    reason:
      - The repository owns four published packages, Cloudflare Worker deploys, public/protected custom domains, CI release permissions, and package registry configuration.
      - Resource names, ownership, bindings, lifecycle, failure behavior, and verification commands must be documented for every release surface.

  API:
    target_level: 4
    reason:
      - "The UI, BrandingDefinition, compiled artifact envelope, runtime projection, Studio host adapter, blocks, token exports, provider read model, and catalog endpoints are stable public contracts."
      - Public changes must remain additive or carry a changeset, migration guidance, and versioned compatibility decision.
      - Hono, OpenAPI-generated clients, backend DTO mappers, webhooks, and MCP server tools are not part of the current repository inventory.

  ERROR:
    target_level: 3
    reason:
      - Component interactions, Portal routes, docs builds, catalog generation, packaging, and release scripts have observable failure paths that must be explicit and recoverable.
      - Build, validation, publish, and deploy failures must stop cleanly and report actionable diagnostics without partial success claims.

  SEC:
    target_level: 4
    reason:
      - Local installs, GitHub Packages publishing, Cloudflare deploys, and CI use scoped credentials that must remain outside the repository and logs.
      - Portal fixtures, documentation, screenshots, and component examples must remain brand-neutral and free of customer or production data.
      - Release and debug output must preserve redaction and least-privilege access even though this package does not own product authorization.

  TEST:
    target_level: 4
    reason:
      - The workspace uses Vitest, React Testing Library, happy-dom, Playwright, axe, deterministic Portal fixtures, and fidelity captures.
      - Reusable components require meaningful behavior, accessibility, responsive, visual, boundary, packaging, and public-export evidence.
      - Release readiness must be proven against the current worktree with type checks, tests, builds, policy validators, and Cloudflare dry runs or smokes as applicable.

  UI:
    target_level: 5
    reason:
      - Reusable provider-backed components, BrandingDefinition compilation, server runtime contracts, design tokens, blocks, CSS, accessibility behavior, and catalog documentation are the primary product of this repository.
      - "`@lemn-ltd/ui` is the project source of truth; consumers must use public exports and the single public stylesheet instead of copying CSS or deep-importing internals."
      - Every reusable component must be composable, responsive, accessible, brand-neutral, documented, catalogued, and demonstrated in the Portal.
      - Dashboard, report, chart, agent, workflow, evidence components, and blocks must expose complete loading, empty, error, permission, pending, success, and interaction states when applicable.
      - Production consumers receive verified scoped branding before first paint; browser effects never repair an unbranded render.

  OBS:
    target_level: 4
    reason:
      - Operators need deployment and runtime evidence for docs/Portal health, Worker versions, catalog availability, browser failures, and release outcomes.
      - Logs, production tails, smoke output, screenshots, and fidelity artifacts must be attributable to a target and current code state without leaking credentials.
      - Distributed trace propagation is required only if future changes add cross-runtime request or job flows.

  OPS:
    target_level: 1
    reason:
      - Package publishing, GitHub Actions, registry access, Cloudflare deploys, custom domains, and AgentOps managed files all require explicit least-privilege permissions.
      - Production mutations and token usage must remain environment-scoped, reviewable, and absent from generated artifacts or logs.

  DOCS:
    target_level: 4
    reason:
      - The repository owns Astro/Starlight human docs, package usage docs, component and pattern catalogs, Portal guidance, release notes, and agent discovery surfaces.
      - Public component changes must update docs, catalog metadata, examples, and changesets together.
      - Pattern profile, audit state, exceptions, and architecture/release decisions must remain reproducible in repository-managed documentation rather than chat alone.
```

## Explicit Non-Goals

The following are not required by this profile for the current project shape:

- product backend services, Hono routes, or OpenAPI-generated clients
- transactional product databases, migrations, Kysely, Hyperdrive, KV
  authority, R2, ClickHouse, or Cloudflare Artifacts inside this repository;
  the external AgentOps simulator owns branding persistence and publication
- product authentication, authorization, billing, entitlements, or tenant data
- Queues, Workflows, Durable Objects, or long-running async orchestration
  inside this repository; a narrow server adapter for Portal Admin does not
  move control-plane ownership into UI
- commercial LLM calls, AI Gateway, Brainstask, Flue, realtime voice, or agent
  execution runtimes
- product-specific data fetching, routing, telemetry, or business-policy
  components inside the shared UI package
- compatibility aliases or alternate public package names for `@lemn-ltd/ui`

If future work introduces one of these capabilities, update this profile first
or record a scoped exception in `patterns/pattern-audit.md`.
