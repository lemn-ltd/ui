# Adding To The Showcase

1. Add shared components to `@appranks/ui`.
2. Add the live page and fixtures to `apps/showcase`.
3. Use `area: "core"` for `/core/<kind>/<slug>` routes and `area: "agents"` for `/agents/components/<slug>` routes.
4. Register entries through the `apps/showcase` registry; product apps do not own local showcase routes.
5. Keep visual baselines in `apps/showcase`, not in product apps or the kit.

## Live catalog contract

The overview and interactive playground render the existing showcase page. Do
not create a second thumbnail component or commit captured images.

- Component and pattern pages use `ComponentPage`. Their first direct
  `ExampleBlock` is the canonical live preview.
- Foundation pages use `FoundationPage`. Their first child is the canonical live
  preview.
- Put any portal companions required by an example, such as a dialog, toaster,
  or confirmation surface, in the same fragment returned by the canonical
  `ExampleBlock`.
- Keep the canonical preview neutral, deterministic, self-contained, and usable
  without product APIs or authentication.
- The overview mounts previews lazily and makes them inert. Clicking a card opens
  one shared, interactive iframe playground with light/dark themes and 375, 768,
  and 1280 pixel viewports.
- Playground links are shareable through `?preview=<showcase-route>`. Embedded
  pages use `?embed=playground&theme=<light|dark>`; those query parameters belong
  to the showcase shell and should not be reimplemented by individual pages.

When a component needs a richer canonical interaction, improve its first
`ExampleBlock`. The card, playground, component route, responsive controls, and
deep link will inherit it automatically.
