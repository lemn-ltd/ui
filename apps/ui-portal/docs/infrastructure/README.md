# UI Portal infrastructure contract

Status: **target-state contract** for `PAT-INFRA-RESOURCE-CONTRACT-001`.

This document defines the production resources that the UI Portal owns or
consumes. It is not a deployment receipt and must not be used as evidence that
the target resources already exist. Exact deployed identifiers, versions, and
verification results belong in the release evidence for the delivered
revision.

## Temporary live-verification exception

The live deployment recorded on 2026-07-20 in the
[Phase 2 clean-room receipt](../../../../docs/evidence/ui-portal-unification/phase-2-production.md)
is an explicit non-production exception to this target-state contract.

At the owner's request, Cloudflare Access applications, policies, audiences,
and service token remain absent while the rebuilt surfaces are tested. The
Portal is deployed with `DEPLOYMENT_ENVIRONMENT=test`, reports
`test-origin-gate`, and accepts the source-visible, non-secret test-origin
marker. Anyone able to reproduce that marker can receive the current
non-authoritative Admin capability: Git-backed read models plus deterministic,
in-memory proposal-bundle generation that does not persist or mutate the active
Registry. The Admin surface must therefore contain no private data and must
gain no persistence, publication, activation, secret, billing, or control-plane
authority while this exception is active.

The target contract below remains unchanged: production requires path-scoped
Cloudflare Access, origin JWT verification, separate human and health
audiences, and a health-only service identity. Closing the exception requires
redeployment with `DEPLOYMENT_ENVIRONMENT=production`, rejection of the test
marker, and positive and negative proof for anonymous, human, and service
identities. Exact affected Worker and deployment ids and the complete closure
checklist live in the Phase 2 receipt.

The disabled edge state is now explicit in
`tooling/manifests/infrastructure/zero-trust.json`: `main` maps to the single
logical `production` environment and `enabled` is `false`. `pnpm access:plan`
reads provider drift; `pnpm access:apply` removes only the
`lemn-zt:lemn-ui:production:*` resources and verifies that Admin and deep
health still fail closed at origin. It never creates a Bypass policy or changes
origin authorization. Enabling later is a manifest change followed by the same
plan/apply gate and the complete identity matrix described below.

## Service boundary

| Field | Contract |
|---|---|
| Service id | `ui-portal` |
| Owner package | `@lemn-ltd/ui-portal` |
| Runtime | Cloudflare Worker with bundled static assets |
| Production Worker | `lemn-ui-portal` |
| Production environment | `production` only |
| Public UI origin | `https://portal.ui.le-mn.com` |
| Schema origin | `https://schemas.ui.le-mn.com` |
| Transactional state | None; the Portal does not own a database, KV namespace, bucket, queue, workflow, cache, or stateful compute resource |
| Registry authority | Git and the provider-registry package |
| Branding authority | AgentOps; the Portal consumes typed read/proposal boundaries and does not become a persistence authority |

The Worker, public Catalog, protected Admin, static assets, machine documents,
and branding schema are one deployable. Local development uses port `6500` and
the shared development tunnel; it does not create a deployed development or
staging Worker.

## Resource inventory

| Resource id | Type / provider name | Purpose | Binding or destination | Owner | Source of truth |
|---|---|---|---|---|---|
| `ui-portal-runtime-worker` | Cloudflare Worker / `lemn-ui-portal` | Routes public Catalog, protected Admin, health, machine documents, assets, and schema responses | Worker entrypoint | UI Platform | `wrangler.jsonc`, Worker source, release workflow |
| `ui-portal-client-assets` | Workers Static Assets | Serves Vite output while the Worker executes first for authorization and host routing | `ASSETS` -> `dist/client` | UI Portal | `wrangler.jsonc`, Vite build |
| `ui-portal-public-domain` | Cloudflare custom domain / `portal.ui.le-mn.com` | Canonical public Portal and protected path families | Worker custom-domain route | UI Platform | `wrangler.jsonc` |
| `ui-portal-schema-domain` | Cloudflare custom domain / `schemas.ui.le-mn.com` | Canonical immutable BrandingDefinition JSON Schema only | Worker custom-domain route | Branding Contract + UI Platform operations | `wrangler.jsonc`, schema handler |
| `ui-portal-admin-access-app` | Cloudflare Access self-hosted application | Human authentication for Admin HTML, API, and exclusive chunks | `portal.ui.le-mn.com` path families `/admin`, `/api/admin`, `/admin-assets` and descendants | UI Platform security | Zero Trust manifest and reconciler; allocated audience is provider state projected through the protected GitHub Environment |
| `ui-portal-admin-allow-policy` | Cloudflare Access Allow policy | Grants the single normalized `portal-admin` capability to approved human identities | Human Access application | UI Platform security | Zero Trust manifest plus exact selector environment input |
| `ui-portal-health-access-app` | Cloudflare Access self-hosted application | Isolates deep operational health from human Admin access | `portal.ui.le-mn.com/health/deep` | UI Platform security | Zero Trust manifest and reconciler; allocated audience is provider state projected through the protected GitHub Environment |
| `ui-portal-health-service-policy` | Cloudflare Access Service Auth policy | Allows only the release health identity to reach deep health | Health Access application | UI Platform security | Zero Trust manifest plus exact service-token-id environment input |
| `ui-portal-release-health-service-token` | Cloudflare Access service token | Production release smoke identity; never a browser identity | `CF-Access-Client-Id` and `CF-Access-Client-Secret` at the CI boundary | UI Platform release operations | Cloudflare Access plus protected GitHub Environment secrets |

