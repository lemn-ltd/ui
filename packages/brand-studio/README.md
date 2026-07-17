# @lemn-ltd/brand-studio

Controlled, persistence-free authoring UI for `BrandingDefinition` v1.

Studio edits one controlled definition, compiles a live preview with real LEMN
components, surfaces diagnostics, and emits typed intents. The host owns draft
identity, optimistic concurrency, persistence, authorization, system-catalog
retrieval, archive/restore, comparison, preview sessions, and asynchronous
publication.

```tsx
import { systemBrandingTemplates } from "@lemn-ltd/brand-contract/system-brandings";
import { BrandStudio } from "@lemn-ltd/brand-studio";
import "@lemn-ltd/brand-studio/styles.css";

return (
  <BrandStudio
    draft={draftContext}
    value={definition}
    onChange={setDefinition}
    onIntent={handleIntent}
    systemBrandings={systemBrandingTemplates}
    previewTargets={previewTargets}
  />
);
```

Studio never fetches, persists, signs, publishes, activates, routes, or reads
credentials. System branding data is supplied by the host from an exact pinned
catalog version; selection emits an intent instead of silently assuming host
authority.
