# Appranks UI

Company design system for Appranks projects.

## Packages

- `@appranks/ui` - public component and token package, published to GitHub Packages.
- `@appranks/showcase-kit` - internal workspace package for showcase page chrome.
- `@appranks/ui-showcase` - Cloudflare Worker SPA deployed to `https://ui.appranks.com`.

## Agent Access

Agents should discover available components through:

- `https://ui.appranks.com/catalog.json`
- `https://ui.appranks.com/llms.txt`
- `https://ui.appranks.com/llms-full.txt`

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