No consumer may create another name for one of these resources. Provider ids,
application audiences, service-token material, and account ids are environment
state and must not be committed.

## Worker and assets

The Worker module is `src/worker/index.ts`. The `ASSETS` binding points to
`dist/client`, uses SPA fallback, and runs the Worker before static delivery.
This ordering is a security boundary:

- public assets remain anonymous;
- Admin JavaScript and CSS are emitted only under `/admin-assets/*`;
- anonymous requests cannot retrieve Admin-exclusive chunks;
- encoded, double-encoded, or backslash variants of protected paths are routed
  through the protected boundary;
- `/api` paths that are not explicitly implemented fail closed instead of
  falling through to the SPA;
- every response receives a correlation id and security-appropriate headers.

The public host serves the Portal. The schema host serves only the canonical
schema path with its explicit CORS and immutable-cache contract; it is not a
second UI application.

## DNS and custom domains

Both hostnames are Worker custom domains declared in `wrangler.jsonc`:

```text
portal.ui.le-mn.com  -> lemn-ui-portal
schemas.ui.le-mn.com -> lemn-ui-portal
```

Cloudflare custom-domain provisioning owns the corresponding DNS attachment.
Operators must not create a second manual CNAME, AAAA record, route, or proxy
Worker for either hostname. Bootstrap may transfer an intended hostname from
its currently recorded owner only after the candidate Worker is uploaded and
verified; a failed bootstrap restores the exact prior owner before removing
the candidate.

## Cloudflare Access topology

### Human Admin boundary

One logical human application protects these canonical path families and all
descendants:

```text
/admin
/api/admin
/admin-assets
```

Use one Cloudflare Access application with multiple public destinations when
the provider supports that representation. If provider constraints require a
minimal technical split, every technical application must reuse the same human
policy semantics, and `ACCESS_AUDIENCE` must contain the explicit comma-separated
audience set. The Worker verifies issuer, every allowed audience, RS256
signature, expiry, required claims, subject, and matching normalized email at
origin. The browser receives only normalized identity and capabilities.

The human policy is an Allow policy for explicitly approved identities using
the configured organization login method. There is no public bypass, service
token include rule, broad email-domain grant, or invented role hierarchy.

### Release health boundary

`/health/deep` uses a separate Access application, audience, Service Auth
policy, and fresh service token. The release identity can call protected deep
health but is denied at every Admin boundary. The Access policy normally stops
that request at the edge; if a valid service application token reaches the
origin, the Worker returns `403 service-health-only`. The service identity
cannot stand in for a human identity. `/health` remains a minimal anonymous
liveness endpoint and contains no secret, credential, provider id, or sensitive
topology.

Admin and health audiences must be distinct. `ACCESS_AUDIENCE` is never reused
as `ACCESS_HEALTH_AUDIENCE`.

## Runtime bindings and configuration

| Name | Class | Secret | Source | Purpose |
|---|---|---:|---|---|
| `ASSETS` | Worker binding | No | Wrangler assets binding | Fetch built client assets after Worker routing |
| `ACCESS_ISSUER` | Worker variable | No | `wrangler.jsonc` | Exact HTTPS Cloudflare Access tenant issuer |
| `ACCESS_AUDIENCE` | Worker variable | No, but protected configuration | Production rollout input | One Admin audience or explicit comma-separated Admin audience set |
| `ACCESS_HEALTH_AUDIENCE` | Worker variable | No, but protected configuration | Production rollout input | Dedicated deep-health audience |
| `DEPLOYMENT_ENVIRONMENT` | Worker variable | No | `wrangler.jsonc` | Enables production fail-closed validation |
| `BUILD_VERSION` | Worker variable | No | Release metadata | Exact package release version |
| `BUILD_GIT_SHA` | Worker variable | No | Release metadata | Exact source revision |
| `BUILD_TIME` | Worker variable | No | Release metadata | Immutable release timestamp |

