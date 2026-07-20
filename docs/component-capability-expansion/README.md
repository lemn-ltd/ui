# Component capability expansion

This document records the component-expansion lineage and the current contract
that keeps package exports, the catalog, the Portal, and written guidance
aligned.

## Result

The public catalog contains exactly 131 components: 102 in Core and 29 in
Agents. Every entry declares its `area` and `group`; area is never inferred from
the family name.

| Area | Family | Count |
| --- | --- | ---: |
| Core | Primitives | 9 |
| Core | Inputs | 17 |
| Core | Forms | 9 |
| Core | Visualizations | 14 |
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

The initial 0.2.0 expansion added 18 catalog components:

- Visualizations: `AreaChart`, `BarChart`, `ComboChart`, `BarList`,
  `CategoryBar`, `DonutChart`, `LineChart`, `ProgressCircle`, `SparkChart`, and
  `Tracker`.
- Inputs: `SelectNative`, `RadioCardGroup`, `ToggleGroup`, `Slider`,
  `DatePicker`, and `DateRangePicker`.
- Navigation: `TabNavigation`.
- Layout: `Separator`.

The later provider cutover added `HeatmapChart` as the 131st capability. It is
the single ECharts-backed visualization and retains a provider-neutral LEMN API.

`Calendar`, `Tabs`, and `InfoBanner` were extended rather than duplicated.
Calendar supports single and range selection, one or two months, locale and
week-start options, disabled constraints, deterministic today, and controlled
or uncontrolled state. Tabs now owns accessible tab panels with preserved or
lazy mounting. InfoBanner now supports titles, optional or custom icons,
actions, dismissal, and urgency semantics.

`AccentColorPicker` is a public theme companion rather than a catalog entry, so
the catalog remains exactly 131 components. Consumers can expose it next to
`ThemeToggle`, control its value, or let it persist a selected accent and apply
the derived semantic tokens to the document root.

## Catalog contract

The public discriminated types are `ComponentArea`, `CoreComponentGroup`,
`AgentComponentGroup`, and `ComponentCatalogEntry`. Consumers that previously
treated `group` as an area must branch on `entry.area` and use the group union
appropriate to that area. The active Lemn UI Portal registry contains Core
only. Core components use `/components/:slug` or `/visualizations/:slug`;
Agent source and package exports remain available but are not registered in
Portal routes, navigation, search, machine catalogs, or browser bundles.

Catalog tests enforce exact counts, unique slugs, valid area-family pairs,
public exports, written component guidance, and Portal routes. A component is
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

Products that want runtime accent selection can opt into the new companion
without changing existing theme setup:

```tsx
import { AccentColorPicker, ThemeToggle } from "@lemn-ltd/ui";

<AccentColorPicker />
<ThemeToggle />
```

The picker defaults to root application and local persistence. Set
`applyToRoot={false}` or `persist={false}` when a product owns those concerns.

## Change checklist

For every future component change:

1. Add or update the implementation, colocated tests, public export, and CSS.
2. Add the explicit area-family catalog entry.
3. Add or update the live Portal page, with no more than three examples.
4. Update `packages/ui/docs/components.md` and relevant composition guidance.
5. Verify package checks, catalog drift, boundaries, bundles, responsive themes,
   accessibility, and the public docs build.

The root `pnpm validate` command is the release gate. Important UI decisions and
evidence also belong in `patterns/pattern-audit.md` under the applicable
`PAT-UI-*`, `PAT-CODE-*`, `PAT-TEST-*`, and `PAT-DOCS-*` patterns.
