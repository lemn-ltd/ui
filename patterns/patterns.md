# Stack

This file defines the default technology stack and what each piece is used for.

## Principles

- Cloudflare-first for runtime, async, storage primitives, and internal service boundaries.
- Neon Postgres is the source of truth for transactional relational product data.
- Durable product domains use one vocabulary across Postgres schema, API module, URL namespace, generated client, frontend module, tests, and docs.
- Runtime code depends on services, ports, repositories, and adapters; provider SDKs stay at the boundary.
- External services require a clear use case, least-privilege access, secrets policy, and an infrastructure contract.

## Runtime And API

| Technology | Use it for | Do not use it for |
| --- | --- | --- |
| Cloudflare Workers | HTTP APIs, webhooks, queue consumers, scheduled entrypoints, thin orchestration | Large monolithic server processes or generic background daemons |
| Hono | Worker HTTP routing and middleware | Business logic or database access |
| Zod | Runtime validation for HTTP, MCP, webhooks, queues, workflows, AI output, and env/config | Replacing database constraints or business authorization |
| OpenAPI | Public and stable internal API contracts, generated clients | Private implementation details |
| Problem Details | Standard public HTTP error envelopes | Internal diagnostics, stack traces, or provider payloads |
| Service Bindings | Internal Worker-to-Worker calls when runtime isolation, secrets, bundle size, or shared capabilities require a boundary | Simple code organization or async work |
| MCP | Agent-facing product APIs with typed, permissioned, audited tools | Generic unrestricted SQL, HTTP, filesystem, or secret access |

## Data And Storage

| Technology | Use it for | Authority |
| --- | --- | --- |
| Neon Postgres | Transactional relational product state: users, orgs, permissions, billing state, jobs, idempotency, ownership | Authoritative |
| Hyperdrive | Worker-to-Neon connectivity in production | Connectivity boundary |
| Kysely + pg | Type-safe Postgres queries inside repositories only | Query layer |
| Migrations | Reviewed schema and data-shape changes | Schema history |
| DBML | Human-readable relational schema documentation and review surface | Documentation; migrations win |
| Cloudflare KV | Disposable cache and read-heavy derived values with TTL/versioned keys | Never authoritative |
| Cloudflare R2 | Blobs, uploads, exports, binaries, large templates, private object storage | Object body only; metadata lives in Postgres |
| Cloudflare Artifacts | Versioned file trees, snapshots, branches, agent workspaces | File-tree state; metadata lives in Postgres |
| ClickHouse | Analytics, metrics, append-only events, aggregate usage | Analytics only |
| HypeQuery | Allowlisted read-only HTTP metrics over ClickHouse | Metrics access |
| D1 / SQLite | Edge-local relational state only with explicit exception | Exception, not default |
| Vectorize / search indexes | Derived search or vector indexes when product search requires it | Projection, not source of truth |

## Async And Coordination

| Technology | Use it for | Do not use it for |
| --- | --- | --- |
| Cloudflare Queues | Retryable async tasks: emails, webhooks, analytics ingestion, provider retries, post-commit side effects | Long multi-step orchestration |
| Cloudflare Workflows | Durable multi-step processes with retries, sleeps, progress, external events, or long duration | One short retryable task |
| Durable Objects | Strong coordination, locks, sessions, realtime presence, single-writer behavior | Generic database storage |
| Outbox pattern | Side effects that must follow a successful database commit | Sending external effects inside a DB transaction |

## AI And Agent Work

| Technology | Use it for | Notes |
| --- | --- | --- |
| Cloudflare AI Gateway | Commercial LLM calls that need observability, policy, usage tracking, and spend controls | Avoid in latency-critical realtime voice unless measured and approved |
| Brainstask | Internal task execution and approved runner-based automation | Do not invent APIs without repo docs |
| Cloudflare Sandbox | Commercial AI code execution and isolated user workloads | Pair with AI Gateway and Artifacts |
| Flue Framework | Commercial agent harnesses deployed on Cloudflare | Use curated MCP tools for external capabilities |
| Realtime voice stack | Low-latency voice sessions | Optimize latency first; usage controls wrap the session |

## Auth, Billing, Security, And Observability

| Technology | Use it for | Rule |
| --- | --- | --- |
| LEMN Auth/RBAC | Actor, session, organization, tenant scoping, and permissions | Do not build parallel auth |
| LEMN Billing | Commercial billing, entitlement checks, paid effects | Store authoritative billing state in Postgres |
| Cloudflare Secrets / CI secrets | Provider keys, credentials, tokens, environment-specific secrets | Never commit or log secrets |
| Structured logs | Correlated operational debugging and incident evidence | Redact secrets, tokens, sensitive provider bodies, and unnecessary PII |
| Audit events | Durable records for auth, billing, admin, MCP, and state-changing decisions | Raw debug logs or sensitive payload storage |
| Resource contracts | Ownership, bindings, lifecycle, invariants, failure modes, operations, and sources for infrastructure | Keep complete docs with the owning service |

## Frontend And Docs

| Technology | Use it for | Rule |
| --- | --- | --- |
| Vite + React | Product frontend applications | Keep UI behavior aligned with API contracts |
| @lemn-ltd/ui | Required graphical UI component package | Import public components and package stylesheet only |
| OpenAPI-generated clients | Frontend API calls | Do not scatter hand-written fetch contracts |
| TanStack Query | Server state, caching, loading/error/empty/mutation states | Do not store server state only in component state |
| Astro + Starlight | Automatic wiki, ADRs, runbooks, API/tool docs | Important decisions must not live only in chat |

## External Services

External providers may be used for payments, email, auth integrations, AI providers, CRM, webhooks, and other product capabilities only when they are wrapped by adapters and documented.

Required before adding or expanding an external service:

- Service or adapter boundary.
- Zod schemas for untrusted inputs and provider responses when needed.
- Timeout, retry, idempotency, and failure-mode policy.
- Secret storage through Cloudflare Secrets or approved CI secrets.
- Audit/logging plan with sensitive data redaction.
- Resource contract if the service affects persistence, delivery, security, availability, or operations.

## Canonical Example Vocabulary

Generic patterns use product-neutral examples so they can apply across projects.

Preferred example domains:

- `orders`
- `projects`
- `users`
- `tenants`
- `invoices`
- `jobs`
- `webhooks`
- `ingestion`
- `admin`
- `public-api`

Do not use project-specific product names, codenames, customer names, or
temporary migration labels in generic pattern examples. Product-specific naming
rules belong in the owning project's specs or product catalog.

## Default Decision Path

1. Product state: Neon Postgres.
2. Blob: R2, with metadata in Postgres.
3. Cache: KV, if losing it is acceptable.
4. Analytics: ClickHouse, exposed through allowlisted HypeQuery when needed.
5. Code organization only: module inside the current deployable.
6. Provider/platform boundary: adapter.
7. Retryable async task: Queue.
8. Long durable process: Workflow.
9. External side effect after a committed database change: outbox plus Queue or Workflow.
10. Strong coordination or single-writer state: Durable Object.
11. Synchronous internal Worker call with immediate result: Service Binding.
12. External provider: adapter plus contract, secrets, retries, and observability.

# Patterns

---
id: PAT-ARCH-CLOUDFLARE-FIRST-001
domain: ARCH
category: INFRASTRUCTURE
version: 1
description: Use this pattern when choosing runtime, deployment, or infrastructure.
precedence_level: 1
depends_on: []
applies_when:
  - "Choosing runtime, deployment, or infrastructure."
---


## Strategy

Default to Cloudflare Workers and Cloudflare primitives. Avoid traditional infrastructure unless a clear approved reason exists.

## Rules

### Must

- Prefer Workers, Queues, Workflows, Durable Objects, R2, KV, and Service Bindings.
- Configure Workers through `PAT-CLOUDFLARE-WRANGLER-CONFIG-001`.
- Accept Neon Postgres as the approved database exception.
- Ask for human approval before adding external infrastructure.

### Must not

- Do not introduce Docker, Kubernetes, AWS, GCP, Azure, or complex Terraform by default.
- Do not propose microservices as the default scaling answer.
- Do not add infrastructure only because it is familiar.

## Decision rules

- If Cloudflare can solve it simply, use Cloudflare.
- If Cloudflare cannot meet runtime, compliance, latency, or product needs, propose an explicit exception.
- If Neon is enough, do not choose D1.

## Allowed exceptions

- Neon/Postgres is an approved exception even though it does not run inside Cloudflare.

## Example

```txt
Preferred: Worker + Queue + Workflow + R2 + Neon via Hyperdrive
Avoid by default: Docker service + Kubernetes deployment + custom Postgres pooler
```

---
id: PAT-ARCH-DECISION-PATH-001
domain: ARCH
category: DECISION_PATH
version: 1
description: Use this pattern when choosing between module, adapter, queue, workflow, or Worker split.
precedence_level: 1
depends_on:
  - PAT-ARCH-CLOUDFLARE-FIRST-001
applies_when:
  - "Choosing between module, adapter, queue, workflow, or Worker split."
---


## Strategy

Follow the simple path first: internal module, thin adapter, queue or workflow
for async work, and separate Worker only for real runtime reasons. Cloudflare
Worker boundaries are deployable runtime surfaces; they are not the default code
organization mechanism.

## Rules

### Must

- Start with module-level organization.
- Use adapters for provider/platform boundaries.
- Use Queue or Workflow for async work.
- Use separate Workers only for runtime isolation.
- Use Service Bindings only for synchronous internal Worker calls that need an
  immediate result and have a justified runtime boundary.
- Use outbox plus Queue or Workflow when committed database state must trigger
  an external side effect.

### Must not

- Do not jump directly to a new service or Worker.
- Do not use infrastructure to solve simple code organization.
- Do not add deployment boundaries without operational reason.
- Do not turn every module, table, or CRUD resource into a Worker.
- Do not route internal Worker calls through a compatibility host.

## Decision rules

- If synchronous and simple, keep it in the module.
- If provider-specific, use adapter.
- If async, choose Queue or Workflow.
- If a committed database change must trigger external work, use outbox plus
  Queue or Workflow.
- If bundle, CPU, secrets, or isolation require it, split Worker.
- If the caller needs an immediate result from another internal Worker, use a
  Service Binding with a typed, tested contract.

## Allowed exceptions

- Human-approved architecture changes may override the default path.

## Example

```txt
sync code organization -> internal module
provider boundary -> adapter
retryable async work -> Queue
long multi-step work -> Workflow
post-commit external side effect -> outbox + Queue
heavy dependency or secret isolation -> separate Worker + Service Binding when synchronous
```

---
id: PAT-ARCH-MONOLITH-001
domain: ARCH
category: MONOLITH
version: 1
description: Use this pattern when structuring backend product code.
precedence_level: 1
depends_on:
  - PAT-ARCH-DECISION-PATH-001
applies_when:
  - "Structuring backend product code."
---


## Strategy

Use a modular monolith on Workers as the base. A monolith means one product, repo, release model, and shared domain contracts; it does not mean one huge Worker bundle. Separate by module first and by runtime only when Cloudflare limits or risk justify it.

## Rules

### Must

- Organize code by modules and responsibilities.
- Keep one coherent release model by default.
- Extract runtime boundaries only for concrete operational reasons.
- Keep frontend static assets and heavy runtime work out of the public API Worker.

### Must not

- Do not create users-service, billing-service, auth-service, or table-based services by default.
- Do not split deployment units just to appear enterprise.
- Do not add choreography between services without need.
- Do not treat bundle-size splits as a move to microservices.

## Decision rules

- If the problem is code organization, use modules.
- If the problem is bundle, secrets, CPU, isolation, or async workload, consider a separate Worker.
- If a split Worker shares repo, release, types, DB, and tests, it is still a runtime partition.
- If release coordination becomes complex, simplify boundaries.

## Allowed exceptions

- A separate Worker is allowed for runtime limits, security isolation, backpressure, heavy dependencies, or shared internal service needs.

## Example

```txt
apps/admin/           -> deployable React/Vite product UI
services/public-api/  -> deployable Worker runtime without graphical UI
packages/contracts/   -> shared API schemas, types, and generated contracts
packages/product-core/ -> shared product rules and use cases with real consumers
@lemn-ltd/ui          -> shared UI component package
```

---
id: PAT-ARCH-DETERMINISTIC-NAMING-001
domain: ARCH
category: DETERMINISTIC_NAMING
version: 1
description: Use this pattern when product, domain, package, deploy, resource, and symbol names must stay consistent.
precedence_level: 1
depends_on: []
applies_when:
  - "Product, domain, package, deploy, resource, and symbol names must stay consistent."
---


## Strategy

Derive names from a versioned catalog using the chain product -> business domain -> component -> resource -> symbol. A name is valid only when declared, derived by rule, or recorded as an exception with a migration target.

## Rules

### Must

- Keep `docs/naming/naming.catalog.json` as the naming source of truth.
- Keep derivation rules in `docs/naming/derivation-rules.md`.
- Use `businessDomain` and `webDomain` instead of ambiguous `domain`.
- Derive package names, deploy targets, bindings, resources, classes, files, tables, events, and route hosts from catalog tokens.
- Use `PAT-DOMAIN-SCHEMA-API-NAMING-001` for the DB/API/OpenAPI/frontend domain-resource naming line.
- Validate catalog shape with a schema when the project has multiple products or deployables.

### Must not

- Do not invent package, Worker, binding, or resource names outside the catalog contract.
- Do not mix business-domain vocabulary with DNS/web-domain vocabulary.
- Do not keep generated naming docs as the source of truth.
- Do not use product-specific abbreviations unless declared in the catalog.

## Decision rules

- If a name crosses a package, deploy, infrastructure, or API boundary, derive it from the catalog.
- If a name crosses Postgres schema, API URL, generated API client, and frontend module, apply `PAT-DOMAIN-SCHEMA-API-NAMING-001`.
- If a provider requires a fixed external id, declare it directly in the catalog.
- If a legacy name cannot be derived, list it as an explicit exception.
- If names drift, fix the catalog or derivation rule before touching generated output.

## Allowed exceptions

- Small local-only scripts may use simple names when they do not create durable contracts.
- Legacy names may remain temporarily with owner, reason, and migration target.

## Example

```txt
product: shop
businessDomain: orders
component: fulfillment
package: @shop/orders-fulfillment
worker: stg-shop-orders-fulfillment
binding: ORDERS_FULFILLMENT_SERVICE
```

---
id: PAT-ARCH-CHANGE-SCOPE-001
domain: ARCH
category: CHANGE_SCOPE
version: 1
description: Use this pattern when deciding how much code to change for a task.
precedence_level: 1
depends_on: []
applies_when:
  - "Deciding how much code to change for a task."
---


## Strategy

Keep changes proportional to the requested objective. Prefer targeted edits over broad rewrites.

## Rules

### Must

- Touch the minimum coherent set of files.
- Preserve local style and patterns.
- Explain any broader refactor clearly.

### Must not

- Do not rewrite modules unrelated to the task.
- Do not add trivial helpers or abstractions to appear cleaner.
- Do not change behavior unless requested or necessary.

## Decision rules

- If the objective is a bug fix, fix the bug and add focused coverage.
- If a refactor is needed to make the fix safe, keep it scoped.
- If scope grows, ask or document why.

## Allowed exceptions

- Security or data-loss fixes may justify broader changes with explicit rationale.

## Example

```txt
Task: fix project rename validation
Good: update project schema, service test, route contract
Bad: rewrite all project modules and introduce new generic validation framework
```

---
id: PAT-ARCH-BEHAVIOR-PRESERVATION-001
domain: ARCH
category: BEHAVIOR
version: 1
description: Use this pattern during hardening, refactors, tests, or cleanup work.
precedence_level: 1
depends_on: []
applies_when:
  - "Use this pattern during hardening, refactors, tests, or cleanup work."
---


## Strategy

Preserve the intended behavior of the PR or task unless a human explicitly authorizes a behavior change.

## Rules

### Must

- Understand existing behavior before editing.
- Keep public contracts stable.
- Add tests that preserve intended outcomes.

### Must not

- Do not silently change business rules during cleanup.
- Do not alter API shapes without explicit reason.
- Do not remove edge cases because they are inconvenient.

## Decision rules

- If behavior is ambiguous, ask.
- If current behavior is unsafe, propose a change explicitly.
- If tests conflict with product intent, clarify before weakening them.

## Allowed exceptions

- Bug fixes may change incorrect behavior when the expected behavior is explicit.

## Example

```ts
// Refactor keeps the same observable result
expect(await service.canArchiveProject(input)).toEqual(previousExpectedResult)
```

---
id: PAT-ARCH-BUSINESS-CLARIFICATION-001
domain: ARCH
category: BUSINESS_LOGIC
version: 1
description: Use this pattern when business intent is ambiguous, risky, or contradictory.
precedence_level: 1
depends_on: []
applies_when:
  - "Business intent is ambiguous, risky, or contradictory."
---


## Strategy

Do not guess business rules for money, permissions, quotas, billing, ownership, or destructive changes. Ask or document the decision boundary.

## Rules

### Must

- Identify the business invariant before changing logic.
- Ask for clarification when intent is unclear.
- Preserve existing behavior if no safe change is known.

### Must not

- Do not invent pricing, permission, quota, or ownership semantics.
- Do not preserve obviously unsafe behavior without flagging it.
- Do not change critical logic only to satisfy a test.

## Decision rules

- If risk is low, make the smallest safe assumption and document it.
- If risk is high, stop and ask.
- If source docs exist, follow them over inference.

## Allowed exceptions

- Implementation details may be inferred when business semantics remain unchanged.

## Example

```txt
Ambiguous: should archived projects count against quota?
Action: ask before changing quota logic.
```

---
id: PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001
domain: ARCH
category: MODULAR_MONOLITH_VERTICAL_SLICES
version: 1
description: Use this pattern when organizing backend product code inside a modular monolith.
precedence_level: 2
depends_on:
  - PAT-ARCH-MONOLITH-001
applies_when:
  - "Organizing backend product code inside a modular monolith."
---


## Strategy

Use a modular monolith with vertical slices and ports/adapters. Modules define business ownership. Slices define use-case flow. Ports and adapters keep HTTP, persistence, queues, providers, and runtime bindings outside application decisions.

For Hono/TypeScript API packages, apply the concrete API profile in `PAT-API-MODULAR-SLICES-001`.

## Rules

### Must

- Organize backend code by business module before technical layer.
- Place each use case in a clear slice inside its module.
- Keep request parsing, authorization, use-case policy, persistence, mapping, and mirrored tests close enough to review as one behavior.
- Keep incoming adapters for HTTP, queues, schedules, CLI, and events.
- Keep outgoing adapters for databases, object storage, providers, messaging, and platform bindings.
- For API modules, use the required `http.ts`, `command.ts` or `query.ts`, `repository.ts`, `mapper.ts`, `policy.ts`, `adapter.ts`, and `types.ts` slice shape from `PAT-API-MODULAR-SLICES-001`; test files live under the service/package `tests/` root.

### Must not

- Do not keep business behavior in global route, service, repository, or utility folders when a module boundary is clear.
- Do not let slices import another module's internals.
- Do not put SQL, provider SDK calls, or runtime bindings in domain/application logic.
- Do not create microservices only to represent modules.
- Do not split by table name instead of product use case.

## Decision rules

- If code changes for one business capability, keep it in that module.
- If code implements one command, query, or use case, keep it in one slice.
- If code talks to the outside world, make it an adapter or repository.
- If another module needs behavior, expose a small public API, command, query, or event.
- If a slice grows too large, extract private helpers inside the same module before creating shared abstractions.
- If the module is a Hono/TypeScript API module, use `PAT-API-MODULAR-SLICES-001` for exact folder, boundary, and test placement rules.

## Allowed exceptions

- Small modules may start flatter and add slices as behavior grows.
- Shared foundation packages such as contracts, database types, generated clients, and observability may remain package-oriented.
- Legacy layer-first code may remain temporarily with a documented migration target.

## Example

```txt
src/modules/orders/
  public.ts
  create-order/
    http.ts
    command.ts
    repository.ts
    mapper.ts
    policy.ts
    types.ts
  cancel-order/
    http.ts
    command.ts
    repository.ts
    mapper.ts
tests/unit/modules/orders/create-order/http.test.ts
tests/unit/modules/orders/cancel-order/http.test.ts
```

---
id: PAT-ARCH-ENTRYPOINTS-001
domain: ARCH
category: ENTRYPOINTS
version: 1
description: Use this pattern when adding a Worker, queue consumer, webhook, scheduled job, or service binding.
precedence_level: 2
depends_on:
  - PAT-ARCH-CLOUDFLARE-FIRST-001
  - PAT-ARCH-DECISION-PATH-001
applies_when:
  - "Adding a Worker, queue consumer, webhook, scheduled job, or service binding."
---


## Strategy

Add new entrypoints only for runtime boundaries. Entrypoints are operational surfaces, not code organization tools.

## Rules

### Must

- Justify each new entrypoint by runtime need.
- Keep entrypoints thin and delegate to services.
- Document bindings, permissions, and failure behavior.

### Must not

- Do not create an entrypoint only because a module exists.
- Do not duplicate business logic across entrypoints.
- Do not expose internal services publicly when Service Bindings fit.

## Decision rules

- If work is async retryable, use Queue.
- If work is long multi-step, use Workflow.
- If work needs isolation or different bundle, use a Worker boundary.

## Allowed exceptions

- Existing local structure may define accepted entrypoints; preserve it unless intentionally changing architecture.

## Example

```ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx)
  },

  async queue(batch: MessageBatch<EmailJob>, env: Env) {
    await emailConsumer.handle(batch, createAdapters(env))
  },
}
```

---
id: PAT-ARCH-BINDINGS-ADAPTERS-001
domain: ARCH
category: BINDINGS
version: 1
description: Use this pattern when accessing Cloudflare bindings or external providers.
precedence_level: 2
depends_on:
  - PAT-ARCH-ENTRYPOINTS-001
applies_when:
  - "Accessing Cloudflare bindings or external providers."
---


## Strategy

Keep platform bindings behind adapters or entrypoints. Domain and services depend on ports, not env.KV, env.R2, env.QUEUE, or provider SDKs directly.

## Rules

### Must

- Access bindings in entrypoints, adapters, or infrastructure modules.
- Pass ports/interfaces into services.
- Use thin adapters for R2, KV, Queues, Workflows, Durable Objects, auth, email, AI providers, and payments when they enter business flows.
- Use fakes for core tests.
- In modular API packages, place provider/platform side effects in `<api-surface-root>/adapters/<adapter>/`, `<api-surface-root>/modules/<module>/<slice>/adapter.ts`, or `<api-surface-root>/modules/<module>/shared/<name>Adapter.ts`.

### Must not

- Do not access env bindings from domain logic.
- Do not couple services to Cloudflare runtime objects.
- Do not make business rules depend on provider SDK shapes.
- Do not add adapters for pure in-process domain code just to look architectural.

## Decision rules

- If code talks to a platform service, place it in an adapter.
- If code decides business behavior, keep it provider-agnostic.
- If a boundary is external, provide one fake for service tests and one integration/smoke path for the adapter.
- If testing requires Cloudflare runtime, boundary is probably too low.
- If a side effect is strictly owned by one API module or slice, a module-local adapter is acceptable; otherwise use a package-level adapter.

## Allowed exceptions

- Database repositories may use Kysely because that is the accepted persistence boundary.

## Example

```ts
export interface ObjectStoragePort {
  put(input: { key: string; body: ReadableStream; contentType: string }): Promise<void>
}

export function createR2Storage(env: Env): ObjectStoragePort {
  return { put: (input) => env.R2.put(input.key, input.body, { httpMetadata: { contentType: input.contentType } }).then(() => undefined) }
}
```

---
id: PAT-ARCH-PERSISTENCE-PORTS-001
domain: ARCH
category: PERSISTENCE_PORTS
version: 2
description: Use this pattern when a use case has an explicit multi-engine persistence requirement or provider-boundary exception.
precedence_level: 2
depends_on:
  - PAT-DATA-POSTGRES-001
  - PAT-DATA-KYSELY-001
applies_when:
  - "A use case has an explicit multi-engine persistence requirement or provider-boundary exception."
---


## Strategy

Neon Postgres with Kysely repositories is the default persistence path. Add business-shaped persistence ports only when the service must isolate a provider boundary, support fakes, or intentionally support more than one engine.

## Rules

### Must

- Start with a Kysely repository for authoritative Postgres state.
- Put persistence interfaces near the service or application layer only when they add test or boundary value.
- Implement one adapter per approved engine or provider.
- Keep row mapping at the adapter boundary.
- Model ports around business operations, not table CRUD.
- Keep analytics writers separate from domain repositories.

### Must not

- Do not create a generic `Repository<T>` abstraction.
- Do not make services depend on Kysely, D1Database, SQL strings, or provider SDKs.
- Do not hide business decisions inside persistence adapters.
- Do not present D1, SQLite, or ClickHouse as default peers to Neon.
- Do not force engines with different semantics through a fake compatibility layer.

## Decision rules

- If code decides product behavior, keep it in domain/application.
- If code knows SQL, Kysely, bindings, or provider APIs, keep it in repository/adapter code.
- If a second engine is proposed, require an explicit exception and contract tests.
- If the goal is only unit testing, use a fake port without implying production engine portability.

## Allowed exceptions

- Small one-off scripts may call storage APIs directly when outside runtime request paths.
- D1/SQLite may be used for edge-local relational state only when Neon cannot fit the runtime need.
- ClickHouse may implement analytics write/read ports, never operational product authority.

## Example

```ts
export interface InvoiceStoragePort {
  saveInvoicePdf(input: { invoiceId: string; body: ReadableStream }): Promise<void>
}

export class R2InvoiceStorage implements InvoiceStoragePort {}
export class FakeInvoiceStorage implements InvoiceStoragePort {}
```

---
id: PAT-ARCH-LAYERS-001
domain: ARCH
category: LAYERS
version: 1
description: Use this pattern when deciding where code belongs.
precedence_level: 2
depends_on:
  - PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001
applies_when:
  - "Deciding where code belongs."
---


## Strategy

Separate transport, validation, business logic, persistence, adapters, and presentation. Each layer must have one clear reason to change.

In modular API packages, the canonical layer mapping is: `http.ts` for HTTP, `command.ts` for mutations, `query.ts` for reads, `repository.ts` for persistence, `mapper.ts` for public DTOs, `policy.ts` for business decisions, and `adapter.ts` for provider/platform boundaries.

## Rules

### Must

- Routes handle HTTP.
- Services handle use cases and policies.
- Repositories handle persistence.
- Mappers handle public DTOs.
- Adapters handle providers and bindings.
- API slices keep commands, queries, repositories, mappers, policies, adapters, and tests in the owning module/slice.

### Must not

- Do not mix SQL, HTTP, business rules, and provider calls in the same function.
- Do not pass Request or Response into services.
- Do not return DB rows as UI contracts.

## Decision rules

- If it parses HTTP, route.
- If it decides business behavior, service.
- If it queries DB, repository.
- If it serializes public output, mapper.
- If code lives in a modular API slice, use the file role defined by `PAT-API-MODULAR-SLICES-001`.

## Allowed exceptions

- Small internal scripts may be flatter when outside production runtime.

## Example

```txt
route: parse HTTP + call service
service: apply policy + use repositories/adapters
repository: Kysely query
mapper: public DTO
adapter: Cloudflare/provider binding
```

---
id: PAT-ARCH-DOMAIN-EDGE-001
domain: ARCH
category: DOMAIN_EDGE
version: 1
description: Use this pattern when edge runtime glue touches business logic.
precedence_level: 2
depends_on:
  - PAT-ARCH-LAYERS-001
applies_when:
  - "Edge runtime glue touches business logic."
---


## Strategy

Keep domain logic separate from routing, parsing, auth glue, Cloudflare bindings, and HTTP serialization. Edge code orchestrates, domain code decides.

## Rules

### Must

- Keep business rules in services or domain modules.
- Keep route parsing and response serialization outside domain logic.
- Keep bindings and provider glue behind adapters.

### Must not

- Do not import Hono context, Request, Response, or env bindings into domain logic.
- Do not make services depend on HTTP status codes.
- Do not bury business rules in edge handlers.

## Decision rules

- If code knows HTTP details, it belongs near the entrypoint.
- If code knows product rules, it belongs in service/domain.
- If code knows Cloudflare bindings, it belongs in adapter/entrypoint.

## Allowed exceptions

- Small pure helpers may be shared when they contain no edge or provider dependencies.

## Example

```ts
// Bad: service receives Hono context
async function createProject(c: Context) {}

// Good: service receives domain input
async function createProject(input: { actorId: string; organizationId: string; name: string }) {}
```

---
id: PAT-ARCH-STRUCTURE-001
domain: ARCH
category: STRUCTURE
version: 1
description: Use this pattern when creating or moving files inside a project.
precedence_level: 2
depends_on:
  - PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001
applies_when:
  - "Creating or moving files inside a project."
---


## Strategy

Preserve the local core, ports, adapters, and entrypoints structure so humans and agents can predict where code belongs.

## Rules

### Must

- Follow existing folder conventions.
- Place new code in the closest matching module.
- Keep ports near core and adapters near infrastructure.
- Keep app entrypoints, domain packages, DB code, and UI packages visually distinct.

### Must not

- Do not create parallel folder structures for the same concept.
- Do not scatter helpers across unrelated shared folders.
- Do not bypass local conventions without explicit reason.
- Do not put frontend assets, provider SDK glue, and business rules in the same module.

## Decision rules

- If a module exists, extend it.
- If a concept exists under another name, reuse it.
- If structure is unclear, inspect nearby patterns before generating files.

## Allowed exceptions

- A new structure is allowed only when the current one cannot represent the domain cleanly.

## Example

```txt
apps/admin/
services/public-api/
packages/contracts/
packages/product-core/
@lemn-ltd/ui
```

---
id: PAT-ARCH-REPO-BOUNDARIES-001
domain: ARCH
category: REPO_BOUNDARIES
version: 1
description: Use this pattern when deciding whether code belongs in an app, service, package, or local module.
precedence_level: 2
depends_on:
  - PAT-ARCH-DECISION-PATH-001
  - PAT-ARCH-MONOLITH-001
  - PAT-ARCH-ENTRYPOINTS-001
applies_when:
  - "Deciding whether code belongs in an app, service, package, or local module."
---


## Strategy

Place code by deployability, user surface, runtime boundary, consumer count, and ownership. Start with module-level organization, then promote code outward only when the boundary is real.

Shared packages are capability boundaries, not helper dumping grounds. Name
packages by the stable capability they own, and document what they must not
contain.

Default repo boundaries:

```txt
apps/*      -> deployable product surfaces with graphical UI
services/*  -> deployable runtime surfaces without graphical UI
packages/*  -> shared code surfaces that are not deployable by themselves
```

A single consumer is not enough to create a package. If only one app or service uses the code, keep it as a local module inside that app or service.

## Related patterns

- `PAT-ARCH-DECISION-PATH-001`: start with modules; add runtime boundaries only for real reasons.
- `PAT-ARCH-MONOLITH-001`: separate by module first, runtime only when justified.
- `PAT-ARCH-ENTRYPOINTS-001`: entrypoints are operational surfaces, not organization tools.
- `PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001`: modules define ownership.
- `PAT-ARCH-BINDINGS-ADAPTERS-001`: providers and platform bindings stay behind adapters.
- `PAT-API-SURFACE-BOUNDARIES-001`: API surfaces are split by consumer, contract, deployability, and runtime cost.
- `PAT-CLOUDFLARE-WRANGLER-CONFIG-001`: Worker deploy config belongs with the deployable.
- `PAT-TEST-PLACEMENT-001`: tests live under the owning app, service, or package `tests/` root.
- `PAT-UI-FRONTEND-MODULAR-MONOLITH-001`: frontend modules own user workflows.
- `PAT-UI-LEMN-001`: graphical UI uses the approved UI package surface.

## Rules

### Must