The Worker has no runtime secret binding. Cloudflare API and Access
service-token credentials exist only at the protected release boundary and are
never uploaded as Worker variables or exposed to browser code.

### Protected GitHub Environment inputs

| Name | Kind | Runtime projection | Purpose |
|---|---|---|---|
| `PRODUCTION_CLOUDFLARE_API_TOKEN` | Secret | `CLOUDFLARE_API_TOKEN` | Scoped Worker script and custom-domain release operations |
| `PRODUCTION_UI_PORTAL_ACCESS_CLIENT_ID` | Secret | `UI_PORTAL_ACCESS_CLIENT_ID` | Service-auth release smoke id |
| `PRODUCTION_UI_PORTAL_ACCESS_CLIENT_SECRET` | Secret | `UI_PORTAL_ACCESS_CLIENT_SECRET` | Service-auth release smoke secret |
| `PRODUCTION_CLOUDFLARE_ACCOUNT_ID` | Variable | `CLOUDFLARE_ACCOUNT_ID` | Exact target account check |
| `PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE` | Variable | `ACCESS_AUDIENCE` during upload | Human Admin origin audience set |
| `PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE` | Variable | `ACCESS_HEALTH_AUDIENCE` during upload | Service health origin audience |

`PUBLIC_BUILD_VERSION`, `PUBLIC_BUILD_GIT_SHA`, `PUBLIC_BUILD_TIME`, and the
`EXPECTED_RELEASE_*` variables are immutable release inputs, not credentials.
Secret values must come from the protected environment or the approved secret
manager, must travel through process environment/stdin only, and must never be
written to logs, artifacts, docs, commits, or Worker assets.

`PRODUCTION_CLOUDFLARE_API_TOKEN` is an **Account Owned API token**, created
under the target account (`POST /accounts/{accountId}/tokens`), not a user API
token. Provisioning must retain its value only in the protected secret store;
the release preflight confirms the same account ownership with
`GET /accounts/{accountId}/tokens/verify` before any mutation.

## Ownership and sources of truth

| Concern | Authority |
|---|---|
| Worker name, entrypoint, compatibility, assets, custom domains, non-secret base vars | [`wrangler.jsonc`](../../wrangler.jsonc) |
| Runtime binding and variable shape | [`src/worker/env.ts`](../../src/worker/env.ts) |
| Host routing and public/protected dispatch | [`src/worker/index.ts`](../../src/worker/index.ts) |
| Protected-path canonicalization | [`src/worker/security/boundary.ts`](../../src/worker/security/boundary.ts) |
| Access JWT verification and normalized identities | [`src/worker/access.ts`](../../src/worker/access.ts) |
| Admin and deep-health capabilities | [`src/worker/admin/routes.ts`](../../src/worker/admin/routes.ts) |
| Release permissions and environment projection | [`.github/workflows/ci-cd.yml`](../../../../.github/workflows/ci-cd.yml) |
| Access desired state, boundaries, policy references, branch mapping, and disabled behavior | [`tooling/manifests/infrastructure/zero-trust.json`](../../../../tooling/manifests/infrastructure/zero-trust.json) |
| Access validation, provider reconciliation, sanitized audience projection, and probes | [`tooling/src/ops/reconcile-zero-trust.ts`](../../../../tooling/src/ops/reconcile-zero-trust.ts) |
| Bootstrap, candidate upload, switch, smoke, and rollback | [`scripts/release/ui-portal-production-rollout.ts`](../../../../scripts/release/ui-portal-production-rollout.ts) |
| Cloudflare account/zone preflight | [`scripts/release/cloudflare-preflight.ts`](../../../../scripts/release/cloudflare-preflight.ts) |
| Public and service-identity production assertions | [`scripts/release/deployment-smoke.ts`](../../../../scripts/release/deployment-smoke.ts) |
| Command ownership and mutation/secrets contract | [`tooling/catalog.json`](../../../../tooling/catalog.json) |
| Product topology and completion boundary | [Portal documentation](../../../../apps/docs/src/content/docs/portal/index.mdx) |

Cloudflare is authoritative for allocated provider ids, active deployment
versions, custom-domain attachment, Access applications/policies/audiences, and
service-token lifecycle. GitHub's protected `production` Environment is
authoritative for release-time projections. Neither provider state is inferred
from a repository declaration; release reconciliation reads it before mutation.

## Lifecycle

### Bootstrap

1. Validate the exact Cloudflare account, zone visibility, Wrangler target,
   Git revision, release identity, audience shape, and credential presence.
2. Inventory Worker existence and the current owner of each intended hostname.
3. Build and dry-run locally, then upload a versioned candidate without making
   it the active deployment.
4. Verify candidate assets, machine contracts, schema, and authorization using
   the candidate version.
