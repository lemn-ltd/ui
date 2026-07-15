# Third-party evidence

Files under `licenses/` are verbatim license artifacts captured from the exact npm package version
or immutable source revision in `registry/provider-registry.v1.json`. Their SHA-256 hashes are part
of the active Git manifest and are verified by `verifyRegistryArtifacts`.

`source-snapshots/` contains byte-identical upstream files at a full Git SHA. `transforms/` contains
the reproducible mechanical transform and `patches/` contains every deliberate LEMN delta with a
reason. Generated UI files are never edited directly; `check:snapshots` proves offline drift and
`sync:snapshots` refetches only the same immutable revision before regenerating output.

`sbom.spdx.json` is the SPDX 2.3 direct-provider inventory for registry revision `1.1.0`. Its own
hash is pinned by the manifest, and validation checks each runtime package or source snapshot
identity, exact version/revision, and declared license against the active capability records.

These files record code-license obligations only. They do not grant rights to provider trademarks,
logos, examples, fonts, copied documentation, or other third-party assets.
