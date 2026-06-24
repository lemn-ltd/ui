# Project Map

Read this reference when using `component-capture-migration`, then inspect the current files before editing.

## Package Layout

- Workspace root: `/Users/angelloor/Documents/SWE/LEMN/code/ui`
- Design system package: `packages/ui`
- Human docs app: `apps/docs`
- Showcase app: `apps/showcase`
- Showcase kit helpers: `packages/showcase-kit`
- Component docs: `packages/ui/docs/components.md`
- Public docs domain: `https://ui.appranks.com`
- Public showcase domain: `https://showcase.ui.appranks.com`

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

## Showcase Files

- App command: `pnpm dev:showcase`
- Vite dev server: `http://localhost:6500`
- Page examples: `apps/showcase/src/client/pages/core/components/*.page.tsx`
- Agent component examples: `apps/showcase/src/client/pages/agents/components/*.page.tsx`
- Registry root: `apps/showcase/src/client/registry/showcase-registry.ts`
- Component registry helper: `apps/showcase/src/client/registry/component-entry.ts`
- Registry entry files:
  - `apps/showcase/src/client/registry/entries/primitives.tsx`
  - `apps/showcase/src/client/registry/entries/forms.tsx`
  - `apps/showcase/src/client/registry/entries/overlays.tsx`
  - `apps/showcase/src/client/registry/entries/navigation.tsx`
  - `apps/showcase/src/client/registry/entries/data-display.tsx`
  - `apps/showcase/src/client/registry/entries/feedback.tsx`
  - `apps/showcase/src/client/registry/entries/layout.tsx`
  - `apps/showcase/src/client/registry/entries/agents.tsx`
- Fixtures: `apps/showcase/src/client/fixtures/`
- How to add showcase pages: `packages/showcase-kit/docs/adding-a-showcase.md`

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
- Showcase behavior/visual tests: `apps/showcase/tests/e2e/`.
- Visual route list: `apps/showcase/tests/e2e/visual.e2e.ts`.
- Playwright projects already cover:
  - desktop: `1280x900`
  - tablet: `768x1024`
  - mobile: `375x812`
  - light and dark themes for visual tests
- Deterministic Playwright helpers: `apps/showcase/tests/helpers/deterministic.ts`.

## Useful Commands

```bash
pnpm dev:showcase
pnpm --filter @appranks/ui run test
pnpm --filter @appranks/ui run check
pnpm --filter @appranks/ui-showcase run test
pnpm --filter @appranks/ui-showcase run test:e2e
pnpm run check
pnpm run build
```

## Local Conventions To Preserve

- Catalog drives showcase metadata. A showcase component route must have a matching `@appranks/ui` catalog entry.
- Use `componentEntry('<slug>', () => <Page />)` for catalog-backed showcase entries.
- Component folders usually contain the `.tsx`, `.css`, and `tests/` files.
- Components use typed props, explicit exported types, local CSS imports, and `data-*` attributes for variants/states.
- Keep visual baselines under `apps/showcase`, not package or product app folders.
