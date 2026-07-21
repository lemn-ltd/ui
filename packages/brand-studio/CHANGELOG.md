# @lemn-ltd/brand-studio

## 2.2.0

### Minor Changes

- 2bef1cf: Expand `BrandStudioPreview` into a responsive, full-bleed application specimen built from public Lemn UI components. The preview now demonstrates navigation, data tables, forms, charts, semantic statuses, responsive surfaces, and live interactions while leaving scrolling and panel controls to the host surface.

## 2.1.0

### Minor Changes

- b5b70d4: Add controlled wizard-step and visual-mode props, make the Brand Studio step rail horizontally scrollable, and expose the package-owned live preview for host-managed surfaces such as `DockPanel` while preserving inline preview as the default.

### Patch Changes

- Updated dependencies [fc0a8b9]
  - @lemn-ltd/ui@0.4.1

## 2.0.0

### Major Changes

- cf5bf3d: Expose Core-only component and React-free block metadata catalog projections so Node and browser catalog consumers can exclude disabled Agent metadata and component CSS without duplicating the package authority.

  Update Brand Studio's exact `@lemn-ltd/ui` peer to the new minor. Because the Studio contract intentionally pins that peer, this compatibility boundary is an explicit major release rather than an implicit dependent bump.

### Patch Changes

- Updated dependencies [cf5bf3d]
  - @lemn-ltd/ui@0.4.0

## 1.0.0

### Major Changes

- 27cee3a: Replace the previous branding contract with `BrandingDefinition` v1, immutable
  versioned System brandings, deterministic complete-mode artifacts, and a
  persistence-free Studio driven only by controlled values and typed host intents.
  Add the server-only runtime package for signed active/preview resolution,
  verified preview draft metadata, canonical per-mode projection hashes, signed
  Workspace/publication identity, public asset references, a bounded multimode
  branded fallback, and first-byte SSR integration. Full compiled artifacts,
  source definitions, private storage keys, other-mode configuration, and
  credentials remain outside runtime envelopes. Selected-mode font origins are
  verified for CSP without preloading preferred fonts. SSR markup and hydration
  are bound to the exact signed `projectionHash` and mode identity, not the
  cross-mode `compiledHash`.
  Publish the extended semantic appearance-token vocabulary without reusing the
  immutable `@lemn-ltd/ui@0.3.0` tarball.

### Patch Changes

- Updated dependencies [27cee3a]
  - @lemn-ltd/brand-contract@1.0.0
  - @lemn-ltd/ui@0.3.1

## 0.2.0

### Minor Changes

- 34a05f9: Introduce BrandProject v2 with Profile-level governed typography, a curated
  system/managed font catalog, immutable Cloudflare CDN resources, SSR font
  metadata, and selectable Body, Heading, and Code roles in Brand Studio.

### Patch Changes

- Updated dependencies [34a05f9]
  - @lemn-ltd/brand-contract@0.2.0

## 0.1.1

### Patch Changes

- 2272000: Expose the side-effect-free `@lemn-ltd/brand-studio/presets` entrypoint so
  SSR, seed, and CLI processes can create canonical brand projects without
  loading React or evaluating CSS.

## 0.1.0

### Minor Changes

- Introduce the persistence-agnostic Brand Studio wizard, preset catalog,
  advanced contract editor, diagnostics, profile and mode controls, and live
  compiled preview host contract.
