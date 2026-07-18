# @lemn-ltd/ui-portal

The private UI Portal application is the single Cloudflare Worker surface for
the public Lemn UI catalog and its protected administration tools. It owns no
transactional data store: Git remains the registry authority and AgentOps
remains the branding authority.

## Local development

```bash
make dev-ui-portal
```

The app runs at `http://localhost:6500`. Its only platform binding is `ASSETS`;
Cloudflare Access assertions are validated again at the Worker origin for every
Admin request.

## Public contract

- Catalog sections: `/foundations`, `/components`, `/visualizations`, `/blocks`,
  `/patterns`, and `/providers`.
- Curated branding playground: `/playground`.
- Machine surfaces: `/catalog.json`, `/provider-registry.json`, `/blocks.json`,
  `/llms.txt`, and `/llms-full.txt`.
- Minimal liveness: `/health`.
- Canonical immutable schema: `https://schemas.ui.le-mn.com/branding/v1.json`.

Every public catalog surface is projected from the React-free
`CATALOG_MANIFEST`. Agent component sources remain available in the repository
for a later release, but are not part of the active registry, routes, search,
navigation, machine documents, or browser bundles.

## Protected Admin contract

Cloudflare Access protects `/admin*`, `/api/admin/*`, and `/admin-assets/*`.
The Worker validates issuer, audience, signature, expiry, and identity claims
before serving either JSON or static Admin assets. A separate least-privilege
service identity can call only `/health/deep`.

Admin is a read/proposal surface. Registry proposals are deterministic bundles
for the reviewed Git workflow; releases and effective settings are read-only;
Brand Studio is intentionally persistence-free.

## Infrastructure contract

The service-local [infrastructure contract](docs/infrastructure/README.md)
defines the target Worker, assets, custom domains, path-scoped Access topology,
service-health identity, protected release inputs, lifecycle, rollback, failure
modes, and sources of truth. It describes the intended production state; exact
deployed resource ids and verification results belong in release evidence.

## Verification

```bash
pnpm --filter @lemn-ltd/ui-portal run check
pnpm --filter @lemn-ltd/ui-portal run test
pnpm --filter @lemn-ltd/ui-portal run cf:dry-run
make test-e2e-ui-portal
```

Production uses Worker `lemn-ui-portal` at `portal.ui.le-mn.com` and also serves
the schema hostname. Release scripts inject an exact Git SHA, version, and build
time; no mutable `latest` dependency or bearer status-token contract is used.