- Put deployable product surfaces with graphical UI under `apps/*`.
- Put deployable runtime surfaces without graphical UI under `services/*`.
- Put shared, non-deployable code with real multiple consumers under `packages/*`.
- Put APIs that exist only for one graphical product surface inside that app as an app-local API surface.
- Keep single-consumer behavior inside the consuming app or service as a local module.
- Keep deploy configuration with the deployable that owns it.
- Keep entrypoints thin and delegate behavior to modules, services, repositories, ports, or adapters.
- Name repo boundaries by ownership and stable purpose.
- Keep package APIs explicit through package exports or `public.ts`.
- Document package consumers when creating or promoting a package.
- Use named capability packages for shared non-deployable code with real
  consumers, explicit public APIs, package-owned tests, and clear exclusions.
- Put tests under the owning app, service, or package `tests/` root.

### Must not

- Do not create packages for speculative reuse.
- Do not create `packages/common`, `packages/shared`, `packages/utils`, or generic catch-all packages.
- Do not put deployable Workers, agents, CLIs, queue consumers, or scheduled runtimes in `packages/*`.
- Do not put graphical UI product surfaces in `services/*`.
- Do not put headless runtime Workers, queues, cron handlers, or agents in `apps/*`.
- Do not split a module into a package if all imports still come from one app or service.
- Do not name boundaries by temporary implementation details such as `react-app`, `worker`, `node-service`, or `new-dashboard`.
- Do not use infrastructure boundaries to solve simple code organization.
- Do not let a narrowly named package become a hidden catch-all for unrelated
  helpers, policies, mappers, adapters, or protocol code.

## Boundary criteria

### Apps

Use `apps/<name>` when the unit is deployed and has a graphical user surface. An app may include UI routes, layouts, assets, generated client wiring, view models, browser state, and app-local API helpers. It may include a thin Worker when that Worker serves the UI or belongs to the same product surface.

```txt
apps/<surface>/
  src/
    app/
    modules/
    api/
    ui/
    assets/
  public/
  tests/
  wrangler.jsonc
  package.json
```

Examples:

```txt
apps/admin
apps/customer-portal
apps/operations-console
```

An app may own `src/api` when that API is a backend-for-frontend or
administrative surface for the app. Public/runtime APIs, webhooks, queue
consumers, scheduled jobs, and headless service APIs still belong under
`services/*`.

### Services

Use `services/<name>` when the unit is deployed but has no graphical UI. A service owns runtime entrypoints such as public APIs, webhooks, queue consumers, scheduled jobs, service-binding targets, agents, CLIs, and headless automation.

Worker shape:

```txt
services/<runtime-surface>/
  src/
    modules/
    adapters/
    routes/
    index.ts
  tests/
  wrangler.jsonc
  package.json
```

Agent shape:

```txt
services/<capability>-agent/
  src/
    commands/
    adapters/
    index.ts
  tests/
  package.json
```

Examples:

```txt
services/public-api
services/ingestion
services/analytics-export
services/runtime-agent
```

### Packages

Use `packages/<name>` when the unit is shared code and is not deployable by itself. A package must have a clear public API and must not depend on app-local routes, browser shell state, Worker deploy config, or environment-specific secrets.

```txt
packages/<owner-purpose>/
  src/
    modules/
    adapters/
    public.ts
  tests/
  package.json
```

Examples:

```txt
packages/contracts
packages/db
packages/problem-details
packages/value-primitives
packages/action-step-policy
packages/product-core
packages/runtime-protocol
packages/platform-adapters
packages/ios-runtime
```

## Naming rules

Name by ownership and stable purpose first. Use type or platform only when it clarifies a real boundary.

Preferred order:

1. Ownership: product surface, domain, capability, or operational owner.
2. Purpose: the durable responsibility the unit owns.
3. Boundary type: app, service, runtime, protocol, contracts, or adapter.
4. Platform/runtime: only when variants exist or the platform is part of the contract.

### App names

Use product-surface nouns:

```txt
apps/admin
apps/customer-portal
apps/operations-console
```

Avoid implementation or lifecycle names:

```txt
apps/react-app
apps/frontend
apps/dashboard2
apps/worker-ui
```

### Service names

Use runtime responsibility names:

```txt
services/public-api
services/ingestion
services/webhooks
services/scheduler
services/runtime-agent
```

Use `-agent` only for autonomous headless process workers or Node agents:

```txt
services/reporting-agent
services/provisioning-agent
```

Avoid generic runtime names unless the repo has only one such surface:

```txt
services/worker
services/api
services/node
services/cloudflare-worker
```

### Package names

Use ownership plus role:

```txt
packages/contracts
packages/product-core
packages/problem-details
packages/value-primitives
packages/action-step-policy
packages/runtime-protocol
packages/provider-adapters
packages/ios-runtime
```

Use `core` only when qualified by owner:

```txt
packages/product-core
packages/commerce-core
```

Avoid unowned generic names:

```txt
packages/core
packages/common
packages/shared
packages/utils
packages/helpers
packages/lib
```

## Promotion rules

Promote local code to `packages/*` only when at least one is true:

- Two or more active consumers import it.
- It is a stable contract used across apps, services, generated clients, or external consumers.
- It is a cross-runtime protocol or runtime library.
- It needs independent tests, versioning, or package-level ownership.
- It isolates a provider or platform adapter used by multiple deployables.

Before creating or promoting a package, record:

```txt
name:
owner:
current consumers:
public API:
responsibility:
must not contain:
why local module is insufficient:
tests:
```

If `current consumers` has only one entry, default to a local module unless the code is a contract, generated-client source, or cross-runtime protocol by design.

## Decision rules

- If it deploys and has graphical UI, put it under `apps/*`.
- If it deploys and has no graphical UI, put it under `services/*`.
- If it does not deploy and has multiple real consumers, put it under `packages/*`.
- If it has one consumer, keep it inside that consumer.
- If the problem is code organization, create or refine a module.
- If the problem is provider or platform access, use an adapter.
- If the problem is bundle size, CPU, secrets, isolation, or independent scaling, consider a service boundary.
- If UI is reusable only inside one app, keep it app-local.
- If UI has multiple product-app consumers, consider an explicitly owned UI package or an upstream contribution to the approved design-system package.
- If a package name would be generic, refine the ownership before creating it.

## Allowed exceptions

- Generated clients, contracts, and cross-runtime protocols may live in `packages/*` with one initial consumer when the external or generated contract is the real boundary.
- Existing repo layout may remain during migration when a target boundary, owner, and removal path are documented.

## Example

```txt
apps/admin/src/modules/users/
apps/admin/src/ui/

services/ingestion/src/modules/webhooks/
services/ingestion/wrangler.jsonc

packages/contracts/src/public.ts
packages/contracts/tests/contract/

packages/runtime-protocol/src/public.ts
packages/runtime-protocol/tests/unit/
```

Avoid:

```txt
packages/admin-ui
packages/dashboard-ui
packages/common
packages/shared
packages/utils
```

---
id: PAT-ARCH-MODULE-BOUNDARIES-001
domain: ARCH
category: MODULE_BOUNDARIES
version: 1
description: Use this pattern when enforcing dependency direction and public/private boundaries between modules.
precedence_level: 2
depends_on:
  - PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001
applies_when:
  - "Enforcing dependency direction and public/private boundaries between modules."
---


## Strategy

Module boundaries must be enforceable, not only visual. A module exposes a small public surface and keeps internal files private. Cross-module imports, shared abstractions, and dependency direction must be intentional, testable, and reviewable.

## Rules

### Must

- Give each non-trivial module a public entrypoint.
- Import another module only through its public entrypoint.
- Use `public.ts` as the public entrypoint when the local stack uses TypeScript module folders.
- Keep private module internals unreachable from other modules.
- Define dependency direction between app, modules, shared code, adapters, and generated code.
- Add lint, test, or architecture checks when boundaries become important to correctness.

### Must not

- Do not deep-import another module's routes, repositories, adapters, UI internals, schemas, or tests.
- Do not create circular dependencies between modules.
- Do not hide shared behavior in ambiguous `common`, `utils`, or `helpers` folders.
- Do not expose everything from a module public entrypoint.
- Do not use broad `export *` from module public surfaces.
- Do not export repositories, private adapters, private slice internals, or test fixtures from module public surfaces.
- Do not bypass boundaries for convenience without an explicit exception.

## Decision rules

- If another module needs one behavior, export one stable function, type, command, query, or event.
- If many modules need the same helper, move it to a named shared package or shared module.
- If multiple modules or deployables need the same domain rule, do not
  deep-import another module's private policy file. Promote the rule to a
  shared kernel or expose one stable public function.
- If two modules import each other, introduce a public API, event, or higher-level orchestration module.
- If a public export leaks infrastructure details, add a mapper or application-facing contract.
- If the package is a modular API, cross-module imports must target `modules/<module>/public.ts` only, unless a documented migration exception exists.
- If boundary rules are repeatedly violated, automate enforcement.

## Allowed exceptions

- Test fixtures may cross boundaries through explicit test support modules.
- Migration adapters may temporarily deep-import legacy code with owner, reason, and removal target.
- Generated code may expose broad surfaces when consumers use typed wrappers.

## Example

```txt
Good:
modules/orders/public.ts
modules/billing/public.ts
modules/orders/create-order/handler.ts imports modules/billing/public.ts

Avoid:
modules/orders/create-order/handler.ts imports modules/billing/repositories/invoices.ts
modules/orders/ui/form.tsx imports modules/customers/ui/internal-card.tsx
```

---
id: PAT-DOMAIN-SCHEMA-API-NAMING-001
domain: ARCH
category: DOMAIN_SCHEMA_API_NAMING
version: 1
description: Use this pattern when a durable product domain needs one naming and ownership line across Postgres, API, OpenAPI, generated clients, and frontend modules.
precedence_level: 2
depends_on:
  - PAT-ARCH-DETERMINISTIC-NAMING-001
  - PAT-DATA-POSTGRES-001
  - PAT-DATA-MIGRATIONS-001
applies_when:
  - "A durable product domain needs one naming and ownership line across Postgres, API, OpenAPI, generated clients, and frontend modules."
---


## Strategy

Use the same domain/resource vocabulary everywhere a durable product concept appears:

```txt
Postgres schema -> API domain module -> public URL namespace -> frontend domain module
Postgres table  -> API resource/slice -> public URL resource  -> frontend resource workflow
```

For example:

```txt
tenancy.tenants
<api-surface-root>/modules/tenancy/tenants
/v1/tenancy/tenants
apps/admin/src/react/modules/tenancy/tenants
```

The URL domain is a public contract. Renaming it requires versioning,
compatibility routing, or a documented deprecation window.

## Related patterns

- `PAT-DATA-POSTGRES-001`: Postgres is authoritative for transactional state.
- `PAT-DATA-HYPERDRIVE-001`: Worker runtime connects to Postgres through Hyperdrive.
- `PAT-DATA-KYSELY-001`: repositories own Kysely and SQL.
- `PAT-DATA-MIGRATIONS-001`: schema changes move through migrations and generated types.
- `PAT-API-SURFACE-BOUNDARIES-001`: API surfaces are placed by consumer, contract, deployability, security posture, and runtime cost.
- `PAT-API-MODULAR-SLICES-001`: API behavior lives in enforceable module/slice boundaries.
- `PAT-API-OPENAPI-001`: HTTP contract and generated clients follow the API source of truth.
- `PAT-TEST-PLACEMENT-001`: test artifacts mirror ownership under `tests/`.
- `PAT-UI-LEMN-001`: graphical UI uses the LEMN package surface.

## Rules

### Must

- Name domains once and reuse them across Postgres schema, API module, URL namespace, OpenAPI tags/operation IDs, frontend module, and documentation.
- Use Postgres schemas for durable domain boundaries and plural lower_snake_case tables for resources.
- Use plural URL resource names under `/v1/<domain>/<resources>`.
- Use the durable API ownership hierarchy `<api-surface-root>/modules/<domain>/<resources>/<use-case>/` when a resource maps to a Postgres schema/table or frontend domain workflow.
- Name use-case slices by responsibility, subresource, or lifecycle concept; keep the resource name in the resource folder, not duplicated into the slice name.
- Keep production runtime persistence on `Repository -> Kysely -> pg/Hyperdrive -> Neon/Postgres`.
- Keep Kysely imports and SQL construction inside owning `repository.ts` files.
- Keep database rows, public DTOs, frontend view models, and cross-runtime contracts as separate shapes with explicit mappers.
- Import cross-module product behavior only through the owning module `public.ts`.
- Keep shared folders domain-free; product policy, DTO shaping, SQL fragments, and orchestration belong to named owners.
- Put all unit, integration, contract, e2e, smoke, fixtures, fakes, mocks, helpers, setup, and snapshots under the owning package or app `tests/` root.
- Generate dashboard API calls from the API/OpenAPI contract into the dashboard app.

### Must not

- Do not prefix target database tables with product prefixes such as `bf_`.
- Do not use D1, SQLite, Drizzle schemas, or compatibility facades as the target runtime model for migrated product domains.
- Do not expose `env.DB`, `D1Database`, `getDb(env).prepare(...)`, or SQLite-to-Postgres translation as target runtime query APIs.
- Do not put SQL, Kysely, provider calls, DTO mappers, or product orchestration in Hono route handlers or app bootstrap.
- Do not create generic `common`, `utils`, or `helpers` folders for product behavior.
- Do not deep-import another module's repository, mapper, types, policy, adapter, or private type file.
- Do not split modules mechanically by CRUD operation when one resource module remains cohesive; split by command/query, subdomain, or subcapability only when ownership is real.
- Do not create top-level resource modules when the resource belongs to a named domain; use `orders/status`, not `order-status`.
- Do not encode resource plus action in one slice folder such as `memberships-create` or `llm-subscription-list`; use domain/resource/use-case paths such as `access/tenant-memberships/create` and `runners/llm-subscriptions/list` when those resources have durable ownership.
- Do not keep a standalone internal `packages/sdk` as dashboard plumbing; generated frontend API code belongs under the dashboard app unless a separately owned public SDK product exists.

## Naming rules

- Domains use stable nouns or domain concepts in lower-kebab-case for files/URLs and lower_snake_case for Postgres schemas when needed.
- Postgres schemas use lower_snake_case and are usually singular or abstract, for example `tenancy`, `identity`, `access`, `tasking`, `planning`, `workflow`, `operations`, and `governance`.
- Tables use plural lower_snake_case names such as `tenancy.tenants`, `access.roles`, `tasking.tasks`, and `planning.action_plan_steps`.
- Columns use singular lower_snake_case attributes such as `tenant_id`, `display_name`, `created_at`, and `updated_at`.
- Indexes and constraints use `{schema}_{table}_{column_or_purpose}_{idx|uq|fk|ck|pk}`.
- URL path segments are nouns, collections are plural, and command-like operations are modeled as subresources such as `status-changes`, `claims`, `heartbeats`, `retries`, and `cancellations`.
- Function names use verbs plus resource names, for example `listTenants`, `getTenant`, `createTenant`, `listTenantRows`, and `mapTenantRowToDto`.
- Public DTO types use names such as `TenantDto` and `TenantListItemDto`; generated DB row aliases use names such as `TenantRow`, `NewTenantRow`, and `TenantRowUpdate`.

## API shape

API source is organized by domain and resource/slice ownership:

```txt
<api-surface-root>/modules/<domain>/
  public.ts
  shared/
  <resources>/
    public.ts
    shared/
    http.ts
    command.ts | query.ts
    repository.ts
    mapper.ts
    policy.ts
    adapter.ts
    types.ts
    <use-case>/
      http.ts
      command.ts | query.ts
      repository.ts
      mapper.ts
      policy.ts
      adapter.ts
      types.ts
```

Use the flat resource files only while the resource remains cohesive. When
commands, queries, policies, provider boundaries, or tests diverge, split inside
the resource folder by use case or subresource without changing the durable
domain/resource vocabulary:

```txt
services/public-api/src/modules/orders/status/list
services/public-api/src/modules/orders/status/detail
services/public-api/src/modules/orders/status/changes
apps/admin/src/api/modules/access/api-keys/revocations
apps/admin/src/api/modules/tenancy/tenants/current-context
```

The API surface root is selected by `PAT-API-SURFACE-BOUNDARIES-001`.
Examples include `apps/admin/src/api` for an admin console API and
`services/public-api/src` for a stable public/runtime API. `packages/api/src`
is allowed only as a temporary compatibility host during migration, not as a
target API surface.

Contract and validation ownership has exactly two targets:

- Shared, public, stable internal, generated-client, or cross-runtime schemas,
  DTOs, and protocol types live in `packages/contracts`.
- Local operation-only request schemas, response DTOs, inferred input types,
  command/query types, ports, and expected error shapes live in the owning
  operation `types.ts`.

Do not create `schema.ts` for API operation contracts. Do not place local API
contracts beside `http.ts` in ad hoc files. Do not put shared contracts in
operation `types.ts`.

Compatibility routes may keep legacy URLs temporarily, but target ownership,
OpenAPI tags, generated clients, tests, and migration metadata must point at the
domain/resource owner. For example, `/v1/order-status` may route to the target
owner only as a documented alias for `/v1/orders/status`.

Use `PAT-API-MODULAR-SLICES-001` for the exact internal slice profile. This
pattern owns naming and cross-surface alignment; the modular-slice pattern owns
file responsibility and migration exceptions.

`app.ts` or app bootstrap files may register modules, middleware, health checks,
OpenAPI, and explicitly allowlisted bootstrap routes. They must not contain
product use cases, SQL, provider calls, DTO mapping, or runtime orchestration.

## Frontend shape

React modules mirror the API domain/resource vocabulary. The app shell is
allowed outside domain modules only for routing, providers, app bootstrap,
generated API client wiring, and global styles:

```txt
apps/admin/src/react/
  app/
  api/
    transport.ts
    generated.ts
    client.ts
  modules/
    <domain>/<resources>/
      public.ts
      routes.tsx
      queries.ts
      mutations.ts
      viewModel.ts
      ui/
  shared/
```

Frontend modules call API through generated client wrappers in module
`queries.ts` and `mutations.ts`. UI components consume DTOs or view models, not
raw API envelopes, and graphical primitives come from `@lemn-ltd/ui`.

## Decision rules

- If a name crosses DB, API, OpenAPI, frontend, tests, or docs, use the same domain/resource vocabulary.
- If the resource has a Postgres table, the API owner is the matching domain/resource path before any use-case split.
- If the only difference is CRUD method, start with resource-local `command.ts`, `query.ts`, `repository.ts`, and `mapper.ts`; split into `list`, `create`, `detail`, or similar only when the responsibilities need separate ownership.
- If an action changes resource lifecycle, prefer a noun subresource or lifecycle slice such as `status-changes`, `claims`, `heartbeats`, `retries`, or `revocations`.
- If code builds queries or executes SQL, place it in the owning repository.
- If data leaves the API boundary, map it explicitly before returning it.
- If a frontend screen talks to the API, use generated client plumbing through module queries or mutations.
- If an old URL/table/module name must remain temporarily, document it as a versioned compatibility exception with owner, reason, risk, target, and expiry.

## Allowed exceptions

- Legacy routes, tables, package-level repositories, app-root code, or flat modules may remain only as documented migration exceptions with owner, risk, migration target, and expiry.
- A separate `packages/sdk` may exist only as an explicitly owned, versioned, supported public SDK product with generated contract tests.
- Small local tooling may use direct database URLs when it is outside deployed Worker runtime and documented by the relevant data pattern.

## Example

```txt
Database: tenancy.tenants
API:      services/public-api/src/modules/tenancy/tenants
URL:      /v1/tenancy/tenants
Frontend: apps/admin/src/react/modules/tenancy/tenants
Tests:    services/public-api/tests/unit/modules/tenancy/tenants
```

---
id: PAT-ARCH-ABSTRACTIONS-001
domain: ARCH
category: ABSTRACTIONS
version: 1
description: Use this pattern when introducing factories, providers, base classes, generics, or helpers.
precedence_level: 2
depends_on: []
applies_when:
  - "Introducing factories, providers, base classes, generics, or helpers."
---


## Strategy

Abstractions must be thin and earned by repeated need, testing value, or infrastructure isolation. Prefer explicit code until duplication or variability is real.

## Rules

### Must

- Use simple functions and modules first.
- Introduce abstractions only when they clarify behavior.
- Keep infrastructure ports small, usually 3-8 methods.
- Keep abstractions transparent to code review.
- Centralize pure helpers only when they are domain-free, platform-free,
  heavily repeated, named by capability, and covered by tests.

### Must not

- Do not add enterprise-style factories or providers speculatively.
- Do not create generic repositories or opaque helpers around SQL.
- Do not create interfaces for every service, use case, or local helper.
- Do not hide complexity to pass metrics.

## Decision rules

- If there is one implementation, avoid an interface unless it enables tests or external provider isolation.
- If the boundary is R2, KV, Queue, Workflow, auth, email, AI, or payment, a small port is usually justified.
- If abstraction makes review harder, remove it.
- If duplication is not yet real, wait.

## Allowed exceptions

- Ports for external providers are allowed because they improve testing and isolation.

## Example

```ts
// Good port: external side effect
export interface EmailProvider {
  send(input: { to: string; template: string; variables: Record<string, unknown> }): Promise<void>
}

// Avoid: interface that only mirrors one local class without value
```

---
id: PAT-ARCH-PORTS-ADAPTERS-001
domain: ARCH
category: PORTS_ADAPTERS
version: 1
description: Use this pattern when a use case depends on external providers, runtimes, protocols, tools, storage backends, Cloudflare bindings, or replaceable infrastructure.
precedence_level: 2
depends_on:
  - PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001
  - PAT-ARCH-BINDINGS-ADAPTERS-001
  - PAT-ARCH-ABSTRACTIONS-001
applies_when:
  - "A use case depends on external providers, runtimes, protocols, tools, storage backends, Cloudflare bindings, or replaceable infrastructure."
---


## Strategy

Use ports and adapters when business use cases need capabilities from outside
the local module boundary. The owning use case or service defines the port by
business purpose. The adapter owns provider, platform, runtime, protocol, or
binding details.

Ports and adapters protect the core from provider SDKs, Cloudflare bindings,
CLI behavior, webhook payloads, MCP transport details, storage APIs, and other
replaceable infrastructure. They also make core service tests deterministic by
allowing fakes at the port boundary.

## Rules

### Must

- Define ports by business capability, not by provider, product, or runtime name.
- Keep ports small, usually 3-8 methods.
- Keep provider SDKs, Cloudflare bindings, CLIs, webhooks, MCP transports, runtime APIs, and raw provider payloads inside adapters.
- Place adapters in the owning API surface, module slice `adapter.ts`, module shared adapter, service adapter, or explicitly named package only when the boundary has multiple real consumers.
- Map external payloads into internal DTOs before crossing into services or domain logic.
- Expose only stable service-facing types from ports.
- Use fakes for core service tests when a use case depends on a port.
- Add adapter integration, contract, smoke, or documented runtime evidence when provider or platform behavior matters.

### Must not

- Do not create ports for speculative reuse.
- Do not create generic ports such as `ExternalClientPort`, `ProviderPort`, or `ApiPort`.
- Do not let services import `env` bindings, provider SDK clients, Hono `Context`, `Request`, `Response`, raw webhook payloads, or raw provider response shapes.
- Do not hide business policy, tenant authorization, or billing decisions inside adapters.
- Do not force unrelated providers through one port when their semantics differ.
- Do not create adapters for pure in-process domain code just to look architectural.

## Decision rules

- If code talks to an external provider, platform binding, runtime API, protocol, object storage, queue, workflow, CLI, MCP server, or webhook source, use an adapter.
- If a service needs the capability, define a business-shaped port near the owning module or service.
- If there is only one implementation, avoid a port unless it isolates an external boundary, enables meaningful fakes, or keeps provider details out of the core.
- If a provider response must leave the adapter, map it first.
- If the adapter changes a stateful external system, combine this pattern with authorization, audit, idempotency, and outbox patterns as applicable.
- If several deployables need the same boundary, promote it to a named capability package with explicit consumers and public API.

## Allowed exceptions

- Kysely repositories are the accepted Postgres persistence boundary and do not need an extra port unless a use case has a documented multi-engine or provider-boundary need.
- Tiny one-off local scripts may call provider APIs directly when they are outside deployed runtime paths and documented as tooling.

## Example

An invoice service needs to store generated PDF documents. The service should
not import R2 bindings or object-storage SDK shapes directly.

```ts
export interface InvoiceDocumentStoragePort {
  put(input: {
    organizationId: string
    invoiceId: string
    body: ReadableStream
    contentType: string
  }): Promise<{ objectKey: string }>

  get(input: {
    organizationId: string
    invoiceId: string
    objectKey: string
  }): Promise<{ body: ReadableStream; contentType: string }>
}

export class R2InvoiceDocumentStorageAdapter implements InvoiceDocumentStoragePort {}
export class FakeInvoiceDocumentStorageAdapter implements InvoiceDocumentStoragePort {}
```

The invoice service depends on `InvoiceDocumentStoragePort`. R2 details stay in
`R2InvoiceDocumentStorageAdapter`. Tests can use
`FakeInvoiceDocumentStorageAdapter`.

---
id: PAT-ARCH-VALUE-PRIMITIVES-001
domain: ARCH
category: VALUE_PRIMITIVES
version: 1
description: Use this pattern when repeated domain-free value parsing or formatting helpers appear across apps, services, or packages.
precedence_level: 2
depends_on:
  - PAT-ARCH-ABSTRACTIONS-001
applies_when:
  - "Repeated domain-free value parsing or formatting helpers appear across apps, services, or packages."
---


## Strategy

Centralize value primitives only when they are small, pure, domain-free,
platform-free, heavily repeated, and stable. This package exists to remove
semantic drift in basic value handling, not to become `utils`.

## Rules

### Must

- Keep functions deterministic and side-effect free.
- Keep helpers domain-free and protocol-free.
- Keep exported names specific to value handling.
- Add package-owned tests for invalid, empty, null, malformed, and edge values.
- Keep the package dependency-free unless a documented standard parser is required.

### Must not

- Do not include HTTP, Hono, Problem Details, crypto, mappers, repositories,
  adapters, provider code, product policy, auth, tenancy, logging, or time
  source ownership.
- Do not hide product normalization in value primitives.
- Do not add helpers only because two files look similar.

## Decision rules

- If the helper parses or formats JSON, strings, numbers, booleans, arrays, or
  plain records without product meaning, it may belong here.
- If the helper names a domain concept, keep it in the owning module or shared
  kernel.
- If the helper touches runtime APIs, put it in the owning adapter or a
  capability-specific package.
- If adding the helper makes review harder, keep it local.

## Allowed exceptions

- Surface-local `shared/*` helpers may remain when reuse is not yet
  cross-surface or when migration would exceed the task scope.

## Example

```txt
packages/value-primitives
  parseJsonOr
  asRecord
  firstNonEmptyString
  numberOrNull
  clampInteger
```

---
id: PAT-ARCH-CONCEPTS-001
domain: ARCH
category: CONCEPTS
version: 1
description: Use this pattern before creating a new service, client, mapper, helper, schema, or abstraction.
precedence_level: 2
depends_on:
  - PAT-ARCH-DETERMINISTIC-NAMING-001
applies_when:
  - "Creating a new service, client, mapper, helper, schema, or abstraction."
---


## Strategy

One product concept should have one canonical implementation. Search existing modules before creating a parallel concept.

## Rules

### Must

- Reuse existing services, clients, schemas, helpers, and patterns.
- Extend canonical modules when behavior belongs there.
- Rename or consolidate duplicates when safe.

### Must not

- Do not create a second implementation of the same concept.
- Do not add alternate clients or helpers without checking current usage.
- Do not fork behavior silently.

## Decision rules

- If two modules model the same business concept, consolidate or ask.
- If local naming differs, follow the repo's canonical naming.
- If a duplicate is intentional, document why.

## Allowed exceptions

- A temporary duplicate is allowed only during an explicit migration plan.

## Example

```txt
Before creating billingClient.ts:
1. search modules/billing
2. search integrations/payments
3. extend the existing canonical client or service
```

---
id: PAT-ARCH-ADAPTER-REGISTRY-001
domain: ARCH
category: ADAPTER_REGISTRY
version: 1
description: Use this pattern when a product concept supports multiple typed implementations selected by a stable type field.
precedence_level: 3
depends_on:
  - PAT-ARCH-PORTS-ADAPTERS-001
  - PAT-ARCH-MODULE-BOUNDARIES-001
applies_when:
  - "A product concept supports multiple typed implementations selected by a stable type field."
---


## Strategy

Use an adapter registry when one product concept has multiple concrete
implementations selected by a stable `type` or equivalent discriminator. The
core owns the registry contract and shared policy. Each adapter owns its config
schema, external validation, provider mapping, and implementation details.

This pattern is for real extensibility points such as notification channels,
payment providers, runtime targets, inference providers, storage backends, or
tool executors. It keeps coordinators from becoming large `switch` statements
and makes adding a new implementation local, typed, and testable.

## Rules

### Must

- Model the durable product resource separately from its adapter implementation.
- Give each adapter one stable `type` value and one config schema.
- Validate adapter config with Zod or the established validation layer before storing or executing it.
- Route adapter selection through a registry owned by the module or service.
- Keep shared policy, tenant scope, idempotency, authorization, and final contract validation in the core use case.
- Keep provider-specific event verification, payload mapping, and protocol behavior inside the adapter.
- Make adding a new adapter type require a new adapter, config schema, tests, and registration, not a rewrite of the coordinator.
- Test the coordinator with fake adapters and test each concrete adapter at its provider or platform boundary when behavior matters.

### Must not

- Do not put a large `switch` or `if` chain in a coordinator, command, query, or route when a registry is the real extension point.
- Do not store untyped adapter config without adapter-owned validation.
- Do not let one adapter import another adapter's internals.
- Do not let adapters bypass module `public.ts` boundaries.
- Do not let adapters own business authorization, tenant isolation, billing policy, or rollout decisions.
- Do not create a registry when there is only one implementation and no concrete extension need.

## Decision rules

- If new `type` values are expected and each type has different config or external behavior, use an adapter registry.
- If the implementation differs only by small local branching with no provider/runtime boundary, keep the logic in policy or command code.
- If adapter config is user-provided or externally triggered, validate before persistence and before execution.
- If adapter output enters a use case, map it into internal DTOs first.
- If adapter execution creates side effects, pair it with idempotency, audit events, and retry policy as applicable.

## Allowed exceptions

- Small enum-based policy choices may remain simple `switch` statements when there is no provider, runtime, protocol, or external boundary.
- Migration code may temporarily use explicit branching with owner, target registry, risk, and expiry documented.

## Example

A notification use case supports multiple delivery channels.

```ts
type NotificationChannelType = 'email' | 'webhook'

interface NotificationChannelAdapter<TConfig> {
  type: NotificationChannelType
  validateConfig(config: unknown): TConfig
  send(input: { config: TConfig; message: NotificationMessage }): Promise<void>
}

const registry = createNotificationChannelRegistry([
  emailNotificationChannelAdapter,
  webhookNotificationChannelAdapter,
])
```

The notification service chooses the adapter through the registry, enforces
tenant scope and audit policy in the core use case, and keeps provider-specific
payloads inside the adapters.

---
id: PAT-ARCH-COMMAND-PATTERN-001
domain: ARCH
category: COMMAND_PATTERN
version: 1
description: Use the Command Pattern when a state-changing use case must be explicit, validated, authorized, auditable, and testable as one operation.
precedence_level: 3
depends_on:
  - PAT-ARCH-LAYERS-001
  - PAT-ARCH-MODULE-BOUNDARIES-001
applies_when:
  - "A state-changing use case must be explicit, validated, authorized, auditable, and testable as one operation."
---


## Strategy

Use the Command Pattern for meaningful mutations. A command represents one
business operation, carries the input needed to perform that operation, and
routes execution through the owning module or service. In this repository,
commands are implemented as command-shaped use cases, usually in `command.ts`
for API slices.

Commands make write behavior reviewable: validation, authorization, policy,
persistence, side effects, idempotency, audit, and tests stay close to the
state change they protect.

## Rules

### Must

