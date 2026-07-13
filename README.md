# Appranks UI

Shared, brand-neutral UI system for Appranks projects. The repository owns the
published `@lemn-ltd/ui` React package, its public component catalog, the docs
site at `https://ui.lemn.ai`, and the showcase site at
`https://showcase.ui.lemn.ai`.

`@lemn-ltd/ui` is the source of truth for shared styles. If a consuming product
needs a reusable component, token, layout, or style migration, make that change
in this repository first, publish a new package version, then update the
consumer. Do not patch `node_modules` or copy shared component CSS into product
apps as a permanent fix.

## Packages

- `@lemn-ltd/ui` - public component and token package, published to GitHub Packages.
- `@appranks/showcase-kit` - internal workspace package for showcase page chrome.
- `@appranks/ui-docs` - Astro Starlight docs deployed to `https://ui.lemn.ai`.
- `@appranks/ui-showcase` - Cloudflare Worker SPA deployed to `https://showcase.ui.lemn.ai`.

## Requirements

- Node.js `>=22`.
- pnpm `11.8.0` through Corepack.
- Access to GitHub Packages for the `@lemn-ltd` scope.
- A GitHub token with package read access for local installs. Publishing requires
  package write access.

```bash
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm install
```

## Install In A Consumer Repo

Keep only the package scope mapping in the consuming repository:

```ini
# .npmrc
@lemn-ltd:registry=https://npm.pkg.github.com
```

Configure authentication in the user's `~/.npmrc`, which must never be
committed to a repository:

```ini
# ~/.npmrc
@lemn-ltd:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Load a classic GitHub personal access token with `read:packages` and repository
access into `NODE_AUTH_TOKEN` through the local secret manager. The registry
mapping alone, or `NODE_AUTH_TOKEN` without the user-level `_authToken` entry,
does not authenticate npm or pnpm.

```bash
pnpm add @lemn-ltd/ui@<published-version>
```

Consumers need compatible React peer dependencies. This workspace currently
catalogs React and React DOM at `19.2.4`.

Import the package from its public surface only:

```tsx
import { Button, Card, componentCatalog } from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css";
```

Import `@lemn-ltd/ui/styles.css` once at the application root. Do not deep-import
from `@lemn-ltd/ui/dist`, `@lemn-ltd/ui/src`, Radix, `cmdk`, or `sonner` in
product apps.

## Agent Access

Agents should discover available components through:

- `https://showcase.ui.lemn.ai/catalog.json`
- `https://showcase.ui.lemn.ai/llms.txt`
- `https://showcase.ui.lemn.ai/llms-full.txt`

Rules:

- Use existing `@lemn-ltd/ui` components before creating app-local UI.
- Import only from the public package surface.
- Do not deep-import package internals.
- Do not import Radix, cmdk, or sonner directly in product apps.

## Local Development

```bash
pnpm install
pnpm dev:showcase
```

The showcase runs at `http://localhost:6500`.

Useful package commands:

```bash
pnpm --filter @lemn-ltd/ui run build
pnpm --filter @lemn-ltd/ui run check
pnpm --filter @lemn-ltd/ui run test
pnpm validate:package-identity
pnpm validate:brand-neutrality
pnpm validate:boundaries
```

## Release Flow

1. Make shared UI changes in `packages/ui/src`.
2. Update package docs and showcase coverage when the public surface changes.
3. Run `pnpm validate:brand-neutrality`, `pnpm validate:boundaries`,
   `pnpm --filter @lemn-ltd/ui run check`, `pnpm --filter @lemn-ltd/ui run test`,
   and `pnpm --filter @lemn-ltd/ui run build`.
4. Add a changeset with `pnpm changeset` for every publishable package change.
   The release workflow turns merged changesets into a release metadata commit
   that updates `packages/ui/package.json`, `packages/ui/CHANGELOG.md`, and the
   docs changelog.
5. Before versioning, pushing, or publishing, CI validates the configured
   Cloudflare Global API Key, account membership, Worker write permissions, and
   access to the production DNS zone without changing ownership or domains. This repository uses
   `CLOUDFLARE_API_KEY` with `CLOUDFLARE_EMAIL`; it must not map the Global API
   Key to `CLOUDFLARE_API_TOKEN`.
6. CI publishes `@lemn-ltd/ui` only when the package version is not already
   available in the authenticated GitHub Packages version list and the package
   scope matches the repository owner. Authentication, authorization, package
   lookup, or network failures stop the release instead of being treated as an
   unpublished version.
7. Update each consuming repo to the newly published version and regenerate its
   lockfile.

The current Lemn DEV credential does not expose the `lemn.ai` zone. The active
`ui.lemn.ai` and `showcase.ui.lemn.ai` domains were deployed from a different
Cloudflare account. Release therefore fails closed during preflight, before a
version commit, push, or package publish, until zone ownership/access is
resolved explicitly. Do not change account IDs or domain ownership merely to
bypass this gate.

## Documentation

- [Package usage guide](packages/ui/README.md)
- [Agent-facing component guide](packages/ui/docs/README.md)
- [Contribution rules](CONTRIBUTING.md)
- [Human docs](https://ui.lemn.ai)
- [Interactive showcase](https://showcase.ui.lemn.ai)
