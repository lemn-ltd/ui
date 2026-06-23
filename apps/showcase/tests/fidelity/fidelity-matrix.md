# Fidelity matrix (Lane A)

> **STATUS: `blocked: needs human + patched .pen`.** No row is GREEN yet.
>
> Lane A proves each `@appranks/ui` component is 100% faithful to its
> `packages/ui/design/ui.pen` master. It is a human faithfulness review, not a
> pixel gate. A row turns GREEN only when (1) the Pencil masters are captured
> against the canonical `packages/ui/design/ui.pen` (see
> `master-manifest.json.capturedAgainstPatchedPen`), (2) the
> build-time contact sheet is generated, and (3) a **second reviewer (the design
> owner), not the implementer**, signs each row by filling Reviewer + Date.
>
> The code bakes the day-one 99 fixes (unitless line-height ratios, soft status
> tokens, canonical Menu, distinct emphasized + linear easings, sidebar wiring)
> from the start, so sign-off can proceed as soon as the canonical `.pen` and a
> reviewer are available. The implementer cannot self-sign.
>
> Lane B (automated regression) is already green and independent of this matrix:
> per-component unit specs, behavior + axe e2e, and Light/Dark x {375,768,1280}
> visual baselines all pass. The **Behavior** column records that Lane-B status.

Cell values: `pass` · `fail` · `n/a` · `pending`.

| Component         | Group        | Light   | Dark    | Mobile  | Tablet  | Desktop | Behavior      | Reviewer | Date | MasterNodeId |
| ----------------- | ------------ | ------- | ------- | ------- | ------- | ------- | ------------- | -------- | ---- | ------------ |
| Button            | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Icon Button       | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Input             | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Textarea          | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Select            | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Search            | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Checkbox          | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Radio             | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Toggle            | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Badge             | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Tag               | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Avatar            | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Kbd               | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Filter Pill       | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Scope Pill        | Primitives   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Field             | Forms        | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Segmented Control | Forms        | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Combobox          | Forms        | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      |              |
| Accordion         | Forms        | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      |              |
| Dialog            | Overlays     | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      |              |
| Confirm Dialog    | Overlays     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Menu              | Overlays     | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      | aulo4        |
| Popover           | Overlays     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      | Ypore        |
| Tooltip           | Overlays     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      | Tz6T9        |
| Command Palette   | Overlays     | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      | raCbS        |
| Sidebar           | Navigation   | pending | pending | pending | pending | pending | n/a           |          |      |              |
| Top Bar           | Navigation   | pending | pending | pending | pending | pending | n/a           |          |      |              |
| Entity Toolbar    | Navigation   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Breadcrumb        | Navigation   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Tabs              | Navigation   | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      |              |
| Stepper           | Navigation   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Org Switcher      | Navigation   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      | oLZGG        |
| Pagination        | Navigation   | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Card              | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Data Table        | Data display | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      |              |
| Stat Card         | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Stats Strip       | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Code Block        | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Json Viewer       | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Sparkline         | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Relative Time     | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| List Shell        | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| List Filters Bar  | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Filter Dropdown   | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Filter Chip       | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Empty State       | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Recent Chips      | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Preset Selector   | Data display | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Toaster           | Feedback     | pending | pending | n/a     | n/a     | n/a     | pass (Lane B) |          |      |              |
| Info Banner       | Feedback     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| System Bar        | Feedback     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Skeleton          | Feedback     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Spinner           | Feedback     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Progress Bar      | Feedback     | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Screen Shell      | Layout       | pending | pending | pending | pending | pending | n/a           |          |      |              |
| Content Layout    | Layout       | pending | pending | pending | pending | pending | n/a           |          |      |              |
| Page Section      | Layout       | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      |              |
| Section Grid      | Layout       | pending | pending | pending | pending | pending | n/a           |          |      |              |
| Two Column        | Layout       | pending | pending | pending | pending | pending | n/a           |          |      |              |
| Version Tag       | Layout       | pending | pending | n/a     | n/a     | n/a     | n/a           |          |      | nJ6hW        |
