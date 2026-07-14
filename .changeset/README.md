# Changesets

Add one changeset for every pull request that changes the published
`@lemn-ltd/ui` package.

```bash
pnpm changeset
```

Choose the SemVer level intentionally:

- `patch` for fixes and non-breaking polish.
- `minor` for additive components, exports, variants, or props.
- `major` for breaking API, behavior, or migration-required visual changes.
