# LEMN UI and Workspace Branding vNext

## Status

- Decision date: 2026-07-17.
- Authority: accepted product and architecture decisions for the LEMN UI ecosystem.
- Posture: provider-first, SSR-first, zero trust, exact versions, and zero legacy.
- This is an implementation decision and delivery plan, not a `write-spec` artifact.

The retired `BrandProject`, Profile inheritance, environment assignment, and
parallel Brand Lab runtime are not compatibility surfaces. They must not be
restored as aliases, migrations, or secondary authorities.

## Objective

Give a two-person team one reusable UI ecosystem assembled from selected,
battle-tested open-source providers. LEMN owns the stable public API, semantic
branding, curation, provenance, release process, and proof applications. It does
not rewrite provider behavior that an accepted upstream already maintains.

Branding is authored once as a versioned visual contract, managed per AgentOps
Workspace, resolved before the first HTML byte, and applied consistently to all
LEMN components and provider-backed visualizations.

## Principles

1. Select capabilities, not whole providers. Each public capability has one
   provider of record even when multiple chart engines coexist.
2. Preserve upstream interaction, accessibility, lifecycle, and chart behavior.
   Branding adapters supply only documented visual configuration.
3. Consumers import LEMN packages and never deep-import providers or copy shared
   component code.
4. Components consume compiled semantic output, never source branding JSON.
5. No browser renders an unbranded first frame. SSR verifies and injects the
   complete selected mode before branded markup.
6. The semantic `--lemn-*` vocabulary is project-neutral. Workspace identity is
   carried by a verified scope, not by project-specific token names.
7. Data fetching, routing, authentication, global state, and internationalization
   are frontend-platform concerns and stay outside the UI library.
8. Published consumers pin exact versions. `latest`, ranges, cross-repository
   workspace links, and mutable upstream references are forbidden.
9. Network location and Service Bindings do not grant business authority. Every
   boundary is typed, least-privilege, tenant-bound, and audited.
10. Cutover leaves no retired names, domains, schemas, routes, storage models,
    fallbacks, docs, or tests.

## Canonical model

```text
Organization
  └── Workspace
        └── Branding
              ├── BrandingVersion 1 (published, immutable)
              ├── BrandingVersion 2 (draft)
              └── activeBrandingVersionId (human compare-and-swap)

SystemBrandingTemplate (immutable ID + version + hash)
  └── copied into a new editable BrandingVersion definition
```

- A Workspace owns exactly one Branding aggregate.
- A Branding owns many independently named BrandingVersions.
- Draft definitions use optimistic definition hashes and an allowlisted JSON
  Patch surface.
- Publishing freezes the definition and immutable provider/source provenance,
  compiles it, signs the byte-addressed object, and materializes it to R2 through
  a transactional outbox.
- Activation is a separate human-only compare-and-swap after signature and
  object-integrity verification.
- A `BrandingDefinition` may contain complete modes such as light and dark. It
  is not an application identity, inheritance family, or lifecycle aggregate.

Postgres through Hyperdrive is authoritative for mutable Workspace state. R2 is
authoritative only for immutable signed objects. KV may cache immutable data but
is never mutable branding authority.

## BrandingDefinition v1

Canonical schema:

```text
https://schemas.ui.le-mn.com/branding/v1.json
```

The source contract owns:

- metadata and governed immutable assets;
- body, heading, label, and code typography from a curated font catalog;
- complete independently compilable modes;
- semantic colors, surfaces, borders, radii, shadows, spacing/density, and motion;
- focus, selection, disabled, and status treatments;
- visualization palettes, axes, grids, cursors, tooltips, and selection;
- iconography and component-appearance choices;
- runtime mode-selection policy;
- JSON-only namespaced extensions that cannot inject CSS or behavior.

The deterministic compiler emits schema/compiler compatibility, diagnostics,
definition/mode/compiled hashes, scoped critical CSS, DOM attributes,
`color-scheme`, font resources/preloads, safe asset deliveries, semantic tokens,
and provider adapters for Recharts and ECharts. Incompatible meaning requires a
new schema major.

## Repository responsibilities

### `lemn-ltd/ui`

- `@lemn-ltd/brand-contract@1.0.0`: schema, validation, canonicalization,
  compiler, diagnostics, private full-artifact and signed minimal mode-object
  contracts, and immutable System brandings.
- `@lemn-ltd/ui@0.3.1`: provider-neutral components, visualizations, blocks,
  catalogs, semantic tokens, and provider adapters.
- `@lemn-ltd/brand-runtime@0.1.0`: server-only resolution, signature/hash/schema
  verification, selected-mode projection, SSR helpers, and bounded fallback.
- `@lemn-ltd/brand-studio@1.0.0`: controlled wizard, real preview, diagnostics,
  JSON review, and typed host intents without persistence or authority.
- Lemn UI and Docs prove the public catalog; protected Lemn UI Admin is a
  persistence-free sandbox for mappings, proposals, and experiments.

### AgentOps branding simulator

- Simulates the platform authority while AgentOps is under development.
- Owns Workspace, Branding, BrandingVersion, authorization, Postgres, R2,
  publication, activation, preview sessions, idempotency, outbox, and audit.
- Hosts Brand Studio through an adapter; it does not fork UI contracts or
  provider behavior.
- Exposes a private runtime as a Cloudflare `WorkerEntrypoint` and an authenticated
  HTTPS adapter for external servers.

### Branding MCP

- Owns MCP transport only and delegates business decisions to the authority.
- Workspace identity comes from the authenticated MCP identity, never tool input.
- It exposes exactly these mutation tools:

