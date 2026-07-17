# @lemn-ltd/ui agent usage guide

Use this guide to select and compose public LEMN components and blocks. The
interactive [Showcase](https://showcase.ui.le-mn.com) renders real capabilities;
the machine-readable catalog and these docs explain when to use them.

## Consumption contract

```tsx
import { Button, Card, DashboardOverviewBlock } from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css";
```

- Install an exact approved package version; never use `latest`, a range, URL,
  branch, workspace link, or relative cross-repository import.
- Import only public `@lemn-ltd/*` entrypoints. Never deep-import package
  internals or import an upstream UI provider for a catalog-owned capability.
- Import `@lemn-ltd/ui/styles.css` once at the application root.
- Prefer `componentCatalog` and `blockCatalog` as the current inventories; do
  not rely on a hard-coded component total.

## Selection order

1. Find the job in [components.md](components.md) or the public catalog.
2. Prefer an existing stable component.
3. Use a [block](patterns.md#blocks-versus-screen-patterns) when it is a curated
   purpose-specific composition with the contract your screen needs.
4. Keep one-off product behavior local and compose public primitives.
5. For a reusable gap, propose exactly one provider of record through the
   provider registry. Do not implement a competing local primitive.

LEMN owns the public API and semantic branding. Accepted upstream providers own
their interaction, focus, accessibility, keyboard, lifecycle, and chart-engine
behavior. Agents must not rewrite those behaviors merely to apply local style.

## Branding contract

Components do not consume raw branding JSON. The host resolves and verifies a
published `@lemn-ltd/brand-contract` artifact before rendering, then applies
the selected mode scope atomically. Every definition compiles into the same
scoped `--lemn-*` semantic vocabulary.

- Never hard-code a project color when a semantic role exists.
- Never create project-specific CSS variable names.
- Never mutate global brand variables from a component.
- Never persist mode or accent state from shared UI.
- Never render a provider default while waiting for branding in production.

Production SSR/edge hosts inject the verified critical CSS and scope attributes
before the first HTML byte. The browser hydrates the same compiled hash. Only a
a compatible verified embedded branded artifact may be used as a failure
fallback.

## Boundaries

- Shared UI is presentational and controlled.
- Product fetching, routing, authentication, global state,
  internationalization, analytics, persistence, and workflow policy remain in
  the consuming app or a separate frontend-platform package.
- Brand Studio is a controlled, persistence-free `BrandingDefinition` wizard.
  Its host owns Workspace context, authorization, storage, publication,
  activation, and audit.
- Showcase Admin is a protected experimentation/proposal host. Public Showcase
  remains read-only.

## Guide index

- [components.md](components.md) — component selection guidance.
- [patterns.md](patterns.md) — composition, state, branding, and block recipes.
- [catalog.json](https://showcase.ui.le-mn.com/catalog.json) — current component
  inventory.
- [llms.txt](https://showcase.ui.le-mn.com/llms.txt) — concise agent index.
- [llms-full.txt](https://showcase.ui.le-mn.com/llms-full.txt) — expanded agent
  documentation.

These rules apply `PAT-UI-LEMN-001`, `PAT-UI-PROVIDER-FIRST-001`,
`PAT-UI-BRAND-CONTRACT-001`, `PAT-UI-SSR-BRANDING-001`,
`PAT-UI-BLOCKS-001`, and `PAT-UI-FRONTEND-PLATFORM-BOUNDARY-001`.
