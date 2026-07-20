# UI Portal unification: Phase 2 live clean-room evidence

Status: **PASS — clean-room reconstruction complete; VERSIONED ACCESS EXCEPTION ACTIVE**

Evidence date: 2026-07-20

Target branch: `main`

Validated runtime revision: `aae526f9a205bbc631b50410c25bb7a0b8df9a1f`

Release version: `0.4.0`

Release time: `2026-07-20T09:23:10Z`

Target contract: [UI Portal infrastructure contract](../../../apps/ui-portal/docs/infrastructure/README.md)

## Evidence boundary

This receipt proves the destructive inventory, scoped removal, empty
checkpoint, rebuild, direct clean deployment, canonical domain attachment,
immutable font delivery, live HTTP behavior, runtime log observation, and
negative legacy state for the exact runtime revision above.

Cloudflare Access is intentionally disabled at the explicit request of the
owner for this verification window. The Portal is deployed with
`DEPLOYMENT_ENVIRONMENT=test` and uses its explicit `test-origin-gate`.
Therefore this receipt does not claim zero-trust readiness or production-ready
Admin authorization. The target-state Access contract remains unchanged and
the versioned exception and closure requirements are recorded below and in
`patterns/pattern-audit.md`.

No resource outside the proved UI ownership allowlist was mutated.

## Pattern applicability

This focused receipt provides evidence for
`PAT-CLOUDFLARE-WRANGLER-CONFIG-001`,
`PAT-CLOUDFLARE-BUNDLE-ASSETS-001`,
`PAT-CLOUDFLARE-BUNDLE-DEPS-001`,
`PAT-INFRA-RESOURCE-NAMING-001`,
`PAT-INFRA-RESOURCE-CONTRACT-001`,
`PAT-TEST-EVIDENCE-001`,
`PAT-OBS-GENERAL-001`, and
`PAT-DOCS-WIKI-001`.

The temporary authorization and credential exceptions affect
`PAT-AUTH-LEMN-001`, `PAT-SEC-AUTHORIZATION-001`, and
`PAT-OPS-LEAST-PRIVILEGE-001`. This focused result does not calculate or change
any domain `current_level`.

## Provider identity and mutation boundary

AgentOps secret metadata was inspected before reading the required credential.
The Cloudflare identity was verified against the Lemn DEV account and the
`le-mn.com` zone recorded in that metadata before mutation. The credential
value was never printed, persisted in repository files, committed, or included
in evidence.

Every destructive operation used an explicit UI-only resource allowlist and
refused unrelated Workers, domains, Access resources, DNS records, and R2
resources.

## Destructive inventory

| Resource class | Proved UI-exclusive inventory |
|---|---|
| Canonical Workers | `lemn-ui-portal`, `lemn-ui-docs` |
| Legacy Workers | `lemn-ui-showcase-admin`, `lemn-ui-showcase`, plus two UI Workers under the retired organization scope (exact names retained only in the ephemeral provider inventory) |
| Canonical Worker domains | `portal.ui.le-mn.com`, `schemas.ui.le-mn.com`, `ui.le-mn.com` |
| Legacy Worker domains | `showcase.ui.le-mn.com`, `admin.showcase.ui.le-mn.com` |
| Access | Four UI-exclusive applications, associated reusable or embedded policies, and two UI-exclusive service tokens |
| Font delivery | R2 bucket `lemn-dev-ui-font-assets`, custom domain `fonts.ui.le-mn.com`, 15 WOFF2 objects, and 8 license objects |
| Shared account resources | Outside the allowlist and left unchanged |

The six Workers were dry-run individually before their clean-room deletion.
Canonical and legacy custom-domain ownership, provider DNS attachments, Access
ownership, service tokens, and font-object keys were checked before removal.

The exact ordered six-Worker destructive allowlist has SHA-256
`41334eb6473467fee961722e0ff67d15c70611d1bfec93d64d514eeff0f8003e`.
Two names in that list used the retired organization identity and are not
repeated in this active repository because the zero-legacy identity gate
intentionally rejects them. The ephemeral mode-`0700` controller used for the
operation had SHA-256
`27bf10c450ab35bfea3297f658e96e3d805eed53e0333842c00935ba16564155`.

