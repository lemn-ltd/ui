# Contributing

This repository is the source of truth for shared Appranks UI. Keep changes
small, neutral, documented, and releasable.

## Scope

- Put reusable visual primitives, layout primitives, tokens, motion, and shared
  presentational components in `packages/ui/src`.
- Keep product-specific workflows, API adapters, runtime DTOs, customer data,
  and feature composition in consuming product apps.
- If a product app needs a shared style, migrate it here first, publish a new
  `@appranks/ui` version, then update the product dependency.
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
- When adding a component-local CSS file, verify `pnpm --filter @appranks/ui run
  build` copies it to `dist` with the same relative path.

## Documentation And Showcase

- Update `src/catalog.ts` or the relevant catalog entry file when adding,
  renaming, or changing component status.
- Update `packages/ui/docs/components.md` for every catalogued component.
- Update `packages/ui/docs/patterns.md` when changing recommended screen
  composition.
- Add or update a showcase page when a component or important variant changes.
- Keep showcase examples neutral and deterministic.

## Validation

Run the narrowest relevant checks while iterating, then run the package gate
before release:

```bash
pnpm validate:brand-neutrality
pnpm validate:boundaries
pnpm --filter @appranks/ui run check
pnpm --filter @appranks/ui run test
pnpm --filter @appranks/ui run build
```

For showcase or docs behavior, also run:

```bash
pnpm --filter @appranks/ui-showcase run check
pnpm --filter @appranks/ui-showcase run test
pnpm dev:showcase
```

## Release Rules

- Bump `packages/ui/package.json` for every publishable package change.
- Treat published GitHub Package versions as immutable. Do not reuse an existing
  version to fix packaging or CSS output.
- Commit and push only reviewed source changes. Avoid mixing unrelated worktree
  changes into the release commit.
- The CI workflow publishes `@appranks/ui` when the pushed version is not already
  present in GitHub Packages.
- After publish, update consuming repos to the new version and regenerate their
  lockfiles.
