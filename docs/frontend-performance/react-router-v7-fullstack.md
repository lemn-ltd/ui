# React Router v7 Full-Stack

## When To Use It

- Routes with clear data contracts.
- Apps where each route must load data before rendering.
- Forms and mutations that belong to a route.
- Flows with redirects, pending states, server-side errors, and revalidation.
- Apps that need server-aware routing without adopting Next.

## Specific Patterns

- Use **loaders** to load data at the route level.
- Use **actions** for mutations, submits, redirects, and form errors.
- Avoid initial route fetching from child components.
- Use pending UI with `useNavigation`.
- Aggregate requests inside the loader when a screen needs multiple sources.
- Keep loaders small and focused on the route.
- Separate public cache from private cache.
- Use HTTP headers and Cloudflare cache only for public data.
- Mark private data as non-cacheable.
- Measure document navigations and client navigations.
- Use streaming or Suspense only when it improves a specific route.
- Keep ownership clear so loaders/actions do not become unstructured backends.

## Why It Improves Performance

- Reduces waterfalls because the route declares its data before rendering.
- Centralizes mutations and revalidation.
- Enables consistent pending UI.
- Avoids duplicate client/server logic.
- Makes each route's cost more visible.

## Risks

- SSR or server-aware routing can be unnecessary for simple dashboards.
- Very large loaders can load more data than needed.
- Misconfigured cache on authenticated routes can leak data.
- The app can mix too much product logic into the router if boundaries are not
  clear.
