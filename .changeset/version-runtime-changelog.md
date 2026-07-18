---
"@lemn-ltd/brand-runtime": patch
---

Publish the corrected versioned changelog metadata in a new immutable package
tarball. The runtime API and behavior are unchanged; this patch prevents the
post-`0.1.0` documentation cleanup from reusing the published `0.1.0` identity.
