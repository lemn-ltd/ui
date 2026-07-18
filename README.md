# Lemn UI ecosystem

Provider-first, brand-neutral UI infrastructure for LEMN products. This
workspace publishes a stable LEMN API over selected, battle-tested open-source
capabilities; it does not ask product teams to import upstream providers or
maintain local rewrites of their behavior.

LEMN owns the public contract, semantic branding vocabulary, curated provider
mapping, blocks, conformance evidence, documentation, and release process.
Keyboard interaction, accessibility primitives, chart engines, and lifecycle
behavior remain upstream-owned wherever an approved provider exists.

This architecture applies `PAT-UI-LEMN-001`,
`PAT-UI-PROVIDER-FIRST-001`, `PAT-UI-BRAND-CONTRACT-001`,
`PAT-UI-SSR-BRANDING-001`, `PAT-UI-BLOCKS-001`, and
`PAT-UI-FRONTEND-PLATFORM-BOUNDARY-001`.

The cross-repository authority, runtime, MCP, consumer, and delivery decisions
are defined in [LEMN UI and Workspace Branding vNext](BRANDING_ECOSYSTEM_VNEXT.md).

## Published packages

- `@lemn-ltd/brand-contract` validates and deterministically compiles a
  versioned `BrandingDefinition` into complete light/dark projections, scoped
  `--lemn-*` tokens, critical CSS, provider adapters, diagnostics, and
  integrity hashes.
- `@lemn-ltd/ui` exposes provider-neutral components, visualizations, curated
  blocks, semantic token fallbacks, and catalog metadata.
- `@lemn-ltd/brand-runtime` resolves and verifies signed branding artifacts on
  the server, then produces first-byte SSR CSS, preload, scope, and bootstrap
  data without a browser-side resolution path.
- `@lemn-ltd/brand-studio` provides a controlled, persistence-free branding
  wizard and preview surface. Its host owns authorization, persistence,
  publication, and audit.

Internal workspace packages and applications:

- `@lemn-ltd/provider-registry` is the Git-authoritative mapping from each
  public capability to exactly one provider of record, immutable origin,
  license, adapter, and conformance evidence.
