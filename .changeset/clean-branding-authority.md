---
"@lemn-ltd/brand-contract": major
"@lemn-ltd/brand-runtime": minor
"@lemn-ltd/brand-studio": major
"@lemn-ltd/ui": patch
---

Replace the previous branding contract with `BrandingDefinition` v1, immutable
versioned System brandings, deterministic complete-mode artifacts, and a
persistence-free Studio driven only by controlled values and typed host intents.
Add the server-only runtime package for signed active/preview resolution,
verified preview draft metadata, bounded branded fallback, and first-byte SSR
integration, including verified selected-mode font origins for CSP without
preloading preferred fonts.
Publish the extended semantic appearance-token vocabulary without reusing the
immutable `@lemn-ltd/ui@0.3.0` tarball.
