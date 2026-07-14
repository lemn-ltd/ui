# Adding To The Showcase

1. Add shared components to `@lemn-ltd/ui`.
2. Add the live page and fixtures to `apps/showcase`.
3. Use `area: "core"` for `/core/<kind>/<slug>` routes and `area: "agents"` for `/agents/components/<slug>` routes.
4. Register entries through the `apps/showcase` registry; product apps do not own local showcase routes.
5. Keep visual baselines in `apps/showcase`, not in product apps or the kit.

## Live catalog contract

The overview is a deliberately curated set of composition patterns built from
public `@lemn-ltd/ui` exports. Do not create thumbnail components, commit
captured images, or add every new component to the homepage automatically.

- Component and pattern pages use `ComponentPage`. Their first direct
  `ExampleBlock` is the canonical example.
- Foundation pages use `FoundationPage`. Their first child is the canonical
  example.
- Put any portal companions required by an example, such as a dialog, toaster,
  or confirmation surface, in the same fragment returned by the canonical
  `ExampleBlock`.
- Keep the canonical example neutral, deterministic, self-contained, and usable
  without product APIs or authentication.
- Homepage compositions live in the typed `HOME_FEATURES` registry. Each entry
  declares its component slugs, uses deterministic local state, and validates
  those slugs against the full showcase registry.
- Keep the homepage between six and eight compositions. New components remain
  discoverable through the sidebar, command search, and the complete-catalog
  links until a deliberate curation decision promotes them.
- Homepage controls are directly interactive at natural size. Titles and
  documentation links stay separate from those controls so cards never become
  whole-surface links.

When a component needs a richer canonical interaction, improve its first
`ExampleBlock`. The component route and its responsive documentation will use it
without coupling that component to homepage curation.

## Component reference contract

Every catalog component page uses `ComponentPage`; the shared adapter turns its
existing content into the long-form interactive reference automatically. A new
page must provide, in this order:

1. One to three direct `ExampleBlock` children. The first is the hero and must
   be a real, deterministic interaction.
2. Optional galleries or supporting controls for variants and states. These do
   not replace an interactive hero.
3. One direct `PropsTable` whose rows reflect the component's public props,
   real defaults, and observable behavior.

The adapter supplies the catalog category, canonical title and summary,
Preview/Code presentation, public `@lemn-ltd/ui` imports, installation steps,
API table, support link, and legal footer. `DocumentationPage` rejects more
than three examples. The route-sweep tests derive all component routes from
`/catalog.json`, so registering a component without this contract fails CI.

Never add page-local theme controls, captured component images, product data,
authentication, remote API fixtures, `@latest`, deep package imports, or public
snippets using the internal workspace package name.

## Homepage pattern evidence

- `PAT-UI-LEMN-001`: homepage compositions import only public
  `@lemn-ltd/ui` exports and use the shared token stylesheet.
- `PAT-UI-FRONTEND-001` and `PAT-UI-STATES-001`: demonstrations use local,
  deterministic state because the showcase has no product API or server-owned
  data; pending, progress, success, selection, and dismissal states are explicit
  where applicable.
- `PAT-UI-SYSTEM-001`: the homepage remains a composition consumer. Reusable
  behavior stays in the package catalog instead of becoming homepage-only
  primitives.
- `PAT-TEST-INTEGRITY-001`, `PAT-TEST-PLACEMENT-001`,
  `PAT-TEST-MEANINGFUL-001`, and `PAT-TEST-EVIDENCE-001`: registry checks live
  under `apps/showcase/tests/unit`, browser behavior under `tests/e2e`, and the
  responsive bento has light/dark visual baselines at 375, 768, and 1280 pixels.
