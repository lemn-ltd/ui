# @lemn-ltd/ui

Provider-neutral React components, visualizations, semantic styles, curated
blocks, and catalog metadata for LEMN products.

The package is deliberately a visual leaf. It accepts controlled props and
compiled branding; it does not fetch product data, route, authenticate,
authorize, persist, translate, publish branding, or own global application
state. Those responsibilities belong to the consuming application or a
separate frontend-platform package.

## Provider-first ownership

Every reusable public capability has exactly one provider of record in the
version-controlled provider registry. LEMN adapters normalize the public API
and semantic token inputs without rewriting accepted upstream interaction,
keyboard, focus, accessibility, chart-engine, or lifecycle behavior.

Consumers must not import upstream UI providers directly for catalog-owned
capabilities. A reusable gap is handled in this order:

1. check the package catalog and blocks;
2. select one battle-tested open-source capability in the provider registry;
3. pin an exact package version or full source commit and record provenance,
   integrity, license, notices, adapter, and conformance;
4. expose a provider-neutral LEMN API;
5. publish a reviewed exact package release before product adoption.

The package intentionally does not ingest complete provider catalogs or expose
two public implementations of the same semantic capability. Provider details
are internal implementation provenance, not consumer contracts.

This boundary implements `PAT-UI-LEMN-001`,
`PAT-UI-PROVIDER-FIRST-001`, and
`PAT-UI-FRONTEND-PLATFORM-BOUNDARY-001`.

## Runtime and build boundaries

- Runtime source remains browser-compatible and must not import Node APIs,
  Cloudflare bindings, product SDKs, or product persistence.
- `react` and `react-dom` are peers. Approved provider dependencies are exact
  and remain behind their owning capability adapters.
- `pnpm validate:boundaries` enforces package and provider boundaries.
- `pnpm validate:brand-neutrality` rejects product identity in shared source.
- TypeScript emits component-local CSS imports. `scripts/copy-css.mjs` copies
  the aggregate stylesheet and every colocated stylesheet into `dist`.
- CSS is the only declared package side effect; other exports remain
  tree-shakeable.

## Public exports

- `@lemn-ltd/ui` — public components, provider-neutral types, tokens, and
  component catalog.
- `@lemn-ltd/ui/tokens` — typed semantic token names.
- `@lemn-ltd/ui/catalog` — data-only component metadata and lookup helpers.
- `@lemn-ltd/ui/blocks` — curated purpose-specific compositions and block
  catalog.
- `@lemn-ltd/ui/styles.css` — aggregate semantic fallback and component styles.

Do not deep-import `src`, `dist`, an individual component directory, or an
upstream provider.

## Exact consumer install

Configure the GitHub Packages scope in the consumer repository:

```ini
@lemn-ltd:registry=https://npm.pkg.github.com
```

Keep the credential outside repositories in the user's `~/.npmrc`:

```ini
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Install the compatible release set with exact versions:

```bash
pnpm add @lemn-ltd/brand-contract@1.0.0 @lemn-ltd/brand-runtime@0.1.0 @lemn-ltd/ui@0.3.1
```

Load styles once and import only public LEMN exports:

```tsx
import {
  AppointmentScheduleBlock,
  Button,
  Card,
  componentCatalog,
} from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css";
```

Never install `latest`, a floating range, a branch, a URL, or a workspace/link
dependency in a published consumer.

## Branding boundary

`@lemn-ltd/brand-contract` is the source schema/compiler package. One
`BrandingDefinition` owns root assets, typography, a default mode, and complete
visual modes. Its deterministic compiler emits:

- an immutable artifact with schema/compiler compatibility metadata;
- definition, mode, byte, and compiled SHA-256 identities where applicable;
- complete mode projections without inheritance;
- critical scoped CSS using only the stable `--lemn-*` vocabulary;
- DOM scope attributes and color scheme;
- provider-specific chart adapters behind provider-neutral artifact fields;
- an asset manifest and publication-blocking diagnostics.

This package consumes only the compiled semantic output. Components do not
parse a `BrandingDefinition`, resolve a Workspace, fetch an active version,
persist a choice, or mutate `:root`. The host applies the verified compiled mode
atomically.

The package stylesheet includes a light-first branded fallback for isolated
development and tests. It is not a substitute for production resolution.
Production hosts use `@lemn-ltd/brand-runtime` to resolve and verify a published
artifact before the first HTML byte, inject selected-mode critical CSS, and put
the compiled scope attributes on the branded container before rendering
components. A compatible verified embedded branded artifact is the only
failure fallback.

Theme and accent controls are controlled visual inputs. The host owns the
active mode, cookies, authorization, server resolution, and atomic scope
replacement. A shared component never persists that state or writes global
brand variables.

See the [SSR branding runbook](../../apps/docs/src/content/docs/ssr-branding/index.mdx).

## Blocks

Blocks are named, curated compositions with a specific repeatable purpose,
controlled data/action contracts, complete applicable states, deterministic
Showcase fixtures, and at least one real consumer before stable promotion.

Current public block exports are:

- `DashboardOverviewBlock`
- `AppointmentScheduleBlock`
- `ApprovalQueueBlock`

Blocks compose only public LEMN capabilities. They never hide product fetching,
persistence, authorization, routing, workflow policy, or a second provider
implementation. Use a component for a single reusable control; use a block only
for a repeatable multi-component workflow or report surface.

## Catalog and agent guidance

`componentCatalog` is the structured source of truth for component area,
family, slug, status, and intent. `blockCatalog` is the corresponding index for
curated compositions. Do not document a hard-coded total: the exported
catalogs, Showcase, and drift tests are authoritative as capabilities evolve.

- [Agent usage guide](docs/README.md)
- [Component selection guide](docs/components.md)
- [Composition patterns](docs/patterns.md)
- [Public Showcase](https://showcase.ui.le-mn.com)

## Brand Studio is separate

`@lemn-ltd/brand-studio` is the reusable, controlled authoring wizard. It can
edit and preview a `BrandingDefinition`, validate/compile it, and emit typed host
intents. It does not belong inside this package and has no persistence,
credentials, Workspace authorization, publication, activation, or audit
authority.

Showcase Admin is a separate protected host for experimentation and provider or
branding proposals. It consumes Studio and registry read models; it does not
write the active provider manifest directly.

## Test and release commands

```bash
pnpm --filter @lemn-ltd/ui run check
pnpm --filter @lemn-ltd/ui run test
pnpm --filter @lemn-ltd/ui run build
pnpm validate:brand-neutrality
pnpm validate:boundaries
```

Any public contract change requires aligned catalog metadata, agent guidance,
Showcase coverage, conformance evidence, and a changeset. Provider updates are
reviewed registry proposals; they never silently alter production consumers.
