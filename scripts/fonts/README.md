# Curated font CDN catalog v2

Owner: LEMN UI

Decision date: 2026-07-16
Patterns: `PAT-ARCH-CHANGE-SCOPE-001`, `PAT-CODE-SCRIPT-GOVERNANCE-001`,
`PAT-CLOUDFLARE-BUNDLE-ASSETS-001`, `PAT-INFRA-RESOURCE-CONTRACT-001`,
`PAT-SEC-SECRETS-001`, `PAT-SEC-RISK-001`, `PAT-TEST-EVIDENCE-001`

This directory is the reproducible, deployment-independent source plan for the
managed font CDN used by `BrandingDefinition` v1. Brand Contract publishes its governed
font and legal metadata, while Brand Studio only presents that catalog. This
directory does not create Cloudflare resources by itself.

## Contract

`catalog.json` is the Git authority for the initial curated catalog:

- Inter
- Open Sans
- Source Sans 3
- Plus Jakarta Sans
- Space Grotesk
- Source Serif 4
- Lora
- JetBrains Mono

Every face records an official Google Fonts distribution URL, the full commit
that last changed that family directory in `google/fonts`, expected byte size,
SHA-256, roles, style, weight range, object key, and final CDN URL. Every family
also records the pinned OFL-1.1 source URL, an exact governed copy under
`scripts/fonts/licenses/<family>/OFL.txt`, its byte size and SHA-256, copyright
notice, pinned distributor directory, original project URL, immutable object
key, and public license URL. The sync path downloads the upstream WOFF2
byte-for-byte and does not subset, recompress, rename internally, or otherwise
transform it.

The initial assets are the official `latin` variable-font subsets. A product
must not claim coverage for another script or subset until its exact upstream
files and Unicode ranges are added to the manifest and pass the same checks.

Published object keys are content-addressed:

```text
v2/<sha256>/<face>.woff2
https://fonts.ui.le-mn.com/v2/<sha256>/<face>.woff2

v2/licenses/<family>/<ofl-sha256>/OFL.txt
https://fonts.ui.le-mn.com/v2/licenses/<family>/<ofl-sha256>/OFL.txt
```

An existing object at that key must contain exactly the expected bytes. The
sync script refuses to overwrite a mismatched object. A font update therefore
creates a new URL and a later published branding definition; it never mutates an asset
referenced by an existing revision.

## Commands

Source-only preflight is the default. It downloads all upstream fonts into a
private temporary directory, checks the WOFF2 magic, size, and SHA-256, and
removes the temporary directory afterward. It also downloads each
commit-pinned OFL source and requires it to match its governed repository copy
byte-for-byte, including the declared size, SHA-256, copyright first line, and
complete SIL OFL 1.1 text:

```sh
node scripts/fonts/sync-font-cdn.ts
node scripts/fonts/sync-font-cdn.ts --preflight
```

To also inspect a previously created dedicated R2 bucket without mutation:

```sh
CLOUDFLARE_API_TOKEN=... node scripts/fonts/sync-font-cdn.ts \
  --preflight --bucket lemn-dev-ui-font-assets
```

To upload only missing objects after all checks pass:

```sh
CLOUDFLARE_API_TOKEN=... node scripts/fonts/sync-font-cdn.ts \
  --apply --bucket lemn-dev-ui-font-assets
```

Equivalent when AgentOps provides the authorized Global API Key credential.
The account id is read from that secret's metadata and pins Wrangler to the
verified account when the operator can access more than one Cloudflare account:

```sh
CLOUDFLARE_API_KEY=... CLOUDFLARE_EMAIL=... \
CLOUDFLARE_ACCOUNT_ID=<account_id_from_secret_note> \
  node scripts/fonts/sync-font-cdn.ts \
  --apply --bucket lemn-dev-ui-font-assets
```

`FONT_CDN_R2_BUCKET` may replace `--bucket` only for `--apply`. The script uses
`pnpm exec wrangler r2 object put` with `--remote`, Standard storage, and
`public, max-age=31536000, immutable`. Font objects use `font/woff2`; license
objects use `text/plain; charset=utf-8`. It then reads back every upload through
the public CDN path using an `Origin` request and re-verifies bytes, hash,
governed `Content-Type`, immutable one-year `Cache-Control`, and CORS
allow-origin response. `--apply` is the only mutating mode.

Use either a resource-scoped `CLOUDFLARE_API_TOKEN` or, when AgentOps identifies
the authorized organization credential as a Cloudflare Global API Key, the
complete `CLOUDFLARE_API_KEY` plus `CLOUDFLARE_EMAIL` pair and the
`CLOUDFLARE_ACCOUNT_ID` from its metadata. Never map a Global API Key into
`CLOUDFLARE_API_TOKEN`. Before a mutation, `wrangler whoami` must report that
exact account id. Mixed or incomplete authentication is rejected. Credentials
are inherited by Wrangler, never put in command arguments, manifest data, logs,
or error messages.

`discover-google-fonts.ts` is a maintainer aid that reads the current official
Google Fonts CSS/API and prints candidate provenance, URLs, hashes, and sizes to
stdout. It never edits the manifest. Discovery output requires human review;
updating the catalog is an explicit source change followed by tests and
preflight.

## Script catalog