5. Attach only the intended custom domains, switch the Worker deployment, and
   run public, anonymous-Access, service-health, and service-denial smokes.
6. Record the Worker version and resource inventory as release evidence.

Bootstrap must preserve unrelated domains and resources. It may create only the
resources in this contract, and it must refuse to overwrite a hostname whose
owner changed after the initial inventory.

### Upgrade

1. Snapshot the active Worker deployment and intended hostname owners.
2. Upload a versioned candidate and run candidate-specific smokes.
3. Switch the active deployment only after candidate verification passes.
4. Run production smokes against the canonical domains.
5. Retain Cloudflare deployment history as the rollback mechanism; do not keep
   a permanent staging Worker.

### Rollback

Any upload, attachment, switch, asset, authorization, schema, or smoke failure
stops the release. Upgrade rollback restores the previous Worker deployment.
Bootstrap rollback restores the exact preflight hostname owners and then
deletes only the candidate Worker it created. A rollback must never delete or
reassign a resource that was not owned by the current operation.

### Deletion

Deletion requires a fresh provider inventory, explicit proof of ownership, a
healthy replacement when applicable, and successful positive/negative smokes.
Keep Access active while removing each legacy custom-domain attachment and DNS
record, then prove the hostname is unavailable. Only after that proof remove
the legacy Access policies, service token, and applications, followed by the
exclusive Worker. This order prevents a formerly protected hostname from ever
remaining reachable without edge authorization. Protected GitHub inputs are
removed only after repository and workflow scans prove that no active release
path reads them. There are no compatibility redirects or tombstone Workers in
the target state.

## Invariants

- Exactly one production Worker serves both Portal and schema domains.
- The public Catalog and machine endpoints are anonymous and read-only.
- Every Admin HTML, API, and exclusive-asset request is protected at Cloudflare
  Access and verified again at the Worker origin.
- Access JWTs, Cloudflare credentials, service-token credentials, and provider
  payloads never reach client storage, response bodies, static assets, or logs.
- Human Admin and service health use distinct audiences and identity shapes.
- The service identity is health-only and is denied at all Admin paths.
- Production requires `ASSETS`, issuer, Admin audience, and health audience;
  missing or malformed configuration fails closed.
- Static Admin chunks remain outside the anonymous public asset graph.
- Schema responses preserve their canonical id, CORS, content type, and
  immutable cache policy.
- Worker build identity matches the exact release revision and is validated by
  smoke tests.
- Production mutation entrypoints run only from the governed main-branch
  release path after Cloudflare preflight.

## Failure modes

| Failure | Expected behavior | Recovery |
|---|---|---|
| Missing or wrong Cloudflare account/zone/token | Preflight exits before mutation | Correct protected input and rerun preflight |
| Missing/malformed/equal Admin and health audiences | Candidate upload or readiness validation fails closed | Correct protected variables; never bypass origin verification |
| Missing, expired, wrong-issuer, wrong-audience, or invalid-signature assertion | Protected request returns a safe `401` Problem Details response | Repair Access topology or identity; do not expose verification detail |
| Service identity reaches an Admin boundary | Worker returns `403 service-health-only` | Fix policy/destination; never broaden service capability |
| JWKS fetch/verification unavailable | Protected origin authorization fails closed | Restore Access/JWKS reachability and retry |
| Admin asset appears outside `/admin-assets` | Build boundary test fails | Correct Vite chunk placement before upload |
| Candidate upload or smoke timeout | No active switch; resumable candidate state remains | Resume the same candidate or run protected rollback |
| Partial hostname attachment failure | Restore the exact prior hostname owners | Reconcile provider state before another attempt |
| Concurrent hostname ownership change | Refuse overwrite and stop | Human review of current provider ownership |
| Post-switch public/protected/schema smoke failure | Restore previous deployment | Diagnose with correlated logs, rebuild, and redeploy |

## Operations

Read-only/local verification:

```bash
pnpm --filter @lemn-ltd/ui-portal run check
pnpm --filter @lemn-ltd/ui-portal run test
pnpm --filter @lemn-ltd/ui-portal run cf:types
pnpm --filter @lemn-ltd/ui-portal run cf:dry-run
pnpm smoke:portal:local
pnpm preflight:cloudflare:release
```

Production mutation is owned by the protected CI release job. Its cataloged
entrypoint is:

```bash
pnpm rollout:portal:prod
```

Do not invoke it with ad-hoc credentials or outside the guarded main-branch
release context. After deployment, use `pnpm smoke:release:production` with the
dedicated service identity and `pnpm --filter @lemn-ltd/ui-portal run
observe:production:tail` for scoped diagnostics. Redact credentials and retain
the exact Worker version, Git SHA, commands, and results in release evidence.