- Represent each non-trivial mutation as a named command or command-shaped use case.
- Keep HTTP parsing in `http.ts`; pass validated command input into `command.ts` or the owning service.
- Authorize before mutation.
- Keep business policy in `policy.ts` or the command when small and local.
- Keep SQL and Kysely construction in repositories.
- Use idempotency when the command can be retried, queued, externally triggered, paid, or costly.
- Insert outbox records inside the same transaction when external side effects must follow a committed change.
- Add audit events for security, billing, admin, MCP, or state-changing tool decisions.
- Test command behavior with repositories, fakes, and policy cases appropriate to risk.

### Must not

- Do not put meaningful mutation orchestration in Hono route handlers.
- Do not let commands import Hono `Context`, `Request`, `Response`, `env`, or provider SDK clients.
- Do not split one business mutation across unrelated helpers without one owning command.
- Do not perform external side effects inside a database transaction.
- Do not make commands return raw database rows or provider payloads.

## Decision rules

- If the operation changes product state, creates cost, changes permissions, starts work, or calls a tool, model it as a command.
- If a command becomes long because it owns several independent outcomes, split by business use case, not by technical step.
- If the command can be delivered twice, make it idempotent.
- If a command starts a long or retryable process, persist the state first, then enqueue or start a workflow.
- If a command only wraps a single repository call without policy, keep it small but still preserve the command boundary when it is part of a public API slice.

## Allowed exceptions

- Tiny internal maintenance scripts outside deployed runtime paths may be flatter when clearly documented.
- Small prototype-only mutations may stay local until productized, but must not enter production paths without a command boundary.

## Example

```txt
apps/admin/src/api/modules/invoicing/invoices/approve/
  http.ts       -> parse and validate request
  command.ts    -> authorize, apply policy, mutate, enqueue side effects
  repository.ts -> Kysely writes
  mapper.ts     -> public DTO
  policy.ts     -> approval rules
  types.ts      -> command input and result shapes
```

---
id: PAT-ARCH-STRATEGY-PATTERN-001
domain: ARCH
category: STRATEGY_PATTERN
version: 1
description: Use the Strategy Pattern when a use case must choose between interchangeable algorithms or policies without changing the caller.
precedence_level: 3
depends_on:
  - PAT-ARCH-ABSTRACTIONS-001
applies_when:
  - "A use case must choose between interchangeable algorithms or policies without changing the caller."
---


## Strategy

Use the Strategy Pattern for interchangeable algorithms or policies selected by
configuration, product policy, runtime context, or tests. The caller depends on
a small strategy contract and does not know the concrete algorithm details.

In this repository, strategy is for policy or algorithm variation. Use
`PAT-ARCH-PORTS-ADAPTERS-001` or `PAT-ARCH-ADAPTER-REGISTRY-001` instead when
the variation is a provider, runtime, protocol, storage backend, or external
capability.

## Rules

### Must

- Use strategies for interchangeable algorithms, scoring rules, cost calculations, rollout decisions, retry choices, or selection policies.
- Keep each strategy focused on one algorithm or policy family.
- Keep strategy inputs and outputs as internal DTOs or value primitives.
- Select the strategy in the owning command, query, service, or policy boundary.
- Test each strategy with representative edge cases.
- Test the selecting use case with at least one fake or deterministic strategy when behavior depends on selection.

### Must not

- Do not use strategies for external providers, platform bindings, runtimes, or tools; use ports/adapters or adapter registries.
- Do not introduce strategies before real variation exists.
- Do not hide business authorization, tenant scope, or persistence inside strategies.
- Do not use inheritance-heavy template hierarchies when simple functions or objects are clearer.
- Do not let strategy selection depend on raw provider payloads or UI state.

## Decision rules

- If the caller needs one of several algorithms with the same purpose, use Strategy.
- If adding a new option should not change the caller, Strategy may fit.
- If the option needs its own external config schema or provider behavior, use an adapter registry instead.
- If the variation is a small local condition, keep it in policy code.
- If strategy names become provider names, the abstraction is likely a port or adapter instead.

## Allowed exceptions

- Local `switch` statements are acceptable for small, closed sets of policy choices.
- One-off strategy implementations may remain private to a module when reuse is not yet real.

## Example

```ts
interface RolloutRiskStrategy {
  score(input: RolloutRiskInput): Promise<{ riskScore: number; reasons: string[] }>
}

const strategy = selectRolloutRiskStrategy(policy)
const risk = await strategy.score({ rollout, metrics, evalResults })
```

---
id: PAT-ARCH-FINITE-STATE-MACHINE-001
domain: ARCH
category: FINITE_STATE_MACHINE
version: 1
description: Use the Finite State Machine Pattern when a durable product resource has a lifecycle with explicit states, transitions, guards, and terminal outcomes.
precedence_level: 3
depends_on:
  - PAT-ARCH-BEHAVIOR-PRESERVATION-001
  - PAT-DATA-TRANSACTIONS-001
applies_when:
  - "A durable product resource has a lifecycle with explicit states, transitions, guards, and terminal outcomes."
---


## Strategy

Use a finite state machine for durable resources whose behavior depends on
their current status. Define the allowed states, allowed transitions, guards,
actor, reason, timestamps, and terminal outcomes in one owner. Invalid
transitions must fail safely and observably.

State machines prevent impossible lifecycle combinations such as a run being
both waiting for human input and completed, or a version being editable after
activation.

## Rules

### Must

- Declare the complete state set for each durable lifecycle.
- Declare allowed transitions and terminal states.
- Enforce transitions in services or commands, not only in the UI.
- Use database constraints where practical for allowed status values.
- Store transition timestamps, actor or system source, and reason when the transition affects user-visible, billable, security, or operational state.
- Make transition commands transactional when they update related rows.
- Emit audit events for sensitive or administrative transitions.
- Test valid transitions, invalid transitions, idempotent replays, and terminal-state behavior.

### Must not

- Do not update status fields directly from routes, adapters, repositories, UI, or scripts.
- Do not use free-form status strings in persistent product state.
- Do not allow transitions out of terminal states unless explicitly modeled.
- Do not hide transition guards in frontend checks.
- Do not infer lifecycle state only from logs or derived data.

## Decision rules

- If a resource has more than three statuses, explicit transition rules are required.
- If a status controls permissions, billing, rollout, async progress, or user-visible behavior, model it as a state machine.
- If a retry should be safe, make the transition idempotent or reject with a stable conflict.
- If multiple actors can transition the same resource, use locking, constraints, or a transaction boundary.
- If historical transition analysis matters, add a transition event table or audit event.

## Allowed exceptions

- Small static lookup state may use simple enum validation when it has no lifecycle behavior.
- Derived display state can be computed when authoritative state remains explicit.

## Example

```txt
HarnessVersion:
  draft -> candidate
  candidate -> active
  candidate -> archived
  active -> archived

Disallowed:
  active -> draft
  archived -> active
```

---
id: PAT-ARCH-DECOMPOSITION-001
domain: ARCH
category: DECOMPOSITION
version: 1
description: Use this pattern when refactoring large files, god objects, or central modules.
precedence_level: 3
depends_on:
  - PAT-ARCH-BEHAVIOR-PRESERVATION-001
  - PAT-TEST-INTEGRITY-001
applies_when:
  - "Refactoring large files, god objects, or central modules."
---


## Strategy

Decompose by responsibility and coupling, not by line count alone. Refactors must make ownership and behavior clearer.

## Rules

### Must

- Extract cohesive functions, modules, or services.
- Keep behavior covered by tests.
- Reduce central knowledge and hidden dependencies.

### Must not

- Do not move lines cosmetically without reducing coupling.
- Do not create tiny wrappers that obscure behavior.
- Do not split files while preserving a god object API.

## Decision rules

- If a file owns multiple responsibilities, split by responsibility.
- If a function has multiple reasons to change, extract use cases.
- If tests become weaker, refactor is not done.

## Allowed exceptions

- Small files may stay together if the responsibility is truly cohesive.

## Example

```ts
// Better split
validateInvite(input)
await policy.assertCanInvite(input)
const invite = await invitesRepo.create(input)
await outboxRepo.insert({ type: 'invite.created', aggregateId: invite.id })
```

---
id: PAT-ARCH-DOMAIN-EVENT-PATTERN-001
domain: ARCH
category: DOMAIN_EVENT_PATTERN
version: 1
description: Use the Domain Event Pattern when a committed business fact must be recorded or trigger follow-up behavior without coupling modules directly.
precedence_level: 4
depends_on:
  - PAT-ASYNC-OUTBOX-001
  - PAT-OBS-TRACE-CONTEXT-001
applies_when:
  - "A committed business fact must be recorded or trigger follow-up behavior without coupling modules directly."
---


## Strategy

Use domain events to represent business facts that have happened and matter to
the product. A domain event is not a command and does not ask another module to
do work directly. It records that something occurred, using past-tense event
names, stable payload versions, tenant scope, and correlation metadata.

When an event must reliably trigger external work, write it through the outbox
inside the same transaction as the state change. Consumers handle the event
after commit and must be idempotent.

## Rules

### Must

- Name events in past tense, for example `invoice.approved` or `run.completed`.
- Include organization or tenant scope when the event relates to tenant data.
- Include aggregate type, aggregate id, event type, payload version, occurredAt, and requestId or traceId.
- Store or publish domain events only after the business state is durable.
- Use outbox for events that must trigger queues, workflows, webhooks, notifications, analytics, evals, or provider calls.
- Make event consumers idempotent.
- Keep event payloads minimal and safe; include identifiers and facts, not full private records.
- Version event payloads when consumers can outlive the producer deploy.

### Must not

- Do not use domain events as commands.
- Do not publish important events before the database transaction commits.
- Do not use in-memory observers for durable product behavior.
- Do not put secrets, raw prompts, raw provider payloads, or large objects in event payloads.
- Do not rely on event ordering across unrelated aggregates unless explicitly modeled.

## Decision rules

- If a fact should trigger other modules but the producer should not know those modules, emit a domain event.
- If the event is only for debugging, use structured logs instead.
- If the event affects billing, security, MCP, tools, rollout, or admin decisions, also create audit evidence.
- If a consumer can fail or retry, deliver through Queue or Workflow from the outbox.
- If the event crosses product or organization boundaries, consider a separate integration event contract.

## Allowed exceptions

- Low-risk in-process notifications may be direct function calls when loss is acceptable and no durable follow-up is required.
- Analytics-only events may bypass outbox when explicitly best-effort and non-authoritative.

## Example

```ts
await db.transaction().execute(async (trx) => {
  await runsRepo(trx).markCompleted({ runId, organizationId })
  await outboxRepo(trx).insert({
    eventType: 'run.completed',
    aggregateType: 'run',
    aggregateId: runId,
    organizationId,
    payloadVersion: 1,
    payload: { runId, harnessVersionId },
    traceId,
  })
})
```

---
id: PAT-ARCH-RELEASE-001
domain: ARCH
category: RELEASE
version: 1
description: Use this pattern when changing deployment units, versioning, or service boundaries.
precedence_level: 4
depends_on: []
applies_when:
  - "Changing deployment units, versioning, or service boundaries."
---


## Strategy

Keep one coherent release model by default. Avoid internal version choreography unless there is a clear operational reason.

## Rules

### Must

- Prefer single deploy for modular monolith changes.
- Keep API contracts backward compatible.
- Document dependencies between release units if split.

### Must not

- Do not add service-to-service version choreography by default.
- Do not split releases only for code ownership.
- Do not require coordinated deploys without explicit plan.

## Decision rules

- If a boundary creates release coupling, reconsider it.
- If separate deploy reduces risk due to runtime isolation, document it.
- If public contracts change, version or preserve compatibility.

## Allowed exceptions

- Separate Workers may share a release when managed as one product deployment.

## Example

```txt
Default release: api Worker + queue consumer + workflow definitions deploy together.
Split release only if runtime isolation or operational risk requires it.
```

---
id: PAT-ARCH-SHARED-KERNEL-001
domain: ARCH
category: SHARED_KERNEL
version: 1
description: Use this pattern when a domain decision must stay identical across multiple modules, services, apps, or runtimes.
precedence_level: 5
depends_on:
  - PAT-ARCH-CONCEPTS-001
applies_when:
  - "A domain decision must stay identical across multiple modules, services, apps, or runtimes."
---


## Strategy

A shared kernel is a small pure domain-policy package. Use it when multiple
deployables or modules must classify, route, authorize, score, price, validate,
or normalize the same domain concept identically.

## Rules

### Must

- Keep shared-kernel code pure TypeScript.
- Keep the public API small and explicit.
- Document current consumers before creating the package.
- Add package-owned tests for every exported decision.
- Export stable functions, types, constants, or schemas only.

### Must not

- Do not import Hono, Request, Response, env bindings, Kysely, SQL, queues,
  Workflows, providers, adapters, repositories, or app/service internals.
- Do not put orchestration, persistence, HTTP serialization, or provider calls
  in a shared kernel.
- Do not use a shared kernel as a generic helper package.

## Decision rules

- If two deployables must make the same domain decision, promote that decision
  to a shared kernel.
- If the rule has one consumer, keep it local.
- If the rule depends on infrastructure, split pure policy from the adapter.
- If consumers need different behavior, keep separate local policies and name
  the difference explicitly.

## Allowed exceptions

- A temporary duplicate may remain during migration when owner, risk, target
  shared kernel, and removal condition are documented.

## Example

```txt
packages/action-step-policy
packages/payment-risk-policy
packages/work-unit-routing-policy
packages/entitlement-policy
```

---
id: PAT-CODE-SCRIPT-GOVERNANCE-001
domain: CODE
category: SCRIPT_GOVERNANCE
version: 1
description: Use this pattern before adding, renaming, migrating, or deleting package scripts, repo scripts, selftests, smoke tests, release commands, package managers, or task runners.
precedence_level: 1
depends_on: []
applies_when:
  - "Adding, renaming, migrating, or deleting package scripts, repo scripts, selftests, smoke tests, release commands, package managers, or task runners."
---


## Strategy

Scripts are a repository contract, not a scratchpad. Keep root `package.json` as a small set of human and CI entrypoints, keep package `package.json` scripts local to that package, and keep executable script implementation under categorized source folders with a catalog that records owner, safety, environment, and CI usage. Script names describe stable actions and domains, not product brands, project phases, codenames, or temporary agent wording.

## Package Manager And Task Runner Decision

Use pnpm for workspace package management, but migrate to it only in a dedicated commit after script names, categories, and CI entrypoints are normalized. Until that migration commit lands, treat the current npm state as authoritative: `package-lock.json`, `npm ci`, npm workspaces, and `npm run -w`.

A pnpm migration must change the package-manager surface together: add `pnpm-workspace.yaml`, pin `packageManager`, generate `pnpm-lock.yaml`, update CI to `pnpm install --frozen-lockfile`, update workspace commands to pnpm filters or recursive runs, and verify GitHub Packages auth for the Lemn UI package without committing tokens.

Use Turborepo only after script governance is clean. Turbo orchestrates and caches deterministic tasks such as `build`, `check`, `test`, and `codegen`; it must not become the catalog for deploys, migrations, live smokes, canaries, or mutable operations. Do not put `turbo run` inside package-level scripts because package scripts are the tasks Turbo discovers; keep Turbo commands at the workspace root.

## Dependency Version Refresh

Use script governance work as the moment to audit package versions. When touching package-manager configuration, script orchestration, CI install behavior, build tools, Worker tooling, test runners, or generated-code tooling, review the packages involved and move them to current stable versions where the upgrade is compatible with the repository.

Pinned versions are required. Do not leave dependency specs as `latest`, floating dist-tags, unbounded ranges, or implicit package-manager downloads. Use exact versions for tooling that controls installs, builds, deploys, formatting, linting, generated output, migrations, or CI reproducibility, including `pnpm`, `turbo`, `@biomejs/biome`, `typescript`, `vite`, `vitest`, `wrangler`, Cloudflare packages, generated-client tooling, and package-manager workspace dependencies. Runtime library ranges may remain only when the repo has an explicit policy for that package family and the lockfile preserves the resolved version.

Version refreshes must be incremental and evidence-backed: update package manifests and the lockfile together, record the reason for any held-back package, run the relevant checks, and keep high-risk upgrades separate from unrelated script moves. If a package uses a private registry or scoped auth, verify install/auth behavior without committing tokens or registry credentials.

## Categories

Every repo script must belong to one category:

- `local`: local development servers, port checks, and process cleanup.
- `check`: architecture, type, policy, registry, generated-output, and source-shape checks.
- `codegen`: generated clients, DBML, manifests, and other reproducible outputs.
- `test`: local unit, contract, integration, and backend-baseline verification.
- `smoke`: browser, staging, production-safe, canary, and live boundary verification.
- `db`: migrations, schema application, import/export, and data backfills.
- `release`: deploy, staging gates, production gates, runner bundle publish, and runtime rollout commands.
- `ops`: operator automation, audits, reconciliations, one-off repairs, and provider setup.
- `bootstrap`: installation and machine/runtime bootstrap.

## Rules

### Must

- Keep root scripts limited to stable entrypoints that developers or CI run directly.
- Keep package scripts package-local: `build`, `check`, `test`, `dev`, `preview`, `deploy:<target>`, or other commands owned by that package.
- Put script implementation under categorized source paths such as `scripts/src/checks`, `scripts/src/codegen`, `scripts/src/db`, `scripts/src/local`, `scripts/src/release`, `scripts/src/smoke`, `scripts/src/ops`, and `scripts/src/bootstrap`.
- Maintain a script catalog that records each command's id, category, owner, package or project scope, target environment, whether it mutates state, required secrets, dry-run/apply behavior, CI usage, and replacement/removal plan when temporary.
- Make mutable scripts dry-run by default or require an explicit `--apply`, `--execute`, or equivalent irreversible flag.
- Make live scripts declare their target in the command name or catalog entry, such as `:staging`, `:production`, `:production:safe`, or `:local`.
- Invoke scripts from CI through cataloged package scripts or a script runner, not direct `node scripts/...` file paths.
- Move test-only scripts into the owning package or app `tests/` tree according to `PAT-TEST-PLACEMENT-001`; leave only thin CLI wrappers in `scripts/` when cross-package orchestration is required.
- Follow `PAT-CODE-TYPESCRIPT-SOURCE-001`: maintained Node scripts are TypeScript source and `.mjs` is generated output or a documented exception.
- Validate script references so docs, CI, specs, and package scripts do not point at deleted or renamed files.
- When touching package-manager, script, CI, build, test, deploy, or generated-code tooling, audit the relevant package versions and pin compatible stable versions with a matching lockfile update.

### Must not

- Do not prefix scripts, folders, files, generated artifacts, or categories with product names, product abbreviations, feature codenames, sprint names, phase numbers, or agent-created branding such as `bf:*`.
- Do not keep broad root aliases that hide deploys, migrations, live smokes, or production mutations behind a vague name.
- Do not add package-manager-specific commands before the repo has a pinned package manager and lockfile for that manager.
- Do not use `latest`, floating dist-tags, unbounded ranges, or package-manager auto-download behavior for package managers, task runners, build tools, deploy tools, test runners, or generated-code tooling.
- Do not introduce Turbo before scripts are categorized and named neutrally.
- Do not cache live, mutable, credentialed, or environment-dependent operations through Turbo.
- Do not leave orphaned operational scripts without an owner and removal or catalog plan.
- Do not use a product rename or API modularization as a reason to preserve stale script names.

## Decision rules

- If the command is deterministic and package-owned, keep it as a package script and let the root orchestrator call it.
- If the command crosses packages, CI stages, environments, providers, databases, or release boundaries, catalog it at the root.
- If the command verifies behavior locally, prefer `test` and the owning package `tests/` tree.
- If the command verifies deployed behavior or an external boundary, classify it as `smoke` and declare target and credentials.
- If the command changes cloud resources, database state, webhooks, runner runtime, or provider state, classify it as `db`, `release`, or `ops` and require explicit mutation intent.
- If a command name contains a product brand, codename, or temporary migration term, rename it to action/domain/target wording before marking the script set clean.
- If pnpm is introduced, update package manager, lockfile, workspace file, CI install, workspace command syntax, and private-registry auth verification in the same commit.
- If Turbo is introduced, configure only deterministic root tasks first and prove cache boundaries with explicit outputs or `cache: false`.
- If Biome is introduced, follow `PAT-CODE-BIOME-001` and keep the formatter/linter rollout separate from structural or behavioral refactors unless the active migration spec explicitly makes it the final cleanup phase.
- If a dependency cannot move to the current stable version, document the blocker, affected package, owner, and next verification step instead of leaving an implicit stale version.

## Allowed exceptions

- Vendor names such as `zendesk`, `neon`, `cloudflare`, `clickhouse`, or `lemn` may appear when the script is vendor-specific and the catalog declares the integration owner.
- Historical production cloud resource names may remain until a versioned migration exists, but package scripts and repo script names still use neutral action/domain names.
- One-off incident scripts may live under `scripts/src/ops` temporarily if the catalog records owner, incident context, and removal target.
- Shell bootstrap scripts may remain shell when they must run before Node dependencies are installed.
- Runtime library ranges may remain when a package-family policy permits ranges and the lockfile pins the resolved version; tooling versions still need exact pins.

## Example

```txt
Good:
check:api-modules
check:design-system
codegen:api-client
migrate:db:production
smoke:staging
smoke:production:safe
deploy:dashboard:staging

Avoid:
bf:check
product_smoke_staging.mjs
phase8-dashboard-hardening
codex-daytona-smoke
node scripts/selftest_supervisor_api_artifact_queue.mjs in CI
```

---
id: PAT-CODE-TYPESCRIPT-SOURCE-001
domain: CODE
category: SOURCE_LANGUAGE
version: 1
description: Use this pattern when creating, migrating, or maintaining source files, scripts, runner code, tests, and operational tools.
precedence_level: 1
depends_on:
  - PAT-CODE-SCRIPT-GOVERNANCE-001
applies_when:
  - "Creating, migrating, or maintaining source files, scripts, runner code, tests, and operational tools."
---


## Strategy

Keep TypeScript as the canonical maintained source language wherever the runtime allows it. JavaScript, MJS, and Python files are allowed only as generated output, bootstrap/runtime artifacts, or explicitly justified exceptions with a migration path.

## Rules

### Must

- Prefer `.ts` for maintained product code, API code, frontend code, runner logic, scripts, selftests, and tools.
- Compile or generate `.js`/`.mjs` artifacts from TypeScript when direct Node execution is required.
- Keep generated JavaScript under explicit build output paths such as `dist`.
- Treat handwritten `.mjs`, `.js`, and `.py` files as exceptions that need a clear runtime reason.
- Document any retained non-TypeScript source with owner, reason, and migration target.
- In `packages/api`, retained non-TypeScript source must be manifest-approved or covered by the modular-slice exception process in `PAT-API-MODULAR-SLICES-001`.

### Must not

- Do not add new handwritten `.js`, `.mjs`, `.cjs`, or `.py` source when `.ts` can reasonably run or compile.
- Do not manually edit generated `.js` output.
- Do not keep parallel TypeScript and JavaScript implementations of the same behavior.
- Do not use Python for runner or tooling behavior unless a required library/runtime makes TypeScript impractical.

## Decision rules

- If the file is maintained by humans and runs in Node, write TypeScript.
- If a runtime requires `.mjs`, build it from TypeScript or keep it as a documented bootstrap exception.
- If the file is generated, keep it outside source-owned paths and verify regeneration.
- If Python remains, record why TypeScript is not viable and what would unblock migration.
- If non-TypeScript source remains in a modular API package, record the owner, reason, migration target, and expiry through the package architecture manifest.

## Allowed exceptions

- Build outputs such as compiled package `dist` files.
- Minimal config files required by framework tooling when TypeScript config is unsupported.
- Small bootstrap entrypoints that must execute before TypeScript tooling is available.
- Python scripts that depend on Python-only libraries, with explicit owner and migration plan.

## Example

```txt
Good:
runner/src/runTask.ts -> runner/dist/run_task.mjs
scripts/runBackendBaselineTests.ts -> scripts/dist/run_backend_baseline_tests.mjs

Allowed generated output:
packages/contracts/dist/*.js

Avoid:
runner/run_task.mjs as long-term maintained source
scripts/audit_zendesk_solved_refunds.py without exception record
```

---
id: PAT-CODE-FILE-SCOPE-001
domain: CODE
category: FILE_SCOPE
version: 1
description: Use this pattern before editing files that are already large or responsibility-heavy.
precedence_level: 2
depends_on:
  - PAT-CODE-TYPESCRIPT-SOURCE-001
applies_when:
  - "Editing files that are already large or responsibility-heavy."
---


## Strategy

Keep files scoped by responsibility. Split behavior by module, function, or layer before making productive files grow into giant touched files.

## Rules

### Must

- Edit the smallest responsible file.
- Extract cohesive behavior when a file owns too much.
- Keep production files readable and navigable.

### Must not

- Do not add unrelated behavior to giant files.
- Do not centralize new logic in catch-all helpers.
- Do not make review harder by touching broad files unnecessarily.

## Decision rules

- If file has multiple responsibilities, split by responsibility.
- If change touches many unrelated sections, reconsider design.
- If file is generated, avoid manual edits.

## Allowed exceptions

- Small targeted edits to large legacy files are allowed when extraction would exceed task scope.

## Example

```txt
Bad: add billing, projects, and AI logic into app.ts
Good: modules/billing/*, modules/projects/*, modules/ai/*
```

---
id: PAT-CODE-READABILITY-001
domain: CODE
category: READABILITY
version: 1
description: Use this pattern when code complexity, line length, metrics, or style pressure appear.
precedence_level: 2
depends_on:
  - PAT-CODE-FILE-SCOPE-001
applies_when:
  - "Code complexity, line length, metrics, or style pressure appear."
---


## Strategy

Keep complexity visible and legible. Do not hide logic in strings, minified constructs, or cosmetic restructuring to game metrics.

## Rules

### Must

- Write readable, reviewable code.
- Prefer clear names and straightforward control flow.
- Refactor complexity honestly when needed.

### Must not

- Do not minify source code.
- Do not hide logic in serialized strings or dynamic eval-like structures.
- Do not split code cosmetically only to satisfy metrics.

## Decision rules

- If a reviewer cannot follow the logic, simplify it.
- If metrics fail, reduce real complexity.
- If generated code is unreadable, regenerate with clearer structure.

## Allowed exceptions

- Build artifacts and generated minified outputs belong outside source review paths.

## Example

```ts
// Good
const canArchive = project.status === 'active' && user.role === 'admin'

// Bad
const canArchive = JSON.parse('{"s":"active"}').s === p.s && r > 1
```

---
id: PAT-CODE-TYPES-001
domain: CODE
category: TYPES
version: 1
description: Use this pattern when resolving TypeScript type errors or designing typed APIs.
precedence_level: 3
depends_on:
  - PAT-CODE-TYPESCRIPT-SOURCE-001
applies_when:
  - "Resolving TypeScript type errors or designing typed APIs."
---


## Strategy

Use strict real types. Fix the model with schemas, specific types, bounded generics, or correct inference instead of widening holes.

## Rules

### Must

- Use Zod and inferred types at boundaries.
- Use specific domain and DTO types.
- Constrain generics and narrow unknown values explicitly.

### Must not

- Do not use any, broad casts, non-null assertions, or as unknown as to silence errors.
- Do not weaken tsconfig or generated types.
- Do not hide invalid runtime assumptions behind type assertions.

## Decision rules

- If input is unknown, validate it.
- If type is wrong, fix the source schema/type.
- If cast is unavoidable, localize and explain it.

## Allowed exceptions

- Narrow adapter boundary casts may be allowed when wrapping poorly typed external libraries.

## Example

```ts
const input = CreateProjectInput.parse(rawBody)
await projectsService.create(input)

// Avoid: await projectsService.create(rawBody as any)
```

---
id: PAT-CODE-SUPPRESSIONS-001
domain: CODE
category: SUPPRESSIONS
version: 1
description: Use this pattern when tempted to add ignore, disable, skip, or suppression comments.
precedence_level: 3
depends_on:
  - PAT-CODE-TYPES-001
applies_when:
  - "Tempted to add ignore, disable, skip, or suppression comments."
---


## Strategy

Fix the cause instead of silencing TypeScript, lint, tests, or security tools.

## Rules

### Must

- Resolve the underlying type, lint, or test issue.
- Keep tool rules active.
- Use suppression only with narrow scope and justification.

### Must not

- Do not add @ts-ignore, eslint-disable, test.skip, or equivalent to pass checks casually.
- Do not disable failing tests instead of fixing behavior.
- Do not suppress security warnings without review.

## Decision rules

- If a tool is wrong, document why and scope suppression to one line.
- If a test is flaky, fix or quarantine with owner and ticket.
- If suppression hides risk, ask for approval.

## Allowed exceptions

- Generated code may contain tool-specific suppressions if produced by the generator and not manually edited.

## Example

```ts
// Bad
// @ts-ignore
await service.create(raw)

// Good
const input = CreateInput.parse(raw)
await service.create(input)
```

---
id: PAT-CODE-TODOS-001
domain: CODE
category: TODOS
version: 1
description: Use this pattern when leaving incomplete work, placeholders, TODOs, or FIXME comments.
precedence_level: 3
depends_on: []
applies_when:
  - "Leaving incomplete work, placeholders, TODOs, or FIXME comments."
---


## Strategy

Pending work needs ownership. Do not leave unresolved placeholders in production paths without a ticket, reason, or human approval.

## Rules

### Must

- Complete the implementation before shipping.
- Attach TODO/FIXME to a ticket or explicit owner.
- Make placeholders fail closed when unavoidable.

### Must not

- Do not leave TODO, FIXME, stub, placeholder, or fake implementation in production code without ownership.
- Do not ship temporary branches that silently do nothing.
- Do not use TODO as a substitute for a decision.

## Decision rules

- If work is required for correctness, finish it now.
- If work is intentionally deferred, reference the tracking item.
- If placeholder affects users, block merge or ask.

## Allowed exceptions

- Non-runtime documentation TODOs may be allowed when clearly tracked.

## Example

```ts
// Allowed only with ownership
// TODO(APP-1234): add provider fallback after billing rollout.
```

---
id: PAT-CODE-PRODUCTION-DATA-001
domain: CODE
category: PRODUCTION_DATA
version: 1
description: Use this pattern when adding mocks, fixtures, hardcoded IDs, URLs, tenants, or credentials.
precedence_level: 3
depends_on:
  - PAT-SEC-SECRETS-001
applies_when:
  - "Adding mocks, fixtures, hardcoded IDs, URLs, tenants, or credentials."
---


## Strategy

Production paths must be free of fake data, hardcoded environment values, mock tenants, and test credentials.

## Rules

### Must

- Keep mocks and fixtures in test/dev-only paths.
- Use environment config for URLs and IDs.
- Validate that production code gets real dependencies.

### Must not

- Do not hardcode customer IDs, tenant IDs, API keys, or provider URLs in production code.
- Do not leave mocks wired to production routes.
- Do not seed fake data from runtime paths.

## Decision rules

- If data is for tests, place it under tests/fixtures.
- If value differs by environment, use config.
- If example data appears in docs, ensure it cannot execute in production.

## Allowed exceptions

- Safe constants like enum values or public product IDs may be hardcoded when intentionally part of contract.

## Example

```ts
const apiBaseUrl = env.PROVIDER_API_BASE_URL

// Bad: const apiBaseUrl = 'https://staging-provider.example.com'
```

---
id: PAT-CODE-DEAD-PLACEHOLDER-001
domain: CODE
category: COMPLETENESS
version: 1
description: Use this pattern when code is scaffolded, disconnected, unreachable, or partially implemented.
precedence_level: 3
depends_on: []
applies_when:
  - "Code is scaffolded, disconnected, unreachable, or partially implemented."
---


## Strategy

Code must be connected or removed. Do not leave dead branches, unfinished paths, or placeholder implementations in production.

## Rules

### Must

- Wire new code to its entrypoint or remove it.
- Delete obsolete code when replacing behavior.
- Make incomplete paths explicit and non-production.

### Must not

