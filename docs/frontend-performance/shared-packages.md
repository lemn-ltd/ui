# Shared Packages

## `@appranks/ui`

Should contain:

- presentational components
- tokens
- themes
- primitives
- base forms
- layout primitives
- icon policy
- shared styles

Must not contain:

- app-specific fetching
- business rules
- product permissions
- auth runtime
- Cloudflare bindings
- app-global state
- baked data coupled to a specific product

## Future Packages

If a pattern repeats across apps but is not presentational UI, it should not be
forced into `@appranks/ui`.

Options:

- `@appranks/app-runtime`: application state, local status, cross-app bootstrap.
- `@appranks/baked-data-client`: common baked-data client if the contract is
  stable.
- `@appranks/frontend-observability`: Web Vitals, route transitions, error reporting.
- `@appranks/worker-bff`: BFF helpers if several Workers share conventions.

## Migration Rule

Move code into shared packages only when it is:

- cross-project
- stable
- testable outside a specific app
- free of direct dependencies on product business rules
- backed by a clear public contract

If something touches runtime, data, Workers, auth, or observability, it should
live in a dedicated package. It should not be mixed into `@appranks/ui`.