The deleted Access inventory is durably identified by application ids
`65b656e2-ecef-485a-943c-a46b52e46c6a`,
`a76ae618-4a0b-4a2b-a320-6a6f872ba3d7`,
`777d5d7b-5b64-4e5a-90fd-47274218984f`, and
`a809302d-05a7-45b6-8ca5-a1195cc481b2`; policy ids
`53a41b80-4a03-44d4-ac55-3bf2eaed5f43`,
`a6b5533e-bbf3-42cc-b385-23c0bc509e79`,
`d5071599-095c-499d-8952-ef802e1200cc`,
`0cda4265-59f2-4b7a-9d77-d00ccd05b2e5`, and
`45ffc536-3531-4b44-bd79-c925929bae7d`; and service-token ids
`b0460b12-591d-4cfe-b54a-3603164d6e98` and
`b7b568d2-4339-4af1-8701-f036f7d2359a`.

## Empty checkpoint

After deletion and before recreation, the scoped inventory returned:

```text
workers 0
domains 0
dns 0
accessApps 0
serviceTokens 0
fontResources 0
versions 0
deployments 0
state empty
```

This checkpoint applies only to the exact UI-owned allowlist. It does not
assert that the Cloudflare account itself was empty.

## Rebuild and local gates

| Gate | Result |
|---|---|
| Frozen workspace installation | `PASS`; lockfile unchanged |
| Root check | `PASS`; `11/11` |
| Root tests | `PASS`; `784/784` |
| Root build | `PASS`; `7/7` |
| Docs Astro check | `PASS`; `0` errors, `0` warnings, `0` hints |
| Portal focused check | `PASS` |
| Portal focused unit tests | `PASS`; `74/74` |
| Portal dist boundaries | `PASS`; `7/7` |
| Docs Wrangler dry run | `PASS`; `110` assets |
| Portal Wrangler dry run | `PASS`; `618` assets |
| Final root `pnpm validate` | `PASS` |
| AgentOps managed-file validation | `PASS` — five managed files match the AgentOps lock |

Wrangler's sandbox log warning, the CSS Custom Highlight parser warning, and
the measured visualization chunk-size warning were non-blocking; every listed
gate command exited successfully.

## Font R2 reconstruction

The governed font catalog recreated exactly 23 objects: 15 immutable WOFF2
files and 8 immutable license files. Every object was uploaded from the
Git-authoritative catalog, downloaded directly from remote R2, and compared by
exact byte length and SHA-256. The public CDN preflight then verified public
hashes, CORS, content types, cache policy, and the active
`fonts.ui.le-mn.com` custom domain. No object outside the governed manifest was
introduced.

## Final Worker deployments

| Surface | Worker | Runtime revision | Version id | Deployment id | Traffic |
|---|---|---|---|---|---:|
| Docs | `lemn-ui-docs` | `aae526f9a205bbc631b50410c25bb7a0b8df9a1f` | `3891ad60-b95b-41c5-a3ac-989340ac05dd` | `955a78fe-aca3-480f-9166-6dfffc4997b5` | `100%` |
| Portal | `lemn-ui-portal` | `aae526f9a205bbc631b50410c25bb7a0b8df9a1f` | `6517ab4e-72ef-463d-84be-589eec8ea4f2` | `a5858b09-deee-46e4-9e7f-5956fe5bab6f` | `100%` |

Each Worker has exactly one version and exactly one deployment. Explicit
`wrangler deployments status` output agrees with the provider APIs.

| Concern | Verified state |
|---|---|
| Docs domain | `ui.le-mn.com` -> `lemn-ui-docs` |
| Portal domains | `portal.ui.le-mn.com` and `schemas.ui.le-mn.com` -> `lemn-ui-portal` |
| Provider-owned DNS attachments | Exactly the three canonical Worker domains |
| Workers.dev | Disabled for both Workers |
| Preview URLs | Disabled for both Workers |
| Worker routes | None |
| Docs runtime bindings | No variables or service bindings |
| Portal asset binding | Exact `ASSETS` binding |
| Portal non-secret variables | Exact issuer, `DEPLOYMENT_ENVIRONMENT=test`, build version, Git SHA, and build time |
| Portal Access audiences | Absent during the authorized Access-off verification window |
| Cloudflare Access | Zero UI applications, policies, and service tokens |
| Font delivery | R2 bucket and custom domain active with exactly 23 governed objects |
| Legacy Workers/domains | Absent |

## Live HTTP and runtime evidence

The final HTTP smoke passed `25/25` checks with zero `5xx` responses. It
covered:

- Docs root and exact release identity;
- Portal root, health, Catalog, provider read model, Blocks, and LLM documents;
- canonical BrandingDefinition schema behavior;
- anonymous denial for Admin and deep health;
- test-origin Admin HTML plus session, Registry, Conformance, Release, and
  Settings read models;
- non-authoritative Registry proposal generation and a before/after assertion
  that the active Registry remained byte-for-byte unchanged;
- explicit `test-origin-gate` state in both the session and Settings contract;
- denial of the Admin identity at the health-only boundary;
- public font and license hashes, cache, and CORS;
- negative resolution for both legacy hostnames.

