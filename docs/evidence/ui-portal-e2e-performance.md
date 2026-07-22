# UI Portal E2E performance evidence

This receipt applies `PAT-CODE-REPOSITORY-TOOLING-001`,
`PAT-CODE-VALIDATION-PROFILES-001`, `PAT-TEST-INTEGRITY-001`,
`PAT-TEST-MEANINGFUL-001`, `PAT-TEST-PLACEMENT-001`, and
`PAT-TEST-EVIDENCE-001`.

## Coverage boundary

The optimization does not remove or skip a validation profile, route, theme,
viewport, assertion, visual baseline, or accessibility scan:

- 102 catalog routes retain a strict delayed-diagnostics navigation check.
- Documentation and responsive contracts cover all 102 routes as independent
  tests.
- Accessibility retains 102 routes in both light and dark: 204 cases.
- Visual regression retains Light/Dark x mobile/tablet/desktop and the exact 96
  Darwin plus 96 Linux governed snapshots.
- `validate:full` and the pre-push `pipeline:local` remain complete gates.

The collected suite grows from 352 opaque top-level cases to 1,169 independently
reportable and shardable cases because route loops are now visible to
Playwright.

## Local measurement

Both measurements used the same checkout, Playwright 1.60.0, Chromium runtime,
command, and reporter:

```sh
/usr/bin/time -p pnpm --dir apps/ui-portal exec playwright test --reporter=dot
```

| Revision state | Result | Playwright time | Wall time |
|---|---:|---:|---:|
| Before optimization | 352 passed | 30.8 min | 1,848.15 s |
| After optimization | 1,169 passed | 4.8 min | 287.55 s |

Wall time fell by 1,560.60 seconds, an **84.4% reduction** and **6.43x
speed-up**.

The current registry stable version was audited with
`pnpm view @playwright/test version` (1.61.1 on 2026-07-22). The optimization
keeps the repository's governed 1.60.0 browser/image pin so the before/after
measurement and existing visual baselines remain comparable; a browser-engine
upgrade is a separate compatibility change.

## Remote baseline

The last successful pre-change `main` workflow was
[CI/CD run 29833279221](https://github.com/lemn-ltd/ui/actions/runs/29833279221)
at `a38fdae`:

| Gate | Jobs | Runner time |
|---|---:|---:|
| UI Portal E2E | 3 | 39m35s |
| UI Portal Accessibility | 4 | 16m57s |
| Combined browser gates | 7 | 56m32s |

The pre-change workflow wall time was 43 minutes and the browser gates waited
for the 6m44s validation job before starting.

## Implementation

- Strict route health is paid once per route; focused suites use the same
  readiness boundary without duplicating the 750 ms delayed-error window.
- Route loops are collection-time cases, enabling native workers, retries,
  sharding, and precise failure ownership.
- Playwright uses four workers locally and two per CI runner, with an explicit
  environment override.
- CI fans validation and browser gates out together, using two E2E shards and
  two accessibility shards instead of seven one-worker jobs.
- Contract tests fail if worker bounds, fan-out, shard counts, or the 102/204/612
  route-case inventories regress.
