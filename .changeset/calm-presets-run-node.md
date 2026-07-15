---
"@lemn-ltd/brand-studio": patch
---

Expose the side-effect-free `@lemn-ltd/brand-studio/presets` entrypoint so
SSR, seed, and CLI processes can create canonical brand projects without
loading React or evaluating CSS.