- `apps/ui-portal` is the single private Lemn UI application. It serves the
  public Catalog and the Cloudflare Access-protected Admin from the
  `lemn-ui-portal` Worker at
  [portal.ui.le-mn.com](https://portal.ui.le-mn.com).
- `apps/docs` is this ecosystem's Starlight documentation at
  [ui.le-mn.com](https://ui.le-mn.com).

## Consumer rule

A product installs exact approved releases. Never use `latest`, a caret, a
tilde, a wildcard, a branch, a URL, a workspace link, or a relative import
across repositories.

```ini
# repository .npmrc
@lemn-ltd:registry=https://npm.pkg.github.com
```

Keep GitHub Packages authentication in the user's `~/.npmrc`, never in a
repository:

```ini
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

For the first compatible release set:

```bash
pnpm add @lemn-ltd/brand-contract@1.0.0 @lemn-ltd/brand-runtime@0.1.0 @lemn-ltd/ui@0.3.1
```

Import only the LEMN public surface and load its stylesheet once at the app
root:

```tsx
import { Button, DashboardOverviewBlock } from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css";
```

Product applications must not import Radix, Tremor, Recharts, ECharts, MUI,
or another UI provider for a capability owned by the LEMN catalog. A missing
reusable capability is selected through the provider registry, adapted once,
proved by conformance, and published before consumer adoption.

## Branding contract

A `BrandingDefinition` is authoring data, not runtime component configuration.
It owns root typography and assets plus complete, non-inheriting visual modes.
The deterministic compiler resolves that source into the same scoped semantic
token vocabulary for every workspace:

```css
[data-lemn-brand-scope="<compiled-scope-id>"] {
  --lemn-color-canvas: #ffffff;
  --lemn-color-surface: #ffffff;
  --lemn-color-text: #0e141b;
  --lemn-color-accent: #0d9488;
}
```

Components consume only those compiled semantic values. They never parse raw
`BrandingDefinition` JSON, persist brand state, resolve a workspace, publish a
version, or mutate global tokens.

Production hosts use `@lemn-ltd/brand-runtime` to resolve the active authorized
workspace branding, verify the signed immutable artifact, select one mode, and
inject its critical CSS and scope attributes before emitting the first HTML
byte. Hydration receives the same compiled hash. If active resolution fails,
the host may use only one verified compatible embedded branded fallback;
preview resolution fails closed and never falls back to active branding.

See [SSR branding runbook](apps/docs/src/content/docs/ssr-branding/index.mdx)
and [package consumption guide](packages/ui/README.md).

## Portal, Studio, and frontend-platform boundaries

- Brand Studio edits one controlled `BrandingDefinition` and emits typed host
  intents for draft lifecycle, validation, comparison, preview, and
  publication. It has no credentials or persistence authority.
- Lemn UI Admin hosts experimentation, provider proposals, System branding
  templates, and definition previews under `/admin` behind Cloudflare Access.
  It cannot persist branding or mutate the active provider manifest directly.
- Data fetching, routing, authentication, global application state,
  internationalization, analytics SDKs, and product workflow policy belong to
  a consuming app or a future frontend-platform package, not these UI packages.

## Blocks

Blocks are curated purpose-specific compositions such as a dashboard overview,
an appointment schedule, or an approval queue. They compose canonical LEMN
components, accept controlled data/actions, model applicable UI states, and
contain no product API, authorization, persistence, routing, or alternate
provider implementation.

## Agent discovery

Agents should start from the LEMN catalog and never guess an upstream import:

- [catalog.json](https://portal.ui.le-mn.com/catalog.json)
- [llms.txt](https://portal.ui.le-mn.com/llms.txt)
- [llms-full.txt](https://portal.ui.le-mn.com/llms-full.txt)
- [component selection guide](packages/ui/docs/components.md)
- [composition patterns](packages/ui/docs/patterns.md)

Selection order:

1. Reuse an existing public LEMN component or block.
2. Keep one-off product behavior local and compose public primitives.
3. For a reusable gap, propose one provider of record in the registry.
4. Add the LEMN adapter, provenance, license, conformance, docs, Portal evidence, and
   changeset before publishing an exact release.

## Local development

Requirements are Node.js `>=22`, pnpm `11.8.0` through Corepack, and GitHub
Packages read access for private dependencies.

```bash
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm install
pnpm dev:portal
pnpm dev:docs
```

Primary verification:

```bash
pnpm validate
pnpm check
pnpm test
pnpm build
pnpm audit --prod
```

Provider updates are reviewed changes against immutable registry entries; they
are never automatic production upgrades. Publish order for the compatible
release set is Brand Contract, UI and Brand Runtime after their shared
contract, then Brand Studio after its Contract and UI dependencies, followed
by clean consumer installs from GitHub Packages and deployed smoke evidence.

Production Cloudflare mutation is main-only and uses the protected Environment
secret `PRODUCTION_CLOUDFLARE_API_TOKEN`. It is scoped to Account `Lemn DEV`
with `Workers Scripts: Edit` (`Workers Scripts Write` in the API) and Zone
`le-mn.com` with `Zone: Read` plus `Workers Routes: Edit` (`Zone Workers Routes
Write` in the API); broader credentials fail closed.

## Documentation

- [Architecture](apps/docs/src/content/docs/architecture/index.mdx)
- [Branding](apps/docs/src/content/docs/branding/index.mdx)
- [Provider governance](apps/docs/src/content/docs/providers/index.mdx)
- [Blocks](apps/docs/src/content/docs/blocks/index.mdx)
- [SSR branding runbook](apps/docs/src/content/docs/ssr-branding/index.mdx)
- [Contribution rules](CONTRIBUTING.md)
