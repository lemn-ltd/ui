# Changesets

Add one changeset for every pull request that changes the contents of any
published package: `@lemn-ltd/brand-contract`, `@lemn-ltd/ui`,
`@lemn-ltd/brand-runtime`, or `@lemn-ltd/brand-studio`.

This includes packaged documentation such as `README.md`, `CHANGELOG.md`, and
`LICENSE`: changing one of those files changes the immutable package tarball
even when the runtime API and behavior stay the same.

```bash
pnpm changeset
```

Choose the SemVer level intentionally:

- `patch` for fixes and non-breaking polish.
- `minor` for additive components, exports, variants, or props.
- `major` for breaking API, behavior, or migration-required visual changes.
