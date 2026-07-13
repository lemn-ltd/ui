# @lemn-ltd/ui - usage guide

`@lemn-ltd/ui` is the shared, brand-neutral, presentational component library:
tokens, theme runtime, motion, and components across eight
taxonomies. It is the one place product screens get their UI from — apps compose
it, they do not fork it.

This `docs/` folder is the **agent-facing usage guide**: which component to reach
for and how to compose screens. It is deliberately not a prop reference — the
live showcase (`apps/showcase`) renders every component, variant, and prop.

## How to consume

```ts
import { Button, Card, componentCatalog } from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css"; // once, at the app root
```

- Import the stylesheet **once** at the app root; components are styled by it.
- Theming is Light-default with Dark and system modes via `applyTheme` /
  `setTheme` / `getTheme`. Do not hard-code colors — every value is a token.
- `componentCatalog` is the structured index of the component set (slug, title,
  group, status, intent). It is data only and tree-shakes out of product bundles.

## The guide

- **[components.md](components.md)** — when to use each component, what to use
  instead, and what it pairs with. One section per component, grouped by taxonomy.
- **[patterns.md](patterns.md)** — recipes that compose these components into whole
  screens (lists, detail, dashboard, settings, auth, states, responsive).

## Foundations (non-negotiable)

- **Tokens, not literals.** Spacing, color, radius, type, and motion come from the
  token layer; never hard-code a value a token already names.
- **Compose, don't fork.** Build product screens by composing this library. Shared
  components live here, never copied into a product app. Agent-system components
  live under `src/agents` and are documented at `/agents/components/<slug>`.
- **Respect the taxonomy.** Primitives, Forms, Overlays, Navigation, Data display,
  Feedback, Layout, and Agents each own a concern — reach across them, don't
  duplicate.
- **Light-first, responsive, reduced-motion aware.** Layouts reflow by container
  width and animations go static under `prefers-reduced-motion`.