```text
create_branding_draft
patch_branding_draft
validate_branding_draft
create_branding_preview
archive_branding_draft
restore_branding_draft
publish_branding_draft
```

- It exposes exactly these resources:

```text
agentops://context
agentops://branding
agentops://branding/versions
agentops://branding/versions/{versionId}
agentops://branding/schema
agentops://branding/system-brandings
agentops://branding/system-brandings/{templateId}/versions/{version}
agentops://ui/catalog
```

- It exposes no activate, rollback, SQL, filesystem, generic HTTP, secret, R2,
  or provider tools. Production activation remains human-only.

### Lunaria Care

- Is the realistic appointment-scheduling consumer.
- Owns product data, routes, authorization, actions, loading/error/empty states,
  and its Postgres database.
- Imports exact published LEMN packages, never providers directly.
- Demonstrates SSR branding, mode switching, controlled previews, blocks, and
  visualization tokens across Recharts and ECharts.
- Has no branding database, R2, Queue, publication, admin, or secret-management
  authority.

## Runtime and preview contract

Same-account Cloudflare consumers call only:

```text
resolveBranding({ requestedModeId? })
exchangeBrandingPreview({ sessionId, code, origin, audience })
resolveBrandingPreview({ sessionId, sessionBearer, requestedModeId? })
```

Deployment-owned `ctx.props` authenticate the exact `workspaceId`, `consumerId`,
and `branding:resolve` permission. RPC inputs cannot override tenant identity.
External servers use a least-privilege `WorkspaceRuntimeCredential` in
server-only configuration.

Publication keeps the full `CompiledBrandingObject` and source-adjacent data in
private R2. It additionally materializes one signed minimal mode object per
allowed mode. Each projection contains only its critical CSS, hydration
bootstrap, font metadata, and public asset references; it contains no source
definition, private storage key, provider credential, or other-mode
configuration. Its canonical `projectionHash` is recalculated by the consumer,
and the signature binds Workspace, BrandingVersion, numeric publication version
or preview draft, schema/compiler versions, definition/compiled/mode hashes,
and `projectionHash`.

Active envelopes carry exactly one positive-version mode object. Preview
envelopes carry exactly one `version: null` mode object, are labelled `draft`,
and are pinned to one-use exchange, session, Workspace, exact definition hash,
exact expiry, origin, and audience. The session bearer never enters HTML, URLs,
browser storage, logs, or evidence.

The server verifies the strict envelope, canonical projection hash, signature,
signed identity, compatibility, selected allowed mode, public asset closure,
and expiry before emitting CSS or markup. Active failure may use only a
release-embedded map of independently signed minimal mode objects. Every
fallback mode is verified and must share one publication identity before any is
selected. Preview failure renders an explicit branded unavailable state and
never falls through to active.

## Providers, components, and blocks

- The registry records exact provider origin/version/commit, license, ingestion
  mode, source path, transforms, patches, adapter, conformance, and last sync.
- A provider update creates a reviewable proposal and never updates production
  automatically.
- Multiple chart providers are allowed only for materially different canonical
  capabilities; duplicate public components are not.
- Blocks are curated compositions with a stable purpose and interaction contract.
  They use public LEMN components and expose data/actions as controlled inputs.
- Data-fetching or product-policy behavior does not move into a block.

## Fonts

System fonts are preferred for zero-download fast paths. Managed WOFF2 families
are self-hosted on the LEMN Cloudflare CDN, immutable, CORS/CSP compatible, and
integrity-bound. Every role declares system emergency fallbacks.

- `preferred`: render immediately with the fallback and optionally swap.
- `required`: preload and use the browser block period, then fail safely to the
  declared emergency fallback if bytes are unavailable.

SSR emits declarations and preloads but the browser still downloads font bytes.

## Delivery and proof gates

1. Validate schemas, compiler determinism, semantic-token parity, accessibility,
   package boundaries, zero legacy, and managed AgentOps checksums.
2. Build and install all four package tarballs in strict clean consumers.
3. Publish immutable exact versions through the protected main release workflow.
4. Install those registry versions in the simulator and Lunaria with frozen
   lockfiles and no aliases.
5. Materialize an independently signed, all-allowed-mode fallback map and JWK
   from the runtime owner without exporting the private full artifact.
6. Deploy UI Docs, Lemn UI Portal, simulator control plane/runtime,
   Branding MCP, and Lunaria from `main`.
7. Demonstrate authoring, validation, publication, human activation, active SSR,
   exact preview, light/dark switching, live visual changes after reload, runtime
   outage fallback, and cross-provider chart token parity.
8. Verify production URLs, release identities, headers, protected boundaries,
   logs/evidence, and clean worktrees.

## Applied patterns

`PAT-UI-PROVIDER-FIRST-001`, `PAT-UI-BRAND-CONTRACT-001`,
`PAT-UI-SSR-BRANDING-001`, `PAT-UI-LEMN-001`, `PAT-UI-BLOCKS-001`,
`PAT-UI-FRONTEND-PLATFORM-BOUNDARY-001`, `PAT-DATA-POSTGRES-001`,
`PAT-ASYNC-OUTBOX-001`, `PAT-CLOUDFLARE-SERVICE-BINDINGS-001`,
`PAT-SEC-AUTHORIZATION-001`, `PAT-SEC-TENANT-ISOLATION-001`,
`PAT-SEC-AUDIT-EVENTS-001`, and `PAT-OPS-LEAST-PRIVILEGE-001` govern this plan.