A scoped Portal Worker error tail remained active during the smoke and emitted
zero error events.

## Browser and visual evidence

The repository-owned live Playwright smoke passed `3/3` for Docs, public
Portal, and Admin. It proved interactive navigation, stable document height,
anonymous Admin denial, the authorized test-origin path, effective Settings,
and zero page, console, or request errors. The inspected screenshots are
retained beside this receipt:

| Surface | Evidence | SHA-256 |
|---|---|---|
| Docs | [live/docs.png](live/docs.png) | `749b7d4cf7b8f2f382a7bc5a3114c59173e8b44c9142b308cd0a131148bd0c69` |
| Portal | [live/portal.png](live/portal.png) | `9c68ebc7769f8d365b0bf74186e64ecbf4ec71a73d7102ce14e6935a597d6a03` |
| Admin | [live/admin.png](live/admin.png) | `4662731d1648da687d19048e25cdcc0886fee05485e7f4de65841951ac51f5ba` |

The Admin UI explicitly reports `Access disabled · test origin gate`, and its
Settings read model reports `test-origin-gate`; it does not misleadingly claim
Cloudflare Access protection. `Cache-Control: no-store, no-transform` prevents
the Cloudflare edge from injecting an Analytics beacon into the strictly
protected Admin HTML.

The in-app Browser had no attached controllable runtime during this gate.
Therefore no in-app-browser interaction is claimed; the live browser evidence
is the repository-owned Playwright run and the inspected screenshots above.

## GitHub workflow and repository state

The release workflow was temporarily disabled to prevent a concurrent hosted
deployment from racing the clean-room operation. It is restored only after the
final evidence commit is pushed and is not used to replay an older release.

Final closure requires and verifies:

```text
workflow active
active hosted runs 0
main equals origin/main
worktree clean
```

## Versioned Cloudflare Access exception

Owner: UI Platform Security.

For Portal Worker version `6517ab4e-72ef-463d-84be-589eec8ea4f2` and
deployment `a5858b09-deee-46e4-9e7f-5956fe5bab6f`, Cloudflare Access
applications, policies, audiences, and service token are intentionally absent.
The Worker is deployed in `test` mode and accepts the source-visible,
non-secret test-origin marker.

Anyone able to reach the origin and reproduce that marker can obtain the
Portal's current non-authoritative Admin capability: Git-backed read models and
deterministic, in-memory proposal-bundle generation that does not persist or
mutate the active Registry. While this exception is active:

- the Admin surface must not contain private, tenant, credential, or customer
  data;
- the Admin surface must not gain persistence, publication, activation,
  secret, billing, or control-plane authority;
- the deployment must not be represented as production-ready or zero-trust
  protected.

Closure requires all of the following:

1. Recreate the path-scoped human Admin Access application or minimal
   technical split with one explicit human policy.
2. Recreate the isolated deep-health Access application, Service Auth policy,
   and a fresh health-only service token.
3. Project distinct Admin and health audiences through the protected release
   boundary.
4. Deploy the Portal with `DEPLOYMENT_ENVIRONMENT=production`.
5. Prove that the test-origin marker is rejected in production.
6. Prove the anonymous, approved-human, wrong-human, health-service,
   wrong-service, wrong-audience, expired-token, and Admin-chunk matrix.
7. Run the integrated HTTP/browser smoke and scoped error tail against the
   exact replacement version.
8. Remove the versioned AUTH and SEC exceptions from
   `patterns/pattern-audit.md`.

## Temporary least-privilege exception

The clean-room controller used the existing Cloudflare Global API Key because
the required account-wide cleanup operations were not available through a
scoped credential. The credential was read only from AgentOps, passed through
the process environment, protected by an explicit resource allowlist, and
never printed or persisted.

Owner: UI Platform Release Operations.

The remaining risk is the credential's account-wide authority if the secret or
process is compromised. Rotate or revoke that credential after this cutover
and use an Account Owned API token with the minimum Worker, domain, DNS,
Access, and R2 permissions for subsequent releases.

## Sign-off

**PASS WITH VERSIONED ACCESS EXCEPTION.** The UI-owned Cloudflare footprint was
inventoried, removed, proved empty, rebuilt, and recreated from the exact
runtime revision. Canonical Docs, Portal, schema, and font hosts pass live
checks; legacy Workers and domains are absent; each Worker has exactly one
active version and deployment at `100%`; and the live error tail is clean.

Cloudflare Access intentionally remains disabled for the owner-authorized test
window. Restoring and proving the zero-trust identity matrix is the explicit
condition for production-readiness, not an implied part of this sign-off.
