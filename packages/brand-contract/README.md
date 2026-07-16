# @lemn-ltd/brand-contract

Versioned, runtime-neutral project-branding contracts and deterministic compiler for LEMN UI consumers.

The source contract is an authoring format. Applications and components consume only the resolved `CompiledBrandArtifact`: scoped CSS, semantic tokens, provider themes, diagnostics, and cryptographic hashes.

BrandProject v2 uses `https://schemas.ui.le-mn.com/brand-project/v2.json`. Typography is declared once per Profile and shared by all of its modes. Font roles reference the exported, versioned `fontCatalog` instead of accepting arbitrary CSS family names.

Managed catalog entries include immutable font resources plus governed legal
provenance: the public exact OFL copy, its pinned source URL and SHA-256,
copyright notice, pinned Google Fonts directory, and original upstream project.

```ts
import { compileBrandProject } from "@lemn-ltd/brand-contract";

const result = await compileBrandProject(source);
if (!result.ok) throw new Error(result.diagnostics.map((item) => item.message).join("\n"));
```

The recommended `system.ui`, `system.sans`, `system.serif`, and `system.mono`
records compile to zero font resources, zero estimated font bytes, and a
`fontNetworkPolicy` of `none`. Curated managed records compile only the selected
weights/styles into immutable WOFF2 resource descriptors and `@font-face`
rules, always with a system emergency fallback. The exported managed resources
are verified immutable WOFF2 objects on `fonts.ui.le-mn.com`; the catalog keeps
their exact SHA-256, SRI integrity, byte size, subset, and pinned OFL license.
`preferred` uses `font-display: optional` and accepts the fallback as the
performance-first result. `required` emits a Profile-isolated family alias,
`font-display: block`, and an SSR preload descriptor to prevent an initial
fallback-font paint during the browser's block period. The emergency fallback
still exists for permanent network/font failure; CSS cannot guarantee an
unbounded invisible wait. Bootstrap serialization includes only the selected
Profile's font resources, never another Profile's loading policy.

Brand persistence, authentication, assignment, and publication belong to the host platform, not this package.
