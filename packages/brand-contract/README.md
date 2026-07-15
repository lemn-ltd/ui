# @lemn-ltd/brand-contract

Versioned, runtime-neutral project-branding contracts and deterministic compiler for LEMN UI consumers.

The source contract is an authoring format. Applications and components consume only the resolved `CompiledBrandArtifact`: scoped CSS, semantic tokens, provider themes, diagnostics, and cryptographic hashes.

```ts
import { compileBrandProject } from "@lemn-ltd/brand-contract";

const result = await compileBrandProject(source);
if (!result.ok) throw new Error(result.diagnostics.map((item) => item.message).join("\n"));
```

Brand persistence, authentication, assignment, and publication belong to the host platform, not this package.
