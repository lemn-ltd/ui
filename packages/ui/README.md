# @lemn-ltd/ui

Presentational, brand-neutral, prop-driven component and token library. It is
the code mirror of `packages/ui/design/ui.pen`: every token, every component variant,
Light default + Dark + system theming, responsive reflow, and motion.

## Ownership and boundaries

- This package owns tokens, theme runtime, motion primitives, and the
  presentational component taxonomy (`primitives`, `inputs`, `forms`,
  `visualizations`, `data-display`, `feedback`, `overlays`, `navigation`,
  `layout`, and `agents`).
- It is a **leaf**: runtime source must not import any `@lemn-ltd/*` sibling,
  any `@cloudflare/*` / `agents` runtime, or Node core
  APIs. Tests may use Node APIs for fixtures and CSS assertions. Allowed runtime
  externals are `react`,
  `react-dom`, the headless component libraries (`radix-ui`,
  `cmdk`, `sonner`, `lucide-react`), the canvas/view graph runtime
  (`@xyflow/react`), and the Markdown rendering stack
  (`react-markdown`, `remark-gfm`, `shiki` with the fine-grained
  `@shikijs/langs` / `@shikijs/themes` bundles, `hast-util-to-jsx-runtime`).
  Recharts is an exact direct dependency allowed only inside
  `src/visualizations`; native visualizations and all other families must not
  import it.
  Enforced by `pnpm validate:boundaries`.
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
   conditions object). Consumers import the stylesheet once, at their app root:
   `import "@lemn-ltd/ui/styles.css"`.
2. **`sideEffects: ["**/\*.css"]`.\*\* This stops bundlers from tree-shaking the
   stylesheet away. Every other export is side-effect-free.
3. **`happy-dom` unit environment.** `vitest.config.ts` uses
   `environment: "happy-dom"` (node-only foundation packages use the default
   node env) so component and theme specs can touch the DOM. `@testing-library/react`
   and `happy-dom` are pinned per-package (not catalogued) to match the exact
   pair used by `apps/app` and `apps/showcase`.

## Build artifact contract

The TypeScript output keeps component-local CSS imports such as
`import "./button.css"` in the emitted `dist/**/*.js` files. The package build
therefore must copy every `src/**/*.css` file into the same relative path under
`dist`, not just the aggregate stylesheet.

`scripts/copy-css.mjs` is part of the package contract:

- it copies `src/styles.css` to `dist/styles.css`;
- it copies every colocated component stylesheet to `dist/<taxonomy>/<component>/`;
- it keeps the published package compatible with bundlers that resolve CSS from
  emitted JavaScript.

If a consumer reports a missing CSS module from `@lemn-ltd/ui/dist`, fix this
package and publish a new version. Do not make a permanent consumer-side
`node_modules` patch.

## Exports

- `.` → the public component + theme + `tokens` + `componentCatalog` surface.
- `./tokens` → the typed token mirror only (`src/tokens.ts`).
- `./catalog` → the typed component catalog and catalog lookup helpers (`src/catalog.ts`).
- `./styles.css` → the aggregated stylesheet (tokens, reset, globals, motion).

Barrel re-exports are `.js`-suffixed for Node16 module resolution.

## Component catalog and usage guide

`src/catalog.ts` is the single structured source of truth for the 130-component
set: `area`, `slug`, `title`, `group`, `status`, and a one-line `intent`.
`apps/showcase`
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

The catalog uses a discriminated area-family contract: 101 Core components in
nine families and 29 Agents components in five families. Consumers must branch
on `entry.area`; `group` is the capability family within that area.

Visualization APIs are owned by Lemn UI and do not expose Recharts or another
renderer's types. The engine decision, token contract, bundle gates, and
extension workflow are documented in `../../docs/visualization-system/README.md`.

## Consumer contract

Private GitHub Packages installs require the committed scope mapping plus a
user-level auth entry. Keep the credential outside every repository:

```ini
# consuming repo .npmrc
@lemn-ltd:registry=https://npm.pkg.github.com

# ~/.npmrc
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Load a classic GitHub personal access token with `read:packages` and repository
access into `NODE_AUTH_TOKEN` through the local secret manager before running
pnpm. Do not commit the user-level auth entry or a token value.

Consumer applications must:

- install `@lemn-ltd/ui` from the GitHub Packages `@lemn-ltd` registry;
- provide compatible `react` and `react-dom` peer dependencies;
- import `@lemn-ltd/ui/styles.css` once at the app root;
- import components only from `@lemn-ltd/ui`, `@lemn-ltd/ui/tokens`, or
  `@lemn-ltd/ui/catalog`;
- keep product data mapping, API clients, runtime DTOs, and feature-specific
  composition outside this package.

This package must stay neutral: no product names, tenant examples, customer
names, product-specific icons, app-local layouts, backend bindings, or data
adapters under `src`.

## Theme runtime

`applyTheme` / `setTheme` / `getTheme` / `getResolvedTheme` drive three modes.
`light` / `dark` write an explicit `data-theme` attribute; `system` clears it so
the `prefers-color-scheme` media block in `tokens.css` governs. Light is the
default mode. The persisted choice uses a brand-neutral `color-theme` storage
key.

`AccentColorPicker` is the companion runtime control for product-selected accent
color. It exposes a pointer palette and keyboard controls, supports controlled
and uncontrolled use, and derives contrast-conscious light/dark values for
`--accent`, `--accent-strong`, `--accent-soft`, and `--focus-ring`. By default it
applies and persists the choice under the brand-neutral `accent-color` key;
consumers can set `applyToRoot={false}` or `persist={false}` and own the runtime
with `applyAccentColor`, `setAccentColor`, and `resetAccentColor` instead.

```tsx
import { AccentColorPicker, ThemeToggle } from '@lemn-ltd/ui';

<AccentColorPicker onValueChange={(hex) => console.info(hex)} />
<ThemeToggle />
```

## Test layout

- Unit specs colocate at `src/<taxonomy>/<component>/tests/<component>.spec.tsx`
  (foundation specs at `src/foundations/tests/*.spec.ts`).
- Fixtures, e2e, and visual baselines live in `apps/showcase`, never here.

## Commands

```bash
pnpm --filter @lemn-ltd/ui run build   # rm -rf dist && tsc && copy src/**/*.css
pnpm --filter @lemn-ltd/ui run check   # tsc --noEmit
pnpm --filter @lemn-ltd/ui run test    # vitest run (happy-dom)
pnpm validate:brand-neutrality         # scan shared UI source for product names
pnpm validate:boundaries               # scan shared UI runtime imports
```
