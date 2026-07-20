# @lemn-ltd/brand-studio

Controlled, persistence-free authoring UI for `BrandingDefinition` v1.

Studio edits one controlled definition, compiles a live preview with real LEMN
components, surfaces diagnostics, and emits typed intents. The host owns draft
identity, optimistic concurrency, persistence, authorization, system-catalog
retrieval, archive/restore, comparison, preview sessions, and asynchronous
publication. Its configuration steps form one horizontally scrollable sequence;
the active editor and the live preview remain a two-pane workspace by default.

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

## Controlled navigation and external preview

`step` and `modeId` are optional controlled props. Existing consumers can keep
using `initialStep` and `initialModeId` for uncontrolled state. A workspace host
can move the exact same package-owned preview into a `DockPanel` without copying
preview markup or compiling branding itself:

```tsx
import {
  BrandStudio,
  BrandStudioPreview,
  type BrandStudioStepId,
} from "@lemn-ltd/brand-studio";
import { DockPanel, ScreenShell } from "@lemn-ltd/ui";
import { useState } from "react";

const [step, setStep] = useState<BrandStudioStepId>("identity");
const [modeId, setModeId] = useState(definition.defaultModeId);

return (
  <ScreenShell
    defaultDockMode="partial"
    sidebar={sidebar}
    rightPanel={
      <DockPanel
        tabs={[
          {
            id: "preview",
            label: "Preview",
            icon: "monitor",
            content: <BrandStudioPreview value={definition} modeId={modeId} />,
          },
        ]}
      />
    }
  >
    <BrandStudio
      draft={draftContext}
      value={definition}
      onChange={setDefinition}
      step={step}
      onStepChange={setStep}
      modeId={modeId}
      onModeIdChange={setModeId}
      previewPlacement="external"
    />
  </ScreenShell>
);
```

`previewPlacement="inline"` remains the default. `BrandStudioPreview` accepts a
controlled `BrandingDefinition` and mode, compiles locally without persistence
or network ownership, and renders the same visual specimen used by inline
Studio.
