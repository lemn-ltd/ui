# Showcase Kit

`@appranks/showcase-kit` owns browser-only, brand-neutral showcase harness primitives and registry plumbing.

Boundaries:

- The only workspace dependency is `@lemn-ltd/ui`.
- The package never imports app source, Cloudflare APIs, Node core APIs, Radix, cmdk, or sonner directly.
- `apps/showcase` passes registries and lazy pages as data. Product apps do not own local showcase registries.
- The kit keeps category and type separate: `area` selects `core` or `agents`, and `kind` selects `foundation`, `component`, or `pattern`.
- The kit never reaches into product code or owns a duplicate component catalog;
  it consumes only public UI helpers needed to render consumer-facing snippets.
- CSS for the harness chrome ships through `@appranks/showcase-kit/styles.css`.
