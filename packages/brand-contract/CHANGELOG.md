# @lemn-ltd/brand-contract

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

## 0.2.0

### Minor Changes

- 34a05f9: Introduce BrandProject v2 with Profile-level governed typography, a curated
  system/managed font catalog, immutable Cloudflare CDN resources, SSR font
  metadata, and selectable Body, Heading, and Code roles in Brand Studio.

## 0.1.0

### Minor Changes

- Introduce the versioned project branding contract, deterministic compiler,
  profile and mode resolution, contrast diagnostics, scoped critical CSS, and
  provider theme adapters for server-first branded rendering.
