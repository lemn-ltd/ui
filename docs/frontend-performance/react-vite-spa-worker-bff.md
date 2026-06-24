# React + Vite SPA + Worker BFF

## When To Use It

- Internal dashboards.
- Operational tools.
- Authenticated apps.
- UIs with many tables, filters, modals, side panels, and workflows.
- Products where SEO does not add value.
- Apps where users spend a lot of time interacting after first load.

## Specific Patterns

- Keep a **small SPA shell**:
  - base layout
  - router
  - auth gate
  - theme
  - minimal UI components
- Load routes with `React.lazy` and `Suspense`.
- Use `useTransition` for non-urgent updates that could block interaction.
- Split heavy features into independent chunks.
- Prefetch only with clear intent:
  - hover
  - focus
  - viewport
  - very frequent routes
- Measure internal navigations manually:
  - click to render
  - click to data ready
  - click to usable view
- Use a client cache for queries.
- Explicitly invalidate data after mutations.
- Virtualize large tables, logs, lists, and searches.
- Keep local state close to the interaction.
- Promote to global state only when the state is truly cross-view.
- Avoid independent initial fetches in nested components when a screen needs
  aggregated data.

## BFF Pattern

The browser should not consume raw internal APIs. It should consume UI-oriented
endpoints.

Example:

- Bad: the table calls five internal services from the browser.
- Better: `/api/dashboard/summary` aggregates data in the Worker and returns
  exactly what the view needs.

The BFF can own:

- baked data
- local application state
- permissions
- feature flags
- service aggregation
- error normalization
- status/readiness
- hiding internal details from the browser

## Why It Improves Performance

- Reduces initial JavaScript by deferring features.
- Avoids waterfalls when the Worker aggregates data per view.
- Keeps interactions fast because local state stays close to the UI.
- Allows real route transitions to be measured and optimized.

## Risks

- An SPA without budgets can accumulate too much initial JavaScript.
- If each component fetches on its own, waterfalls appear.
- Core Web Vitals can look good while internal navigations are slow, so route
  transitions must be measured.
- Excessive global state makes the app fragile.
