# @lemn-ltd/ui

## 0.1.2

### Patch Changes

- 089bff0: Add documentation, changelog, and release automation for the UI design system.
- Publish the canonical GitHub Packages identity as `@lemn-ltd/ui`, including
  the root, tokens, catalog, and stylesheet exports for strict React 19.2 consumers.
- Fail the production release before package publication unless the Cloudflare
  Global API Key can deploy both docs and showcase, then reject stale build metadata.

## 0.1.1

- Publish the current shared component catalog, docs, CSS assets, and public package surface.
- Deploy the showcase as the interactive catalog for visual, responsive, and agent-facing review.