- Do not leave dead code, unused branches, fake implementations, or unreachable scaffolds.
- Do not return placeholder success for unimplemented behavior.
- Do not keep duplicate old logic after migration without plan.

## Decision rules

- If code is not called, justify or remove it.
- If feature is behind flag, ensure flag path is real and tested.
- If migration leaves old code, document removal plan.

## Allowed exceptions

- Temporary scaffolding is allowed in non-production branches when clearly marked and not shipped.

## Example

```ts
// Bad
export async function chargeCustomer() { return { ok: true } }

// Good
export async function chargeCustomer(input: ChargeInput) {
  return billingPort.charge(input)
}
```

---
id: PAT-CODE-FRAMEWORK-API-VALIDITY-001
domain: CODE
category: STACK_API_VALIDITY
version: 1
description: Use this pattern when using framework APIs, hooks, generated sources, configs, or internal packages.
precedence_level: 3
depends_on: []
applies_when:
  - "Using framework APIs, hooks, generated sources, configs, or internal packages."
---


## Strategy

Implement against real APIs from the current repo, docs, generated sources, and lockfile. Do not hallucinate stack behavior.

## Rules

### Must

- Inspect existing examples before calling APIs.
- Follow installed package versions and generated code.
- Verify runtime compatibility for Cloudflare Workers.

### Must not

- Do not invent imports, hooks, config names, or internal package APIs.
- Do not assume Node APIs exist in Workers.
- Do not edit generated sources manually unless instructed.

## Decision rules

- If API is unknown, search the repo or ask.
- If docs and code differ, prefer current repo implementation.
- If generated source must change, change the generator/source contract.

## Allowed exceptions

- Small standard Web APIs may be used when supported by Workers runtime.

## Example

```ts
// Before writing this, inspect existing repo examples and installed package docs.
import { createRoute } from '@hono/zod-openapi'
```

---
id: PAT-CODE-DEPENDENCIES-001
domain: CODE
category: DEPENDENCIES
version: 1
description: Use this pattern when adding, removing, or upgrading dependencies.
precedence_level: 4
depends_on:
  - PAT-CODE-FRAMEWORK-API-VALIDITY-001
applies_when:
  - "Adding, removing, or upgrading dependencies."
---


## Strategy

Dependencies must solve a real need. Prefer platform APIs, existing packages, and local patterns before adding new runtime surface.

## Rules

### Must

- Justify new dependencies.
- Update package manifest and lockfile coherently.
- Check bundle, security, license, and Worker compatibility.

### Must not

- Do not add dependencies for trivial utilities.
- Do not edit lockfile blindly.
- Do not add Node-only runtime packages to Workers without verification.

## Decision rules

- If existing package or Web API works, use it.
- If dependency is heavy, consider adapter or Worker split.
- If package is internal, inspect repo docs before importing.

## Allowed exceptions

- Dev-only tooling may be added with lower runtime scrutiny but still needs lockfile consistency.

## Example

```txt
Good PR note: Added nanoid because Web Crypto UUID does not satisfy sortable ID requirement; bundle impact checked.
Bad PR note: Added lodash for one isEmpty call.
```

---
id: PAT-CODE-BIOME-001
domain: CODE
category: FORMATTER_LINTER
version: 1
description: Use this pattern when introducing, configuring, running, or enforcing Biome formatting, import organization, or lint checks.
precedence_level: 4
depends_on:
  - PAT-CODE-SCRIPT-GOVERNANCE-001
applies_when:
  - "Introducing, configuring, running, or enforcing Biome formatting, import organization, or lint checks."
---


## Strategy

Biome is a deterministic cleanup and enforcement gate, not a substitute for architecture, type, test, security, or behavioral verification. Introduce it as pinned root tooling with a reviewed config, run it in report mode before write mode, and keep broad formatting churn separate from productive refactors.

For staged zero-legacy or structural migrations, Biome belongs at the final cleanup phase after DB/API/frontend structure and verification pass. Do not use Biome early to churn files before the target tree is known.

## Rules

### Must

- Add `@biomejs/biome` as an exact pinned root dev dependency.
- Create a root `biome.jsonc` only when the rollout phase is approved for formatter/linter enforcement.
- Add scripts through `PAT-CODE-SCRIPT-GOVERNANCE-001`, typically `format`, `format:check`, and `check:biome`.
- Run report mode first, such as `npx biome ci` or `npm run check:biome`, before running write mode.
- Review the report before applying `npx biome check --write` or equivalent write commands.
- Keep broad formatting/import-organization diffs separate from behavior changes when the diff is large.
- Exclude generated, vendored, build-output, and tool-owned files through config, not scattered inline suppressions.
- Wire `check:biome` into the root `check` command only after the initial config validates and the repo is formatted or explicitly scoped.
- Record the installed Biome version, command output, and any residual rule/config exceptions in the owning evidence or release notes when Biome is part of a migration gate.

### Must not

- Do not introduce `biome.jsonc`, Biome scripts, or broad Biome writes in the middle of a structural refactor when the active migration plan says Biome is final-phase only.
- Do not install Biome through `latest`, floating ranges, transient `npx` downloads, or unpinned package-manager behavior.
- Do not use Biome to hide TypeScript, test, architecture, security, or runtime failures.
- Do not add broad `biome-ignore` comments or blanket suppressions to make checks pass.
- Do not format generated output, vendored files, lockfiles, build artifacts, or external snapshots unless the generator/tool contract explicitly allows it.
- Do not mix large formatting churn with API contract, migration, persistence, or UI behavior changes unless the reviewer can still isolate the behavior change.

## Decision rules

- If the repo is mid-migration and the target tree is not stable, defer Biome to the documented final cleanup phase.
- If Biome reports only formatting/import organization issues, fix them in a formatting-only change.
- If Biome reports a real lint issue, fix the source behavior or type model rather than suppressing it.
- If a Biome rule conflicts with generated output or a required tool format, use the narrowest config override and document why.
- If Biome cannot express a repo architecture rule, keep or add a deterministic custom checker instead of relying on formatting.
- If package-registry auth or install prerequisites are missing, report the auth gap instead of replacing Biome with ad hoc formatting tools.

## Allowed exceptions

- Greenfield packages may introduce Biome at the start when no broad migration or legacy formatting churn exists.
- Small targeted files may be formatted by editor tooling when the repo already has an approved Biome config.
- Tool-required generated outputs may remain unformatted or config-excluded when regeneration is the source of truth.
- Emergency production fixes may skip Biome temporarily if the release record names the skipped check and follow-up owner.

## Example

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.5.2/schema.json",
  "files": {
    "ignoreUnknown": true,
    "includes": ["**", "!dist/**", "!node_modules/**", "!coverage/**"]
  },
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true
  },
  "organizeImports": {
    "enabled": true
  }
}
```

```sh
npm install --save-dev --save-exact @biomejs/biome@2.5.2
npx biome ci
npx biome check --write
npm run check:biome
```

---
id: PAT-DATA-POSTGRES-001
domain: DATA
category: POSTGRES
version: 1
description: Use this pattern when deciding where transactional relational product data must live.
precedence_level: 1
depends_on: []
applies_when:
  - "Deciding where transactional relational product data must live."
---


## Strategy

Use Neon Postgres as the source of truth for operational state. KV, R2, Artifacts, and ClickHouse are supporting systems, not replacements for relational product data.

## Rules

### Must

- Store transactional relational product data in Neon Postgres.
- Use constraints, indexes, tenant scoping, and migrations for persistent entities.
- Keep Postgres authoritative for money, permissions, ownership, quotas, jobs, and billing state.
- For production runtime persistence, keep the path `Repository -> Kysely -> pg/Hyperdrive -> Neon/Postgres` unless a documented pattern exception says otherwise.
- Name durable schemas, tables, API modules, URLs, and frontend modules according to `PAT-DOMAIN-SCHEMA-API-NAMING-001`.

### Must not

- Do not use KV, R2, Artifacts, ClickHouse, or D1 as the primary store when Neon fits.
- Do not model persistent product state only in TypeScript code.
- Do not bypass Postgres for consistency-critical decisions.
- Do not use D1, SQLite, Drizzle runtime schemas, or compatibility facades as the target runtime model for migrated product domains.

## Decision rules

- If data is transactional and relational, use Neon Postgres.
- If data is cacheable and disposable, use KV.
- If data is a blob, use R2.
- If data is analytics-only, use ClickHouse.

## Allowed exceptions

- Derived cache or analytics copies are allowed if Postgres remains authoritative.
- D1/SQLite requires an explicit exception when Neon cannot fit the runtime need and must not be used as a hidden compatibility layer for product runtime persistence.

## Example

```sql
create table projects (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  name text not null,
  status text not null check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create index projects_org_status_idx on projects (organization_id, status);
```

---
id: PAT-DATA-MIGRATIONS-001
domain: DATA
category: MIGRATIONS
version: 2
description: Use this pattern when a feature changes persistent schema, data shape, migrations, generated DB types, or deploy compatibility.
precedence_level: 1
depends_on:
  - PAT-DATA-POSTGRES-001
applies_when:
  - "A feature changes persistent schema, data shape, migrations, generated DB types, or deploy compatibility."
---


## Strategy

Treat migrations as the reviewed path for changing database shape. Schema changes must move through migration, generated types, repositories, deploy compatibility, backfill plan, and tests together.

## Rules

### Must

- Add an explicit migration for schema changes.
- Review migrations in PR before production deploy.
- Regenerate or align Kysely types after migrations.
- Use Neon branching for PR previews that touch schema or DB behavior.
- Preserve compatibility across rolling deploys with expand/backfill/contract when needed.
- Include lock, timeout, backfill, rollback, and smoke evidence for risky changes.

### Must not

- Do not change TypeScript types without changing the real schema.
- Do not apply destructive schema changes without a data plan.
- Do not edit generated DB types manually.
- Do not drop or rename fields before checking runtime, queue, workflow, API, and reporting consumers.
- Do not rely on runtime code to mutate schema.

## Decision rules

- If a new column/table/index is required, create a migration first.
- If old and new app versions may both run, make schema compatible with both.
- If data must be backfilled, include batching, retry, and verification.
- If the change is destructive, require explicit owner approval and rollback posture.

## Allowed exceptions

- Experimental local migrations are allowed only outside production paths.
- Small additive changes may be direct when migration, generated types, repo code, and tests move together.

## Example

```sql
alter table projects add column archived_at timestamptz;
create index projects_archived_at_idx on projects (organization_id, archived_at);
```

For renames or required fields, ship additive column first, backfill, deploy compatible code, then contract in a later migration.

---
id: PAT-DATA-DDL-RUNTIME-001
domain: DATA
category: DDL_RUNTIME
version: 1
description: Use this pattern when schema creation or mutation appears in runtime code.
precedence_level: 1
depends_on:
  - PAT-DATA-MIGRATIONS-001
applies_when:
  - "Schema creation or mutation appears in runtime code."
---


## Strategy

DDL belongs in migrations and tooling, never in production request paths, queue consumers, webhooks, workflows, or app bootstrap.

## Rules

### Must

- Create, alter, drop, and migrate schema only through migrations or explicit tooling.
- Keep runtime code focused on application behavior.
- Make schema state an input assumption of deployed code.

### Must not

- Do not run DDL from fetch handlers, webhooks, queues, workflows, or production bootstrap.
- Do not auto-create tables on first request.
- Do not hide migrations inside repositories or adapters.

## Decision rules

- If schema must change, write a migration.
- If local dev needs bootstrap, keep it outside production runtime.
- If runtime detects missing schema, fail safely and report deployment issue.

## Allowed exceptions

- Local development setup scripts may create schema when clearly outside production paths.

## Example

```ts
// Bad: DDL inside request path
app.post('/setup', async () => {
  await db.schema.createTable('projects').addColumn('id', 'uuid').execute()
})

// Good: runtime assumes schema already exists
app.post('/projects', async (c) => projectsService.create(c.req.valid('json')))
```

---
id: PAT-DATA-HYPERDRIVE-001
domain: DATA
category: HYPERDRIVE
version: 1
description: Use this pattern when connecting Cloudflare Workers to Neon Postgres.
precedence_level: 2
depends_on:
  - PAT-DATA-POSTGRES-001
applies_when:
  - "Connecting Cloudflare Workers to Neon Postgres."
---


## Strategy

Connect Workers to Neon through Hyperdrive and a native Postgres driver. Hyperdrive is the accepted boundary between edge runtime and Postgres.

## Rules

### Must

- Use Hyperdrive for production Worker to Postgres connectivity.
- Use the project-approved pg or Postgres driver configuration.
- Keep database bootstrap code in a dedicated db module.
- Keep Worker runtime database access on the `Repository -> Kysely -> pg/Hyperdrive -> Neon/Postgres` path.

### Must not

- Do not open ad hoc Postgres connections from feature code.
- Do not invent binding names or connection strings.
- Do not move connection setup into routes or services.
- Do not bypass Hyperdrive in deployed Worker runtime with direct Neon URLs such as `NEON_DATABASE_URL`.

## Decision rules

- If code runs in a Worker and talks to Neon, route it through Hyperdrive.
- If Hyperdrive binding is missing, inspect project config before changing code.
- If connection behavior changes, update config and smoke evidence.

## Allowed exceptions

- Local scripts, migrations, and non-runtime verification tooling may use direct DB URLs when explicitly configured outside deployed Worker runtime.

## Example

```ts
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { DB } from './types'

export function createDb(env: Env): Kysely<DB> {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: env.HYPERDRIVE.connectionString }),
    }),
  })
}
```

---
id: PAT-DATA-KYSELY-001
domain: DATA
category: KYSELY
version: 2
description: Use this pattern when implementing Postgres repositories with Kysely in runtime application code.
precedence_level: 2
depends_on:
  - PAT-DATA-POSTGRES-001
  - PAT-DATA-MIGRATIONS-001
  - PAT-DATA-DDL-RUNTIME-001
applies_when:
  - "Implementing Postgres repositories with Kysely in runtime application code."
---


## Strategy

Kysely is the runtime query layer for Neon Postgres. Routes validate HTTP and call services. Services own use cases and call repositories. Repositories are the only feature layer that builds Kysely queries or SQL.

## Rules

### Must

- Use Kysely for Postgres access in application runtime.
- Keep SQL and Kysely calls inside repositories only.
- In modular API packages, keep SQL, `getDb`, `.prepare`, and Kysely query construction in slice-local `repository.ts` files or package-level repositories that are declared as legacy/partial migration exceptions.
- For migrated product domains, remove D1-shaped access such as `getDb(env).prepare(...)` from the target runtime path.
- Generate or align database types from the real Postgres schema.
- Use Hyperdrive between Workers and Neon Postgres.
- Map rows before returning public API, MCP, or UI data.
- Accept a db or transaction handle when the service owns a transaction.
- Follow `PAT-DOMAIN-SCHEMA-API-NAMING-001` for schema/table constants and repository ownership.

### Must not

- Do not import Kysely inside routes, controllers, or services.
- Do not import Kysely inside API `http.ts`, `command.ts`, `query.ts`, `mapper.ts`, `policy.ts`, or shared helpers.
- Do not write SQL directly in the Worker or route layer.
- Do not return raw database rows directly to public API consumers without mapping.
- Do not treat repository code as the place for business decisions unrelated to persistence.
- Do not fake SQL correctness with only mocked repository tests.

## Decision rules

- If code builds queries, joins tables, or executes SQL, put it in a repository.
- If a Postgres feature needs raw SQL, keep it inside the repository and type/map the result.
- If query behavior matters, test against real Postgres or a Neon preview branch.
- If multiple repositories must write atomically, use `PAT-DATA-TRANSACTIONS-001`.
- If an API package is under modular-slice migration, declare any retained package-level repository through `PAT-API-MODULAR-SLICES-001` migration status or exception metadata.

## Allowed exceptions

- One-off scripts under a dedicated scripts or maintenance path may access Kysely directly if they are not part of the runtime request path.
- Low-level shared database bootstrap code under a dedicated db module may create and export the Kysely client.
- Migrations and baseline tooling may use provider-specific SQL outside runtime paths.

## Example

```txt
Worker/Route -> Service -> Repository -> Kysely -> pg -> Hyperdrive -> Neon
```

```ts
export async function getById(id: string) {
  const user = await userRepository.findById(id)
  if (!user) throw new Error('USER_NOT_FOUND')
  return toUserDto(user)
}

export async function findById(id: string) {
  return db
    .selectFrom('users')
    .select(['id', 'email', 'display_name'])
    .where('id', '=', id)
    .executeTakeFirst()
}
```

---
id: PAT-DATA-PAGINATION-001
domain: DATA
category: PAGINATION
version: 1
description: Use this pattern when returning lists, feeds, search results, events, or analytics rows.
precedence_level: 3
depends_on:
  - PAT-DATA-KYSELY-001
applies_when:
  - "Returning lists, feeds, search results, events, or analytics rows."
---


## Strategy

Use bounded pagination with stable ordering. Prefer cursor pagination for large, growing, or user-facing lists.

## Rules

### Must

- Apply explicit limits to list queries.
- Use stable ordering for every paginated query.
- Scope paginated queries by tenant, permissions, and filters.
- Return enough cursor data to fetch the next page safely.

### Must not

- Do not expose unbounded `findAll()` or `selectAll()` list endpoints.
- Do not use large offset pagination for growing tables by default.
- Do not paginate without deterministic ordering.
- Do not return all rows from admin/export endpoints synchronously.

## Decision rules

- If a list can grow, use cursor pagination.
- If the caller needs all rows, use an async export instead of an unbounded response.
- If filters change, reset the cursor.
- If the table is tenant-scoped, include tenant scope in the query.

## Allowed exceptions

- Small static lookup tables may return all rows when bounded by design.

## Example

```ts
return db
  .selectFrom('projects')
  .select(['id', 'name', 'created_at'])
  .where('organization_id', '=', organizationId)
  .where('created_at', '<', cursor.createdAt)
  .orderBy('created_at', 'desc')
  .limit(51)
  .execute()
```

---
id: PAT-DATA-TRANSACTIONS-001
domain: DATA
category: TRANSACTIONS
version: 2
description: Use this pattern when a service must coordinate multiple repository writes, outbox records, or atomic business state changes.
precedence_level: 3
depends_on:
  - PAT-DATA-KYSELY-001
applies_when:
  - "A service must coordinate multiple repository writes, outbox records, or atomic business state changes."
---


## Strategy

Services own transaction boundaries. Repositories accept a db or transaction handle and stay focused on persistence. Use a unit-of-work shape when one use case must coordinate several repositories.

## Rules

### Must

- Use a transaction for multi-table critical writes.
- Insert outbox events inside the same transaction when side effects follow.
- Rely on DB constraints as the final consistency defense.
- Keep Worker/Hyperdrive transactions short.
- Define retry policy for serialization failures and deadlocks.
- Use idempotency keys for retried paid or externally-triggered mutations.

### Must not

- Do not perform related critical writes without atomicity.
- Do not send external webhooks or emails inside the DB transaction.
- Do not ignore Postgres constraint failures.
- Do not open transactions in routes or controllers.
- Do not hold transactions while waiting on external providers.

## Decision rules

- If partial success would corrupt business state, use a transaction.
- If a side effect must follow a commit, use outbox and queue.
- If the write can be retried, design idempotency.
- If multiple repositories participate, pass the same transaction handle through the use case.

## Allowed exceptions

- Single-row non-critical writes may avoid explicit transaction when constraints are sufficient.
- Read-only service methods may call repositories without a unit of work.

## Example

```ts
await db.transaction().execute(async (trx) => {
  const invoice = await invoicesRepo(trx).create(input)
  await outboxRepo(trx).insert({ type: 'invoice.created', aggregateId: invoice.id })
  return invoice
})
```

---
id: PAT-DATA-DBML-001
domain: DATA
category: DBML
version: 1
description: Use this pattern when documenting or reviewing relational schema structure outside executable migrations.
precedence_level: 4
depends_on:
  - PAT-DATA-MIGRATIONS-001
applies_when:
  - "Documenting or reviewing relational schema structure outside executable migrations."
---


## Strategy

Use DBML as a human-readable schema review surface. DBML helps humans and agents understand tables, relationships, and invariants, but migrations and the real database schema remain authoritative.

## Rules

### Must

- Keep DBML close to the database target or service it documents.
- Update DBML when relational schema shape changes.
- Treat migrations and the migrated database as the executable source of truth.

### Must not

- Do not treat DBML as authoritative when it conflicts with migrations.
- Do not rely on DBML changes to modify runtime schema.
- Do not let DBML drift from tables, relationships, constraints, or ownership rules.

## Decision rules

- If schema changes, update the migration first and DBML alongside it.
- If DBML and migrated schema disagree, fix the drift explicitly.
- If a schema is shared or review-heavy, document it with DBML.

## Allowed exceptions

- Very small prototypes may defer DBML until the model becomes shared, persistent, or review-heavy.

## Example

```dbml
Table projects {
  id uuid [pk]
  organization_id uuid [not null]
  name text [not null]
  status text [not null]
  created_at timestamptz [not null]
}
```

---
id: PAT-DATA-DATABASE-LIFECYCLE-001
domain: DATA
category: DATABASE_LIFECYCLE
version: 1
description: Use this pattern when managing relational database targets, migrations, seeds, schema docs, CI checks, or baselines.
precedence_level: 4
depends_on:
  - PAT-DATA-MIGRATIONS-001
  - PAT-DATA-DBML-001
applies_when:
  - "Managing relational database targets, migrations, seeds, schema docs, CI checks, or baselines."
---


## Strategy

Use one manifest to declare relational database targets. Drive migrations, seeds, DBML, generated types, lifecycle checks, and baseline generation from that manifest while each engine keeps its native migration path.

## Rules

### Must

- Declare each target with id, engine, owning service, binding, migration directory, DBML file, connection source, and seed profiles.
- Treat SQL migrations as executable truth.
- Keep DBML close to the owning service as review documentation.
- Separate reference, dev, and test seeds.
- Run lifecycle checks on changed targets.
- Keep baseline generation separate from normal deploy work.

### Must not

- Do not treat DBML as authoritative when it disagrees with migrated schema.
- Do not run dev or test seeds in production.
- Do not generate baselines after every migration or inside CD.
- Do not adopt a baseline for a live database without backup, drift check, owner approval, and smoke test.
- Do not force one ORM or migrator across engines that behave differently.

## Decision rules

- If a target has more than three tables or cross-service consumers, keep DBML.
- If schema shape changes, update migration and DBML together.
- If migration replay is noisy or slow, consider a baseline-only PR.
- If a data change is high-volume or long-running, use a backfill outside the migration path.

## Allowed exceptions

- Very small relational targets may defer DBML until invariants or consumers justify it.
- Provider-specific commands may live behind manifest-driven adapter scripts.

## Example

```json
{
  "id": "orders-primary",
  "engine": "postgres",
  "serviceDir": "services/orders",
  "binding": "ORDERS_PRIMARY_PG",
  "migrationsDir": "migrations/postgres",
  "dbml": "docs/storage/orders.dbml"
}
```

---
id: PAT-DATA-KV-001
domain: DATA
category: KV
version: 1
description: Use this pattern when considering Cloudflare KV for application data.
precedence_level: 5
depends_on:
  - PAT-DATA-POSTGRES-001
applies_when:
  - "Considering Cloudflare KV for application data."
---


## Strategy

Use KV only as a disposable cache or read-heavy derived store. Postgres remains authoritative for critical product state.

## Rules

### Must

- Use versioned keys and TTLs.
- Cache only recomputable or safely stale data.
- Invalidate or refresh cache on critical mutations.

### Must not

- Do not store permissions, billing, quotas, ownership, auth state, or transactional records as KV authority.
- Do not use KV when strong immediate consistency is required.
- Do not store sensitive payloads without explicit policy.

## Decision rules

- If losing KV data is acceptable, KV may fit.
- If the data decides access, money, ownership, or quota, use Postgres.
- If data needs relational querying, use Postgres.

## Allowed exceptions

- Temporary cache copies are allowed when Postgres remains source of truth.

## Example

```ts
const key = `v1:org:${organizationId}:public-profile`
const cached = await env.KV.get<PublicOrgProfile>(key, 'json')
if (cached) return cached

const profile = await orgRepo.getPublicProfile(organizationId)
await env.KV.put(key, JSON.stringify(profile), { expirationTtl: 300 })
return profile
```

---
id: PAT-DATA-R2-001
domain: DATA
category: R2
version: 1
description: Use this pattern when storing uploads, exports, binaries, or large files.
precedence_level: 5
depends_on:
  - PAT-DATA-POSTGRES-001
applies_when:
  - "Storing uploads, exports, binaries, or large files."
---


## Strategy

Use R2 for blobs and objects. Store metadata, ownership, permissions, and searchable state in Postgres.

## Rules

### Must

- Store object metadata in Postgres.
- Use scoped object keys by org/user/resource.
- Serve private objects through authorized Worker endpoints or signed access.

### Must not

- Do not use R2 as a queryable database.
- Do not store critical metadata only inside object names.
- Do not expose private buckets directly.

## Decision rules

- If the value is a file/blob, use R2.
- If it must be filtered, joined, authorized, or transacted, store metadata in Postgres.
- If it is a versioned file tree, use Artifacts.

## Allowed exceptions

- Public static assets may use direct serving when approved by product/security policy.

## Example

```ts
const fileId = crypto.randomUUID()
const key = `org/${organizationId}/files/${fileId}/original`

await env.R2.put(key, fileBody, { httpMetadata: { contentType } })
await filesRepo.create({ id: fileId, organizationId, key, contentType, sizeBytes })
```

---
id: PAT-DATA-ARTIFACTS-001
domain: DATA
category: ARTIFACTS
version: 1
description: Use this pattern when an agent or sandbox needs a versioned file tree.
precedence_level: 5
depends_on:
  - PAT-DATA-POSTGRES-001
applies_when:
  - "An agent or sandbox needs a versioned file tree."
---


## Strategy

Use Cloudflare Artifacts for Git-like file trees, snapshots, branches, and agent working directories. Use R2 for simple blobs.

## Rules

### Must

- Store file-tree snapshots and agent workspaces in Artifacts.
- Store run metadata and ownership in Postgres.
- Store large binary outputs in R2 when appropriate.

### Must not

- Do not use Artifacts as a relational database.
- Do not use Artifacts for simple blobs that belong in R2.
- Do not store auth, billing, or permissions only in Artifacts.

## Decision rules

- If the data is a versioned tree, use Artifacts.
- If it is one large object, use R2.
- If it is operational state, use Postgres.

## Allowed exceptions

- Artifacts beta access is accepted and must not be treated as a blocker.

## Example

```ts
await agentRunsRepo.create({
  id: runId,
  organizationId,
  status: 'running',
  artifactTreeRef,
})

// Use the approved Artifacts adapter from the repo; do not invent imports.
await artifactsPort.commitTree({ treeRef: artifactTreeRef, message: 'agent run start' })
```

---
id: PAT-DATA-CLICKHOUSE-001
domain: DATA
category: CLICKHOUSE
version: 1
description: Use this pattern when storing analytics, events, metrics, or aggregated usage.
precedence_level: 5
depends_on:
  - PAT-DATA-POSTGRES-001
applies_when:
  - "Storing analytics, events, metrics, or aggregated usage."
---


## Strategy

Use ClickHouse for analytics and HypeQuery for controlled read-only HTTP metrics. Do not use ClickHouse as operational state.

## Rules

### Must

- Write append-only events and metrics to ClickHouse.
- Expose metrics through allowlisted, read-only HypeQuery endpoints.
- Keep operational state in Postgres.

### Must not

- Do not use ClickHouse for permissions, billing state, ownership, or product transactions.
- Do not expose raw ClickHouse credentials to frontend users.
- Do not allow arbitrary user SQL.

## Decision rules

- If data answers analytics questions, use ClickHouse.
- If data drives product behavior, use Postgres.
- If metrics are exposed externally, require RBAC and query allowlists.

## Allowed exceptions

- Derived analytics copies are allowed when the authoritative source remains Postgres.

## Example

```ts
await analytics.writeEvent({
  type: 'ai_usage_recorded',
  organizationId,
  actorId,
  occurredAt: new Date().toISOString(),
  properties: { model, tokens, costUsd },
})
```

---
id: PAT-CLOUDFLARE-WRANGLER-CONFIG-001
domain: CLOUDFLARE
category: WRANGLER_CONFIG
version: 1
description: Use this pattern when configuring Cloudflare Workers with Wrangler.
precedence_level: 1
depends_on:
  - PAT-ARCH-CLOUDFLARE-FIRST-001
applies_when:
  - "Configuring Cloudflare Workers with Wrangler."
---


## Strategy

Wrangler configuration is the deploy-time source of truth for each Cloudflare Worker. Keep that source of truth in `wrangler.jsonc`, with schema-backed, reviewable, environment-aware configuration. Do not keep Worker configuration in `wrangler.toml`.

## Rules

### Must

- Use `wrangler.jsonc` as the only Wrangler configuration file for every Worker service.
- Include `"$schema": "./node_modules/wrangler/config-schema.json"` or the package-correct relative path to Wrangler's config schema.
- Keep Worker entrypoint, compatibility date, compatibility flags, assets, routes, observability, bindings, and environment-specific settings in `wrangler.jsonc`.
- Keep staging, production, preview, and local-development differences under explicit `env` entries when the Worker deploys to multiple environments.
- Run Wrangler commands with `--config wrangler.jsonc` when the command does not already resolve the package-local JSONC config unambiguously.
- Treat `wrangler.jsonc` as the source of truth over Cloudflare dashboard edits; dashboard-generated changes must be ported back into `wrangler.jsonc` before they are considered durable.
- Validate deploy-impacting config changes with `wrangler deploy --config wrangler.jsonc --dry-run` for each affected environment.
- If `wrangler`, `@cloudflare/workers-types`, Cloudflare Vite/Vitest tooling, or another Cloudflare deploy/runtime package must be upgraded to support the config or a required Worker feature, upgrade that package to the current npm `latest` version in the same change.

### Must not

- Do not add, keep, or edit `wrangler.toml`.
- Do not add `wrangler.json` when comments or local documentation would make `wrangler.jsonc` clearer.
- Do not split one Worker's deploy configuration across multiple Wrangler config files.
- Do not rely on Cloudflare dashboard-only Worker settings for routes, bindings, compatibility flags, assets, or observability.
- Do not commit secrets, tokens, account credentials, or environment-specific secret values in `wrangler.jsonc`.

## Decision rules

- If a package deploys a Cloudflare Worker, the first configuration file to create or migrate is `<worker-root>/wrangler.jsonc`.
- If a tool still references `wrangler.toml`, update the script, CI job, runbook, or smoke command before claiming compliance.
- If a Worker uses bindings, declare every non-secret binding in `wrangler.jsonc` and verify the runtime binding name matches the typed `Env`.
- If a deployment path has multiple environments, define them in one `wrangler.jsonc` using `env`, not separate config files per environment.
- If a Cloudflare feature requires JSON config, use the native JSONC shape directly instead of translating through TOML.
- If conversion to `wrangler.jsonc` or a new Cloudflare config key fails on the installed tooling version, check the npm `latest` dist-tag and upgrade to that version before designing a workaround.

## Allowed exceptions

None. `wrangler.toml` is not an allowed format for company Worker configuration.

## Example

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "orders-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-07-05",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "routes": [
    {
      "pattern": "api.example.com/*",
      "zone_name": "example.com"
    }
  ],
  "env": {
    "staging": {
      "name": "orders-api-staging",
      "routes": [
        {
          "pattern": "staging-api.example.com/*",
          "zone_name": "example.com"
        }
      ]
    },
    "production": {
      "name": "orders-api"
    }
  }
}
```

---
id: PAT-CLOUDFLARE-BUNDLE-ASSETS-001
domain: CLOUDFLARE
category: BUNDLE_ASSETS
version: 1
description: Use this pattern when adding assets, JSON, fonts, PDFs, images, or generated files to Worker code.
precedence_level: 4
depends_on:
  - PAT-ARCH-ENTRYPOINTS-001
applies_when:
  - "Adding assets, JSON, fonts, PDFs, images, or generated files to Worker code."
---


