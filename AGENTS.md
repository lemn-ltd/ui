## AgentOps

Este repo puede definir un MCP de AgentOps a nivel proyecto en `.codex/config.toml`. Antes de asumir que AgentOps no esta disponible, revisa ese archivo y el token `AGENTOPS_MCP_TOKEN` en el entorno o en el `.env` local ignorado por git. Nunca imprimas el valor del token.

Configuracion esperada:

```toml
[mcp_servers.agentops]
url = "https://agentops.le-mn.com/mcp"
bearer_token_env_var = "AGENTOPS_MCP_TOKEN"
http_headers = { "MCP-Protocol-Version" = "2025-11-25" }
```

Usa AgentOps MCP para:

- Managed files: `list_managed_files`, `read_managed_file`, `managed_file_status`, `sync_managed_file`, `sync_all_managed_files`.
- Secrets: `list_secrets_metadata` antes de `get_secret`; lee solo el secreto necesario y nunca lo imprimas, guardes en commits ni registres en logs.
- GitHub sync: `github_sync_plan` antes de `github_sync_apply`; aplica solo planes non-production y solo cuando el cambio solicitado lo requiera.

## Cloudflare credentials desde AgentOps

Las credenciales de Cloudflare pueden vivir como secrets de organizacion o proyecto en AgentOps. Este archivo debe ser generico para todos los proyectos: no hardcodees emails, account IDs, worker names, dominios ni nombres de recursos que deban venir del secret.

Cuando necesites operar Cloudflare:

1. Usa `list_secrets_metadata` primero.
2. Ubica el secret relevante, normalmente llamado `cloudflare` o equivalente para el proyecto.
3. Lee el `note`/metadata del secret para obtener contexto operativo como `accountId=<cloudflare_account_id>` y `email=<cloudflare_email>`, ademas de recursos aplicables si fueron documentados.
4. Usa `get_secret` solo cuando el valor real de la credencial sea necesario.
5. Nunca imprimas, guardes, commitees ni registres el valor del secret.

Si la credencial es una Cloudflare Global API Key, no la uses como `CLOUDFLARE_API_TOKEN`. Wrangler debe recibirla como `CLOUDFLARE_API_KEY` junto con `CLOUDFLARE_EMAIL` obtenido desde el `note` del secret:

```sh
IFS= read -rs CLOUDFLARE_API_KEY
export CLOUDFLARE_API_KEY
export CLOUDFLARE_EMAIL="<email_from_secret_note>"
./node_modules/.bin/wrangler whoami
```

Antes de mutar recursos, verifica que `wrangler whoami` muestre el `accountId` esperado desde el `note`. Con esa credencial se pueden operar los recursos Cloudflare permitidos por esa cuenta y por el repo/proyecto actual, como Workers, deploys, custom domains/routes, KV, Hyperdrive, Worker vars/secrets y otros bindings declarados en la configuracion del proyecto. Despues de usarla, limpia el proceso con `unset CLOUDFLARE_API_KEY CLOUDFLARE_EMAIL`.

Resources MCP disponibles: `agentops://managed-files`, `agentops://secrets/metadata` y `agentops://github-sync/plan`; actualmente no hay prompts ni resource templates.

Managed files conocidos para este proyecto:

- `AGENTS.md`
- `patterns/patterns.md`
- `patterns/pattern-system.md`
- `patterns/pattern-profile.md`
- `patterns/pattern-audit.md`

Antes de editar un managed file, lee el archivo local y revisa `managed_file_status`. Si un archivo gestionado falta localmente o esta desincronizado, usa AgentOps MCP (`sync_managed_file` o `sync_all_managed_files`) para materializarlo. No sobrescribas cambios locales del usuario sin instruccion explicita. Para cambiar patrones, edita el archivo local correspondiente bajo `patterns/` y actualizalo en AgentOps con `update_managed_file`; luego verifica checksums remoto/local.

## AgentOps Hook State

Despues de una ejecucion del hook de AgentOps, revisa `.agentops/state.json` antes de asumir que archivos gestionados cambiaron. Usa `agentopsHookContext.changeSet` como indice optimizado:

