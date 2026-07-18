# Project Map

Read this reference when using `component-capture-migration`, then inspect the current files before editing.

## Package Layout

- Workspace root: `/Users/aweaxiecy/Workspaces/ui`
- Design system package: `packages/ui`
- Human docs app: `apps/docs`
- Lemn UI Portal app: `apps/ui-portal`
- Component docs: `packages/ui/docs/components.md`
- Public docs domain: `https://ui.le-mn.com`
- Public Portal domain: `https://portal.ui.le-mn.com`

## Core Design-System Files

- Public package entry: `packages/ui/src/index.ts`
- Catalog source: `packages/ui/src/catalog.ts`
- Catalog entry files:
  - `packages/ui/src/catalog-primary-entries.ts`
  - `packages/ui/src/catalog-secondary-entries.ts`
  - `packages/ui/src/catalog-automation-entries.ts`
- Catalog types: `packages/ui/src/catalog-types.ts`
- Component groups:
  - `packages/ui/src/primitives/`
  - `packages/ui/src/forms/`
  - `packages/ui/src/overlays/`
  - `packages/ui/src/navigation/`
  - `packages/ui/src/data-display/`
  - `packages/ui/src/feedback/`
  - `packages/ui/src/layout/`
  - `packages/ui/src/agents/`
- Tokens/theme:
  - `packages/ui/src/tokens.ts`
  - `packages/ui/src/styles.css`
  - `packages/ui/src/foundations/theme.ts`

## Lemn UI Portal Files

- App command: `pnpm dev:portal`
- Vite dev server: `http://localhost:6500`
- Page examples: `apps/ui-portal/src/client/pages/core/components/*.page.tsx`
- Registry root: `apps/ui-portal/src/client/registry/catalog-registry.ts`
- Component registry helper: `apps/ui-portal/src/client/registry/component-entry.ts`
- Registry entry files:
  - `apps/ui-portal/src/client/registry/entries/primitives.tsx`
  - `apps/ui-portal/src/client/registry/entries/forms.tsx`
  - `apps/ui-portal/src/client/registry/entries/overlays.tsx`
  - `apps/ui-portal/src/client/registry/entries/navigation.tsx`
  - `apps/ui-portal/src/client/registry/entries/data-display.tsx`
  - `apps/ui-portal/src/client/registry/entries/feedback.tsx`
  - `apps/ui-portal/src/client/registry/entries/layout.tsx`
  - `apps/ui-portal/src/client/registry/entries/visualizations.tsx`
- Fixtures: `apps/ui-portal/src/client/fixtures/`
- Agent source and exports remain in the repository but are not part of the active Portal registry, routes, navigation, search, machine catalogs, or browser bundles.

## Docs Files

- App command: `pnpm dev:docs`
- Astro/Starlight app: `apps/docs`
- Changelog source: `packages/ui/CHANGELOG.md`
- Generated changelog pages:
  - `apps/docs/src/content/docs/changelog/index.mdx`
  - `apps/docs/src/content/docs/es/changelog/index.mdx`
- Changelog sync command: `pnpm sync:docs-changelog`

## Tests and Visual Verification

- Component/unit tests live beside components, e.g. `packages/ui/src/primitives/button/tests/button.spec.tsx`.
- Catalog drift guard: `packages/ui/src/tests/catalog.spec.ts`.
- Portal behavior/visual tests: `apps/ui-portal/tests/e2e/`.
- Visual route list: `apps/ui-portal/tests/e2e/visual.e2e.ts`.
- Playwright projects already cover:
  - desktop: `1280x900`
  - tablet: `768x1024`
  - mobile: `375x812`
  - light and dark themes for visual tests
- Deterministic Playwright helpers: `apps/ui-portal/tests/helpers/deterministic.ts`.

## Useful Commands

```bash
pnpm dev:portal
pnpm --filter @lemn-ltd/ui run test
pnpm --filter @lemn-ltd/ui run check
pnpm --filter @lemn-ltd/ui-portal run test
pnpm --filter @lemn-ltd/ui-portal run test:e2e
pnpm run check
pnpm run build
```

## Local Conventions To Preserve

- Catalog drives Portal metadata. A Portal component route must have a matching active `@lemn-ltd/ui` catalog entry.
- Use `componentEntry('<slug>', () => <Page />)` for catalog-backed Portal entries.
- Component folders usually contain the `.tsx`, `.css`, and `tests/` files.
- Components use typed props, explicit exported types, local CSS imports, and `data-*` attributes for variants/states.
- Keep visual baselines under `apps/ui-portal`, not package or product app folders.
