# @lemn-ltd/brand-contract

Runtime-neutral `BrandingDefinition` v1 schema, deterministic compiler, governed
font catalog, and immutable System branding catalog for LEMN UI consumers.

The authoring contract uses
`https://schemas.ui.le-mn.com/branding/v1.json`. Typography and asset roles live
at the definition root. Each entry in `modes` is a complete light, dark, or
future visual mode containing colors, shape, elevation, density, motion,
visualization, iconography, accessibility, and component appearance.

```ts
import { compileBrandingDefinition } from "@lemn-ltd/brand-contract";

const result = await compileBrandingDefinition(source);
if (!result.ok) {
  throw new Error(result.diagnostics.map((item) => item.message).join("\n"));
}
```

Compilation produces deterministic definition, mode, artifact, and byte hashes;
scoped semantic CSS; complete private artifacts; Recharts and ECharts adapters;
font resources; asset metadata; diagnostics; and a minimal safe hydration
bootstrap. The full `CompiledBrandingObject` remains private publication storage
and never crosses the runtime boundary.

Publication creates one `CompiledBrandingModeObject` for each allowed mode. Its
canonical `projectionHash` covers only the selected mode's critical CSS,
bootstrap, font metadata, and public asset references. Its signature binds the
Workspace, BrandingVersion, numeric publication version or preview draft,
schema/compiler versions, definition/compiled/mode hashes, and
`projectionHash`. It contains no source definition, private storage key,
unselected mode configuration, or provider credential. Consumers verify one
signed mode projection atomically and never parse source JSON in UI components.

System brandings are available from the isolated, side-effect-free entrypoint:

```ts
import {
  getSystemBrandingTemplate,
  systemBrandingTemplates,
} from "@lemn-ltd/brand-contract/system-brandings";

const exactTemplate = getSystemBrandingTemplate("verdant-ledger", 1);
```

Template IDs and versions are exact and immutable. Selecting one copies its
complete definition; future template versions never mutate existing workspace
drafts.

The recommended `system.ui`, `system.sans`, `system.serif`, and `system.mono`
fonts compile to zero network resources. Managed fonts use immutable WOFF2
objects from `fonts.ui.le-mn.com`, exact SHA-256 and SRI metadata, pinned
licenses, and a required system fallback. `preferred` accepts the fallback for
fast rendering. `required` emits SSR preload metadata and a blocking font-display
period, while retaining the emergency fallback for permanent failure. Both
managed modes expose their exact verified HTTPS origins through
`getCompiledModeFontResourceOrigins` so server CSP can authorize every emitted
`@font-face` without turning `preferred` resources into preloads.

Workspace persistence, authorization, publication, activation, preview
sessions, and runtime credentials belong to the host platform.
