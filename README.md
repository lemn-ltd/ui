# Appranks UI

Shared, brand-neutral UI system for Appranks projects. The repository owns the
published `@appranks/ui` React package, its public component catalog, the docs
site at `https://ui.le-mn.com`, and the showcase site at
`https://showcase.ui.le-mn.com`.

`@appranks/ui` is the source of truth for shared styles. If a consuming product
needs a reusable component, token, layout, or style migration, make that change
in this repository first, publish a new package version, then update the
consumer. Do not patch `node_modules` or copy shared component CSS into product
apps as a permanent fix.

## Packages

- `@appranks/ui` - public component and token package, published to GitHub Packages.
- `@appranks/showcase-kit` - internal workspace package for showcase page chrome.
- `@appranks/ui-docs` - Astro Starlight docs deployed to `https://ui.le-mn.com`.
- `@appranks/ui-showcase` - Cloudflare Worker SPA deployed to `https://showcase.ui.le-mn.com`.

## Requirements

- Node.js `>=22`.
- pnpm `11.8.0` through Corepack.
- Access to GitHub Packages for the `@appranks` scope.
- A GitHub token with package read access for local installs. Publishing requires
  package write access.

```bash
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm install
```

## Install In A Consumer Repo

Add the package registry to the consuming repository:

```ini
# .npmrc
@appranks:registry=https://npm.pkg.github.com
```

Authenticate locally with a package-readable GitHub token:

```bash
export NODE_AUTH_TOKEN=<github-token>
pnpm add @appranks/ui@<published-version>
```

Consumers need compatible React peer dependencies. This workspace currently
catalogs React and React DOM at `19.2.4`.

Import the package from its public surface only:

```tsx
import { Button, Card, componentCatalog } from "@appranks/ui";
import "@appranks/ui/styles.css";
```

Import `@appranks/ui/styles.css` once at the application root. Do not deep-import
from `@appranks/ui/dist`, `@appranks/ui/src`, Radix, `cmdk`, or `sonner` in
product apps.

## Agent Access

Agents should discover available components through:

- `https://showcase.ui.le-mn.com/catalog.json`
- `https://showcase.ui.le-mn.com/llms.txt`
- `https://showcase.ui.le-mn.com/llms-full.txt`

Rules:

- Use existing `@appranks/ui` components before creating app-local UI.
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
pnpm --filter @appranks/ui run build
pnpm --filter @appranks/ui run check
pnpm --filter @appranks/ui run test
pnpm validate:brand-neutrality
pnpm validate:boundaries
```

## Release Flow

1. Make shared UI changes in `packages/ui/src`.
2. Update package docs and showcase coverage when the public surface changes.
3. Run `pnpm validate:brand-neutrality`, `pnpm validate:boundaries`,
   `pnpm --filter @appranks/ui run check`, `pnpm --filter @appranks/ui run test`,
   and `pnpm --filter @appranks/ui run build`.
4. Add a changeset with `pnpm changeset` for every publishable package change.
   The release workflow turns merged changesets into a release metadata commit
   that updates `packages/ui/package.json`, `packages/ui/CHANGELOG.md`, and the
   docs changelog.
5. CI publishes `@appranks/ui` only when the package version is not already
   available and the registry owner/token can publish the package scope. With
   GitHub Packages, a repo-owned `GITHUB_TOKEN` can publish scopes owned by the
   repo owner; otherwise CI records a publish warning and still deploys docs and
   showcase.
6. Update each consuming repo to the newly published version and regenerate its
   lockfile.

## Documentation

- [Package usage guide](packages/ui/README.md)
- [Agent-facing component guide](packages/ui/docs/README.md)
- [Contribution rules](CONTRIBUTING.md)
- [Human docs](https://ui.le-mn.com)
- [Interactive showcase](https://showcase.ui.le-mn.com)
