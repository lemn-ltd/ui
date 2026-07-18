# @lemn-ltd/brand-runtime changelog

## 0.1.1

### Patch Changes

- d517b3e: Publish the corrected versioned changelog metadata in a new immutable package
  tarball. The runtime API and behavior are unchanged; this patch prevents the
  post-`0.1.0` documentation cleanup from reusing the published `0.1.0` identity.

## 0.1.0

### Minor Changes

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

### Additional details

- Add verified active and preview branding resolution for SSR consumers.
- Add capability-scoped RPC Service Binding and authenticated HTTPS adapters.
- Add embedded branded fallback, preview selection validation, and safe SSR
  markup helpers.
- Add one-use hosted-preview exchange, exact draft-hash pinning, and isolated
  short-lived preview authorization.
- Emit the selected color scheme, immutable font preloads, scoped critical CSS,
  and hydration identity before consumer markup.