## Strategy

Keep Workers lightweight. Large assets and data files must live in R2, Static Assets, Artifacts, KV, or a separate Worker as appropriate. Frontend assets are not Worker bundle budget.

## Rules

### Must

- Measure bundle impact before adding large files.
- Store blobs in R2 and static assets in the approved asset path.
- Keep paid Worker bundles below the 10 MB gzip and 64 MB uncompressed platform limits.
- Warn in CI when a Worker exceeds 5 MB gzip; require approval or split before 8 MB gzip.
- Lazy-load or split heavy runtime-only functionality.

### Must not

- Do not bundle PDFs, images, fonts, huge JSON, datasets, or snapshots into the Worker.
- Do not ship frontend JS/CSS/images/fonts inside the API Worker bundle.
- Do not hide assets in strings to bypass bundle review.
- Do not add assets that increase startup without need.

## Decision rules

- If content is a large object, use R2.
- If it is a versioned tree, use Artifacts.
- If it is frontend static content, use Static Assets or UI package.
- If runtime code approaches bundle limits, split by concrete runtime need, not by business noun.

## Allowed exceptions

- Tiny static constants are allowed when they do not affect startup or bundle risk.

## Example

```ts
// Good: load large template from R2
const object = await env.R2.get(`templates/${templateId}.html`)

// Bad: import hugeTemplate from './huge-template.html?raw'
```

---
id: PAT-CLOUDFLARE-BUNDLE-DEPS-001
domain: CLOUDFLARE
category: BUNDLE_DEPENDENCIES
version: 1
description: Use this pattern when adding or upgrading runtime dependencies in Workers.
precedence_level: 4
depends_on:
  - PAT-ARCH-ENTRYPOINTS-001
applies_when:
  - "Adding or upgrading runtime dependencies in Workers."
---


## Strategy

Worker dependencies must be justified by real value and measured for bundle, startup, runtime compatibility, and security impact.

## Rules

### Must

- Prefer existing APIs and small libraries.
- Check Cloudflare Workers compatibility.
- Measure bundle impact and transitive dependencies before merging.
- Keep API-surface bundles separated by entrypoint and import boundaries.
- Keep manifest and lockfile coherent.

### Must not

- Do not add large SDKs when a small HTTP adapter is enough.
- Do not put PDF rendering, image processing, local AI inference, charting, or rare admin-only dependencies in the public API Worker.
- Do not let app-local admin API dependencies enter the public/runtime API Worker bundle.
- Do not add Node-only packages without verifying runtime support.
- Do not add dependencies just for trivial helpers.

## Decision rules

- If dependency saves significant code or risk, justify it.
- If it impacts bundle/startup, consider a separate Worker.
- If dependency is only needed for jobs, webhooks, reports, or admin tasks, keep it out of the public API Worker.
- If UI and API code are colocated in one app, bundle inclusion is governed by the Worker and browser entrypoints, not by folder proximity.
- If lockfile changes unexpectedly, inspect them.

## Allowed exceptions

- Dev-only dependencies may be larger if they never enter Worker runtime bundle.

## Example

```txt
Before adding dependency:
1. check Web API alternative
2. check existing package
3. inspect bundle impact
4. justify manifest + lockfile change
```

---
id: PAT-CLOUDFLARE-DURABLE-OBJECTS-001
domain: CLOUDFLARE
category: DURABLE_OBJECTS
version: 1
description: Use this pattern when considering Durable Objects for state or coordination.
precedence_level: 5
depends_on:
  - PAT-ASYNC-PRIMITIVE-DECISION-001
applies_when:
  - "Considering Durable Objects for state or coordination."
---


## Strategy

Use Durable Objects only for strong coordination, locks, sessions, realtime, presence, or single-writer behavior. Do not use them as a generic database.

## Rules

### Must

- Use DOs for WebSockets, agent sessions, locks, and coordinated state.
- Persist durable business state to Postgres when needed.
- Avoid global bottleneck objects.

### Must not

- Do not store the whole domain model in Durable Object storage.
- Do not choose DOs for normal relational querying.
- Do not create one global coordinator without capacity reasoning.

## Decision rules

- If state is live and coordinated, DO may fit.
- If state is relational and queryable, use Postgres.
- If work is multi-step durable, use Workflow.

## Allowed exceptions

- Small ephemeral session state may live in a DO when tied to realtime coordination.

## Example

```ts
export class AgentSessionDO {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request) {
    // coordinate WebSocket/session state here; persist business state elsewhere
    return new Response('ok')
  }
}
```

---
id: PAT-CLOUDFLARE-SERVICE-BINDINGS-001
domain: CLOUDFLARE
category: SERVICE_BINDINGS
version: 1
description: Use this pattern when an internal Worker needs to call another Worker without a public HTTP service boundary.
precedence_level: 5
depends_on:
  - PAT-ARCH-ENTRYPOINTS-001
applies_when:
  - "An internal Worker needs to call another Worker without a public HTTP service boundary."
---


## Strategy

Use Service Bindings for internal Worker-to-Worker calls when a deployable
runtime boundary is justified and the caller needs a synchronous result. Service
Bindings provide internal separation of concerns; they are not a microservice
requirement, service mesh, queue replacement, workflow engine, or module
organization tool.

## Rules

### Must

- Keep bound services internal by default.
- Document why the Worker boundary exists.
- Keep business contracts stable across the binding.
- Keep calls coarse-grained and capability-shaped.
- Keep binding payloads typed, tested, and versioned when stable consumers exist.
- Propagate requestId/traceId across the binding.
- Enforce internal authorization, tenant scope, and least-privilege bindings.
- Define timeouts, retry policy, idempotency, and failure mapping at the caller boundary.

### Must not

- Do not split Workers by table or CRUD module.
- Do not expose internal services publicly when bindings fit.
- Do not create release choreography without need.
- Do not create a Worker only because a module exists.
- Do not route internal calls through a compatibility host.
- Do not call internal Workers through public URLs when Service Bindings fit.
- Do not create chatty synchronous chains such as Service A -> Service B ->
  Service C.
- Do not use Service Bindings for retryable async work, post-commit side
  effects, long-running work, or human approval flows.

## Decision rules

- If the caller needs an immediate answer and bundle, CPU, secrets, isolation,
  security, independent deployment, or shared internal capability differs,
  consider Service Binding.
- If only code organization is needed, use modules.
- If call is async, Queue/Workflow may fit better.
- If a committed database change must trigger downstream work, use outbox plus
  Queue or Workflow.
- If the call chain would cross more than one internal Worker synchronously,
  redesign around a workflow, queue, read model, or module boundary.

## Allowed exceptions

- Public APIs may remain HTTP endpoints when they are product contracts.
- A temporary compatibility host may forward legacy internal calls only when it
  has a documented owner, target Worker, removal condition, and evidence. It
  must not become the permanent parent for service-to-service calls.

## Example

```ts
const response = await env.PRICING_WORKER.fetch(new Request('https://internal/quote', {
  method: 'POST',
  body: JSON.stringify({ orderId, traceId }),
}))
```

---
id: PAT-CLOUDFLARE-SANDBOX-001
domain: CLOUDFLARE
category: SANDBOX
version: 1
description: Use this pattern when executing untrusted, generated, or heavy code.
precedence_level: 5
depends_on:
  - PAT-ARCH-ENTRYPOINTS-001
applies_when:
  - "Executing untrusted, generated, or heavy code."
---


## Strategy

Run untrusted or commercial code execution in Cloudflare Sandbox, not inside the main API Worker.

## Rules

### Must

- Use Sandbox for Codex SDK and generated code execution.
- Persist run state in Postgres.
- Store file trees in Artifacts and large blobs in R2.

### Must not

- Do not execute untrusted code inside the Worker request path.
- Do not bundle heavy code execution SDKs into the API Worker.
- Do not keep authoritative state only inside the Sandbox.

## Decision rules

- If code is user-generated or unsafe, use Sandbox.
- If task is commercial AI code execution, pair Sandbox with AI Gateway.
- If task is internal trusted automation, use the approved Brainstask runner.

## Allowed exceptions

- Local development runners may execute trusted internal tasks with explicit scope.

## Example

```ts
const run = await sandboxPort.startCodeRun({
  organizationId,
  artifactTreeRef,
  command: 'pnpm test',
})

await runsRepo.markStarted({ runId: run.id })
```

---
id: PAT-INFRA-RESOURCE-NAMING-001
domain: INFRA
category: RESOURCE_NAMING
version: 1
description: Use this pattern when naming infrastructure resources, runtime bindings, provider resources, or executable resource classes.
precedence_level: 1
depends_on:
  - PAT-ARCH-DETERMINISTIC-NAMING-001
applies_when:
  - "Naming infrastructure resources, runtime bindings, provider resources, or executable resource classes."
---


## Strategy

Keep four names separate: service-local resource id, runtime binding, cloud resource name, and executable class name. Each answers a different question and must not be collapsed into one vague name.

## Rules

### Must

- Use kebab-case for resource ids, file names, folders, and cloud resources.
- Use UPPER_SNAKE_CASE for runtime bindings.
- Use PascalCase for workflow and stateful compute classes.
- Keep runtime bindings stable across local, staging, and production.
- Use stable environment tokens such as `local`, `dev`, `stg`, `prod`, and `preview-<id>`.

### Must not

- Do not put environment names in runtime bindings.
- Do not use vague bindings such as `DB` when a service has multiple stores.
- Do not name cloud resources only by provider id.
- Do not use mixed environment tokens such as stage, staging, and stg in one project.
- Do not use consumer-local names for resources owned by another service.

## Decision rules

- If docs or manifests need a stable local handle, use `<service>-<purpose>-<kind>`.
- If runtime code needs access, use `<SERVICE>_<PURPOSE>_<TYPE_SUFFIX>`.
- If operators need the provider resource, use `<env>-<product>-<service>-<purpose>-<provider-kind>`.
- If the resource executes code, derive the class as `<Service><Purpose><Kind>`.

## Allowed exceptions

- Provider-imposed names may be declared explicitly when derivation is impossible.
- Existing production resources may keep legacy names while docs record the migration target.

## Example

```txt
resource id: orders-primary-postgres
runtime binding: ORDERS_PRIMARY_PG
cloud resource: stg-shop-orders-primary-pg
class name: OrdersFulfillmentWorkflow
```

---
id: PAT-INFRA-RESOURCE-CONTRACT-001
domain: INFRA
category: RESOURCE_CONTRACT
version: 1
description: Use this pattern when documenting runtime infrastructure resources owned or consumed by a service.
precedence_level: 4
depends_on:
  - PAT-INFRA-RESOURCE-NAMING-001
  - PAT-CLOUDFLARE-WRANGLER-CONFIG-001
applies_when:
  - "Documenting runtime infrastructure resources owned or consumed by a service."
---


## Strategy

Document every runtime infrastructure resource close to the service that owns or consumes it. The project-level infrastructure doc is an index of owners, not a duplicate source of detail.

## Rules

### Must

- Create service-local contracts under `docs/infrastructure/`.
- Document databases, buckets, queues, workflows, stateful compute, indexes, caches, secrets, and external services.
- Include purpose, type, binding, names, ownership, source of truth, shape, lifecycle, invariants, failure modes, operations, related code, and sources.
- Keep the complete contract with the owning service.
- Let consumers reference owner contracts and document only their integration expectations.

### Must not

- Do not document ordinary classes, helpers, UI components, or repositories as infrastructure resources.
- Do not duplicate full ownership docs in both project-level and service-level docs.
- Do not let each consumer rename the same owner resource.
- Do not leave operational invariants implicit in config files only.

## Decision rules

- If a resource affects persistence, delivery, coordination, security, availability, or operations, document it.
- If a service owns the resource, write the complete contract there.
- If a service only consumes it, write a short consumer contract and link to the owner.
- If several services use one resource, choose one owner before documenting details.

## Allowed exceptions

- Tiny prototypes may start with a single infrastructure README if resource ownership is obvious.
- Temporary external integrations may use a short contract when deletion is already scheduled.

## Example

```txt
services/orders/docs/infrastructure/
  README.md
  naming.md
  postgres/primary-db.md
  r2/invoices-bucket.md
  queues/order-events-queue.md
```

---
id: PAT-API-SURFACE-BOUNDARIES-001
domain: API
category: SURFACE_BOUNDARIES
version: 1
description: Use this pattern when a product has multiple API surfaces such as admin console APIs, public/runtime APIs, webhooks, internal service APIs, or generated-client APIs.
precedence_level: 1
depends_on:
  - PAT-ARCH-REPO-BOUNDARIES-001
  - PAT-DOMAIN-SCHEMA-API-NAMING-001
applies_when:
  - "A product has multiple API surfaces such as admin console APIs, public/runtime APIs, webhooks, internal service APIs, or generated-client APIs."
---


## Strategy

Separate API code by consumer, contract stability, deployability, security
posture, and runtime cost. Do not treat every HTTP route as the same product
surface just because it uses the same router or Worker platform.

Canonical runtime topology:

```txt
apps/<ui-surface>/src/api
  -> API coupled to one graphical product surface, such as an admin console

services/public-api
  -> stable public/runtime API without graphical UI

services/<capability>
  -> internal or headless runtime API, queue consumer, webhook worker, coordinator, executor, or agent

packages/contracts
  -> shared schemas, generated contracts, OpenAPI artifacts, and typed protocol surfaces

packages/db
  -> shared database boundary, Kysely types, table constants, and Hyperdrive/Postgres client factory
```

This topology describes Cloudflare-first deployable boundaries. It does not
require classical microservices. A `services/*` directory is a deployable Worker
surface; it is not automatically an autonomous microservice with a separate
database, release train, or service mesh.

`packages/api` is not a target topology. It may exist only as a temporary
compatibility host during migration.

Colocation is allowed by ownership. Bundle inclusion is controlled by
entrypoints and imports.

## Related patterns

- `PAT-ARCH-REPO-BOUNDARIES-001`: apps, services, and packages have different deployability and ownership rules.
- `PAT-ARCH-MODULAR-MONOLITH-VERTICAL-SLICES-001`: modules and slices define product ownership inside a deployable.
- `PAT-API-MODULAR-SLICES-001`: every API surface uses the same HTTP, command/query, repository, mapper, policy, and adapter roles.
- `PAT-DOMAIN-SCHEMA-API-NAMING-001`: durable domain/resource names stay aligned across DB, API, OpenAPI, generated clients, frontend, tests, and docs.
- `PAT-DATA-HYPERDRIVE-001`: Worker runtime connects to Neon Postgres through Hyperdrive.
- `PAT-DATA-KYSELY-001`: Kysely and SQL stay in repositories.
- `PAT-CLOUDFLARE-BUNDLE-DEPS-001`: Worker bundles and runtime dependencies are measured and kept surface-appropriate.
- `PAT-API-OPENAPI-001`: public and stable internal contracts are modeled in OpenAPI.
- `PAT-CLOUDFLARE-SERVICE-BINDINGS-001`: internal synchronous Worker-to-Worker calls use Service Bindings when justified.
- `PAT-ASYNC-PRIMITIVE-DECISION-001`: async primitives are chosen by durability, duration, coordination, and caller expectations.

## Rules

### Must

- Put API routes used only by one UI surface under that app's API root, for example `apps/admin/src/api`.
- Put stable public, integration, runner, SDK, webhook, or runtime contracts under `services/public-api` or another explicitly named headless service.
- Put internal headless APIs under the owning service, for example `services/coordinator` or `services/edge-executor`.
- Keep shared schemas, generated contracts, and cross-runtime protocols in `packages/contracts` or a more specific non-deployable package.
- Keep database access through `packages/db` and the owning API surface's `repository.ts` files.
- Keep each API surface independently measurable for bundle size, startup, secrets, bindings, auth, OpenAPI, tests, and deploy config.
- Use `PAT-API-MODULAR-SLICES-001` inside every API surface.
- Generate or publish separate OpenAPI contracts when API surfaces have different consumers, auth posture, or stability expectations.
- Keep browser/UI code and server/API code separated by import boundaries when they live under the same app.
- Use Service Bindings for justified synchronous internal Worker calls.
- Use Queue, Workflow, or outbox when work is async, durable, retryable, or
  follows a committed database change.
- Keep `packages/api` compatibility routes thin, documented, and pointed at
  their target API surface during migration.

### Must not

- Do not put a deployable Worker API in `packages/*`.
- Do not keep public/runtime API behavior inside an admin app merely because the admin Worker already exists.
- Do not expose admin-only DTOs as public/runtime API contracts.
- Do not let React or browser modules import server API modules.
- Do not let admin-only dependencies leak into the public API Worker bundle.
- Do not create `packages/api` as a speculative shared API when only one app or service consumes it.
- Do not split API surfaces just to appear distributed; split for real consumer, contract, security, bundle, CPU, secrets, isolation, or operational reasons.
- Do not treat `packages/api` as a parent service, service registry, service
  mesh, or permanent runtime host.
- Do not route service-to-service calls through `packages/api`.
- Do not call another internal Worker through a public URL when a Service Binding fits.
- Do not split Workers by table, CRUD operation, or module name alone.

## Decision rules

- If only the admin UI consumes it, put it in `apps/admin/src/api`.
- If runners, integrations, SDKs, webhooks, automation, or external clients consume it, put it in `services/public-api` or the owning headless service.
- If it is Worker-to-Worker or internal orchestration, put it in `services/<capability>`.
- If it is shared schema, type, OpenAPI output, or protocol, put it in `packages/contracts`.
- If it builds SQL, creates Kysely clients, or exposes generated DB table/type surfaces, keep it in `packages/db` plus the owning API `repository.ts`.
- If a single deployable owns both UI assets and an app-local API, keep separate entrypoints and forbid cross-imports between browser and server roots.
- If bundle size, startup time, CPU, secrets, provider SDKs, or dependency isolation becomes a concern, split the API surface into a headless service rather than leaking heavy code into another Worker.
- If Service A needs an immediate answer from Service B, use a Cloudflare
  Service Binding only when B owns a real runtime capability and the boundary is
  justified by isolation, secrets, bundle size, CPU, security, independent
  deployment, or shared internal capability.
- If Service A only needs to trigger work in Service B, use Queue, Workflow, or
  outbox instead of a synchronous Worker call.
- If a route remains in `packages/api`, document the target surface, owner,
  compatibility reason, removal condition, and test or smoke evidence.

## Required shapes

Admin or backoffice app with colocated API:

```txt
apps/admin/
  src/
    react/
      main.tsx
      modules/
      api/generated/
    api/
      app.ts
      openapi.ts
      modules/
        <domain>/
          public.ts
          <resources>/
            public.ts
            <use-case>/
              http.ts
              command.ts | query.ts
              repository.ts
              mapper.ts
              policy.ts
              adapter.ts
              types.ts
    worker.ts
  tests/
  wrangler.jsonc
  package.json
```

Public/runtime API:

```txt
services/public-api/
  src/
    app.ts
    openapi.ts
    modules/
      <domain>/
        <resources>/
          <use-case>/
            http.ts
            command.ts | query.ts
            repository.ts
            mapper.ts
            policy.ts
            adapter.ts
            types.ts
  tests/
  wrangler.jsonc
  package.json
```

Shared boundaries:

```txt
packages/contracts/
  src/

packages/db/
  src/
    client.ts
    tables.ts
    types.ts
```

## Runtime data path

Every API surface that talks to Postgres uses the same deployed Worker path:

```txt
http.ts
  -> query.ts | command.ts
  -> repository.ts
  -> packages/db createDb(env)
  -> Kysely
  -> pg
  -> env.HYPERDRIVE.connectionString
  -> Neon Postgres
```

Forbidden runtime paths:

```txt
http.ts -> SQL
command.ts -> Kysely query construction
query.ts -> Kysely query construction
mapper.ts -> DB access
React/browser module -> server API module import
Worker feature code -> new pg.Pool(...)
deployed Worker -> NEON_DATABASE_URL
Service A -> packages/api -> Service B
Service A -> public URL of Service B for internal calls
Service A -> Service B -> Service C synchronous chains
```

## Bundle and import rules

When UI and API are colocated in one app, keep the import graph explicit:

```txt
src/react/* must not import src/api/*
src/api/* must not import src/react/*
public-api must not import admin-only modules
admin Worker must not import browser-only UI packages
```

Measure Worker bundles with the repo's dry-run or deploy packaging command
before claiming the surface is production-ready. Static assets and Worker script
size have different limits; moving files does not change bundle size unless the
entrypoint imports them.

## Allowed exceptions

- A transitional `packages/api` may remain during migration when its consumers,
  target API surfaces, retained aliases, bundle risk, compatibility reason,
  removal condition, owner, and evidence are documented. It must not own new
  product behavior, SQL, provider adapters, business orchestration, or new
  public contracts.
- A single Worker may serve UI assets and an app-local admin API when measured bundle size, startup time, bindings, secrets, and auth posture remain acceptable.
- Generated contracts may live in `packages/*` with one initial consumer when the contract is externally stable or cross-runtime by design.

---
id: PAT-API-HONO-001
domain: API
category: HONO
version: 1
description: Use this pattern when implementing Cloudflare Worker HTTP endpoints with Hono.
precedence_level: 2
depends_on:
  - PAT-API-SURFACE-BOUNDARIES-001
  - PAT-ARCH-ENTRYPOINTS-001
applies_when:
  - "Implementing Cloudflare Worker HTTP endpoints with Hono."
---


## Strategy

Hono routes handle transport only. They validate input, read request context, call services, and serialize responses. In modular API packages, `app.ts` is bootstrap and module registration only; product HTTP behavior lives in slice-local `http.ts` files.

## Rules

### Must

- Validate params, query, and body before calling services.
- Use services for business behavior.
- Return mapped DTOs and normalized errors.
- Keep `app.ts` limited to app bootstrap, global middleware, auth/principal wiring, allowlisted bootstrap routes, and module registration.
- Keep slice `http.ts` files responsible for boundary parsing, validation, context extraction, use-case calls, known Problem Details mapping, and HTTP responses.
- Use the domain/resource URL vocabulary from `PAT-DOMAIN-SCHEMA-API-NAMING-001` for durable product routes.

### Must not

- Do not write SQL in routes.
- Do not put business workflows in route handlers.
- Do not call external providers directly from routes unless the route is a thin adapter endpoint.
- Do not leave product route handlers, provider calls, binding side effects, complex DTO construction, or product normalization in `app.ts`.

## Decision rules

- If handler becomes decision-heavy, move logic to service.
- If route needs platform binding, use adapter or context.
- If output is public, map it before response.
- If the endpoint belongs to a modular API slice, register it through the owning module public surface and keep route implementation in that slice.
- If a route is a compatibility alias for an older URL, document the versioning or deprecation exception before marking it complete.

## Allowed exceptions

- Very small health checks may return directly without service layer.

## Example

```ts
app.openapi(createProjectRoute, async (c) => {
  const body = c.req.valid('json')
  const ctx = getRequestContext(c)
  const project = await projectsService.create({ ...body, actorId: ctx.actor.id, organizationId: ctx.organization.id })
  return c.json(toProjectDto(project), 201)
})
```

---
id: PAT-API-MODULAR-SLICES-001
domain: API
category: MODULAR_SLICES
version: 1
description: Use this pattern when organizing a Hono/TypeScript API surface as enforceable modular slices.
precedence_level: 2
depends_on:
  - PAT-API-SURFACE-BOUNDARIES-001
  - PAT-DOMAIN-SCHEMA-API-NAMING-001
  - PAT-CODE-SCRIPT-GOVERNANCE-001
  - PAT-CLOUDFLARE-WRANGLER-CONFIG-001
  - PAT-TEST-PLACEMENT-001
applies_when:
  - "Organizing a Hono/TypeScript API surface as enforceable modular slices."
---


## Strategy

Make API surfaces enforceable modular monoliths. Product behavior is organized by business module and use-case slice, with domain and resource names aligned to `PAT-DOMAIN-SCHEMA-API-NAMING-001`. `app.ts` bootstraps Hono and registers modules. Slice files own explicit responsibilities: `http.ts` handles HTTP boundaries, `command.ts` handles mutations, `query.ts` handles reads, `repository.ts` handles persistence, `mapper.ts` handles public DTOs, `policy.ts` handles business decisions, and `adapter.ts` handles provider/platform side effects.

The API surface root is selected by `PAT-API-SURFACE-BOUNDARIES-001`. Examples
include `apps/admin/src/api` and `services/public-api/src`. `packages/api/src`
is allowed only as a temporary compatibility host during migration, not as a
target API surface.

## Repository Tooling Precondition

This pattern is project-wide before it is package-local. Before claiming API modular-slice compliance, agents must apply `PAT-CODE-SCRIPT-GOVERNANCE-001` across the repository so package scripts, operational scripts, selftests, smoke tests, generated tooling, and CI entrypoints do not keep product-branded names, direct file invocations, or mixed package-manager behavior around the API migration.

For this repository, npm-to-pnpm migration is allowed only as a separate commit after script normalization. The current npm state must be treated as the migration source of truth until then: `package-lock.json`, `npm ci`, npm workspaces, and `npm run -w` remain active until replaced together by `pnpm-workspace.yaml`, `packageManager`, `pnpm-lock.yaml`, `pnpm install --frozen-lockfile` in CI, and verified GitHub Packages auth for the Lemn UI package. Turborepo may be introduced only after script names and categories are clean; use it for deterministic `build`, `check`, `test`, and `codegen` tasks, not for deploys, migrations, live smokes, or mutable operations.

## Product Naming Precondition

Agents applying this pattern must use the owning project's canonical product,
domain, and resource names from its product catalog, architecture spec, or local
migration plan. Generic patterns must not hardcode a specific product name,
legacy codename, customer name, or temporary migration label.

Before marking an API slice, Worker deploy package, or related dashboard/API surface compliant:

- Replace legacy product names, codenames, or temporary migration labels with
  the canonical name when they describe product identity in touched API,
  Worker, SDK, dashboard, smoke, docs, specs, evidence, OpenAPI, Problem
  Details, headers, user-agent strings, UI copy, or deploy configuration.
- Rename local symbols, test names, smoke assertions, docs, and examples when
  they describe the product rather than an immutable third-party identifier.
- Treat remaining legacy product identity references as compliance blockers,
  not silent legacy exceptions.
- If a remaining value is an immutable external identifier that cannot be
  changed in the same migration without a versioned deploy or DNS/resource
  migration, record the blocker and required migration target before claiming
  compliance.

## Rules

### Must

- Satisfy `PAT-CLOUDFLARE-WRANGLER-CONFIG-001` first for any Cloudflare Worker API package: deploy configuration must be `wrangler.jsonc`, and `wrangler.toml` must not exist.
- Satisfy the Repository Tooling Precondition and `PAT-CODE-SCRIPT-GOVERNANCE-001` for the whole project before claiming modular-slice completion.
- Satisfy the Product Naming Precondition before claiming a module, slice, Worker deploy package, or API-facing surface is complete.
- Satisfy `PAT-DOMAIN-SCHEMA-API-NAMING-001` for durable DB schema, API module, public URL, OpenAPI, generated-client, frontend-module, and test ownership names.
- Organize non-trivial API behavior under `<api-surface-root>/modules/<domain>/<resources>/<use-case>/` for durable resource-backed domains; pure platform or bootstrap modules may use `<api-surface-root>/modules/<module>/<slice>/` only when no durable domain/resource owner exists.
- Give every non-trivial module a `public.ts` entrypoint for route registration and stable cross-module commands, queries, or types.
- Keep `<api-surface-root>/app.ts` limited to Hono bootstrap, global middleware, auth/principal wiring, explicitly allowlisted bootstrap routes, and `register<Module>Routes(app, deps)` calls.
- Use this slice shape when the responsibility exists: `http.ts`, `command.ts` or `query.ts`, `repository.ts`, `mapper.ts`, `policy.ts`, `adapter.ts`, and `types.ts`.
- Keep SQL, `getDb`, `.prepare`, and Kysely query construction in `repository.ts` files or declared legacy repositories only.
- Keep provider SDKs, external `fetch`, queues, R2, service bindings, email delivery, ClickHouse transport, and similar side effects in API-surface adapters or module-local adapters.
- Keep `<api-surface-root>/shared/*` domain-free: parsing, pagination, JSON
  normalization, IDs, time formatting, and sanitization only. Promote repeated
  cross-surface value helpers to `packages/value-primitives` instead of copying
  them across API surfaces; test helpers belong under the owning API surface
  `tests/helpers/`.
- Place every API test artifact under the owning API surface `tests/` root according to `PAT-TEST-PLACEMENT-001`.
- Track temporary app-root, flat-module, SQL, side-effect, non-TypeScript, or test-placement debt in `spec/architecture/api-modular-slice-exceptions.json`.
- Track module migration state in `spec/architecture/api-module-migration-status.json` with `legacy`, `partial`, or `complete` status.
- Enforce this pattern with an architecture checker wired into the package or repo check command.

### Must not

- Do not keep product route handlers, business policy, SQL, provider calls, binding side effects, product DTO mappers, or complex product normalization in `app.ts`.
- Do not let `http.ts` build SQL, call providers/bindings directly, own product policy beyond boundary validation, or construct complex public DTOs when a mapper can own them.
- Do not let commands or queries import Hono `Context`, return Hono `Response`, call `c.env`, build SQL, or parse raw HTTP bodies.
- Do not let cross-module imports bypass another module's `public.ts`.
- Do not use `export *` from module public surfaces.
- Do not expose repositories, private adapters, private slice internals, or test fixtures from module public surfaces.
- Do not put product policy, product DTO mappers, SQL, provider code, or module-specific branching in `<api-surface-root>/shared/*`.
- Do not split by CRUD operation only to satisfy folder shape; split by command, query, subdomain, or subcapability when the responsibility has real ownership.
- Do not make resource folders top-level modules when `PAT-DOMAIN-SCHEMA-API-NAMING-001` names a domain owner; `orders/status/list` is valid, `order-status/list` is a legacy compatibility shape.
- Do not combine resource and operation in a single slice name when a resource folder can own it; prefer `access/api-keys/revocations` over `api-keys/revoke` and `access/tenant-memberships/create` over `memberships-create`.
- Do not keep active exceptions for modules or slices marked complete.
- Do not add new legacy product names, codenames, or temporary migration labels
  for canonical product identity.

## Decision rules

- If code reads route params, query params, headers, body, principal, or request context, keep it in `http.ts`.
- If code mutates product state or starts a state-changing use case, keep orchestration in `command.ts`.
- If code reads product state without mutation, keep orchestration in `query.ts`.
- If code builds SQL or Kysely queries, keep it in `repository.ts`.
- If data leaves the API boundary, map it in `mapper.ts`.
- If code decides business policy, validation policy, status policy, retry policy, or normalization rules, keep it in `policy.ts` or command/query when small.
- If code talks to a provider or platform binding, keep it in an API-surface adapter, slice `adapter.ts`, or module shared adapter.
- If resource-level files remain cohesive, keep them together; if commands, queries, policies, or provider boundaries diverge, split them into named slices without changing the domain/resource vocabulary.
- If a target URL is `/v1/<domain>/<resources>`, the owning source path is `<api-surface-root>/modules/<domain>/<resources>/`; compatibility aliases do not define ownership.
- If a resource-backed slice is complete, it needs mirrored unit tests under the owning API surface `tests/unit/modules/<domain>/<resources>/<use-case>/` and no active exception entries.
- If DB/provider/binding correctness matters, add integration, e2e, smoke, or documented boundary evidence.
- If API code is deployed by a Worker wrapper or host app, that deploy package must satisfy `PAT-CLOUDFLARE-WRANGLER-CONFIG-001` before the API can be marked fully compliant.
- If a touched file contains legacy product names, codenames, or temporary
  migration labels, decide whether they are product identity; product-identity
  usage must be renamed to the canonical name before completion.

## Required API surface shape

