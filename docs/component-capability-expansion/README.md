# Component capability expansion

This document records the `@lemn-ltd/ui` 0.2.0 component expansion and the
contract that keeps package exports, the catalog, the showcase, and written
guidance aligned.

## Result

The public catalog contains exactly 130 components: 101 in Core and 29 in
Agents. Every entry declares its `area` and `group`; area is never inferred from
the family name.

| Area | Family | Count |
| --- | --- | ---: |
| Core | Primitives | 9 |
| Core | Inputs | 17 |
| Core | Forms | 9 |
| Core | Visualizations | 13 |
| Core | Data display | 18 |
| Core | Feedback | 6 |
| Core | Overlays | 10 |
| Core | Navigation | 10 |
| Core | Layout | 9 |
| Agents | Conversation | 6 |
| Agents | Governance | 6 |
| Agents | Approvals | 3 |
| Agents | Automation | 6 |
| Agents | Runtime & evidence | 8 |

The 18 new catalog components are:

- Visualizations: `AreaChart`, `BarChart`, `ComboChart`, `BarList`,
  `CategoryBar`, `DonutChart`, `LineChart`, `ProgressCircle`, `SparkChart`, and
  `Tracker`.
- Inputs: `SelectNative`, `RadioCardGroup`, `ToggleGroup`, `Slider`,
  `DatePicker`, and `DateRangePicker`.
- Navigation: `TabNavigation`.
- Layout: `Separator`.

`Calendar`, `Tabs`, and `InfoBanner` were extended rather than duplicated.
Calendar supports single and range selection, one or two months, locale and
week-start options, disabled constraints, deterministic today, and controlled
or uncontrolled state. Tabs now owns accessible tab panels with preserved or
lazy mounting. InfoBanner now supports titles, optional or custom icons,
actions, dismissal, and urgency semantics.

## Catalog contract

The public discriminated types are `ComponentArea`, `CoreComponentGroup`,
`AgentComponentGroup`, and `ComponentCatalogEntry`. Consumers that previously
treated `group` as an area must branch on `entry.area` and use the group union
appropriate to that area. Routes remain `/core/components/:slug` and
`/agents/components/:slug`.

Catalog tests enforce exact counts, unique slugs, valid area-family pairs,
public exports, written component guidance, and showcase routes. A component is
not complete until all of those surfaces are updated together.

## Selection rules

- Use `Field` for accessible labels, descriptions, validation, and form layout.
  A standalone `Label` is intentionally not part of the catalog.
- Use `Tabs` to switch panels in the current document. Use `TabNavigation` for
  links that change URLs.
- Use `Toggle` for one binary state, `ToggleGroup` for a related set of toggles,
  and `SegmentedControl` for one compact choice among mutually exclusive views.
- Use `Calendar` for an exposed calendar surface. Use `DatePicker` or
  `DateRangePicker` when the calendar belongs in a compact form control.

## Consumer migration for 0.2.0

The package and stylesheet imports remain canonical:

```ts
import { Button, LineChart, componentCatalog } from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css";
```

Update catalog integrations to read `entry.area` explicitly and replace uses of
the former broad `ComponentGroup` type with `CoreComponentGroup` or
`AgentComponentGroup`. Do not import provider types for charts; the public chart
APIs are owned by Lemn UI. See the [visualization system](../visualization-system/README.md)
for renderer and bundle boundaries.

## Change checklist

For every future component change:

1. Add or update the implementation, colocated tests, public export, and CSS.
2. Add the explicit area-family catalog entry.
3. Add or update the live showcase page, with no more than three examples.
4. Update `packages/ui/docs/components.md` and relevant composition guidance.
5. Verify package checks, catalog drift, boundaries, bundles, responsive themes,
   accessibility, and the public docs build.

The root `pnpm validate` command is the release gate. Important UI decisions and
evidence also belong in `patterns/pattern-audit.md` under the applicable
`PAT-UI-*`, `PAT-CODE-*`, `PAT-TEST-*`, and `PAT-DOCS-*` patterns.
