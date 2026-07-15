# `@lemn-ltd/provider-registry`

Pure TypeScript governance kernel for selected upstream UI capabilities. It does not render UI,
fetch providers, mutate Git, or accept administrative proposals.

The only active authority is the reviewed Git manifest at
`registry/provider-registry.v1.json`. JSON Schema, TypeScript validation, read models, SPDX
alignment, and artifact hashing are enforcement layers around that file; none is a second source
of truth. Provider proposals belong in a separate PR bundle and become active only after the
reviewed manifest changes.

The companion `registry/capability-migration-matrix.v1.json` classifies every current catalog
capability as `keep-provider-backed`, `replace`, `native-with-rationale`, or `remove`. Its checked-in
generator is a drift gate: adding, removing, or renaming a catalog capability fails validation until
the provider decision, final export, SemVer effect, and conformance evidence are reviewed.

This boundary implements `PAT-ARCH-REPO-BOUNDARIES-001`,
`PAT-ARCH-SHARED-KERNEL-001`, `PAT-CODE-FRAMEWORK-API-VALIDITY-001`,
`PAT-CODE-DEPENDENCIES-001`, `PAT-API-CONTRACTS-001`, `PAT-TEST-INTEGRITY-001`, and
the provider governance in `PROVIDER_BRANDING_ECOSYSTEM_PLAN.md` sections 2.1, 2.7, and 7.

## Consumers and exclusions

The UI catalog, public Showcase read model, and protected Admin review surface consume the same
released manifest. The package owns only the shared, deterministic mapping policy those consumers
need; provider discovery, proposal review, and Git mutation remain host responsibilities.

It must not contain:

- React components or provider runtime imports;
- provider update fetching, GitHub credentials, or PR creation;
- persistence, HTTP, auth, or release orchestration;
- proposal or draft records in the active manifest;
- a second component catalog.

## Record guarantees

Each registered implementation records a stable semantic capability ID, one public LEMN export,
one provider of record, exact upstream identity, package integrity or full Git SHA, captured
licenses, SPDX classification, local adapters, branding roles, conformance evidence, and sync
state. Validation rejects:

- `latest`, semver ranges, tags, partial Git SHAs, and split provider package versions;
- zero or multiple active implementations/providers of record for a capability;
- duplicate public exports across active capabilities;
- denied, unknown, or unapproved manual-review licenses;
- missing/tampered license or SBOM artifacts;
- source snapshots whose selected files are outside the declared closure;
- path traversal, unknown fields, and proposal data in the active schema.

An empty conformance category is an explicit evidence gap, not a pass. `behavior` must always have
at least one real test. The final migration must fill accessibility, interaction, visual, SSR, and
bundle evidence where applicable before claiming the capability complete.

## Current provider-of-record slice

| Capability | LEMN export | Provider pin | License |
|---|---|---|---|
| `ui.primitive.checkbox` | `Checkbox` | `radix-ui@1.4.3` | MIT |
| `ui.visualization.line-chart` | `LineChart` | `recharts@3.9.2` | MIT |
| `ui.visualization.heatmap-chart` | `HeatmapChart` | `echarts@6.1.0` | Apache-2.0 |
| `ui.core.tracker` | `Tracker` | `tremorlabs/tremor@ca4d588f47820ff3d514d37fa4ee08a4222dec11` | Apache-2.0 |
| `ui.form.json-code-editor` | `JsonCodeEditor` | `@uiw/react-codemirror@4.25.10` | MIT |
| `ui.data-display.syntax-code-block` | `SyntaxCodeBlock` | `shiki@4.2.0` | MIT |
| `ui.data-display.markdown` | `Markdown` | `react-markdown@10.1.0` | MIT |
| `ui.overlay.command-palette` | `CommandPalette` | `cmdk@1.1.1` | MIT |
| `ui.feedback.toaster` | `Toaster` | `sonner@2.0.7` | MIT |
| `ui.agent.execution-map` | `ExecutionMap` | `@xyflow/react@12.11.0` | MIT |

This is a deliberately selected provider-backed slice, not an instruction to ingest complete
provider catalogs. Unregistered capabilities are not silently classified as native LEMN code;
each additional external capability requires its own reviewed provider-of-record record.

## Usage

```ts
import manifest from '@lemn-ltd/provider-registry/manifest.json' with { type: 'json' }
import {
  assertValidProviderRegistry,
  buildProviderRegistryReadModel,
} from '@lemn-ltd/provider-registry'

assertValidProviderRegistry(manifest)
const readModel = buildProviderRegistryReadModel(manifest)
```

Use `verifyRegistryArtifacts` at repository/release boundaries with a host-provided file reader.
The kernel uses Web Crypto and never imports Node filesystem APIs in production code.

## Verification

### Script catalog

| Command | Category | Owner | Scope | Environment | Mutation | Secrets | Dry-run / apply | CI | Removal |
|---|---|---|---|---|---|---|---|---|---|
| `check:snapshots` | `check` | LEMN UI | Active `source_snapshot` closure, transform hashes, and generated outputs | Local and CI; offline | None | None | Always check-only; never writes | Yes, through package `check` | Permanent while the registry supports source snapshots |
| `sync:snapshots` | `codegen` | LEMN UI | The same active immutable closure and generated outputs | Maintainer workstation with network access | Writes only declared snapshot/output paths | None | Explicit apply command; the underlying CLI writes only with `--write` | No | Remove only after the final source-snapshot capability is retired |

Both commands execute maintained TypeScript source. Network refresh is limited
to the full Git SHA in the reviewed manifest, and every fetched byte must match
its pinned SHA-256 before any file is written.

```bash
pnpm --filter @lemn-ltd/provider-registry run check
pnpm --filter @lemn-ltd/provider-registry run test
pnpm --filter @lemn-ltd/provider-registry run build
# Offline drift check for captured bytes and generated adapters
pnpm --filter @lemn-ltd/provider-registry run check:snapshots
# Explicit network refresh from the same immutable full commit
pnpm --filter @lemn-ltd/provider-registry run sync:snapshots
```

The checked-in `third-party/sbom.spdx.json` is the SPDX 2.3 inventory of selected direct runtime
providers and source snapshots. Captured Apache ECharts evidence includes its Apache-2.0 license,
NOTICE, and embedded d3 BSD-3-Clause license. Tremor Tracker records a byte-identical raw closure,
deterministic transform, explicit semantic patch, and Apache-2.0 evidence. Release tooling verifies
these immutable artifacts before package publication.
