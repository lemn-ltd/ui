# Adding To The Showcase

1. Add shared components to `@appranks/ui`.
2. Add the live page and fixtures to `apps/showcase`.
3. Use `area: "core"` for `/core/<kind>/<slug>` routes and `area: "agents"` for `/agents/components/<slug>` routes.
4. Register entries through the `apps/showcase` registry; product apps do not own local showcase routes.
5. Keep visual baselines in `apps/showcase`, not in product apps or the kit.
