# @appranks/ui

Presentational, brand-neutral, prop-driven component and token library. It is
the code mirror of `packages/ui/design/ui.pen`: every token, every component variant,
Light default + Dark + system theming, responsive reflow, and motion.

## Ownership and boundaries

- This package owns tokens, theme runtime, motion primitives, and the
  presentational component taxonomy (`primitives`, `forms`, `overlays`,
  `navigation`, `layout`, `data-display`, `feedback`, `agents`).
- It is a **leaf**: it must not import any `@appranks/*` or `@appranks/*` sibling, any
  `@cloudflare/*` / `agents` runtime, or Node core APIs. Allowed externals are
  `react`, `react-dom`, the headless component libraries (`radix-ui`,
  `cmdk`, `sonner`, `lucide-react`), the canvas/view graph runtime
  (`@xyflow/react`), and the Markdown rendering stack
  (`react-markdown`, `remark-gfm`, `shiki` with the fine-grained
  `@shikijs/langs` / `@shikijs/themes` bundles, `hast-util-to-jsx-runtime`).
  Enforced by the `ui-is-leaf`,
  `ui-has-no-cloudflare-sdk`, and `ui-has-no-node-core` rules in
  `scripts/readiness/dependency-cruiser.cjs`.
- It is **brand-neutral**: no product name appears anywhere under `src`.
  Enforced by `pnpm validate:brand-neutrality`.
- Agent-compatible shared components live in `src/agents`. They stay
  brand-neutral and contract-light: reusable lifecycle, execution, and evidence
  UI primitives for agent systems, not product-specific workflows or data
  adapters.
- No product/domain components, no domain icons, no data plane. Product-specific
  composition lives in the product apps that consume this library.

## Package pattern (the three deviations from node-only foundation packages)

This is the workspace's first React + CSS foundation package. It keeps the
proven `tsc`-to-`dist` build (no bundler), with three documented deviations:

1. **`./styles.css` string export.** `package.json` `exports` maps
   `"./styles.css"` to the literal `"./dist/styles.css"` string (not a
   conditions object). `build` runs `tsc` then copies `src/styles.css` to
   `dist/styles.css`. Consumers import the stylesheet once, at their app root:
   `import "@appranks/ui/styles.css"`.
2. **`sideEffects: ["**/\*.css"]`.\*\* This stops bundlers from tree-shaking the
   stylesheet away. Every other export is side-effect-free.
3. **`happy-dom` unit environment.** `vitest.config.ts` uses
   `environment: "happy-dom"` (node-only foundation packages use the default
   node env) so component and theme specs can touch the DOM. `@testing-library/react`
   and `happy-dom` are pinned per-package (not catalogued) to match the exact
   pair used by `apps/app` and `apps/showcase`.

## Exports

- `.` → the public component + theme + `tokens` + `componentCatalog` surface.
- `./tokens` → the typed token mirror only (`src/tokens.ts`).
- `./styles.css` → the aggregated stylesheet (tokens, reset, globals, motion).

Barrel re-exports are `.js`-suffixed for Node16 module resolution.

## Component catalog and usage guide

`src/catalog.ts` is the single structured source of truth for the component set:
`slug`, `title`, `group`, `status`, and a one-line `intent`. `apps/showcase`
consumes `componentCatalog` for its nav titles, summaries, and status, so those
never drift from the package. `componentCatalog` is data only, so it tree-shakes
out of product bundles that import components but not the catalog.

The agent-facing "when to use" guide lives in `docs/`:

- `docs/README.md` — how to consume the library and the foundations rules.
- `docs/components.md` — per-component selection guidance (when to use, when not,
  what it pairs with), one section per catalogued component.
- `docs/patterns.md` — screen composition recipes built from these components.

`src/tests/catalog.spec.ts` is the drift guard: it fails if a catalogued
component is missing from `docs/components.md`.

## Theme runtime

`applyTheme` / `setTheme` / `getTheme` / `getResolvedTheme` drive three modes.
`light` / `dark` write an explicit `data-theme` attribute; `system` clears it so
the `prefers-color-scheme` media block in `tokens.css` governs. Light is the
default mode. The persisted choice uses a brand-neutral `color-theme` storage
key.

## Test layout

- Unit specs colocate at `src/<taxonomy>/<component>/tests/<component>.spec.tsx`
  (foundation specs at `src/foundations/tests/*.spec.ts`).
- Fixtures, e2e, and visual baselines live in `apps/showcase`, never here.

## Commands

```bash
pnpm --filter @appranks/ui run build   # rm -rf dist && tsc && copy styles.css
pnpm --filter @appranks/ui run check   # tsc --noEmit
pnpm --filter @appranks/ui run test    # vitest run (happy-dom)
```
