---
name: component-capture-migration
description: Analyze a screenshot, image, or source URL of a UI component, compare it against this repo's @lemn-ltd/ui component catalog, identify functional and visual gaps, propose a design-system-aligned migration, implement or adapt the component, add it to the showcase, update docs, and verify responsive visual/functional parity with browser or preview tooling before writing tests. Use when the user wants to copy, recreate, migrate, or benchmark a component from another website or image into this design system.
---

# Component Capture Migration

## Core Rule

Recreate the component as an original `@lemn-ltd/ui` implementation that matches the user's target behavior and visual intent while conforming to this repo's design system. Do not paste third-party source code, copy proprietary assets, bypass access controls, or introduce brand-specific styling that conflicts with `@lemn-ltd/ui`.

Read [references/project-map.md](references/project-map.md) at the start of each task, then inspect the current repo files it names because catalog and showcase wiring may have changed.

## Input Handling

- If the user provides an image, treat it as the primary visual target.
- If the user provides a URL, open it and capture the component in desktop, tablet, and mobile when possible.
- If both image and URL are provided, use the image as the visual target and the URL/DOM as supporting evidence for structure, state, copy, attributes, and interaction behavior.
- If the page is inaccessible, authenticated, heavily dynamic, or blocked, continue from the screenshot and state the limitation.
- Store temporary captures, notes, and screenshots under `tmp/component-capture/<slug>/`; do not commit external screenshots unless the user explicitly asks.

## Workflow

### 1. Capture Evidence

Inspect the supplied image directly. When a URL is available, use browser tooling to:

- Capture desktop, tablet, and mobile screenshots.
- Inspect the DOM shape around the target component.
- Record user-visible states: default, hover, focus, disabled, selected, loading, empty, error, expanded/collapsed, and keyboard behavior.
- Record accessible names, roles, labels, ARIA attributes, focus order, and form semantics.
- Record props/data that can be inferred from HTML attributes, inline data, script-rendered state, or visible DOM. Do not rely on minified source internals unless they are public API examples.
- Capture computed styles only as evidence for proportions, spacing, typography, color roles, and motion; translate them into local tokens and component APIs.

If running in Codex, use the in-app browser or Playwright. If running in Claude, use preview/browser tooling available in that environment. Prefer real browser evidence over static reasoning.

### 2. Identify the Component

Produce a concise component brief before changing code:

- Target component name and likely category.
- Core job-to-be-done.
- Required props and controlled/uncontrolled state.
- Required variants, sizes, tones, slots, icons, and content regions.
- Required interactions and keyboard/a11y behavior.
- Responsive behavior across desktop, tablet, and mobile.
- Explicit non-goals for this migration.

### 3. Compare Against the Catalog

Search `packages/ui/src/catalog*.ts`, `packages/ui/docs/components.md`, and existing component folders before creating anything new.

Classify the target as one of:

- **Existing component match**: configure or document an existing component.
- **Variant extension**: add a variant/size/state to an existing component.
- **Composition pattern**: build the target from existing components and add a showcase pattern rather than a new primitive.
- **New component**: add a new `@lemn-ltd/ui` component only when no existing component or composition owns the job.

Write a short diff before implementation:

- Functional gaps: behavior, state, input/output props, events, accessibility, keyboard behavior.
- Visual gaps: layout, spacing, typography, color role, border, elevation, density, motion.
- API gaps: missing props, confusing naming, uncontrolled/controlled needs, composition slots.
- Documentation/showcase/test gaps.

### 4. Propose the Migration

State the chosen migration path and why it fits the design system. The proposal must name:

- Existing components/tokens to reuse.
- Files likely to change.
- Public API shape and defaults.
- Showcase route and examples.
- Test strategy.
- Risks or expected differences from the source component.

Keep the proposal brief, then implement unless the user asked only for analysis.

### 5. Implement in the Design System

Follow local conventions:

- Put reusable components in `packages/ui/src/<group>/<slug>/`.
- Keep component CSS in the component folder and import it from the component file.
- Use local design tokens, existing CSS class naming, `data-*` variants, and current React/TypeScript patterns.
- Export the component from its group `index.ts` and from `packages/ui/src/index.ts` through existing group exports.
- Update the catalog entry in the appropriate `packages/ui/src/catalog-*.ts` file.
- Update `packages/ui/docs/components.md` with a link to the showcase route and when-to-use guidance.
- Add or update deterministic fixtures in `apps/showcase/src/client/fixtures/` when examples need realistic data.
- Add the showcase page under `apps/showcase/src/client/pages/<area>/components/<slug>.page.tsx`.
- Register the page in the matching `apps/showcase/src/client/registry/entries/*.tsx` file.
- Prefer composition over a new component when the target is a screen pattern or layout made of existing primitives.

### 6. Runtime Parity Before Tests

Before writing or finalizing tests, run the app and inspect the component in a real browser/preview:

- Start the showcase with `pnpm dev:showcase` or rely on Playwright's configured web server.
- Verify desktop `1280x900`, tablet `768x1024`, and mobile `375x812`.
- Check light and dark themes when the component uses color, border, elevation, or state tones.
- Exercise every interaction that was part of the target brief.
- Compare against the target image/URL evidence and adjust implementation first.

Only proceed to tests after this responsive runtime pass is complete. If the browser/preview cannot be used, stop and report what prevented verification.

### 7. Tests and Validation

Add tests after runtime parity is established:

- Unit/component tests in the component's local `tests/` folder for props, state, events, accessibility labels, and keyboard behavior.
- E2E tests in `apps/showcase/tests/e2e/` when behavior requires a browser.
- Visual coverage by adding the route to `apps/showcase/tests/e2e/visual.e2e.ts` when the component has meaningful visual states or becomes a primary catalog surface.
- Run focused tests first, then relevant package/workspace checks.

Use these commands as the default validation ladder:

```bash
pnpm --filter @lemn-ltd/ui run test
pnpm --filter @lemn-ltd/ui run check
pnpm --filter @lemn-ltd/ui-showcase run test
pnpm --filter @lemn-ltd/ui-showcase run test:e2e
pnpm run check
pnpm run build
```

Run a narrower subset when the change is small, but never skip the browser/preview responsive pass for migrated components.

## Completion Report

Finish with:

- What source evidence was used: image, URL, DOM, computed styles, or fallback.
- Catalog decision: existing match, extension, composition pattern, or new component.
- Functional and visual differences that remain, if any.
- Showcase route.
- Docs updated.
- Tests and validation commands run, with failures or skipped checks called out.
