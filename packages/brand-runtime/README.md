# @lemn-ltd/brand-runtime

Server-only branding resolution and SSR helpers for LEMN applications.

The package resolves one active or preview `BrandingVersion`, accepts only one
minimal signed `CompiledBrandingModeObject`, verifies its canonical
`projectionHash` and signed Workspace/publication identity, and produces
critical CSS, font preloads, safe public asset references, and a minimal
hydration bootstrap before the first HTML byte is sent. Runtime envelopes never
contain the source definition, a full compiled artifact, private storage keys,
provider credentials, or another mode's configuration.

Active resolution has a bounded embedded branded fallback containing an exact
map of independently signed minimal mode projections. Every projection in the
map is verified before use and must share one publication identity; this allows
server-owned light/dark selection without embedding the private full artifact.
Preview resolution never silently falls back to active branding.

Runtime and MCP credentials are different. Same-account Cloudflare consumers
use the RPC Service Binding adapter with a dedicated `WorkerEntrypoint` and
deployment-owned `ctx.props` containing the exact Workspace, consumer, and
`branding:resolve` capability. External servers use the HTTPS adapter and keep
their Workspace runtime credential server-side. This package contains no
browser effect, routing, cookie signing, or persistence.

Hosted previews use a separate one-use exchange and a short-lived session
bearer. The consumer owns its encrypted or server-backed `HttpOnly; Secure`
host session and passes decoded, server-only `BrandingPreviewSelection` claims
to this package. Preview resolution is pinned to the exact `definitionHash`,
returns `version: null` for the draft, and never falls back to active branding.
Neither the session bearer nor the active runtime credential is serialized into
CSS, HTML attributes, the hydration bootstrap, URLs, or request bodies.

The default private endpoints are:

- `POST /internal/v1/branding/resolve`
- `POST /internal/v1/branding/previews/exchange`
- `POST /internal/v1/branding/previews/resolve`

Those HTTP endpoints belong to the authenticated HTTPS adapter. The RPC adapter
calls `resolveBranding`, `exchangeBrandingPreview`, and
`resolveBrandingPreview` directly and never invents tenant identity from a
request body.

`createBrandingSsrParts` emits the selected color scheme, immutable font
preloads, critical scoped CSS, and a hydration document bound to the exact
signed `projectionHash` and mode before host markup.
`assertBrandingHydrationIdentity` rejects a document from another mode even when
both modes share one `compiledHash`. `brandingContentSecurityPolicySources`
derives `font-src` from every
verified selected-mode font resource origin, including non-preloaded
`preferred` fonts, and rejects credentialed or non-HTTPS origins. Consumers
must render those parts during SSR; a browser repair fetch is not a supported
integration.

Use exact package versions; never install `latest`.