```txt
<api-surface-root>/
  app.ts
  types.ts
  contracts.ts
  openapi.ts
  problem.ts
  shared/
  modules/
    <domain>/
      public.ts
      shared/
      <resources>/
        public.ts
        shared/
        http.ts
        command.ts | query.ts
        repository.ts
        mapper.ts
        policy.ts
        adapter.ts
        types.ts
        <use-case>/
          http.ts
          command.ts | query.ts
          repository.ts
          mapper.ts
          policy.ts
          adapter.ts
          types.ts
    <module-without-durable-resource>/
      public.ts
      <slice>/
        http.ts
        command.ts | query.ts
        repository.ts
        mapper.ts
        policy.ts
        adapter.ts
        types.ts
  adapters/
  middleware/
tests/
  unit/
    modules/
  integration/
  contract/
  e2e/
  smoke/
  fixtures/
  fakes/
  mocks/
  mockups/
  helpers/
  setup/
  snapshots/
```

## Allowed exceptions

- Small read-only slices may omit `command.ts`.
- Small mutation slices may omit `query.ts`.
- Optional slice files may be omitted only when that responsibility does not exist.
- Legacy app-root behavior, package-level repositories, flat module files, non-TypeScript source, and test files or test support outside the owning API surface `tests/` root may remain only with owner, reason, risk, migration target, expiry, and checker-specific match metadata.
- Health, OpenAPI, capability discovery, and other explicitly allowlisted bootstrap routes may stay in `app.ts`.

## Example

```txt
services/public-api/src/modules/access/api-keys/
  public.ts
  list/
    http.ts
    query.ts
    repository.ts
    mapper.ts
    policy.ts
  issuance/
    http.ts
    command.ts
    repository.ts
    mapper.ts
    policy.ts
    types.ts
  revocations/
    http.ts
    command.ts
    repository.ts
    mapper.ts
    policy.ts

services/public-api/src/modules/orders/status/
  public.ts
  list/
    http.ts
    query.ts
    repository.ts
    mapper.ts
    policy.ts
  status-changes/
    http.ts
    command.ts
    repository.ts
    mapper.ts
    policy.ts

services/public-api/tests/unit/modules/access/api-keys/issuance/http.test.ts
services/public-api/tests/unit/modules/access/api-keys/revocations/command.test.ts
services/public-api/tests/unit/modules/orders/status/changes/command.test.ts
services/public-api/tests/integration/access/api-keys/api-key-repository.integration.test.ts
services/public-api/tests/fixtures/access/api-keys/issue-api-key.json
services/public-api/tests/fakes/queue.ts
```

---
id: PAT-API-OPENAPI-001
domain: API
category: OPENAPI
version: 1
description: Use this pattern when creating or changing API endpoints.
precedence_level: 2
depends_on:
  - PAT-API-SURFACE-BOUNDARIES-001
  - PAT-DOMAIN-SCHEMA-API-NAMING-001
applies_when:
  - "Creating or changing API endpoints."
---


## Strategy

OpenAPI is mandatory. The API is a product contract and must be updated with endpoint behavior.

## Rules

### Must

- Define stable operationId values.
- Use the domain/resource route namespace from `PAT-DOMAIN-SCHEMA-API-NAMING-001` for durable product resources.
- Document request schemas, response DTOs, and errors.
- Regenerate or update clients when contracts change.

### Must not

- Do not add endpoints without OpenAPI.
- Do not change response shapes without updating contracts.
- Do not let frontend invent API types manually.

## Decision rules

- If endpoint is public or stable internal API, model it in OpenAPI.
- If an endpoint represents a durable product resource, align path, tag, operationId, and generated-client name with the domain/resource vocabulary.
- If contract changes, preserve compatibility or version it.
- If generated clients exist, update them in the same change.

## Allowed exceptions

- Temporary internal debugging endpoints may be excluded only when not shipped to production.

## Example

```ts
export const createProjectRoute = createRoute({
  method: 'post',
  path: '/v1/projects',
  operationId: 'createProject',
  request: { body: { content: { 'application/json': { schema: CreateProjectInput } } } },
  responses: { 201: { description: 'Project', content: { 'application/json': { schema: ProjectDto } } } },
})
```

---
id: PAT-API-MAPPERS-001
domain: API
category: MAPPERS
version: 1
description: Use this pattern when returning data from backend to API, MCP, or UI clients.
precedence_level: 2
depends_on:
  - PAT-API-MODULAR-SLICES-001
applies_when:
  - "Returning data from backend to API, MCP, or UI clients."
---


## Strategy

Map DB or domain objects to explicit public DTOs. Public contracts must not leak internal rows or provider shapes.

## Rules

### Must

- Create DTO schemas for public outputs.
- Use mappers per module.
- Hide internal, sensitive, or unstable fields.

### Must not

- Do not return raw DB rows to clients.
- Do not expose password hashes, tenant internals, provider IDs, or private flags.
- Do not let DB column names dictate public API names.

## Decision rules

- If data leaves the backend, map it.
- If a field is not part of the public contract, omit it.
- If DTO changes, update OpenAPI/MCP contract.

## Allowed exceptions

- Internal service-to-service values may use domain objects when not exposed externally.

## Example

```ts
export function toProjectDto(project: ProjectRow): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    createdAt: project.created_at.toISOString(),
  }
}
```

---
id: PAT-API-CONTRACTS-001
domain: API
category: CONTRACTS
version: 1
description: Use this pattern when changing exports, routes, schemas, config, workflows, events, or tool contracts.
precedence_level: 2
depends_on:
  - PAT-API-OPENAPI-001
applies_when:
  - "Changing exports, routes, schemas, config, workflows, events, or tool contracts."
---


## Strategy

Contracts are compatible by default. Breaking changes require explicit context, migration path, or versioning.

## Rules

### Must

- Preserve public names and shapes unless intentionally versioned.
- Update producers and consumers together.
- Add compatibility shims when needed.
- Keep DB/API/OpenAPI/frontend naming changes aligned with `PAT-DOMAIN-SCHEMA-API-NAMING-001`.

### Must not

- Do not rename routes, exports, event fields, or config keys casually.
- Do not change schema semantics without consumer review.
- Do not remove fields that clients may still use.

## Decision rules

- If consumed externally, treat it as a contract.
- If change is breaking, version or coordinate rollout.
- If consumer set is unknown, assume compatibility matters.

## Allowed exceptions

- Internal private helpers may change freely when all call sites are updated.

## Example

```ts
// Compatible: add optional field
export const ProjectDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  archivedAt: z.string().datetime().optional(),
})
```

---
id: PAT-API-ZOD-001
domain: API
category: VALIDATION
version: 1
description: Use this pattern whenever data crosses a trust boundary.
precedence_level: 3
depends_on:
  - PAT-API-HONO-001
applies_when:
  - "Use this pattern whenever data crosses a trust boundary."
---


## Strategy

Use Zod for runtime validation at HTTP, MCP, webhook, queue, workflow, AI output, and environment boundaries.

## Rules

### Must

- Define explicit Zod schemas for untrusted inputs.
- Infer TypeScript types from schemas when appropriate.
- Validate before calling commands, queries, providers, or internal runtime work.
- Keep boundary schemas in `packages/contracts` when shared or in operation
  `types.ts` when local-only.

### Must not

- Do not rely on TypeScript types for runtime input.
- Do not pass raw request bodies into commands, queries, providers, or
  repositories.
- Do not use any for MCP tool or webhook input.
- Do not create API operation `schema.ts` files; local validation schemas belong
  in operation `types.ts`.

## Decision rules

- If data comes from user, provider, queue, AI, env, or network, validate it.
- If data is internal and already typed, avoid redundant schemas unless crossing a public boundary.
- If validation fails, return normalized errors.

## Allowed exceptions

- Performance-critical internal paths may validate at ingress only when documented.

## Example

```ts
export const CreateProjectInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
})

export type CreateProjectInput = z.infer<typeof CreateProjectInput>
```

---
id: PAT-API-ERRORS-001
domain: API
category: ERROR_MODEL
version: 3
description: Use this pattern when modeling expected internal errors before they are serialized to HTTP, MCP, queue, or workflow boundaries.
precedence_level: 3
depends_on:
  - PAT-API-MODULAR-SLICES-001
applies_when:
  - "Modeling expected internal errors before they are serialized to HTTP, MCP, queue, or workflow boundaries."
---


## Strategy

Use typed result unions, AppError, or module-specific typed errors for expected
business, persistence, and provider failures. Own expected errors at the
narrowest module boundary that can name and test them. Public serialization is
handled by `PAT-API-PROBLEM-DETAILS-001`; repositories, adapters, commands, and
queries must not invent client-visible envelopes.

Expected errors are product contracts. Treat their codes, retry semantics,
resource-existence behavior, and audit/log correlation as deliberately as
success DTOs.

## Rules

### Must

- Use stable lower-snake-case error codes for expected failures.
- Include requestId/trace correlation in logs and public error envelopes using
  the API surface's established wire naming.
- Map validation, auth, not found, conflict, rate limit, idempotency, provider,
  persistence, and policy failures intentionally.
- Preserve safe cause metadata for logs, traces, audit events, or job state.
- Convert expected failures before they become generic 500s.
- Define operation-local expected error/result unions in the owning operation
  `types.ts` under `PAT-API-MODULAR-SLICES-001`.
- Put reusable module or resource business errors in the nearest
  `shared/errors.ts`.
- Put public, stable, generated-client, SDK, runner, webhook, queue, or
  cross-runtime error codes/contracts in `packages/contracts`.
- Keep `packages/problem-details` or the equivalent API-surface file focused on
  HTTP Problem Details serialization only.
- Let repository query failures propagate unless the repository is explicitly
  performing a documented best-effort read that cannot affect the primary
  result, authorization, user-visible state, or audit outcome.
- Convert provider/platform failures in adapters into typed adapter results or
  safe internal exceptions before they reach business code.
- Make best-effort failures observable with a stable code, correlation id, and
  owner-visible log/audit/job state when the primary flow continues.

### Must not

- Do not expose stack traces or raw provider errors.
- Do not throw plain Error for expected business cases.
- Do not return inconsistent error shapes per endpoint.
- Do not serialize internal causes directly to clients.
- Do not put a global business-error catalog in `packages/api/src/errors.ts`.
- Do not put business rules in `problem.ts`.
- Do not let repositories manufacture business errors.
- Do not use `.catch(() => null)`, `.catch(() => [])`, or
  `.catch(() => undefined)` in repositories to convert database, Kysely,
  Hyperdrive, Neon, R2, or provider failures into successful absence.
- Do not return `not_found`, an empty list, or a successful null because the
  persistence layer failed.
- Do not let command/query code hide expected failures as unexpected 500s.
- Do not let HTTP handlers return endpoint-specific `{ error: ... }` envelopes
  instead of Problem Details.

## Decision rules

- If a repository query succeeds with no row, return `null` or `[]` according
  to the repository contract.
- If a repository query fails, propagate the failure unless the read/write is
  explicitly best-effort and non-authoritative.
- If a missing row is meaningful to the use case, command/query maps `null` to
  a typed `not_found` or expected problem result.
- If an operation can fail for a known business reason, model that branch in
  operation `types.ts` and return it from command/query.
- If the same business error is used by sibling operations, move the constant or
  helper to the nearest `shared/errors.ts`.
- If a client, SDK, runner, webhook, queue consumer, or service can branch on an
  error code, declare that stable code/contract in `packages/contracts`.
- If schema validation fails, use the standard validation Problem Details
  response with safe field errors.
- If an error crosses HTTP, use `PAT-API-PROBLEM-DETAILS-001`.
- If an error crosses a non-HTTP boundary, use an equivalent typed envelope and
  document it with the boundary contract.
- If the error is internal or unexpected, log safe details with correlation and
  return a generic public problem.

## Allowed exceptions

- Unexpected errors may be caught by the global error handler and normalized.
- Local parsing of non-authoritative diagnostic payloads may use a narrow catch
  fallback, for example `response.text().catch(() => "")`, when it cannot alter
  authorization, persistence, public response semantics, or primary success.
- Fire-and-observe side effects may catch and continue only when the side effect
  is explicitly best-effort, the primary flow remains correct without it, and
  the failure is logged or recorded with a stable code.

## Ownership

```txt
packages/contracts/src/errors.ts
  Public, generated-client, SDK, runner, webhook, queue, cross-runtime,
  cross-service, or externally stable error codes and protocol contracts.

packages/api/src/errors.ts
  Optional AppError base class, generic error helpers, and safe cause utilities.
  This file must not become a product-wide business-error catalog.

packages/problem-details
  HTTP Problem Details serialization and small public helpers such as notFound.
  This package must not decide product policy.

<api-surface-root>/shared/problem.ts
  Thin API-surface wrapper when a surface needs local request context, naming,
  or compatibility behavior.

modules/<domain>/shared/errors.ts
  Business errors shared across resources in one module.

modules/<domain>/<resource>/shared/errors.ts
  Business errors shared by sibling operations for one resource.

modules/<domain>/<resource>/<operation>/types.ts
  Operation-local expected error/result unions and local validation schemas.

modules/<domain>/<resource>/<operation>/command.ts | query.ts
  Use-case logic that returns typed expected results.

modules/<domain>/<resource>/<operation>/http.ts
  Boundary mapping from typed expected results to Problem Details.

modules/<domain>/<resource>/<operation>/repository.ts
  Persistence only. Successful no-row is null/[]; persistence failure
  propagates or is explicitly documented best-effort.

modules/<domain>/<resource>/<operation>/adapter.ts
  Provider/platform interaction and safe provider failure mapping.
```

## Catch Policy

Use catches to classify or observe failures, not to erase them.

Allowed:

```ts
const row = await db.selectFrom(TABLE).selectAll().executeTakeFirst()
return row ?? null
```

Not allowed:

```ts
return db.selectFrom(TABLE)
  .selectAll()
  .executeTakeFirst()
  .then((row) => row ?? null)
  .catch(() => null)
```

Allowed for best-effort side effects only:

```ts
await audit.record(event).catch((cause) => {
  logger.warn("audit_event_record_failed", {
    request_id: requestId,
    code: "audit_event_record_failed",
    cause: safeError(cause),
  })
})
```

Allowed for non-authoritative diagnostics:

```ts
const detailText = await response.text().catch(() => "")
```

## Example

```ts
// modules/access/api-keys/revocations/types.ts
export type ApiKeyRevokeProblem =
  | {
      code: "api_key_already_revoked"
      status: 409
      title: "API key already revoked"
      detail: string
      retryable: false
    }

export type ApiKeyRevokeResult =
  | { kind: "revoked"; payload: ApiKeyPayload }
  | { kind: "not_found" }
  | { kind: "problem"; problem: ApiKeyRevokeProblem }

// modules/access/api-keys/revocations/command.ts
if (!row) return { kind: "not_found" }
if (row.status === "revoked") {
  return {
    kind: "problem",
    problem: {
      code: "api_key_already_revoked",
      status: 409,
      title: "API key already revoked",
      detail: "This API key has already been revoked.",
      retryable: false,
    },
  }
}

// modules/access/api-keys/revocations/http.ts
if (result.kind === "not_found") return notFound(c, "api_key")
if (result.kind === "problem") return problem(c, result.problem)
```

---
id: PAT-API-PROBLEM-DETAILS-001
domain: API
category: PROBLEM_DETAILS
version: 2
description: Use this pattern when returning client-visible HTTP errors from Hono routes, API adapters, or generated clients.
precedence_level: 3
depends_on:
  - PAT-API-ERRORS-001
applies_when:
  - "Returning client-visible HTTP errors from Hono routes, API adapters, or generated clients."
---


## Strategy

Return RFC 9457 Problem Details for public HTTP errors. The shape is stable,
safe, machine-readable, documented in OpenAPI, and shared by validation, auth,
provider, persistence, rate-limit, idempotency, and unexpected error handlers.
Problem Details is a serialization boundary, not a business-rule owner. When
multiple API surfaces need the same HTTP error serialization, use
`packages/problem-details`.

## Rules

### Must

- Use `application/problem+json` for error responses.
- Include `type`, `title`, `status`, `detail`, and `instance` when available.
- Put stable machine codes and request correlation in extension fields using the
  API surface's established wire naming.
- Map Zod validation errors to a safe field-error extension.
- Document error responses in OpenAPI and contract tests.
- Keep public problem `detail` safe for end users and support workflows.
- Include retry semantics when clients can safely retry.
- Use one API-surface helper for HTTP serialization, such as `problem(c, ...)`,
  instead of hand-rolled response bodies.
- Keep `problem.ts` free of module-specific business policy.
- Use `packages/problem-details` for shared RFC 9457 serialization when multiple
  API surfaces need the same envelope.

### Must not

- Do not expose stack traces, SQL, provider bodies, secrets, or raw validation internals.
- Do not invent endpoint-specific error envelopes.
- Do not leak resource existence through 401/403/404 choices.
- Do not let repositories or adapters serialize HTTP Problem Details directly.
- Do not put raw exception messages into public `detail` unless the message was
  intentionally authored as safe public text.
- Do not change the public error envelope field naming without a versioned
  contract migration.
- Do not put business error catalogs, provider mappings, recovery policy,
  logging, audit decisions, SQL, or adapters in `packages/problem-details`.

## Decision rules

- If a client can branch on it, expose a stable `code` extension.
- If detail is only useful to developers, log it and return safe text.
- If the error is unexpected, return a generic problem with correlation id.
- If a missing resource should be hidden for authorization reasons, use the
  product's established 404/403 policy consistently.
- If the error is retryable, set retry metadata and headers where the protocol
  supports them.
- If validation fails, include safe field-level entries but not raw input.

## Allowed exceptions

- Non-HTTP protocols may use equivalent typed error envelopes when documented.
- Internal-only health or diagnostic endpoints may add safe extensions when the
  contract documents them and they still use the same base shape.

## Example

```ts
return c.json({
  type: 'https://docs.le-mn.com/errors/project-not-found',
  title: 'Project not found',
  status: error.status,
  code: error.code,
  detail: error.safeMessage,
  instance: c.req.path,
  requestId,
}, error.status)
```

---
id: PAT-API-CORS-001
domain: API
category: CORS
version: 1
description: Use this pattern when configuring browser access to APIs.
precedence_level: 3
depends_on:
  - PAT-API-SURFACE-BOUNDARIES-001
applies_when:
  - "Configuring browser access to APIs."
---


## Strategy

CORS must be explicit, environment-aware, and minimal. CORS is a browser boundary, not an authorization mechanism.

## Rules

### Must

- Use allowlisted origins per environment.
- Allow credentials only when required.
- Keep exposed headers minimal.
- Enforce backend authorization regardless of CORS.

### Must not

- Do not use wildcard origins with credentials.
- Do not treat CORS as backend authorization.
- Do not expose sensitive headers by default.
- Do not add broad methods or headers without product need.

## Decision rules

- If frontend origin is known, allowlist it.
- If endpoint is public and credentialless, wildcard may be acceptable.
- If auth is required, enforce backend auth in the route/service.
- If multiple environments exist, configure origins per environment.

## Allowed exceptions

- Public static or credentialless APIs may allow `*` when they expose no private data.

## Example

```ts
app.use('*', cors({
  origin: (origin) => allowedOrigins.has(origin) ? origin : null,
  credentials: true,
}))
```

---
id: PAT-API-VERSIONING-001
domain: API
category: VERSIONING
version: 1
description: Use this pattern when changing public or stable internal API contracts.
precedence_level: 4
depends_on:
  - PAT-API-OPENAPI-001
applies_when:
  - "Changing public or stable internal API contracts."
---


## Strategy

Keep API contracts compatible by default. Additive changes are preferred; breaking changes require versioning, deprecation, migration, or explicit human approval.

## Rules

### Must

- Prefer additive optional fields over removing or renaming fields.
- Keep OpenAPI and generated clients aligned with contract changes.
- Document breaking changes with migration or deprecation plan.
- Preserve operation semantics unless a versioned change is intentional.
- Treat domain URL namespace changes from `PAT-DOMAIN-SCHEMA-API-NAMING-001` as public contract changes.

### Must not

- Do not silently change response shapes.
- Do not remove fields, enum values, routes, or operationIds without compatibility plan.
- Do not reuse the same operationId for different semantics.
- Do not let frontend or MCP clients depend on undocumented shapes.

## Decision rules

- If existing clients may break, version or deprecate.
- If change is additive and optional, keep the same version.
- If semantics change, treat it as breaking even when TypeScript still compiles.
- If moving from a legacy URL to `/v1/<domain>/<resources>`, keep a compatibility route or publish a deprecation window unless all consumers are known and migrated.
- If consumers are unknown, assume compatibility matters.

## Allowed exceptions

- Private experimental endpoints may change quickly when they are not production contracts.

## Example

```ts
export const ProjectDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  archivedAt: z.string().datetime().optional(),
})
```

---
id: PAT-API-WEBHOOKS-INBOUND-001
domain: API
category: WEBHOOKS_INBOUND
version: 1
description: Use this pattern when receiving webhooks from external providers.
precedence_level: 5
depends_on:
  - PAT-API-SURFACE-BOUNDARIES-001
  - PAT-API-ZOD-001
applies_when:
  - "Receiving webhooks from external providers."
---


## Strategy

Inbound webhooks must be verified, validated, deduplicated, and processed idempotently. Provider retries are expected.

## Rules

### Must

- Verify provider signature before processing.
- Enforce timestamp tolerance when the provider supports it.
- Validate payloads with Zod or a provider adapter schema.
- Deduplicate by provider event ID.
- Store processing state or enqueue durable work.

### Must not

- Do not process unsigned or unverifiable webhooks.
- Do not trust provider payload shape without validation.
- Do not perform complex long-running work inside the webhook request.
- Do not grant access, credits, or paid state from an unverified event.

## Decision rules

- If provider retries events, dedupe them.
- If processing is slow, acknowledge safely and enqueue work.
- If signature fails, reject without side effects.
- If event affects billing or permissions, audit it.

## Allowed exceptions

- Local development webhook tests may bypass signature only behind explicit dev-only guards.

## Example

```ts
const rawBody = await c.req.text()
verifySignature(rawBody, c.req.header('provider-signature'))

const event = ProviderWebhookSchema.parse(JSON.parse(rawBody))
await webhookService.processIdempotently({ providerEventId: event.id, event })
```

---
id: PAT-API-WEBHOOKS-OUTBOUND-001
domain: API
category: WEBHOOKS_OUTBOUND
version: 1
description: Use this pattern when sending webhooks or external callbacks to customers or providers.
precedence_level: 5
depends_on:
  - PAT-API-CONTRACTS-001
  - PAT-ASYNC-OUTBOX-001
applies_when:
  - "Sending webhooks or external callbacks to customers or providers."
---


## Strategy

Outbound webhooks are durable side effects. Send them through outbox and queue with retries, signing, delivery state, and observability.

## Rules

### Must

- Insert outbound webhook events after successful business commits.
- Send webhooks from queue or worker consumers, not inside DB transactions.
- Sign payloads when the receiver must verify authenticity.
- Record delivery attempts, status, and terminal failures.

### Must not

- Do not send webhooks directly inside DB transactions.
- Do not lose failed deliveries without retry or DLQ.
- Do not retry non-idempotent customer effects without stable event IDs.
- Do not block critical request paths on webhook delivery unless explicitly required.

## Decision rules

- If webhook reflects committed state, use outbox.
- If delivery fails, retry with backoff and track attempts.
- If endpoint is disabled or invalid, stop retrying and mark terminal.
- If webhook payload is public contract, version it.

## Allowed exceptions

- Non-critical best-effort callbacks may skip retries when documented.

## Example

```ts
await outboxRepo.insert({
  type: 'webhook.project.created',
  aggregateId: project.id,
  payload: { eventId, projectId: project.id, organizationId: project.organizationId },
})
```

---
id: PAT-API-MCP-001
domain: API
category: MCP
version: 1
description: Use this pattern when exposing product capabilities to agents through MCP.
precedence_level: 5
depends_on:
  - PAT-API-SURFACE-BOUNDARIES-001
  - PAT-SEC-AUTHORIZATION-001
  - PAT-SEC-AUDIT-EVENTS-001
applies_when:
  - "Exposing product capabilities to agents through MCP."
---


## Strategy

MCP tools are product APIs. They must be curated, typed, permissioned, auditable, and routed through services.

## Rules

### Must

- Use Zod for tool inputs.
- Apply LEMN RBAC and tenant scoping.
- Audit tool calls and results.
- Reuse services and policies.

### Must not

- Do not expose generic execute_sql, unrestricted http_fetch, or filesystem tools without strict scope.
- Do not let MCP tools bypass service layer.
- Do not expose secrets or unnecessary PII.

## Decision rules

- If an agent can trigger product behavior, expose a curated tool.
- If a tool touches tenant data, require RBAC.
- If a tool is dangerous, require explicit approval or narrower capability.

## Allowed exceptions

- Internal-only diagnostic tools may exist with strict non-production scope.

## Example

```ts
const CreateProjectToolInput = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
})

async function createProjectTool(rawInput: unknown, ctx: ToolContext) {
  const input = CreateProjectToolInput.parse(rawInput)
  await rbac.assert(ctx.actorId, input.organizationId, 'project:create')
  return projectsService.create({ ...input, actorId: ctx.actorId })
}
```

---
id: PAT-ERROR-FLOWS-001
domain: ERROR
category: FAILURE_PATHS
version: 2
description: Use this pattern when designing flows that can fail, retry, clean up, or fallback.
precedence_level: 3
depends_on:
  - PAT-API-ERRORS-001
applies_when:
  - "Designing flows that can fail, retry, clean up, or fallback."
---


## Strategy

Failure paths are part of the design. Define errors, retries, cleanup,
fallbacks, idempotency, observability, and terminal states before shipping the
happy path. A catch block is a design decision: it must either convert a failure
into a typed expected outcome, record/observe a best-effort failure, or rethrow.

## Rules

### Must

- Handle expected errors explicitly.
- Define retry and fallback behavior where applicable.
- Clean up or persist recoverable state after partial failure.
- Make retryable flows idempotent.
- Distinguish authoritative failures from optional best-effort failures.
- Preserve enough safe cause metadata for operations, support, and replay.
- Persist terminal failure state for durable jobs, workflows, queues, and
  long-running processes.
- Log or audit best-effort failures with stable codes when the primary flow
  continues.

### Must not

- Do not add error handling as an afterthought.
- Do not let partial failures corrupt state.
- Do not swallow errors that should affect user, job, or audit state.
- Do not let catch blocks convert infrastructure or persistence failure into a
  successful domain result.
- Do not hide missing credentials, missing bindings, provider outages, database
  errors, or migration incompatibilities behind empty lists or null records.
- Do not continue after a failed side effect when downstream state would imply
  the side effect succeeded.

## Decision rules

- If provider call fails, map and decide retry/fallback.
- If multi-step process fails, persist state.
- If cleanup can fail, make it observable.
- If the failed step is required for the user-visible or durable outcome, fail
  the flow or mark the durable process failed.
- If the failed step is optional telemetry, analytics, notification, or
  secondary indexing, the flow may continue only when the failure is recorded
  and the primary state remains truthful.
- If a retry is possible, store idempotency keys, attempts, next retry time,
  terminal status, and safe error code.
- If a fallback changes semantics, expose that state in the response, job state,
  or audit trail.

## Allowed exceptions

- Truly unexpected errors may be delegated to global handlers if they are logged and normalized.
- Best-effort cleanup, telemetry, analytics, and notifications may catch and
  continue only when explicitly documented by the owning use case and observable
  through logs, metrics, audit events, or durable job state.

## Example

```ts
try {
  await provider.send(input)
} catch (cause) {
  await jobsRepo.markFailed(jobId, { code: 'EMAIL_SEND_FAILED' })
  throw AppError.external('EMAIL_PROVIDER_FAILED', { cause })
}
```

Best-effort example:

```ts
await analytics.record(event).catch((cause) => {
  logger.warn("analytics_record_failed", {
    code: "analytics_record_failed",
    requestId,
    cause: safeError(cause),
  })
})
```

---
id: PAT-AUTH-LEMN-001
domain: AUTH
category: LEMN
version: 1
description: Use this pattern when implementing auth, sessions, RBAC, or billing-adjacent identity behavior.
precedence_level: 1
depends_on: []
applies_when:
  - "Implementing auth, sessions, RBAC, or billing-adjacent identity behavior."
---


## Strategy

Use LEMN as the commercial auth and RBAC source. BetterAuth is internal to LEMN and must not become a parallel custom auth system.

## Rules

### Must

- Resolve actor, session, organization, and permissions through LEMN integration.
- Enforce policies in services and tenant scope in repositories.
- Use audit logs for sensitive actions.

### Must not

- Do not implement a parallel auth system.
- Do not rely on frontend-only permissions.
- Do not query tenant data without organization scope.

## Decision rules

- If route is sensitive, require backend authorization.
- If MCP tool acts for a user, apply LEMN RBAC.
- If LEMN API is unclear, inspect internal docs instead of inventing.

## Allowed exceptions

- Public unauthenticated endpoints are allowed only when explicitly product-defined.

## Example

```ts
const auth = await authPort.requireContext(request)
await policy.assertCan(auth.actorId, auth.organizationId, 'project:read')

const project = await projectsRepo.findByIdForOrg({ projectId, organizationId: auth.organizationId })
```

---
id: PAT-AUTH-BILLING-001
domain: AUTH
category: BILLING
version: 2
description: Use this pattern when ingesting billing provider events, payment webhooks, subscription state, invoices, or paid account state.
precedence_level: 1
depends_on:
  - PAT-AUTH-LEMN-001
applies_when:
  - "Ingesting billing provider events, payment webhooks, subscription state, invoices, or paid account state."
---


## Strategy

Use LEMN for commercial billing authority. Verified billing events update an auditable Postgres ledger and derived account state through idempotent processing.

## Rules

### Must

- Verify webhook signatures and provider event identity.
- Deduplicate provider events before changing state.
- Store authoritative billing state and event ledger in Postgres.
- Audit actor/provider, organization, event type, resource, decision, and requestId.
- Reconcile provider state on a schedule or when drift is suspected.

### Must not

- Do not create custom billing when LEMN covers the case.
- Do not store billing authority only in KV.
- Do not grant paid access from an unverified webhook.
- Do not delete billing history required for audit or reconciliation.

## Decision rules

- If event processing can retry, use event-id dedupe and idempotent updates.
- If provider state conflicts with local state, prefer verified provider state and record reconciliation.
- If behavior affects money or access, preserve current behavior until clarified.

## Allowed exceptions

- Derived billing analytics may be copied to ClickHouse.
- Cached billing views may live in KV if Postgres remains authoritative.

## Example

```ts
await billingEvents.ingestVerifiedWebhook({ providerEventId, organizationId, payloadHash })
```

---
id: PAT-AUTH-ENTITLEMENTS-001
domain: AUTH
category: ENTITLEMENTS
version: 1
description: Use this pattern when checking whether an actor or organization may use a paid feature.
precedence_level: 3
depends_on:
  - PAT-AUTH-LEMN-001
  - PAT-AUTH-BILLING-001
applies_when:
  - "Checking whether an actor or organization may use a paid feature."
---


## Strategy

Entitlement checks are authorization decisions. Resolve them server-side through LEMN and authoritative Postgres state before starting paid or restricted work.

## Rules

### Must

- Check entitlement at the service boundary before paid effects.
- Scope checks by actor, organization, plan, feature, and resource when relevant.
- Deny by default when entitlement state is missing or stale.
- Cache only derived entitlement views with short TTL or versioned keys.

### Must not

- Do not trust frontend feature flags as billing authority.
- Do not start paid work before entitlement and quota checks pass.
- Do not hide entitlement decisions inside provider adapters.

## Decision rules

- If a feature is paid, quota-limited, or plan-gated, require entitlement check.
- If entitlement is ambiguous, return a safe denial or ask for product decision.
- If cached entitlement disagrees with Postgres, Postgres wins.

## Allowed exceptions

- Public free features may skip entitlement checks when product-defined.

## Example

```ts
await entitlementPolicy.assertCanUse({
  actorId,
  organizationId,
  feature: 'ai_job',
})
```

---
id: PAT-AUTH-USAGE-METERING-001
domain: AUTH
category: USAGE_METERING
version: 1
description: Use this pattern when recording paid usage, credits, quotas, tokens, seats, or cost-bearing activity.
precedence_level: 4
depends_on:
  - PAT-AUTH-BILLING-001
