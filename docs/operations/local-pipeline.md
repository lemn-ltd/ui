# Local pipeline contract

This repository applies `PAT-CODE-REPOSITORY-TOOLING-001`,
`PAT-CODE-VALIDATION-PROFILES-001`, and `PAT-OPS-CI-CD-001`. GitHub Actions
must call the same catalogued commands available locally; it must not contain a
second implementation of validation behavior.

## Profiles

| Command | Purpose | Runs remotely |
|---|---|---|
| `pnpm validate:quick` | Validate changed files, owning workspaces, and transitive consumers. | No |
| `pnpm validate:quick:fix` | Apply explicit safe formatting fixes to changed files. | No |
| `pnpm validate:standard` | Run repository-wide policy, unit and contract tests, builds, local Portal smoke, and package tarball smoke. | No |
| `pnpm validate:full` | Add the complete Portal Playwright suite and Cloudflare Worker dry runs. | No |
| `pnpm pipeline:local` | Simulate all non-mutating CI and release gates from a clean revision and record ignored evidence. | Only the package vulnerability audit may query the registry. |
| `pnpm pipeline:visual:local` | Explicitly regenerate governed Linux visual baselines, matching the manual GitHub workflow. | The pinned Playwright container may be pulled. |

`pnpm validate` always aliases `validate:standard`. Production deployment and
live production smokes remain separately named, guarded commands and are never
hidden in a validation profile.

## Hooks

Run `pnpm hooks:install` once per checkout. The tracked hooks configure:

- `pre-commit` -> `pnpm validate:quick`
- `pre-push` -> `pnpm pipeline:local`

The pre-push pipeline requires a clean revision. Its transient receipt is
written to ignored `tooling/artifacts/checks/local-pipeline.json` and contains
the exact commit that passed.

## GitHub boundary

The validation job calls `pnpm validate:standard`; browser and accessibility
jobs retain their shard orchestration but are reproduced by `validate:full`.
The visual-baseline workflow delegates to `pipeline:visual:local`. A push to
`main` validates only: production release requires manual workflow dispatch and
the protected `production` environment.
