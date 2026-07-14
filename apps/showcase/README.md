# @lemn-ltd/ui-showcase

`apps/showcase` is a static Cloudflare Worker SPA that renders the whole
`@lemn-ltd/ui` catalog as a functional docs site. It owns no backend: no D1,
PostgreSQL, Hyperdrive, R2, KV, Durable Objects, Queues, Workflows, or service
bindings. It owns only the `ASSETS` binding that serves the Vite client bundle.

## Local Cloudflare Surface

| Field | Value |
| --- | --- |
| Package | `@lemn-ltd/ui-showcase` |
| Local URL | `http://localhost:6500` |
| Dev command | `make dev-ui-showcase` |
| Package dev | `pnpm --filter @lemn-ltd/ui-showcase run dev` |
| Status | `/health`, `/health/ready`, `/_status`, `/_status.json` |
| Local Explorer | `http://localhost:6500/cdn-cgi/explorer` |
| Local Explorer API | `pnpm --filter @lemn-ltd/ui-showcase run observe:local:explorer-api` |

## Ownership And Boundaries

- The host owns the worker shape, `SHOWCASE_REGISTRY`, the dogfooded shell, and
  the page-authoring primitives (`ExampleBlock`, `Controls`, `PropsTable`,
  `VariantsGallery`).
- `SHOWCASE_REGISTRY` is the one source of truth for nav, routes, and the
  command palette.
- Core routes live under `/core/foundations/<slug>`,
  `/core/components/<slug>`, and `/core/patterns/<slug>`.
- Agent-compatible shared components live under `/agents/components/<slug>`.
- Product apps consume `@lemn-ltd/ui`; they do not own local showcase routes,
  local design catalogs, or duplicate component docs.
- The client imports only the `@lemn-ltd/ui` public surface. It never deep-imports
  `packages/ui/src/...`, `radix-ui`, `cmdk`, or `sonner` directly.
- The worker entry imports none of `react`, `react-router`, `radix`, `cmdk`, or
  `sonner`; it uses Worker `env` plus the data-only component catalog.
- Do not add API routes or service bindings here.

## Runtime Bindings

- `ASSETS` - serves the Vite client bundle. This is the only binding.

## Service Graph

Inbound consumers: none.

Outbound service dependencies: none.

## Development

The client consumes `@lemn-ltd/ui` from source via Vite/Vitest aliases to
`../ui/src`, so the catalog stays the single visual source of truth without a
package rebuild during development.

```bash
make dev-ui-showcase
```

Toggle the theme from the top bar, open the command palette with Cmd/Ctrl+K,
and browse the catalog. Component pages are authored alongside their registry
entries.

## Environment

`DEPLOYMENT_ENVIRONMENT` selects local, staging, production, or test.
`STATUS_TOKEN` is optional locally and required in staging for deep status
routes. Local secrets live in the versioned encrypted `.dev.vars`; `.env.keys`
owns the local `DOTENV_PRIVATE_KEY_VARS` and stays ignored. Start through
`make dev-ui-showcase` or `pnpm env:with --service ui-showcase -- <command>` so
`.dev.vars` is decrypted only for the local process and re-encrypted on exit.
Production uses the `lemn-ui-showcase` Worker and `showcase.ui.le-mn.com`.

## Fidelity

Lane A human faithfulness review lives under `tests/fidelity/`:
`fidelity-matrix.md` is the signed matrix, `master-manifest.json` tracks each
master's node id and the `ui.pen` hash, and `fidelity:capture-masters` /
`fidelity:contact-sheets` build the review artifacts. Sign-off is blocked until
a second reviewer signs against the canonical `packages/ui/design/ui.pen`.
Lane B is the automated regression lane.

## Testing And Observability

```bash
pnpm --filter @lemn-ltd/ui-showcase run check
pnpm --filter @lemn-ltd/ui-showcase run test
pnpm --filter @lemn-ltd/ui-showcase run cf:dry-run
make test-e2e-ui-showcase
pnpm --filter @lemn-ltd/ui-showcase run observe:production:tail
```

The worker unit spec covers `/health` 200, SPA asset fallback, and readiness
503 when `ASSETS` is missing. `make test-e2e-ui-showcase` is the canonical
complete Playwright lane for behavior, visual baselines, and axe. It starts and
cleans up its own strict-port server isolated by checkout; it never reuses the
development server on port 6500 or a server from another worktree.

Visual assertions keep paired Darwin and Linux baselines at the unchanged 1%
pixel threshold. Regenerate the Linux side reproducibly with the pinned
Playwright container. The generator archives the immutable Git index, rejects
unstaged or untracked source, and replaces existing Linux images only after all
90 outputs have exact filename parity with Darwin. Stage the intended source
tree before running it:

```bash
pnpm visual:update:linux
```