applies_when:
  - "Recording paid usage, credits, quotas, tokens, seats, or cost-bearing activity."
---


## Strategy

Usage metering is an auditable ledger. Record usage in Postgres with idempotency, then publish derived analytics to ClickHouse when needed.

## Rules

### Must

- Use an idempotency key for metered operations.
- Record actor, organization, feature, amount, unit, source, and occurredAt.
- Store the usage ledger in Postgres before derived analytics.
- Reconcile usage with provider bills or AI Gateway records when possible.

### Must not

- Do not meter only in logs, KV, ClickHouse, or frontend state.
- Do not double-charge on retry.
- Do not estimate billable usage without recording actual reconciliation data later.

## Decision rules

- If usage creates cost or consumes quota, record a ledger entry.
- If the provider reports final usage later, reconcile estimated and final values.
- If a job fails before billable work begins, do not consume credits.

## Allowed exceptions

- Non-billable product telemetry may go directly to analytics when it does not affect entitlement or money.

## Example

```ts
await usageMeter.record({
  organizationId,
  idempotencyKey,
  feature: 'ai_job',
  amount: tokenCount,
  unit: 'tokens',
})
```

---
id: PAT-SEC-SECRETS-001
domain: SEC
category: SECRETS
version: 1
description: Use this pattern when code, tests, docs, logs, config, or workflows touch credentials.
precedence_level: 1
depends_on: []
applies_when:
  - "Code, tests, docs, logs, config, or workflows touch credentials."
---


## Strategy

Secrets must live outside the repo and be referenced through approved secret bindings or CI secret stores.

## Rules

### Must

- Use Cloudflare Secrets or approved CI secret mechanisms.
- Keep tokens, API keys, prod values, and customer data out of code and docs.
- Redact sensitive values in logs and artifacts.

### Must not

- Do not commit credentials, auth headers, provider keys, prod URLs with secrets, or client data.
- Do not place secrets in snapshots, generated docs, or fixtures.
- Do not print secrets during tests or deploy.

## Decision rules

- If a value grants access, treat it as secret.
- If a value is environment-specific, use config or secrets.
- If unsure, classify as sensitive and ask.

## Allowed exceptions

- Non-sensitive public config may live in env vars or repo config when explicitly safe.

## Example

```ts
// Good: secret binding provided by platform
const token = env.PROVIDER_API_TOKEN

// Bad: const token = 'sk_live_...'
```

---
id: PAT-SEC-RISK-001
domain: SEC
category: RISK_MODEL
version: 1
description: Use this pattern before touching secrets, privacy, authorization, CORS, SSRF, destructive actions, or customer data.
precedence_level: 1
depends_on: []
applies_when:
  - "Touching secrets, privacy, authorization, CORS, SSRF, destructive actions, or customer data."
---


## Strategy

Model risk before changing sensitive data flows. Security, privacy, and data-loss concerns must be explicit, not accidental.

## Rules

### Must

- Identify sensitive inputs, outputs, and side effects.
- Check auth, CORS, SSRF, data loss, and secret exposure risks.
- Add safeguards before merging sensitive changes.

### Must not

- Do not broaden access silently.
- Do not add external fetch capability without allowlists or policy.
- Do not delete or migrate data without a plan.

## Decision rules

- If code crosses trust boundaries, do a risk check.
- If external URLs are user-controlled, consider SSRF.
- If data is private, minimize and redact.

## Allowed exceptions

- Low-risk UI-only changes may not need a formal risk note.

## Example

```ts
const allowedHosts = new Set(['api.provider.com'])
const url = new URL(input.callbackUrl)
if (!allowedHosts.has(url.hostname)) throw AppError.validation('CALLBACK_HOST_NOT_ALLOWED')
```

---
id: PAT-SEC-AUTHORIZATION-001
domain: SEC
category: AUTHORIZATION
version: 1
description: Use this pattern when implementing sensitive routes, tools, jobs, or data access.
precedence_level: 3
depends_on:
  - PAT-AUTH-LEMN-001
applies_when:
  - "Implementing sensitive routes, tools, jobs, or data access."
---


## Strategy

Backend authorization must validate actor, tenant, role, permissions, and ownership. Frontend checks are only UX.

## Rules

### Must

- Check actor/session server-side.
- Check tenant and ownership in services and repositories.
- Use RBAC/policies for sensitive actions.

### Must not

- Do not trust user-provided organizationId without authorization.
- Do not rely only on frontend route guards.
- Do not return resources without tenant scoping.

## Decision rules

- If route reads private data, authorize it.
- If route mutates state, authorize and audit it.
- If repository query is multi-tenant, include tenant filter.

## Allowed exceptions

- Public resources may skip auth only when intentionally public and safe.

## Example

```ts
await policy.assertCanUpdateProject({ actorId, organizationId, projectId })
await projectsRepo.updateName({ organizationId, projectId, name })
```

---
id: PAT-SEC-TENANT-ISOLATION-001
domain: SEC
category: TENANT_ISOLATION
version: 1
description: Use this pattern when reading or writing tenant-scoped product data.
precedence_level: 3
depends_on:
  - PAT-SEC-AUTHORIZATION-001
applies_when:
  - "Reading or writing tenant-scoped product data."
---


## Strategy

Tenant isolation must be enforced in authorization and persistence. Services authorize access; repositories filter by organization or tenant.

## Rules

### Must

- Include `organization_id` or `tenant_id` in tenant-scoped tables.
- Authorize actor access to the tenant in services.
- Filter repository queries by tenant boundary.
- Test cross-tenant access denial for sensitive flows.

### Must not

- Do not fetch tenant resources by resource ID alone.
- Do not trust `organizationId` supplied by the client without verifying membership or permissions.
- Do not expose cross-tenant search, analytics, files, or agent results.
- Do not rely only on frontend tenant selection.

## Decision rules

- If a resource belongs to an organization, filter by `organization_id`.
- If actor can belong to multiple orgs, require explicit org context.
- If tenant boundary is unclear, ask before implementing.
- If data is globally public, model that explicitly.

## Allowed exceptions

- Globally public resources may omit tenant scoping when intentionally modeled as public and safe.

## Example

```ts
return db
  .selectFrom('projects')
  .selectAll()
  .where('id', '=', projectId)
  .where('organization_id', '=', organizationId)
  .executeTakeFirst()
```

---
id: PAT-SEC-PUBLIC-ERRORS-001
domain: SEC
category: PUBLIC_ERRORS
version: 1
description: Use this pattern when converting internal failures to client-visible responses.
precedence_level: 3
depends_on:
  - PAT-API-PROBLEM-DETAILS-001
applies_when:
  - "Converting internal failures to client-visible responses."
---


## Strategy

Expose safe status, title, code, and requestId to clients. Keep stacks, SQL, provider details, and internal state in logs/tracing only.

## Rules

### Must

- Return normalized safe errors.
- Keep internal diagnostics out of public response bodies.
- Correlate public errors with logs via requestId.

### Must not

- Do not reveal stack traces, SQL, provider credentials, table names, or internal exception messages.
- Do not return raw validation/provider errors without normalization.
- Do not hide expected errors as 500s.

## Decision rules

- If user can act on it, expose a safe message.
- If detail helps only developers, log it.
- If error is authorization-related, avoid leaking resource existence when needed.

## Allowed exceptions

- Development environments may show more detail behind explicit local-only guards.

## Example

```ts
catch (error) {
  const appError = normalizeError(error)
  logger.error('request.failed', { requestId, code: appError.code, cause: error })
  return c.json(toProblemDetails(appError, requestId), appError.status)
}
```

---
id: PAT-SEC-LOGGING-001
domain: SEC
category: LOGGING
version: 1
description: Use this pattern when adding or changing logs, traces, metrics, or debug output.
precedence_level: 4
depends_on:
  - PAT-SEC-PUBLIC-ERRORS-001
applies_when:
  - "Adding or changing logs, traces, metrics, or debug output."
---


## Strategy

Logs must be useful, minimal, correlated, and safe. Never log secrets, sensitive payloads, full provider bodies, or unnecessary PII.

## Rules

### Must

- Include requestId, traceId, operation, status, and stable error code.
- Redact tokens, headers, secrets, and sensitive bodies.
- Log enough to debug without leaking customer data.

### Must not

- Do not log Authorization headers, API keys, prompts with sensitive content, or raw customer payloads.
- Do not log entire provider responses by default.
- Do not create logs without correlation IDs.

## Decision rules

- If value can identify or authenticate a user, redact it.
- If debugging needs sensitive payloads, use explicit secure sampling policy.
- If queue/workflow fails, log job/run IDs.

## Allowed exceptions

- Local development debug logs may be more verbose when never committed or shipped.

## Example

```ts
logger.info('project.created', {
  requestId,
  organizationId,
  actorId,
  projectId,
})
```

---
id: PAT-SEC-AUDIT-EVENTS-001
domain: SEC
category: AUDIT_EVENTS
version: 1
description: Use this pattern when recording security, billing, MCP, authorization, admin, or state-changing tool decisions.
precedence_level: 4
depends_on:
  - PAT-SEC-AUTHORIZATION-001
  - PAT-SEC-LOGGING-001
applies_when:
  - "Recording security, billing, MCP, authorization, admin, or state-changing tool decisions."
---


## Strategy

Audit events are durable decision records, not debug logs. They record who acted, on what, under which tenant and policy, with safe metadata that supports investigation and reconciliation.

## Rules

### Must

- Record actor, organization, action, resource type/id, decision, requestId, and occurredAt.
- Redact secrets, prompts, provider bodies, and unnecessary PII.
- Store state-changing billing, auth, admin, and MCP tool decisions durably.
- Include source system and idempotency/event IDs when present.
- Make audit event schemas versioned.

### Must not

- Do not rely only on best-effort logs for money, auth, or admin decisions.
- Do not store raw tokens, credentials, private payloads, or full tool outputs.
- Do not let frontend events become audit authority.

## Decision rules

- If a decision grants access, spends money, changes state, or calls a tool for a user, audit it.
- If a provider event changes billing or entitlement, include provider event id.
- If an audit event is sensitive, protect access and retention separately from debug logs.

## Allowed exceptions

- Low-risk read-only access may use structured logs when product policy does not require audit retention.

## Example

```ts
await audit.record({
  actorId,
  organizationId,
  action: 'project.delete',
  resourceId: projectId,
  decision: 'allowed',
  requestId,
})
```

---
id: PAT-SEC-PROXY-PATTERN-001
domain: SEC
category: PROXY_PATTERN
version: 1
description: Use the Proxy Pattern when access to a sensitive capability must be mediated, authorized, audited, or filtered before reaching the real provider or tool.
precedence_level: 4
depends_on:
  - PAT-SEC-AUTHORIZATION-001
  - PAT-SEC-AUDIT-EVENTS-001
  - PAT-ARCH-PORTS-ADAPTERS-001
applies_when:
  - "Access to a sensitive capability must be mediated, authorized, audited, or filtered before reaching the real provider or tool."
---


## Strategy

Use the Proxy Pattern for sensitive capabilities that should not be exposed
directly to callers, agents, browsers, CLIs, or third-party systems. A proxy is
a controlled stand-in for the real capability. It checks authorization,
enforces policy, redacts or shapes input/output, records audit evidence, and
then delegates to the real adapter or provider only when allowed.

This pattern is especially important when the caller should not receive raw
secrets or direct provider credentials.

## Rules

### Must

- Put authorization and tenant-scope checks before delegating to the real capability.
- Enforce least privilege and deny by default when policy is missing or ambiguous.
- Keep secrets in the proxy or backing adapter, not in the caller.
- Record durable audit events for allowed, denied, approval-required, or state-changing decisions.
- Redact sensitive inputs and outputs before logging, tracing, or returning to less-trusted callers.
- Use ports/adapters behind the proxy so provider details remain isolated.
- Define timeout, retry, idempotency, and failure mapping for proxied calls that cross a provider or runtime boundary.

### Must not

- Do not hand provider tokens, API keys, or broad credentials to agents or browsers when a proxy can execute the capability.
- Do not let the proxy bypass service-layer authorization or tenant scoping.
- Do not expose raw provider errors, raw secret values, or full sensitive tool outputs.
- Do not let the proxy become a generic unrestricted HTTP, SQL, filesystem, or shell gateway.
- Do not hide business policy in a low-level provider adapter when the proxy is the decision boundary.

## Decision rules

- If the caller should not own credentials, use a proxy.
- If a tool call can spend money, mutate state, access private data, or require approval, route it through a proxy.
- If the proxy only forwards without authorization, audit, filtering, or secret isolation, it is not justified.
- If a human approval is required, return an approval-required decision and create a durable human task instead of blocking indefinitely.
- If the proxied capability is read-only but sensitive, still enforce tenant scope and redaction.

## Allowed exceptions

- Local development tools may use direct credentials when explicitly outside production and excluded from commits, logs, and artifacts.
- Some CLIs may require ephemeral credentials in the execution environment when no API or MCP proxy exists; scope and lifetime must be minimal.

## Example

```txt
Caller -> capability proxy -> policy check -> audit decision -> provider adapter

Allowed: proxy executes the provider call and returns a safe result.
Denied: proxy returns a safe denial without exposing provider details.
Approval: proxy creates a human task and waits for a later retry/resume path.
```

---
id: PAT-ASYNC-PRIMITIVE-DECISION-001
domain: ASYNC
category: PRIMITIVE_DECISION
version: 1
description: Use this pattern when choosing between waitUntil, Queue, Workflow, Durable Object, Service Binding, or direct execution.
precedence_level: 1
depends_on: []
applies_when:
  - "Choosing between waitUntil, Queue, Workflow, Durable Object, Service Binding, or direct execution."
---


## Strategy

Choose the async primitive by durability, duration, coordination, and caller
expectations. Do not use infrastructure boundaries as a substitute for clear
workflow semantics or simple code organization.

## Rules

### Must

- Use direct execution when the caller needs the result immediately and work is bounded.
- Use `waitUntil` only for short best-effort post-response work.
- Use Queue for durable retryable single-step work.
- Use Workflow for long or multi-step durable processes.
- Use Durable Object for strong coordination, locks, realtime, or single-writer state.
- Use Service Binding for internal Worker boundaries, not durable background work.
- Use outbox plus Queue or Workflow when an external effect must follow a
  committed database change.

### Must not

- Do not use `waitUntil` for critical long-running work.
- Do not use Queue for multi-step orchestration without a state model.
- Do not use Workflow for one short retryable task.
- Do not create a Worker boundary only for code organization.
- Do not use Service Binding for work that can happen after the response.
- Do not hide state synchronization in ad hoc Worker-to-Worker calls.

## Decision rules

- If loss is acceptable, `waitUntil` may fit.
- If delivery must retry, use Queue.
- If progress must survive sleeps, retries, or external events, use Workflow.
- If concurrent actors need one coordinator, use Durable Object.
- If an immediate internal Worker answer is required and isolation or bundle
  boundary is justified, use Service Binding.
- If a committed database change must trigger external work, use outbox plus
  Queue or Workflow.

## Allowed exceptions

- Existing platform constraints may choose a primitive when documented with owner and rollback path.

## Example

```txt
best-effort telemetry -> waitUntil
email/webhook retry -> Queue
fulfillment with waits -> Workflow
session/presence lock -> Durable Object
private internal API with immediate answer -> Service Binding
post-commit external side effect -> outbox + Queue
```

---
id: PAT-ASYNC-CONTROLLED-001
domain: ASYNC
category: CONTROLLED_ASYNC
version: 1
description: Use this pattern when code performs writes, deletes, network calls, validation, or background work.
precedence_level: 2
depends_on:
  - PAT-ASYNC-PRIMITIVE-DECISION-001
applies_when:
  - "Code performs writes, deletes, network calls, validation, or background work."
---


## Strategy

Async effects must be awaited, handled, propagated, or intentionally scheduled through durable primitives. Critical work is never fire-and-forget.

## Rules

### Must

- Await or return Promises for critical work.
- Handle or propagate errors explicitly.
- Use Queue, Workflow, or outbox for durable async effects.

### Must not

- Do not use empty catch blocks.
- Do not ignore write/delete/network errors.
- Do not use waitUntil for critical long-running work without durability.

## Decision rules

- If failure changes business state, handle it.
- If caller need not wait but work is important, enqueue it.
- If cleanup is needed, include it in the failure path.

## Allowed exceptions

- Non-critical telemetry may use waitUntil if loss is acceptable.

## Example

```ts
// Critical: enqueue and await
await env.EMAIL_QUEUE.send({ type: 'welcome_email', userId })

// Best-effort only
ctx.waitUntil(analytics.track(event))
```

---
id: PAT-ASYNC-HEAVY-WORK-001
domain: ASYNC
category: HEAVY_WORK
version: 1
description: Use this pattern when a request path includes slow, costly, CPU-heavy, or retryable work.
precedence_level: 2
depends_on:
  - PAT-ASYNC-PRIMITIVE-DECISION-001
applies_when:
  - "A request path includes slow, costly, CPU-heavy, or retryable work."
---


## Strategy

Heavy work belongs outside the synchronous request path. Offload to Queue, Workflow, scheduled work, Service Binding, or Sandbox depending on durability and runtime needs.

## Rules

### Must

- Keep HTTP request paths fast and bounded.
- Offload slow or expensive work to the correct async primitive.
- Return job IDs or accepted responses when work continues asynchronously.

### Must not

- Do not block requests on long AI jobs, imports, exports, PDF generation, or external retries.
- Do not run CPU-heavy work in the main API Worker when it risks limits.
- Do not hide long work behind waitUntil when durability matters.

## Decision rules

- If work is short and best-effort, waitUntil may fit.
- If work is retryable, use Queue.
- If work is multi-step or long, use Workflow.
- If code execution is unsafe/heavy, use Sandbox or separate Worker.

## Allowed exceptions

- Small synchronous operations are allowed when they are bounded and user-visible latency is acceptable.

## Example

```ts
const job = await aiJobsService.create(input)
await env.AI_JOB_QUEUE.send({ jobId: job.id })
return c.json({ jobId: job.id, status: 'queued' }, 202)
```

---
id: PAT-ASYNC-IDEMPOTENCY-001
domain: ASYNC
category: IDEMPOTENCY
version: 1
description: Use this pattern when a mutation, job, webhook, queue, or workflow can be retried.
precedence_level: 3
depends_on:
  - PAT-ASYNC-CONTROLLED-001
applies_when:
  - "A mutation, job, webhook, queue, or workflow can be retried."
---


## Strategy

Retries are expected. Use idempotency keys, request hashes, event IDs, execution records, and dedupe state so repeated delivery does not repeat business effects.

## Rules

### Must

- Use idempotency for paid or costly POST operations.
- Store request hash, result, status, and expiry when client retries are possible.
- Dedupe inbound provider webhooks by provider event ID.
- Make queue consumers safe for at-least-once delivery.
- Record execution state for jobs and workflows.

### Must not

- Do not allow duplicate charges, duplicate jobs, or duplicate webhooks by retry.
- Do not process inbound webhooks without dedupe.
- Do not reuse one idempotency key across different actors, organizations, or request shapes.

## Decision rules

- If client can retry, make request idempotent.
- If provider can retry, dedupe event IDs.
- If queue can redeliver, make consumer safe.
- If request hash differs for an existing key, reject the replay.

## Allowed exceptions

- Read-only operations do not need idempotency beyond normal caching semantics.

## Example

```ts
const claim = await idempotency.claim({ key, actorId, organizationId, requestHash })
if (claim.status === 'replay') return claim.response
```

---
id: PAT-ASYNC-OUTBOX-001
domain: ASYNC
category: OUTBOX
version: 1
description: Use this pattern when a committed database change must reliably trigger email, webhooks, queues, analytics, or provider calls.
precedence_level: 3
depends_on:
  - PAT-ASYNC-IDEMPOTENCY-001
  - PAT-DATA-TRANSACTIONS-001
applies_when:
  - "A committed database change must reliably trigger email, webhooks, queues, analytics, or provider calls."
---


## Strategy

Write outbound side-effect intents into Postgres inside the same transaction as the business change. A dispatcher publishes them after commit with retry, dedupe, and poison handling.

## Rules

### Must

- Insert outbox records in the same transaction as the state change.
- Include event type, aggregate id, organization id, payload version, idempotency key, and attempt state.
- Dispatch outbox records outside the DB transaction.
- Make consumers idempotent because delivery may repeat.
- Record terminal failure or DLQ state after retry budget is exhausted.

### Must not

- Do not call external providers inside the database transaction.
- Do not publish queue messages before the business commit is durable.
- Do not delete failed outbox records without audit trail.

## Decision rules

- If a side effect must follow a commit, use outbox.
- If loss is acceptable, `waitUntil` or best-effort telemetry may be enough.
- If dispatch is multi-step or long-running, enqueue or start a Workflow from the outbox.

## Allowed exceptions

- Synchronous provider calls may happen before commit only when they are pure validation and have no durable side effect.

## Example

```ts
await db.transaction().execute(async (trx) => {
  const job = await jobsRepo(trx).create(input)
  await outboxRepo(trx).insert({ type: 'job.created', aggregateId: job.id })
})
```

---
id: PAT-ASYNC-EXTERNAL-CALLS-001
domain: ASYNC
category: EXTERNAL_CALLS
version: 1
description: Use this pattern when calling external providers, APIs, LLMs, payment systems, or webhooks.
precedence_level: 3
depends_on:
  - PAT-ASYNC-IDEMPOTENCY-001
applies_when:
  - "Calling external providers, APIs, LLMs, payment systems, or webhooks."
---


## Strategy

External calls must have timeouts, bounded retries, error mapping, and concurrency control appropriate to cost and risk.

## Rules

### Must

- Set explicit timeouts.
- Use retries with backoff only for retryable failures.
- Map provider errors into AppError or job failure state.
- Limit concurrency for expensive providers.

### Must not

- Do not let provider calls hang indefinitely.
- Do not retry non-idempotent writes blindly.
- Do not expose raw provider errors to clients.

## Decision rules

- If call is user-facing, bound latency.
- If call is async, use Queue/Workflow with retry policy.
- If call creates cost, track actor/org and usage.

## Allowed exceptions

- Provider SDK defaults may be accepted only if verified and safe for the use case.

## Example

```ts
const signal = AbortSignal.timeout(10_000)
const response = await fetch(providerUrl, { method: 'POST', body, signal })
if (!response.ok) throw AppError.external('PROVIDER_REQUEST_FAILED')
```

---
id: PAT-ASYNC-QUEUES-001
domain: ASYNC
category: QUEUES
version: 1
description: Use this pattern when work is async, retryable, and does not need to block the HTTP response.
precedence_level: 4
depends_on:
  - PAT-ASYNC-CONTROLLED-001
  - PAT-ASYNC-IDEMPOTENCY-001
applies_when:
  - "Work is async, retryable, and does not need to block the HTTP response."
---


## Strategy

Use Cloudflare Queues for reliable asynchronous work such as emails, webhooks, analytics ingestion, and retryable tasks.

## Rules

### Must

- Enqueue after durable state is recorded.
- Design consumers to be idempotent.
- Use DLQ or terminal failure handling for repeated failures.
- Include requestId/traceId or job/run identifiers in queue payloads when the
  work affects product state, providers, audit, billing, or user-visible status.

### Must not

- Do not block request paths on secondary effects.
- Do not use Queue for complex long-running orchestration without state model.
- Do not lose important events without retry or DLQ.
- Do not use Service Binding for retryable post-response work that belongs in a Queue.

## Decision rules

- If user does not need the result immediately, consider Queue.
- If task is multi-step or long, consider Workflow.
- If event comes from transaction, pair with outbox.
- If the event represents a committed state change that must reach a provider,
  customer webhook, or downstream process, pair Queue with outbox.

## Allowed exceptions

- Best-effort analytics may skip outbox when loss is acceptable and documented.

## Example

```ts
export async function queue(batch: MessageBatch<EmailJob>, env: Env) {
  for (const message of batch.messages) {
    await emailConsumer.handle(message.body, createAdapters(env))
    message.ack()
  }
}
```

---
id: PAT-ASYNC-WORKFLOWS-001
domain: ASYNC
category: WORKFLOWS
version: 1
description: Use this pattern when work is long, multi-step, retryable, or needs recovery.
precedence_level: 5
depends_on:
  - PAT-ASYNC-CONTROLLED-001
  - PAT-ASYNC-IDEMPOTENCY-001
applies_when:
  - "Work is long, multi-step, retryable, or needs recovery."
---


## Strategy

Use Cloudflare Workflows for durable processes with steps, retries, sleeps, external events, and progress state.

## Rules

### Must

- Model each durable step explicitly.
- Persist job state in Postgres.
- Make steps retry-safe and observable.
- Link workflow instance IDs to product state, requestId/traceId, and audit or
  job records when the workflow affects user-visible state.

### Must not

- Do not run long multi-step work inside fetch handlers.
- Do not emulate workflows with manual sleeps or scattered queues.
- Do not hide workflow state only in logs.
- Do not use Service Binding chains as a substitute for a durable workflow.

## Decision rules

- If process may last minutes or resume after failure, use Workflow.
- If process is one short async task, Queue may fit.
- If human approval is needed, model it as workflow state.
- If a workflow starts because of committed database state, start it from the
  outbox or record a durable start marker with idempotency.

## Allowed exceptions

- Simple scheduled cleanup may use cron/scheduled handler if durable recovery is not needed.

## Example

```ts
await workflows.start('ai-job', { id: jobId, organizationId })

// workflow steps: validate -> run model -> store artifact -> mark completed
```

---
id: PAT-ASYNC-DURABLE-PROCESS-001
domain: ASYNC
category: DURABLE_PROCESS
version: 1
description: Use this pattern when a business process spans multiple states, providers, or retries.
precedence_level: 5
depends_on:
  - PAT-ASYNC-WORKFLOWS-001
applies_when:
  - "A business process spans multiple states, providers, or retries."
---


## Strategy

Represent durable processes as state machines with explicit status, transitions, recovery, and traceability.

## Rules

### Must

- Store process status and step state.
- Define retry and terminal failure behavior.
- Correlate process IDs with logs, traces, artifacts, and billing usage.

### Must not

- Do not represent long processes only as in-memory promises.
- Do not rely on logs as the only state.
- Do not leave partial states without recovery path.

## Decision rules

- If a process can fail halfway, model status.
- If user can inspect progress, persist progress.
- If retry can duplicate side effects, add idempotency.

## Allowed exceptions

- Short single-step effects may not need explicit state machine.

## Example

```ts
type JobStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'failed'

await jobsRepo.transition({ jobId, from: 'queued', to: 'running' })
```

---
id: PAT-ASYNC-CHECKPOINT-RESUME-001
domain: ASYNC
category: CHECKPOINT_RESUME
version: 1
description: Use the Checkpoint / Resume Pattern when a long-running process must pause, survive runtime teardown, and continue from durable state.
precedence_level: 5
depends_on:
  - PAT-ASYNC-DURABLE-PROCESS-001
  - PAT-DATA-ARTIFACTS-001
  - PAT-OBS-TRACE-CONTEXT-001
applies_when:
  - "A long-running process must pause, survive runtime teardown, and continue from durable state."
---


## Strategy

Use the Checkpoint / Resume Pattern when work may pause for human input,
external events, sandbox teardown, provider recovery, deployment, or long waits.
The process must persist enough state to resume without relying on memory,
live processes, temporary files, or logs.

For file-tree workloads, store workspace snapshots in Cloudflare Artifacts and
store metadata, status, checkpoint references, and correlation IDs in Postgres.
Use R2 for blobs and raw traces when appropriate.

## Rules

### Must

- Persist checkpoint metadata in Postgres before tearing down or releasing runtime resources.
- Store file-tree checkpoints in Artifacts when the process owns a mutable workspace.
- Store large blobs, attachments, and raw traces in R2 with Postgres metadata.
- Include process id, checkpoint id, status, step name, traceId/requestId, artifact refs, createdAt, and resume eligibility.
- Make resume idempotent and safe after duplicate events or retries.
- Define what state is authoritative, what can be recomputed, and what is discarded.
- Clean up temporary runtime directories, sandboxes, leases, and credentials after checkpointing.
- Test pause, resume, duplicate resume, failed resume, missing artifact, and terminal-state behavior.

### Must not

- Do not rely on in-memory promises, live containers, shell state, or temporary files as authoritative checkpoint state.
- Do not store secrets, provider credentials, or raw sensitive payloads in Artifacts, R2, logs, or checkpoint metadata.
- Do not resume from a checkpoint without revalidating tenant scope, permissions, and current process status.
- Do not keep paid or ephemeral compute alive while waiting for long human or external input.
- Do not overwrite newer checkpoints with stale resumes.

## Decision rules

- If runtime can be destroyed before completion, checkpoint before waiting.
- If human approval or document upload is required, persist a checkpoint and release expensive runtime resources.
- If the process modifies a file tree, use Artifacts for the checkpoint and R2 only for large blobs.
- If the process can resume from a provider callback, include provider event id and idempotency key.
- If restoring state would repeat side effects, store completed step markers and skip already-completed steps.

## Allowed exceptions

- Short retryable queue tasks may use normal idempotency without checkpointing when no runtime teardown or long wait is expected.
- Local development runs may keep temporary files for debugging when they are ignored by git and have an explicit cleanup policy.

## Example

```txt
Run enters waiting_for_human:
  1. write workspace checkpoint to Artifacts
  2. store checkpoint metadata in Postgres
  3. create HumanTask
  4. stop sandbox or release runner lease
  5. resume later from checkpoint after HumanTask is answered
```

---
id: PAT-TEST-INTEGRITY-001
domain: TEST
category: INTEGRITY
version: 1
description: Use this pattern when touching tests, snapshots, mocks, or behavior covered by tests.
precedence_level: 1
depends_on: []
applies_when:
  - "Touching tests, snapshots, mocks, or behavior covered by tests."
---


## Strategy

Tests are behavior contracts. Preserve or strengthen them instead of deleting, weakening, over-mocking, or regenerating snapshots blindly.

## Rules

### Must

- Keep existing meaningful assertions.
- Add coverage for changed behavior.
- Review snapshot changes semantically.

### Must not

- Do not delete tests to make CI pass.
- Do not over-mock away real behavior.
- Do not regenerate snapshots without understanding the change.

## Decision rules

- If behavior changes intentionally, update tests to match explicit intent.
- If test fails due to bug, fix code.
- If test is wrong, explain why and update it narrowly.

## Allowed exceptions

- Flaky tests may be quarantined only with owner, reason, and follow-up.

## Example

```ts
it('preserves tenant scoping', async () => {
  await expect(service.getProject({ actorId, organizationId: otherOrg, projectId })).rejects.toMatchObject({ code: 'PROJECT_NOT_FOUND' })
})
```

---
id: PAT-TEST-PLACEMENT-001
domain: TEST
category: PLACEMENT
version: 1
description: Use this pattern when deciding where test files and test-only support artifacts should live.
precedence_level: 2
depends_on:
  - PAT-CODE-SCRIPT-GOVERNANCE-001
applies_when:
  - "Deciding where test files and test-only support artifacts should live."
---


## Strategy

Every service, app, or package keeps all test-only artifacts under a first-level `tests/` directory at that service root. Source ownership is preserved by mirroring the `src/` module or workflow path under `tests/<level>/`, not by placing test files inside production source folders.

## Rules

### Must

- Put all test files and test-only support artifacts under `<service-or-package>/tests/`.
- Use verification-level folders under `tests/`: `unit/`, `integration/`, `contract/`, `e2e/`, `smoke/`, `fixtures/`, `fakes/`, `mocks/`, `mockups/`, `helpers/`, `setup/`, and `snapshots/` as needed.
- Mirror production ownership under the relevant level folder, for example `src/modules/tasks/create/command.ts` maps to `tests/unit/modules/tasks/create/command.test.ts`.
- For domain/resource modules, mirror the vocabulary from `PAT-DOMAIN-SCHEMA-API-NAMING-001` in API and frontend test paths.
- Keep backend, worker, runner, and frontend services on the same root-level convention.
- Put reusable test helpers, fakes, mocks, mockups, fixtures, setup code, and snapshots under the owning service's `tests/` tree.
- Configure test runners to collect tests from the owning `tests/` tree by level, for example Vitest `include` globs or Playwright `testDir`/`testMatch`.
- Configure architecture checks so `src/` remains production source and `tests/` remains test-only source.
- Keep production build, packaging, and generated-client inputs from treating `tests/` as runtime source.

