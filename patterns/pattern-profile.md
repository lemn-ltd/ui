# Pattern Profile

Project-specific required domains and target levels for Appranks UI.

Source system: `patterns/pattern-system.md`
Pattern catalog: `patterns/patterns.md`
Derived audit-state projection: `patterns/pattern-audit.md`

## Inventory Basis

This profile is based on the Appranks UI repository inventory as of
2026-07-13.

Appranks UI is not a product backend or the full AgentOps control plane. It is
the shared graphical UI system and release workspace for Appranks products,
with:

- a Node.js 22+, pnpm, and Turborepo workspace
- the published `@appranks/ui` React package, including components, design
  tokens, styles, catalog metadata, package docs, and public exports
- the internal `@appranks/showcase-kit` package for reusable showcase chrome
- a React/Vite showcase deployed as a Cloudflare Worker SPA
- an Astro/Starlight documentation site deployed through Cloudflare
- Vitest, React Testing Library, Playwright, axe, and fidelity-capture coverage
- brand-neutrality and package-boundary validation scripts
- Changesets, GitHub Packages publishing, changelog synchronization, and
  coordinated docs/showcase release automation

The profile therefore targets the highest relevant rigor for reusable UI,
public package contracts, release evidence, documentation, and the Cloudflare
surfaces this repository actually owns. It does not import backend product
requirements merely because they exist in the organization-wide catalog.

## Applicability Rules

- Apply every pattern in a listed domain with
  `precedence_level <= target_level` only when its `applies_when` condition
  matches this repository inventory.
- Treat this repository as the producer and source of truth for
  `@appranks/ui`. Where organization-level `PAT-UI-LEMN-001` or
  `PAT-UI-SYSTEM-001` examples name `@lemn-ltd/ui`, apply their design-system
  control intent through the current package, registry, catalog, docs, and
  showcase contracts declared by this repository. A package-scope rename is
  not implied by this profile.
- Treat package exports, tokens, CSS, component props, catalog metadata,
  changesets, and published versions as public contracts. HTTP-specific Hono,
  OpenAPI, Problem Details, CORS, webhook, and MCP requirements are not
  applicable unless this repository introduces those product API surfaces.
- Apply Cloudflare patterns to `apps/showcase` and `apps/docs`, their Wrangler
  configuration, bundled assets, runtime dependencies, deploy commands, and
  production verification. Durable Objects, Service Bindings, Sandbox,
  Queues, and Workflows are not required by the current inventory.
- Keep components presentational and brand-neutral. Consuming applications own
  product data fetching, authorization, persistence, routing, telemetry, and
  workflow policy.
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
      - "The workspace owns one shared UI kernel consumed by multiple products plus separate package, showcase, and documentation surfaces."
      - Public/private package boundaries, stable catalog vocabulary, and dependency direction must remain explicit across packages and apps.
      - Component, token, style, and catalog decisions must stay identical across the published package, showcase, docs, and consumers.
      - Changesets, package publishing, docs deployment, and showcase deployment require a coherent compatibility-first release model.

  CODE:
    target_level: 4
    reason:
      - The maintained inventory is TypeScript, TSX, CSS, JSON, Astro configuration, and Node tooling.
      - pnpm, Turborepo, TypeScript, Vite, Vitest, Playwright, Wrangler, and Biome are repository contracts and must remain pinned and reproducible.
      - Components, catalogs, build scripts, validation scripts, and test helpers require file-scope, readability, type, placeholder, suppression, and dependency discipline.

  CLOUDFLARE:
    target_level: 4
    reason:
      - The showcase and documentation applications are deployed through Wrangler to Cloudflare.
      - Worker configuration, bundled static assets, runtime dependencies, generated types, dry runs, and production deploy commands must remain reviewable and reproducible.
      - Durable Objects, Service Bindings, and Sandbox are not applicable to the current static showcase/docs runtime.

  INFRA:
    target_level: 4
    reason:
      - The repository owns GitHub Packages publishing, Cloudflare Worker deploys, custom documentation/showcase domains, CI release permissions, and package registry configuration.
      - Resource names, ownership, bindings, lifecycle, failure behavior, and verification commands must be documented for every release surface.

  API:
    target_level: 4
    reason:
      - "The `@appranks/ui` exports, component props, token exports, stylesheet path, catalog metadata, and agent-facing catalog endpoints are stable public contracts."
      - Public changes must remain additive or carry a changeset, migration guidance, and versioned compatibility decision.
      - Hono, OpenAPI-generated clients, backend DTO mappers, webhooks, and MCP server tools are not part of the current repository inventory.

  ERROR:
    target_level: 3
    reason:
      - Component interactions, showcase routes, docs builds, catalog generation, packaging, and release scripts have observable failure paths that must be explicit and recoverable.
      - Build, validation, publish, and deploy failures must stop cleanly and report actionable diagnostics without partial success claims.

  SEC:
    target_level: 4
    reason:
      - Local installs, GitHub Packages publishing, Cloudflare deploys, and CI use scoped credentials that must remain outside the repository and logs.
      - Showcase fixtures, documentation, screenshots, and component examples must remain brand-neutral and free of customer or production data.
      - Release and debug output must preserve redaction and least-privilege access even though this package does not own product authorization.

  TEST:
    target_level: 4
    reason:
      - The workspace uses Vitest, React Testing Library, happy-dom, Playwright, axe, deterministic showcase fixtures, and fidelity captures.
      - Reusable components require meaningful behavior, accessibility, responsive, visual, boundary, packaging, and public-export evidence.
      - Release readiness must be proven against the current worktree with type checks, tests, builds, policy validators, and Cloudflare dry runs or smokes as applicable.

  UI:
    target_level: 5
    reason:
      - Reusable graphical components, design tokens, CSS, accessibility behavior, composition patterns, and catalog documentation are the primary product of this repository.
      - "`@appranks/ui` is the project source of truth; consumers must use public exports and the single public stylesheet instead of copying CSS or deep-importing internals."
      - Every reusable component must be composable, responsive, accessible, brand-neutral, documented, catalogued, and demonstrated in the showcase.
      - Dashboard, report, chart, agent, workflow, and evidence components must expose complete loading, empty, error, permission, pending, success, and interaction states when applicable.

  OBS:
    target_level: 4
    reason:
      - Operators need deployment and runtime evidence for docs/showcase health, Worker versions, catalog availability, browser failures, and release outcomes.
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
      - The repository owns Astro/Starlight human docs, package usage docs, component and pattern catalogs, showcase guidance, release notes, and agent discovery surfaces.
      - Public component changes must update docs, catalog metadata, examples, and changesets together.
      - Pattern profile, audit state, exceptions, and architecture/release decisions must remain reproducible in repository-managed documentation rather than chat alone.
```

## Explicit Non-Goals

The following are not required by this profile for the current project shape:

- product backend services, Hono routes, or OpenAPI-generated clients
- transactional databases, migrations, Kysely, Hyperdrive, KV authority, R2,
  ClickHouse, or Cloudflare Artifacts
- product authentication, authorization, billing, entitlements, or tenant data
- Queues, Workflows, Durable Objects, Service Bindings, or long-running async
  orchestration
- commercial LLM calls, AI Gateway, Brainstask, Flue, realtime voice, or agent
  execution runtimes
- product-specific data fetching, routing, telemetry, or business-policy
  components inside the shared UI package
- renaming the current `@appranks/ui` package scope solely to match generic
  organization-level examples

If future work introduces one of these capabilities, update this profile first
or record a scoped exception in `patterns/pattern-audit.md`.