- `summary` indica cuantos archivos se materializaron, removieron o inyectaron en contexto.
- `injected.files` lista solo los managed files que el hook agrego a `additionalContext`.
- `files[].diff.inline` contiene el diff unificado cuando cabe en el estado.
- `files[].diff.diffPath` apunta al diff completo cuando el diff es grande.
- Si `files[].diff.truncated` es `true`, lee `diffPath`; ese archivo es la fuente exacta del cambio.

No releas ni reinjectes managed files sin cambios solo porque existen localmente. El hook ya materializa todos los managed files remotos en disco; el `changeSet` te dice que cambio exactamente en la ultima ejecucion.

# Agent Instructions

Agents must read this file before planning, coding, testing, or reviewing work in this repository.

This file is local workspace guidance. The pattern authority lives in the managed files under `patterns/`.

## Repository Standards

- Follow the existing architecture, conventions, dependencies, styling, and test patterns before adding anything new.
- Keep changes scoped to the task. Do not rewrite unrelated modules or change behavior unless requested or required.
- Do not introduce new dependencies unless the task clearly justifies the tradeoff.
- Never fake tests, fixtures, data, logs, screenshots, validation output, API responses, or reviewer results.
- Never commit or log secrets, tokens, `.env` files, credentials, customer data, request headers, or production-only local state.
- Do not leave TODOs, stubs, placeholder success paths, dead branches, skipped tests, or suppressions in production paths without explicit owner and follow-up.

## Pattern System

Use the managed `patterns/` files as the single pattern authority:

- `patterns/pattern-system.md`: how patterns are ordered, applied, audited, and synchronized.
- `patterns/pattern-profile.md`: AgentOps domains and required `target_level` values.
- `patterns/patterns.md`: canonical `PAT-*` catalog with `precedence_level`, `depends_on`, and `applies_when`.
- `patterns/pattern-audit.md`: current status, evidence, gaps, blockers, and exceptions.

Before planning, coding, testing, or reviewing:

- Read `patterns/pattern-system.md` first, then `patterns/pattern-profile.md`, then the relevant entries in `patterns/patterns.md`, then `patterns/pattern-audit.md`.
- Identify the relevant `PAT-*` ids and evaluate lower `precedence_level` patterns plus every `depends_on` requirement before applying higher-level patterns.
- Apply patterns through the repo's current architecture. If a pattern conflicts with current implementation, follow the existing convention for the task, record the gap/blocker/exception in `patterns/pattern-audit.md`, and migrate only when explicitly requested.
- Do not mark a pattern complete from intent, green tests alone, or absence of obvious problems. Completion requires concrete evidence: code paths, tests, command output, docs, smoke results, audit events, traces, screenshots, or deployed behavior as applicable.
- Cite materially relevant `PAT-*` ids in implementation notes, PR summaries, specs, or evidence files.

Default implementation posture from the catalog:

- Cloudflare-first runtime; Neon Postgres is authoritative for transactional state; KV is cache/compatibility only.
- Hono routes stay thin; services own use cases; repositories own Kysely/SQL; provider SDKs and Cloudflare bindings stay behind ports/adapters.
- Schema changes require migrations; never run DDL from request paths, queues, workflows, app bootstrap, or production runtime.
- Validate untrusted inputs with the established validation layer, keep OpenAPI/generated clients aligned, and return public HTTP errors through the established Problem Details/error boundary.
- Use Queues for retryable async work, Workflows for durable multi-step processes, Durable Objects only for coordination/single-writer needs, and outbox semantics when external side effects must follow committed database state.
- Keep agent/MCP tools permissioned, typed, audited, and least-privilege; never expose generic SQL, filesystem, HTTP, or secret access.
- Frontend work follows `frontend/src/modules/*`, generated API clients, TanStack Query for server state, and explicit loading/empty/error/permission/pending/success states.
- Tests must preserve meaningful assertions, use fakes for external providers without hiding behavior, and store evidence for important gates.
- Never commit, print, log, or persist secrets, tokens, `.env`, credentials, sensitive headers, provider payloads, or customer data.
- Important architecture, API, runbook, tool, pattern, and operational decisions live in repo docs or pattern audit evidence, not only chat.
