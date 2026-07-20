# Lemn UI

Provider-first, brand-neutral React UI infrastructure for LEMN products. The
workspace publishes curated components, visualizations, blocks, branding
contracts, SSR runtime support, and a single UI Portal without exposing provider
APIs to consumers.

## Packages

| Package | Responsibility |
| --- | --- |
| `@lemn-ltd/ui` | Components, visualizations, blocks, semantic styles, and catalogs |
| `@lemn-ltd/brand-contract` | Versioned branding schema and deterministic compiler |
| `@lemn-ltd/brand-runtime` | Verified first-byte SSR branding resolution |
| `@lemn-ltd/brand-studio` | Controlled branding authoring and preview UI |
| `@lemn-ltd/provider-registry` | Pinned provider mapping, provenance, and conformance |

## Development

Requires Node.js `>=22` and pnpm `11.8.0` through Corepack.

Private package authentication belongs only in `~/.npmrc`:

```ini
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
pnpm install --frozen-lockfile
pnpm validate
```

Use `pnpm dev:portal` for the UI Portal and `pnpm dev:docs` for documentation.

Production deploys target the `lemn-ui-portal` Worker in Cloudflare account
`Lemn DEV` and zone `le-mn.com`. Its protected token is limited to
`Workers Scripts: Edit`, `Zone: Read`, and `Workers Routes: Edit`; the complete
contract lives in the
[Portal infrastructure guide](apps/ui-portal/docs/infrastructure/README.md).

## Documentation

- [Architecture](apps/docs/src/content/docs/architecture/index.mdx)
- [Branding](apps/docs/src/content/docs/branding/index.mdx)
- [Provider governance](apps/docs/src/content/docs/providers/index.mdx)
- [SSR branding](apps/docs/src/content/docs/ssr-branding/index.mdx)
- [Portal](apps/docs/src/content/docs/portal/index.mdx)
- [Package consumption](packages/ui/README.md)
- [Contributing](CONTRIBUTING.md)

Public documentation is available at [ui.le-mn.com](https://ui.le-mn.com) and
the catalog at [portal.ui.le-mn.com](https://portal.ui.le-mn.com).
