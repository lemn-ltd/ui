# Common Patterns

These patterns apply regardless of framework.

## Measurement And Budgets

- Measure with **Real User Monitoring**, not only local Lighthouse.
- Measure Core Web Vitals: `LCP`, `INP`, and `CLS`.
- Use reference targets:
  - `LCP <= 2.5s`
  - `INP <= 200ms`
  - `CLS <= 0.1`
- Evaluate the 75th percentile and separate mobile from desktop.
- Create PR budgets for:
  - Initial JavaScript.
  - Chunk size.
  - Critical request count.
  - API payloads.
  - Above-the-fold images.
  - Long tasks.
  - Time to usable view.
- Measure critical business routes, not only the home page.

## JavaScript

- Keep the initial bundle small.
- Split code by route, feature, or interaction.
- Keep heavy dependencies out of the initial bundle:
  - charts
  - code editors
  - syntax highlighters
  - maps
  - external SDKs
  - heavy analytics clients
- Use lazy loading for non-critical features.
- Avoid long tasks on the main thread.
- Break heavy computation into small steps or move it out of render.
- Avoid unnecessary renders and expensive recomputation.
- Use virtualization for large tables, logs, lists, and result sets.

## Data And Networking

- Avoid data waterfalls.
- Aggregate data in the backend when a view needs multiple sources.
- Cache data with explicit rules:
  - public
  - private
  - per user
  - per tenant
  - temporary
- Cancel stale requests with `AbortController`.
- Do not repeat identical requests on every render.
- Define clear invalidation after mutations.
- Reduce payloads. The UI should not receive fields it does not use.
- Use streaming when the payload can grow or when users can consume results
  progressively.

## UI And Rendering

- Reserve dimensions for images, banners, cards, tables, and dynamic panels to
  avoid `CLS`.
- Use responsive images and lazy loading.
- Optimize the element that dominates `LCP`.
- Maintain `loading`, `empty`, `error`, and `success` states.
- Use error boundaries on critical surfaces.
- Avoid layout thrashing.
- Do not block interactions with secondary renders.
- Use skeletons only when they clarify structure, not to hide poor latency.

## Cloudflare Workers

- Serve static assets from Workers Static Assets when the frontend lives on
  Workers.
- Use the Worker as a BFF for `/api/*`, health checks, status endpoints,
  catalogs, or agent endpoints.
- Keep `compatibility_date` current.
- Use `nodejs_compat` only when the stack needs it.
- Generate types with `wrangler types`.
- Use native Cloudflare bindings instead of internal REST APIs when applicable.
- Do not use mutable global state for request, user, permission, or tenant
  information.
- `await` or `ctx.waitUntil()` important promises.
- Enable logs, traces, and observability before considering a deploy ready.