| Command | Category | Scope | Target | Mutates | Secrets | CI | Removal |
|---|---|---|---|---|---|---|---|
| `sync-font-cdn.ts --preflight` | check | Manifest and exact upstream assets | Local/network | No | None | Suitable after network policy is configured | Permanent |
| `sync-font-cdn.ts --preflight --bucket ...` | smoke | Dedicated R2 contract and object parity | Explicit remote bucket | No | Scoped token or authorized Global API Key pair | Operator/release gate | Permanent |
| `sync-font-cdn.ts --apply --bucket ...` | ops | Missing immutable font and OFL objects only | Explicit remote bucket | Yes | Scoped token or authorized Global API Key pair | Never implicit | Permanent |
| `discover-google-fonts.ts` | ops | Candidate source discovery | Google Fonts/GitHub | No repository or Cloudflare mutation | None | No | Keep while Google Fonts is a provider |

## Cloudflare resource contract

The resource is one dedicated R2 Standard bucket owned by LEMN UI in the Lemn
DEV Cloudflare account.

| Field | Contract |
|---|---|
| Purpose | Immutable public webfont origin |
| Source of truth | `scripts/fonts/catalog.json` |
| Cloud resource | `lemn-dev-ui-font-assets` |
| Runtime binding | None; the hot path is the R2 custom domain, not a Worker |
| Public hostname | `fonts.ui.le-mn.com` |
| Object prefix | `v2/` |
| Font objects | `v2/<font-sha256>/<face>.woff2` |
| License objects | `v2/licenses/<family>/<ofl-sha256>/OFL.txt` |
| Storage class | R2 Standard |
| Writes | Maintainer/release identity only |
| Reads | Public through the custom domain |
| Development URL | `r2.dev` disabled |
| Lifecycle | Retain while referenced; deletion requires reference audit |
| Cache | One year at browser/edge; Smart Tiered Cache recommended |

Resource status on 2026-07-16:

- `lemn-dev-ui-font-assets`: created in Lemn DEV.
- `fonts.ui.le-mn.com`: active R2 custom domain with TLS 1.2 minimum.
- `r2.dev`: disabled; the governed custom domain is the only public endpoint.
- `cors-policy.json`: applied and verified for public `GET`/`HEAD` reads.
- Font objects: all 15 catalog faces uploaded and verified byte-for-byte through
  `fonts.ui.le-mn.com` on 2026-07-16.
- License objects: all eight exact governed OFL artifacts are uploaded and
  remotely verified alongside the WOFF2 objects on 2026-07-16.

Applied configuration and remaining hardening:

1. The `fonts.ui.le-mn.com` R2 custom domain is active and `r2.dev` is disabled.
2. Bucket CORS from `cors-policy.json` permits public `GET`/`HEAD` font reads.
   Public browser fonts return `Access-Control-Allow-Origin: *`; CORS is
   interoperability, not DRM. Applying the file is an explicit mutation:

   ```sh
   pnpm exec wrangler r2 bucket cors set lemn-dev-ui-font-assets \
     --file scripts/fonts/cors-policy.json --force
   ```

3. Verify the applied policy without mutation:

   ```sh
   pnpm exec wrangler r2 bucket cors list lemn-dev-ui-font-assets
   ```

4. A Cache Rule for the hostname/path with a one-year Edge TTL and Smart Tiered
   Cache. WOFF2 is already cacheable by extension.
5. Response headers `Cross-Origin-Resource-Policy: cross-origin` and
   `X-Content-Type-Options: nosniff`.
6. A retention or Bucket Lock policy that prevents premature deletion without
   making planned garbage collection impossible.

The R2 bucket is not an authorization boundary for licensed font use. Only
assets whose license permits the intended self-hosted webfont distribution may
enter the catalog. License evidence is pinned in the manifest and projected
into `fontCatalog`. Any future provider with product or domain restrictions
must add an explicit control-plane policy before its assets can enter a
published branding definition.

## Failure behavior

- Source hash, size, URL host, schema, governed OFL, copyright, or WOFF2
  mismatch: stop before any Cloudflare command.
- Missing, mixed, or incomplete credentials: stop without displaying values.
- Bucket unavailable or Wrangler error: stop; do not attempt uploads.
- Existing remote object differs from the manifest: stop and preserve it for
  investigation; never overwrite.
- Missing object during `--preflight`: report it without mutation.
- Missing object during `--apply`: upload, read back, and verify.

The deployed delivery path is proven by
the remote preflight: eight families, 15 immutable WOFF2 faces, eight exact OFL
artifacts, exact hashes, governed content types, public CORS, and one-year
immutable browser cache headers.

## Legal artifact publication

The eight license objects are immutable additions and never overwrite font
objects. Re-running the following commands with the authorized Cloudflare
credential loaded only in the operator process is idempotent:

```sh
node scripts/fonts/sync-font-cdn.ts --apply \
  --bucket lemn-dev-ui-font-assets

node scripts/fonts/sync-font-cdn.ts --preflight \
  --bucket lemn-dev-ui-font-assets
```

`fontCatalog` exposes the public governed license URL, source license URL,
license SHA-256, copyright notice, pinned Google Fonts directory, and original
upstream project URL for each managed family. Brand Studio links the public OFL
copy and visibly displays its pinned source plus copyright attribution. These
governed copies preserve rather than replace the upstream notices.
