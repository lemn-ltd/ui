# Third-party evidence

Files under `licenses/` are verbatim license artifacts captured from the exact npm package
versions in `registry/provider-registry.v1.json`. Their SHA-256 hashes are part of the active Git
manifest and are verified by `verifyRegistryArtifacts`.

`sbom.spdx.json` is the SPDX 2.3 direct-provider inventory for registry revision `1.0.0`. Its own
hash is pinned by the manifest, and validation checks each runtime provider name, exact version,
and declared license against the active capability records.

These files record code-license obligations only. They do not grant rights to provider trademarks,
logos, examples, fonts, copied documentation, or other third-party assets.
