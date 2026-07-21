# Project Zero Trust disabled-state evidence — 2026-07-21

## Scope

This focused receipt covers `PAT-CLOUDFLARE-ACCESS-PER-PROJECT-001` for
project `lemn-ui`. The repository declares one environment,
`main -> production`, with `enabled: false`.

## Deterministic validation

- Strict TypeScript check passed for the tooling project.
- The reconciler suite passed 40/40 tests.
- The script catalog passed 4/4 contract tests.
- The matrix covers enabled creation, application and policy drift updates,
  owned deletion, partial application disable, second-plan idempotency, exact
  human and service selectors, multiple environments and applications,
  origin-variable projection, GET and POST probes, public routes, CI/local
  branch resolution, wrong branch,
  missing confirmation, malformed manifests, Bypass rejection, overlapping
  local and foreign destinations, duplicate or foreign provider state,
  pagination, both supported credential modes, and sanitized provider errors.

## Live disabled-state result

`pnpm access:plan` returned zero actions. `pnpm access:apply` passed the
main-only release guard, returned a zero-action converged plan, and verified:

| Probe | Expected | HTTP | Result |
| --- | --- | ---: | --- |
| Portal Admin session | Origin denial | 401 | PASS |
| Portal deep health | Origin denial | 401 | PASS |
| Portal home | Public | 200 | PASS |
| Portal health | Public | 200 | PASS |

The Cloudflare account inventory contains no project-managed
`lemn-zt:lemn-ui:production:*` Access application. The disabled state is not
an authorization bypass: protected routes continue to deny at the Worker.

## Deliberate limit

Human-login, exact service-token, wrong-identity, and wrong-audience deployed
smokes are not claimed because the requested final state is disabled.
Their configuration and reconciliation paths are covered deterministically;
the live identity matrix becomes mandatory when an environment is explicitly
enabled.
