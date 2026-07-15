# UI Brand Lab MVP

This private workspace app validates the provider-selection and project-branding architecture before a production specification is written.

## Scope

- Exactly five selected capabilities: React Aria `Button`, the official shadcn `Checkbox` structure backed by the direct Radix Checkbox package, Apache ECharts `AreaChart`, and Recharts `BarChart` plus `PieChart` configured as a donut.
- The preset catalog contains 49 identities and 98 complete project contracts: all 32 themes bundled by the open-source Codex CLI, adapted independently to light and dark application semantics, 15 original LEMN identities designed as native light/dark pairs, and two public-product visual studies for Cloudflare Dashboard and Apple application styling.
- Public-reference seeds pass through the same mandatory contrast compiler as every other brand. Text, focus, or chart colors are minimally normalized when the selected surface would otherwise fail the MVP's accessibility gates.
- Project branding is validated and compiled into CSS variables plus provider adapters. `Chart 1` is one contract value consumed by all three charts, even across ECharts and Recharts.
- Initial HTML, component markup, critical styles, the ECharts SVG, and branded fixed-size Recharts fallbacks are rendered by the Worker before browser JavaScript runs. Recharts mounts its native interactive charts after hydration with the already-compiled snapshot.
- Published project contracts and compiled snapshots use a local Cloudflare KV binding. Built-in projects remain a fully branded fallback when KV is unavailable.
- The app is private and has no production deploy command, public package exports, changeset, or entry in the stable component catalog.

## Pattern posture

The MVP applies `PAT-ARCH-CLOUDFLARE-FIRST-001`, `PAT-ARCH-BINDINGS-ADAPTERS-001`, `PAT-CODE-DEPENDENCIES-001`, `PAT-CLOUDFLARE-WRANGLER-CONFIG-001`, `PAT-TEST-CLOUDFLARE-ADAPTERS-001`, and `PAT-UI-SYSTEM-001`.

Cloudflare KV is intentionally limited to non-sensitive, versioned branding contracts and derived snapshots. It does not store permissions, ownership, billing, authentication, or other consistency-critical state. The built-in projects make every KV record disposable for this MVP.

## Run

```bash
pnpm --filter @lemn-ltd/ui-brand-lab run dev
```

Local URL: `http://localhost:6501`

With the shared Lemn development tunnel running, the browser URL is
`https://brand-lab-6501.le-mn.com`.

## What to verify

1. Select any Codex, LEMN, or visual-reference preset, then switch its light/dark appearance. The
   selector exposes 49 identities instead of duplicating 98 flat options; every
   choice still resolves to an independent, versioned project contract.
2. Verify that the root CSS snapshot, provider components, ECharts theme, and
   both Recharts adapters move to the same hash in one browser frame.
3. Use the Colors, Typography, and Shape steps to change semantic colors, font
   stacks, sizes, radii, borders, elevation, and density without modifying any
   provider's interaction code.
4. Expand **Advanced semantic colors**, change **Chart 1**, and verify the area,
   bar, and donut charts update together despite using two providers.
5. Open Review to inspect or copy the exact versioned JSON contract. Provider
   provenance and preset-family metadata remain outside the project JSON.
6. Publish to local KV, then use **Reload SSR proof**. The next document response
   contains the stored brand tokens and chart SVG before the hydration script.