### Must not

- Do not place `*.test.*`, `*.spec.*`, `__tests__/`, or `tests/` directories inside production `src/`.
- Do not place integration, e2e, smoke, fixtures, fakes, mocks, mockups, helpers, setup, or snapshots at package root outside `tests/`.
- Do not put reusable fixtures, fakes, mocks, or helpers inside production source modules.
- Do not use test placement to bypass module boundaries or import private internals from other modules.
- Do not leave unrelated package-root test files as a permanent home for product behavior.

## Decision rules

- If a test runs pure business logic with faked ports, put it under `tests/unit/` and mirror the source owner.
- If a test covers a domain/resource workflow, use the same domain/resource owner path as the API or frontend module.
- If a test verifies SQL, migrations, provider adapters, Cloudflare bindings, generated clients, or external transport behavior, put it under `tests/integration/` or `tests/contract/`.
- If a test verifies a complete user, browser, API, deployment, or staging workflow, put it under `tests/e2e/` or `tests/smoke/`.
- If a test artifact is reused across modules, keep it under `tests/helpers/`, `tests/fakes/`, `tests/mocks/`, `tests/mockups/`, or `tests/fixtures/` instead of product shared folders.
- If legacy tests cannot move immediately, document owner, reason, migration target, and expiry where the package has an exception mechanism.
- If a package has no exception mechanism, fail CI on new test artifacts outside `<service-or-package>/tests/` and migrate existing violations before marking the package compliant.

## Allowed exceptions

- Framework-required config files may stay where the framework requires, but they should point to implementation under `tests/setup/` or `tests/helpers/`.
- Generated snapshots or fixtures may live in tool-required output directories only when the generation path is documented and ignored from production source.
- Legacy source-colocated tests may remain temporarily with explicit migration ownership and expiry.

## Example

```txt
services/public-api/src/modules/tasks/create/command.ts
services/public-api/tests/unit/modules/tasks/create/command.test.ts
services/public-api/tests/integration/tasks/task-dispatch.integration.test.ts
services/public-api/tests/contract/openapi/openapi.test.ts
services/public-api/tests/e2e/api/task-lifecycle.e2e.test.ts
services/public-api/tests/smoke/staging/task-lifecycle.smoke.test.ts
services/public-api/tests/fixtures/tasks/create-task.json
services/public-api/tests/fakes/queue.ts
services/public-api/tests/mocks/providers/github.ts
services/public-api/tests/mockups/dashboard/task-list-state.ts
services/public-api/tests/helpers/create-test-app.ts
services/public-api/tests/setup/vitest.setup.ts

apps/dashboard/src/modules/tasks/TaskList.tsx
apps/dashboard/tests/unit/modules/tasks/TaskList.test.tsx
apps/dashboard/tests/e2e/task-lifecycle.e2e.ts
apps/dashboard/tests/mocks/api/tasks.ts
```

---
id: PAT-TEST-MEANINGFUL-001
domain: TEST
category: MEANINGFUL
version: 1
description: Use this pattern when adding or modifying tests for a feature or fix.
precedence_level: 3
depends_on:
  - PAT-TEST-INTEGRITY-001
  - PAT-TEST-PLACEMENT-001
applies_when:
  - "Adding or modifying tests for a feature or fix."
---


## Strategy

Validate behavior at the correct level. Tests should cover success, errors, permissions, limits, retries, idempotency, and real behavior when applicable.

## Rules

### Must

- Test services with faked ports.
- Test repositories against real Postgres/Neon branch when query behavior matters.
- Test API contracts and error shapes.
- Place tests according to `PAT-TEST-PLACEMENT-001` so unit, integration, contract, e2e, smoke, fixtures, fakes, mocks, mockups, helpers, setup code, and snapshots are separated by verification level and package ownership.

### Must not

- Do not rely only on shallow implementation tests.
- Do not mock the DB for query correctness.
- Do not test only the happy path for sensitive flows.

## Decision rules

- If logic is business-heavy, unit test service.
- If logic is SQL-heavy, test repository.
- If behavior is public API, test HTTP contract.
- If a test crosses process, database, provider, binding, browser, or deployment boundaries, place it outside unit-test source folders.

## Allowed exceptions

- Tiny presentation-only changes may need lighter tests if existing coverage is sufficient.

## Example

```ts
it('rejects duplicate idempotency key with different payload', async () => {
  await expect(service.createCharge({ key, amount: 200 })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' })
})
```

---
id: PAT-TEST-CORE-FAKES-001
domain: TEST
category: CORE_FAKES
version: 1
description: Use this pattern when testing business logic that depends on Cloudflare bindings or external providers.
precedence_level: 3
depends_on:
  - PAT-TEST-MEANINGFUL-001
  - PAT-ARCH-BINDINGS-ADAPTERS-001
applies_when:
  - "Testing business logic that depends on Cloudflare bindings or external providers."
---


## Strategy

Core business tests should use fake ports instead of real Cloudflare bindings or providers. This keeps domain logic deterministic and fast.

## Rules

### Must

- Inject ports into services.
- Use fakes for email, payment, AI, storage, analytics, and clock.
- Assert behavior and side effects at the port boundary.

### Must not

- Do not require real KV/R2/Queue/provider for pure service tests.
- Do not couple domain tests to env bindings.
- Do not mock so deeply that behavior disappears.

## Decision rules

- If testing service logic, fake providers.
- If testing adapter behavior, use adapter smoke tests.
- If testing DB queries, use real DB preview.

## Allowed exceptions

- End-to-end tests may use real or staging providers when explicitly configured.

## Example

```ts
const emailFake: EmailProvider = {
  sent: [],
  async sendEmail(input) { this.sent.push(input) },
} as EmailProvider & { sent: unknown[] }
```

---
id: PAT-TEST-CLOUDFLARE-ADAPTERS-001
domain: TEST
category: CLOUDFLARE_ADAPTERS
version: 1
description: Use this pattern when changing adapters for KV, R2, Queues, Workflows, Durable Objects, bindings, or Worker runtime APIs.
precedence_level: 4
depends_on:
  - PAT-TEST-MEANINGFUL-001
  - PAT-CLOUDFLARE-WRANGLER-CONFIG-001
applies_when:
  - "Changing adapters for KV, R2, Queues, Workflows, Durable Objects, bindings, or Worker runtime APIs."
---


## Strategy

Cloudflare adapters need realistic smoke evidence at the boundary because faked core tests cannot prove runtime integration.

## Rules

### Must

- Add adapter tests, smoke tests, or documented verification.
- Use Worker runtime test tools when feasible.
- Verify binding names, permissions, and payload shapes.

### Must not

- Do not rely only on pure unit tests for adapter changes.
- Do not assume bindings exist without config check.
- Do not declare ready without boundary evidence.

## Decision rules

- If adapter code changes, provide smoke evidence.
- If only core logic changes behind stable adapter, core tests may be enough.
- If binding config changes, verify deploy config too.

## Allowed exceptions

- Manual smoke evidence is acceptable for beta services when automated test support is limited.

## Example

```ts
it('writes and reads through R2 adapter', async () => {
  await storage.put({ key: 'test/file.txt', body, contentType: 'text/plain' })
  await expect(storage.get('test/file.txt')).resolves.toBeDefined()
})
```

---
id: PAT-TEST-EVIDENCE-001
domain: TEST
category: EVIDENCE
version: 1
description: Use this pattern before declaring a change ready for review or merge.
precedence_level: 4
depends_on:
  - PAT-TEST-INTEGRITY-001
applies_when:
  - "Declaring a change ready for review or merge."
---


## Strategy

Validation must reference the current SHA and actual code state. Run or inspect lint, typecheck, tests, smoke checks, and remote status as applicable.

## Rules

### Must

- Run relevant lint, typecheck, and tests.
- Inspect failures instead of assuming.
- Report exactly what was run and what was not run.

### Must not

- Do not claim checks passed without evidence.
- Do not rely on stale CI from another SHA.
- Do not ignore remote or smoke failures.

## Decision rules

- If code changed, validate current SHA.
- If checks cannot run, state why and what remains risky.
- If external system changed, provide smoke or config evidence.

## Allowed exceptions

- Documentation-only changes may use lighter validation when no code paths changed.

## Example

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:worker
```

---
id: PAT-UI-LEMN-001
domain: UI
category: DESIGN_SYSTEM
version: 1
description: Use this pattern when creating or migrating graphical user interfaces for LEMN products.
precedence_level: 1
depends_on: []
applies_when:
  - "Creating or migrating graphical user interfaces for LEMN products."
---


## Strategy

Use `@lemn-ltd/ui` from `https://ui.le-mn.com` as the required company design-system package for graphical UI. Product apps consume the published package and its public stylesheet instead of copying component CSS, deep-importing internals, or creating divergent local component systems.

## Rules

### Must

- Configure GitHub Packages for the package owner scope.
- Install and use the published `@lemn-ltd/ui` package.
- Import components only from the public package surface.
- Import `@lemn-ltd/ui/styles.css` exactly once at the app root.
- Prefer existing catalog components before creating local UI.
- Use the showcase/catalog to choose components and verify behavior.
- Add reusable missing components to the UI package first, then update consumers.

### Must not

- Do not deep-import from `@lemn-ltd/ui/src`, `@lemn-ltd/ui/dist`, or component internals.
- Do not copy package CSS into product apps.
- Do not import Radix, `cmdk`, or `sonner` directly in product apps for shared UI behavior.
- Do not create a parallel product-specific design system for reusable UI.
- Do not commit GitHub Packages tokens or local npm auth files.

## Decision rules

- If the UI component exists in `@lemn-ltd/ui`, use it.
- If the component is reusable but missing, add it to the UI package and publish a version before product adoption.
- If a one-off product-specific component is unavoidable, keep it local, small, and composed from package primitives.
- If GitHub Packages auth is missing, stop and report the auth gap instead of replacing the package with local copies.

## Package contract

- Registry: `https://npm.pkg.github.com`
- Package: `@lemn-ltd/ui`
- Version: use the latest published release approved by the consuming repository.
- Producer preflight in this repo: `pnpm validate && pnpm check && pnpm test && pnpm build`

## Example

```tsx
import { Button, Card, componentCatalog } from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css";
```

---
id: PAT-UI-FRONTEND-001
domain: UI
category: FRONTEND
version: 1
description: Use this pattern when building web app frontend behavior.
precedence_level: 2
depends_on:
  - PAT-UI-LEMN-001
  - PAT-API-OPENAPI-001
applies_when:
  - "Building web app frontend behavior."
---


## Strategy

Use Vite and React with OpenAPI-generated clients. Server state belongs in TanStack Query, not hand-written scattered fetch logic.

## Rules

### Must

- Use generated API types and client.
- Use TanStack Query for server state, cache, mutations, and refetching.
- Adapt DTOs to UI through view models when needed.
- Use `PAT-UI-LEMN-001` for graphical UI components and app-root stylesheet setup.

### Must not

- Do not invent API shapes in frontend.
- Do not scatter raw fetch strings across components.
- Do not use frontend state as permission authority.

## Decision rules

- If data comes from API, use generated client.
- If data is server-owned, use query/mutation state.
- If DTO is awkward for UI, map it locally without changing API contract.
- If a shared UI component exists in `@lemn-ltd/ui`, use it instead of recreating it locally.

## Allowed exceptions

- Tiny internal prototypes may use direct fetch briefly before productizing.

## Example

```tsx
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.GET('/v1/projects/{id}', { params: { path: { id: projectId } } }),
  })
}
```

---
id: PAT-UI-FRONTEND-MODULAR-MONOLITH-001
domain: UI
category: FRONTEND_MODULAR_MONOLITH
version: 1
description: Use this pattern when organizing React frontend code for product applications.
precedence_level: 2
depends_on:
  - PAT-UI-FRONTEND-001
  - PAT-DOMAIN-SCHEMA-API-NAMING-001
  - PAT-TEST-PLACEMENT-001
applies_when:
  - "Organizing React frontend code for product applications."
---


## Strategy

Use a frontend modular monolith. The application deploys as one product UI, but code is organized into business modules with clear boundaries. React components, routes, queries, mutations, view models, and UI state belong to the module that owns the user workflow.

## Rules

### Must

- Organize frontend code by business module before component type.
- Align durable frontend module names with `PAT-DOMAIN-SCHEMA-API-NAMING-001` when the workflow mirrors a backend domain/resource.
- Keep routes, screens, forms, query hooks, mutations, and view models near the workflow they support; tests mirror that workflow under the app/package `tests/` root.
- Use the generated API client for server communication.
- Use TanStack Query for server state, cache invalidation, loading, error, empty, pending, and success states.
- Use `@lemn-ltd/ui` through `PAT-UI-LEMN-001` for graphical interface components.
- Place frontend unit, integration, e2e, smoke, fixtures, fakes, and setup tests by verification level according to `PAT-TEST-PLACEMENT-001`.

### Must not

- Do not scatter API calls, fetch contracts, and DTO shaping across components.
- Do not store API-backed server state only in local React state.
- Do not create global `components`, `hooks`, or `utils` folders for unrelated product behavior.
- Do not build a parallel reusable UI system beside `@lemn-ltd/ui`.
- Do not import another module's private files.

## Decision rules

- If UI changes for one product workflow, keep it in that module.
- If code talks to the backend, put it behind module API/query/mutation helpers.
- If the workflow maps to a backend resource, mirror the API domain/resource vocabulary in the frontend module path.
- If code is reusable only inside one module, keep it private to that module.
- If code is shared across modules, promote it to a named shared area only after repeated need.
- If a screen needs data, model the query and mutation lifecycle explicitly.
- If a frontend test verifies one workflow module, mirror that module under `tests/unit/`; if it verifies browser/deployment behavior, place it under `tests/e2e/` or `tests/smoke/`.

## Allowed exceptions

- App bootstrap, router setup, providers, generated clients, and shared test utilities may live outside modules.
- Tiny presentational helpers may stay shared when they have no product behavior.
- Legacy screens may remain during migration with a target module.

## Example

```txt
src/app/
  router.tsx
  providers.tsx
  query-client.ts

src/modules/orders/
  public.ts
  routes/
  queries/
  mutations/
  ui/
  view-models/

src/shared/
  api/
  ui/

tests/unit/modules/orders/
tests/e2e/orders/
tests/helpers/
tests/setup/
```

---
id: PAT-UI-STATES-001
domain: UI
category: UX_STATES
version: 1
description: Use this pattern when implementing screens, forms, lists, or API-backed UI flows.
precedence_level: 3
depends_on:
  - PAT-UI-FRONTEND-001
applies_when:
  - "Implementing screens, forms, lists, or API-backed UI flows."
---


## Strategy

Every UI flow must model loading, empty, success, error, permission, validation, pending, and retry states as applicable.

## Rules

### Must

- Render explicit loading and empty states.
- Show recoverable errors with actions.
- Disable or mark pending actions during submit.
- Handle optimistic rollback when used.

### Must not

- Do not leave blank screens while loading.
- Do not show generic errors without recovery path.
- Do not allow duplicate submits without pending state.

## Decision rules

- If UI fetches data, handle loading/error/empty.
- If UI mutates data, handle pending/success/failure.
- If auth may fail, show permission state.

## Allowed exceptions

- Static informational pages may not need all states.

## Example

```tsx
if (query.isLoading) return <ProjectSkeleton />
if (query.error) return <ErrorState onRetry={() => query.refetch()} />
if (!query.data?.items.length) return <EmptyState />
return <ProjectList projects={query.data.items} />
```

---
id: PAT-UI-SYSTEM-001
domain: UI
category: DESIGN_SYSTEM
version: 1
description: Use this pattern when creating or changing reusable UI components.
precedence_level: 5
depends_on:
  - PAT-UI-LEMN-001
applies_when:
  - "Creating or changing reusable UI components."
---


## Strategy

Design in Pencil, then promote reusable components to `@lemn-ltd/ui` and document them in ui.le-mn.com.

## Rules

### Must

- Check existing shared components first.
- Promote repeated UI to `@lemn-ltd/ui` according to `PAT-UI-LEMN-001`.
- Keep components accessible, composable, and documented.

### Must not

- Do not copy-paste divergent components across apps.
- Do not create one-off UI when a shared component exists.
- Do not ignore accessibility or interaction states.

## Decision rules

- If component repeats across products, share it.
- If design is experimental, keep it local until approved.
- If component is shared, document examples and variants.
- If GitHub Packages auth is missing, report the auth gap instead of copying package CSS or localizing the shared component.

## Allowed exceptions

- Single-use product-specific UI may stay local when not reusable.

## Example

```tsx
import { Button, Dialog } from '@lemn-ltd/ui'

export function DeleteProjectDialog() {
  return <Dialog><Button variant="danger">Delete</Button></Dialog>
}
```

---
id: PAT-OBS-GENERAL-001
domain: OBS
category: GENERAL
version: 1
description: Use this pattern when adding request, job, workflow, or integration behavior.
precedence_level: 1
depends_on: []
applies_when:
  - "Adding request, job, workflow, or integration behavior."
---


## Strategy

Every important flow should be traceable with stable IDs, useful events, durations, status, and error codes.

## Rules

### Must

- Include requestId or traceId.
- Log operation name, status, duration, actor/org when safe, and error code.
- Correlate jobs, workflows, queues, and artifacts.

### Must not

- Do not add logs without correlation.
- Do not swallow queue or workflow failures silently.
- Do not log secrets or full sensitive payloads.

## Decision rules

- If flow can fail asynchronously, add job/run identifiers.
- If user reports issue, logs should locate the flow.
- If metrics drive product decisions, emit structured events.

## Allowed exceptions

- Low-risk local-only flows may use minimal logging.

## Example

```ts
logger.info('job.completed', {
  requestId,
  traceId,
  jobId,
  organizationId,
  durationMs,
})
```

---
id: PAT-OBS-TRACE-CONTEXT-001
domain: OBS
category: TRACE_CONTEXT
version: 1
description: Use this pattern when work crosses Workers, Service Bindings, Queues, Workflows, Durable Objects, LLM runs, Artifacts, or Postgres.
precedence_level: 4
depends_on:
  - PAT-OBS-GENERAL-001
applies_when:
  - "Work crosses Workers, Service Bindings, Queues, Workflows, Durable Objects, LLM runs, Artifacts, or Postgres."
---


## Strategy

Propagate correlation context across every boundary. A user report, provider event, queue message, workflow step, agent run, or DB record should be traceable to the same request or run lineage.

## Rules

### Must

- Create or accept a requestId at the entrypoint.
- Propagate traceId/requestId through service calls, queues, workflows, service bindings, and outbox records.
- Store run/job/workflow IDs in Postgres for durable async work.
- Include provider request IDs and AI Gateway IDs when available.
- Redact sensitive data before adding trace attributes.

### Must not

- Do not generate unrelated IDs at each boundary without linking them.
- Do not rely only on frontend session IDs for backend traceability.
- Do not put secrets, prompts, or large payloads in trace attributes.

## Decision rules

- If work can continue after the HTTP response, persist correlation IDs.
- If a provider call can fail, capture provider request ID or equivalent.
- If an agent run writes files, link Artifacts refs to run and trace IDs.

## Allowed exceptions

- Local-only scripts may use a single generated runId when no request context exists.

## Example

```ts
await env.JOBS_QUEUE.send({
  type: 'job.run',
  jobId,
  traceId,
  requestId,
})
```

---
id: PAT-OPS-LEAST-PRIVILEGE-001
domain: OPS
category: PERMISSIONS
version: 1
description: Use this pattern when changing CI, deploy workflows, secrets, permissions, environments, or tokens.
precedence_level: 1
depends_on:
  - PAT-SEC-SECRETS-001
applies_when:
  - "Changing CI, deploy workflows, secrets, permissions, environments, or tokens."
---


## Strategy

Use least privilege. Permission and secret changes must be minimal, explicit, auditable, and tied to a real need.

## Rules

### Must

- Grant only required scopes.
- Document why workflow or secret access changes.
- Keep environment separation clear.

### Must not

- Do not broaden CI permissions casually.
- Do not expose production secrets to preview or test jobs without need.
- Do not add tokens to logs, artifacts, or generated files.

## Decision rules

- If workflow needs new permission, justify the exact scope.
- If secret is needed in CI, limit environment and job access.
- If deployment target changes, require explicit review.

## Allowed exceptions

- Temporary elevated access may be allowed with time-bound approval and cleanup plan.

## Example

```yaml
permissions:
  contents: read
  deployments: write
  id-token: write
```

---
id: PAT-LLM-OBSERVABILITY-001
domain: LLM
category: OBSERVABILITY
version: 1
description: Use this pattern when building LLM jobs, agents, tools, or costly AI flows.
precedence_level: 4
depends_on:
  - PAT-OBS-TRACE-CONTEXT-001
applies_when:
  - "Building LLM jobs, agents, tools, or costly AI flows."
---


## Strategy

LLM flows must be traceable across request, job, model call, tool call, artifact, cost, and billing usage.

## Rules

### Must

- Emit requestId, traceId, runId, jobId, actor/org metadata when safe.
- Track model, provider, latency, tokens, cost, and error codes.
- Correlate Brainstask, Flue, AI Gateway, Artifacts, and Postgres state.

### Must not

- Do not log secrets or sensitive prompts by default.
- Do not create untracked commercial model calls.
- Do not leave artifacts without run ownership metadata.

## Decision rules

- If AI flow costs money, track usage.
- If flow creates artifacts, correlate artifact ID to run.
- If tool call changes state, audit it.

## Allowed exceptions

- Best-effort internal experiments may use lighter observability when not customer-impacting.

## Example

```ts
span.setAttributes({
  'ai.run_id': runId,
  'ai.model': model,
  'app.organization_id': organizationId,
  'ai.cost_usd': costUsd,
})
```

---
id: PAT-LLM-AI-GATEWAY-001
domain: LLM
category: AI_GATEWAY
version: 1
description: Use this pattern when making commercial LLM calls that are not latency-critical realtime voice.
precedence_level: 5
depends_on:
  - PAT-SEC-SECRETS-001
  - PAT-OBS-GENERAL-001
applies_when:
  - "Making commercial LLM calls that are not latency-critical realtime voice."
---


## Strategy

Route commercial LLM usage through Cloudflare AI Gateway for observability, tracking, policy, and spend controls when possible.

## Rules

### Must

- Attach actor, organization, product, and run metadata when safe.
- Track usage and cost for commercial calls.
- Use gateway policies for limits and routing where applicable.

### Must not

- Do not make commercial LLM calls without tracking.
- Do not log sensitive prompts by default.
- Do not place AI Gateway in latency-critical realtime voice unless explicitly approved.

## Decision rules

- If call creates user-visible cost, use AI Gateway.
- If call is internal and runner-based, follow Brainstask policy.
- If latency is critical voice streaming, bypass gateway and track asynchronously.

## Allowed exceptions

- Provider-direct calls are allowed for approved realtime voice or unsupported gateway cases.

## Example

```ts
await llmPort.complete({
  gateway: 'cloudflare-ai-gateway',
  model,
  messages,
  metadata: { actorId, organizationId, product: 'agent' },
})
```

---
id: PAT-LLM-VOICE-001
domain: LLM
category: REALTIME_VOICE
version: 1
description: Use this pattern when building realtime voice agents or audio streaming flows.
precedence_level: 5
depends_on:
  - PAT-AUTH-USAGE-METERING-001
applies_when:
  - "Building realtime voice agents or audio streaming flows."
---


## Strategy

Optimize realtime voice for latency. Avoid AI Gateway in the critical audio path when it adds delay; enforce usage controls around the session.

## Rules

### Must

- Pre-check quota before session start.
- Use direct provider path during realtime audio.
- Record usage asynchronously after or alongside the session.

### Must not

- Do not insert unnecessary proxy hops into realtime audio.
- Do not block streaming on synchronous billing or logging.
- Do not skip user/org usage tracking.

## Decision rules

- If latency affects UX, bypass gateway.
- If quota can be checked before session, do it before opening audio.
- If usage arrives after session, reconcile asynchronously.

## Allowed exceptions

- AI Gateway may be used when latency impact is measured and accepted.

## Example

```ts
await quotaService.assertCanStartVoiceSession({ actorId, organizationId })
const session = await realtimeVoiceProvider.createSession({ actorId })
ctx.waitUntil(usageReconciliation.recordVoiceSession(session.id))
```

---
id: PAT-LLM-BRAINSTASK-001
domain: LLM
category: BRAINSTASK
version: 1
description: Use this pattern when executing AI tasks, blueprints, playbooks, or coding workflows.
precedence_level: 5
depends_on:
  - PAT-DATA-ARTIFACTS-001
  - PAT-CLOUDFLARE-SANDBOX-001
applies_when:
  - "Executing AI tasks, blueprints, playbooks, or coding workflows."
---


## Strategy

Use Brainstask as the task execution layer. Internal tasks prefer Mac runners; commercial user tasks use Cloudflare Sandbox with Codex SDK and AI Gateway.

## Rules

### Must

- Version important blueprints and playbooks.
- Use OTel for task observability.
- Store operational state in Postgres and file trees in Artifacts.

### Must not

- Do not run commercial untrusted tasks on internal Mac runners.
- Do not execute untrusted code in the API Worker.
- Do not invent Brainstask APIs when repo docs are missing.

## Decision rules

- If task is internal trusted automation, use Mac runners when appropriate.
- If task is commercial/user-facing code execution, use Sandbox.
- If output is file-tree based, use Artifacts.

## Allowed exceptions

- Manual internal experiments may run outside the commercial path when clearly non-production.

## Example

```ts
await brainstaskPort.start({
  blueprint: 'code-review',
  organizationId,
  artifactTreeRef,
  executionMode: 'commercial-sandbox',
})
```

---
id: PAT-LLM-FLUE-001
domain: LLM
category: FLUE
version: 1
description: Use this pattern when deploying commercial AI agents, chatbots, or agent harnesses.
precedence_level: 5
depends_on:
  - PAT-API-MCP-001
  - PAT-SEC-AUTHORIZATION-001
applies_when:
  - "Deploying commercial AI agents, chatbots, or agent harnesses."
---


## Strategy

Use Flue Framework and the approved Flue harness pattern for commercial agents deployed on Cloudflare.

## Rules

### Must

- Define harness, tools, policies, session state, and observability explicitly.
- Use curated MCP tools when external capabilities are exposed.
- Apply RBAC and service-layer access.

### Must not

- Do not improvise commercial agent harnesses outside Flue.
- Do not let agents access DB directly without services/policies.
- Do not invent Flue imports or APIs.

## Decision rules

- If agent is commercial, use Flue.
- If agent exposes tools, use MCP discipline.
- If API is unclear, inspect internal examples or ask.

## Allowed exceptions

- Prototype agents may be experimental if not shipped as commercial product.

## Example

```ts
const harness = {
  name: 'support-agent',
  tools: curatedTools,
  policy: lemnRbacPolicy,
  observability: brainstaskOtel,
}

// Use the approved Flue adapter/API from the repo to deploy this harness.
```

---
id: PAT-DOCS-WIKI-001
domain: DOCS
category: WIKI
version: 1
description: Use this pattern when documenting architecture, APIs, runbooks, tools, or operational decisions.
precedence_level: 1
depends_on: []
applies_when:
  - "Documenting architecture, APIs, runbooks, tools, or operational decisions."
---


## Strategy

Use Astro and Starlight for the automatic wiki. Important architecture decisions must live in docs or ADRs, not only chat.

## Rules

### Must

- Document ADRs, runbooks, MCP tools, OpenAPI links, and Brainstask/Flue playbooks.
- Keep docs aligned with code.
- Add owner/date for decisions.

### Must not

- Do not leave important decisions only in Slack or chat.
- Do not create docs that contradict current implementation.
- Do not write ADRs without consequence or owner.

## Decision rules

- If architecture changes, update or add ADR.
- If tool behavior is product-facing, document it.
- If runbook is needed for incidents, add it to wiki.

## Allowed exceptions

- Temporary notes may live in PR descriptions if later consolidated.

## Example

```md
---
title: ADR-0007 Use Kysely repositories
owner: platform
date: 2026-06-30
---

Decision: Postgres access goes through module repositories only.
```

---
id: PAT-DOCS-PATTERN-AUDIT-001
domain: DOCS
category: PATTERN_AUDIT
version: 1
description: Use this pattern when auditing a codebase against the pattern profile, target levels, precedence chain, or hardening readiness.
precedence_level: 4
depends_on:
  - PAT-DOCS-WIKI-001
  - PAT-TEST-EVIDENCE-001
applies_when:
  - "Auditing a codebase against the pattern profile, target levels, precedence chain, or hardening readiness."
---


## Strategy

Audit patterns from the project profile, not from a flat checklist. The audit starts with `docs/patterns/pattern-profile.md`, expands every required domain up to its `target_level`, evaluates dependencies, and records current state in `docs/patterns/pattern-audit.md`.

The precedence chain is domain-first. `category` is the assignment unit for audit work; it does not define the implementation order. Implementation order is domain -> `precedence_level` -> `depends_on`.

## Rules

### Must

- Read `pattern-system.md`, `pattern-profile.md`, `patterns.md`, and `pattern-audit.md` before starting.
- Evaluate every domain listed in `pattern_profile` up to its `target_level`.
- Include dependency patterns even when they come from another domain.
- Evaluate lower `precedence_level` patterns before higher-level patterns in the same domain.
- Treat missing lower-level requirements as blockers or required predecessor work for higher-level patterns.
- Record status, evidence, gaps, blockers, and exceptions in `pattern-audit.md`.
- Keep audit evidence minimal and actionable; use `docs/patterns/audits/<audit-id>.md` only when the evidence is too large for `pattern-audit.md`.
- When subagents are available, audit one domain at a time and split each domain by category.

### Must not

- Do not mark a high-level pattern complete when an applicable lower-level dependency is unresolved.
- Do not audit only the patterns that are convenient or recently changed.
- Do not use category order as a substitute for `precedence_level` and `depends_on`.
- Do not create one evidence file per pattern by default.
- Do not treat missing evidence as success.

## Audit wave model

Run audits by domain waves:

1. Select one domain from `pattern_profile`.
2. Build the applicable pattern set for that domain: all patterns with `precedence_level <= target_level`, plus required dependencies.
3. Group that domain's applicable patterns by `category`.
4. Launch one subagent per category when subagents are available.
5. Limit a wave to 6 category agents by default; if a domain has 11 categories, run 2 waves.
6. Ask each category agent for evidence, gaps, blockers, exceptions, and recommended predecessor work.
7. Merge category results back in precedence order before moving to the next domain.

If subagents are unavailable, use the same wave model sequentially in the main session.

## Statuses

Use only these statuses in audit output:

- `APPLIES`
- `NOT_APPLICABLE`
- `GAP`
- `BLOCKED`
- `EXCEPTION_VERSIONED`
- `COMPLETE`

## Evidence

Evidence must point to concrete code, tests, docs, commands, screenshots, traces, audit events, or smoke results. Prefer links or paths over prose summaries.

Minimum audit row:

```md
| Pattern | Domain | Category | Level | Status | Evidence | Gap / Blocker / Exception |
|---|---|---|---:|---|---|---|
```

## Example

```md
Audit: 2026-07-09-agentops-pattern-audit
Domain: API
Wave 1 categories: SURFACE_BOUNDARIES, HONO, MODULAR_SLICES, OPENAPI, MAPPERS, CONTRACTS
Wave 2 categories: VALIDATION, ERROR_MODEL, PROBLEM_DETAILS, CORS, VERSIONING, MCP

Result: `PAT-API-MCP-001` cannot be complete until `PAT-SEC-AUTHORIZATION-001`
and `PAT-SEC-AUDIT-EVENTS-001` have evidence.
```
