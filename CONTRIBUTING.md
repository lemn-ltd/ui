# Contributing

This repository is the source of truth for shared Lemn UI. Keep changes
small, neutral, documented, and releasable.

## Scope

- Put reusable visual primitives, layout primitives, tokens, motion, and shared
  presentational components in `packages/ui/src`.
- Keep product-specific workflows, API adapters, runtime DTOs, customer data,
  and feature composition in consuming product apps.
- If a product app needs a shared style, migrate it here first, publish a new
  `@lemn-ltd/ui` version, then update the product dependency.
- Do not rely on consumer-side `node_modules` edits, copied `dist` files, or
  app-local forks as permanent fixes.

## Neutrality Rules

- Do not add product names, tenant names, customer names, personal names,
  product-specific route names, or product-specific icons under `packages/ui/src`.
- Use generic examples such as `Example workspace`, `Acme`, or `Design System`
  in tests and showcase fixtures.
- Components must be prop-driven and presentational. The host owns data fetching,
  permissions, persistence, routing, telemetry, and product policy.
- Agent components may model reusable lifecycle, approval, execution, evidence,
  and capability concepts, but they must not import product contracts or backend
  DTOs directly.
- Run `pnpm validate:brand-neutrality` before publishing or opening a PR.

## Public API Rules

- Prefer additive API changes.
- Do not remove or rename exports without a consumer migration plan.
- Import from public barrels in consumers. Do not deep-import `src`, `dist`, or
  internal component files from product apps.
- Keep React and React DOM as peer dependencies.
- Keep headless UI dependencies inside this package; product apps should not
  import Radix, `cmdk`, or `sonner` directly for shared UI behavior.
- Run `pnpm validate:boundaries` when changing imports in `packages/ui/src`.

## Styling Rules

- Use design tokens for color, spacing, radius, type, shadow, and motion.
- Colocate component CSS beside the component that imports it.
- Keep `src/styles.css` as the single root stylesheet import for consumers.
- Do not hard-code product palettes, logos, domain icons, app names, or route
  structure into shared components.
- When adding a component-local CSS file, verify `pnpm --filter @lemn-ltd/ui run
  build` copies it to `dist` with the same relative path.

## Documentation And Showcase

- Update `src/catalog.ts` or the relevant catalog entry file when adding,
  renaming, or changing component status.
- Update `packages/ui/docs/components.md` for every catalogued component.
- Update `packages/ui/docs/patterns.md` when changing recommended screen
  composition.
- Add or update a showcase page when a component or important variant changes.
- Keep showcase examples neutral and deterministic.
- Put the canonical, deterministic interaction in the first `ExampleBlock` of
  every component or pattern page. The overview reuses that real rendered example
  as its lazy preview, and the shared playground makes it interactive.
- Foundation pages must use `FoundationPage`; its first child is the canonical
  live preview. Do not add checked-in screenshots or a separate thumbnail demo.
- Keep preview examples self-contained: they must not depend on production data,
  remote requests, authentication, or mutable time.

## Validation

Run the narrowest relevant checks while iterating, then run the package gate
before release:

```bash
pnpm validate:identity
pnpm validate:brand-neutrality
pnpm validate:boundaries
pnpm --filter @lemn-ltd/ui run check
pnpm --filter @lemn-ltd/ui run test
pnpm --filter @lemn-ltd/ui run build
```

For showcase or docs behavior, also run:

```bash
pnpm --filter @lemn-ltd/ui-showcase run check
pnpm --filter @lemn-ltd/ui-showcase run test
pnpm dev:showcase
```

## Release Rules

- Add a changeset with `pnpm changeset` for every publishable package change.
- Let CI generate the release metadata commit that updates
  `packages/ui/package.json` and `packages/ui/CHANGELOG.md`; do not hand-edit
  package versions in feature PRs.
- Treat published GitHub Package versions as immutable. Do not reuse an existing
  version to fix packaging or CSS output.
- Commit and push only reviewed source changes. Avoid mixing unrelated worktree
  changes into the release commit.
- The CI workflow publishes `@lemn-ltd/ui` when the pushed version is not already
  present and the registry owner/token can publish the package scope. If the
  package scope and GitHub repo owner are not aligned, CI records a warning and
  continues the docs/showcase deploy.
- The CI workflow deploys docs to `ui.le-mn.com` and the interactive showcase
  to `showcase.ui.le-mn.com` after the release automation has run.
- After publish, update consuming repos to the new version and regenerate their
  lockfiles.
