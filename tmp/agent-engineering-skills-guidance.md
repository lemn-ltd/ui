# Agent Engineering: Skills y Guidance

Documento de trabajo para definir una base centralizada de skills, rules/guidance y conocimiento reutilizable para el ciclo completo de desarrollo de software.

## Objetivo

Crear una sola fuente de verdad para `agent-engineering` que pueda servir primero a Codex y despues adaptarse a Claude, sin duplicar conocimiento ni mezclar recetas ejecutables con reglas de comportamiento.

## Fuentes Open Source Revisadas

Estas fuentes sirven como referencia inicial. No deben copiarse sin revisar licencia, calidad y encaje con nuestro estandar interno.

| Repo | Uso recomendado | Licencia observada | Nota |
| --- | --- | --- | --- |
| https://github.com/agentskills/agentskills | Base conceptual para skills | Apache-2.0 | Buen punto de partida para entender skills como capacidades reutilizables. |
| https://github.com/agentsmd/agents.md | Formato AGENTS.md | MIT | Importante para Codex-first y convenciones de agente por repo. |
| https://github.com/addyosmani/agent-skills | Skills de ingenieria production-grade | MIT | Muy util para ver organizacion por capacidades como testing, review, security, release, docs. |
| https://github.com/github/awesome-copilot | Catalogo amplio de skills, instructions, agents, workflows | MIT | Referencia fuerte para separar `skills/`, `instructions/`, `agents/`, `hooks/`, `workflows/` y docs. |
| https://github.com/microsoft/skills | Skills, MCP, agents y AGENTS.md | MIT | Util como referencia moderna de ecosistema de agentes. |
| https://github.com/sanjeed5/awesome-cursor-rules-mdc | Catalogo de rules Cursor | CC0-1.0 | Buena fuente para reglas e instrucciones reutilizables. |
| https://github.com/ciembor/agent-rules-books | Rules inspiradas en libros de ingenieria | MIT | Util para guidance de arquitectura, clean code, refactoring y DDD. |
| https://github.com/trailofbits/skills | Skills de seguridad e investigacion | CC-BY-SA-4.0 | Muy valioso para seguridad, pero requiere cuidado por licencia share-alike. |
| https://github.com/mercari/production-readiness-checklist | Production readiness | MIT | Buena base para checklist de readiness. |
| https://github.com/kgoralski/microservice-production-readiness-checklist | Readiness de microservicios | Apache-2.0 | Complemento para servicios backend. |
| https://github.com/zalando/restful-api-guidelines | Guidelines REST/API | CC-BY-4.0 | Referencia fuerte para API design. |
| https://github.com/adidas/api-guidelines | API guidelines | MIT | Buena fuente reusable para reglas de API. |
| https://github.com/Azure/azure-api-style-guide | API style y Spectral rules | MIT | Util si queremos validaciones automaticas. |
| https://github.com/Arcadia-Science/arcadia-software-handbook | Handbook interno de software | CC0-1.0 | Buen patron de handbook organizacional. |
| https://github.com/inDriver/handbook | Engineering handbook | MIT | Referencia para estructura de conocimiento por organizacion. |

## Patrones Observados

Los repos mas maduros no organizan todo por herramienta. Separan el conocimiento canonico de los adaptadores para cada agente.

Patrones repetidos:

- `AGENTS.md` y `CLAUDE.md` son entrypoints de agente, no el repositorio completo del conocimiento.
- `skills/` contiene recetas reutilizables y accionables.
- `instructions/`, `rules/` o `guidance/` contienen politicas, principios, restricciones y criterios de calidad.
- `docs/` explica como usar, contribuir y mantener el sistema.
- `workflows/`, `hooks/`, `agents/` y `plugins/` aparecen cuando hay integraciones mas avanzadas.
- Los handbooks serios separan areas de ownership: API, seguridad, release, testing, operacion, arquitectura, incidentes y documentacion.
- Las colecciones grandes usan catalogos o indices para descubrir contenido, porque la carpeta por si sola no escala.

## Decision Recomendada

La estructura principal debe ser por area o capacidad, no por etapa ni por framework.

Razon:

- Los skills transversales como code review, debugging, security, testing, release u observability aplican a muchas etapas.
- Si organizamos primero por etapa, duplicamos skills en `planning/`, `implementation/`, `review/` y `release`.
- Si organizamos primero por framework, convertimos el repositorio en un inventario de stacks y perdemos metodologia comun.
- Las areas/capacidades permiten ownership claro y crecimiento natural.
- Etapa, framework, plataforma y agente deben ser metadatos, no carpetas principales.

Modelo recomendado:

- Eje primario: area/capacidad.
- Ejes secundarios: etapa del ciclo de vida, framework, plataforma, tipo de artefacto, agente compatible, madurez y scope.
- Adaptadores: Codex y Claude consumen la misma fuente canonica y generan o referencian formatos especificos.

## Versionado SemVer

Cada skill y cada guidance debe tener version propia usando SemVer.

Reglas:

- La version vive en el frontmatter YAML del artifact, no en el nombre del archivo.
- El nombre del archivo y el `id` deben ser estables para no romper links.
- `MAJOR` cambia cuando el contrato, comportamiento esperado o forma de uso cambia de manera incompatible.
- `MINOR` cambia cuando se agregan capacidades, criterios, pasos o cobertura sin romper el uso anterior.
- `PATCH` cambia cuando se corrige redaccion, ejemplos, edge cases o errores menores sin cambiar el contrato.
- Durante incubacion, usar `0.x.y`.
- Cuando un skill o guidance ya fue probado en casos reales y es confiable, promoverlo a `1.0.0`.
- La version del repo o plugin puede existir aparte, pero no reemplaza la version por artifact.

Ejemplo:

```yaml
id: production-readiness-review
type: skill
version: 0.1.0
status: draft
```

Los estados recomendados son:

- `draft`: propuesta inicial o no probada.
- `experimental`: util, pero todavia cambiante.
- `stable`: validada y lista para uso general.
- `deprecated`: reemplazada o en salida.

## Links y Knowledge Graph

La fuente canonica debe ser Markdown estandar con frontmatter YAML, compatible con Obsidian pero no dependiente de Obsidian.

Decision:

- Usar links Markdown relativos como formato canonico.
- No usar `[[wikilinks]]` como formato principal.
- No usar block references de Obsidian como `#^block-id` en la fuente canonica.
- Obsidian puede usarse como visualizador opcional del grafo.
- Codex, Claude, Astro, GitHub y parsers Markdown deben poder navegar los archivos sin plugins especiales.

Ejemplo recomendado:

```md
## Related

- Depends on: [Code Review Standards](../../guidance/code-quality/code-review-standards.md)
- Supports: [Production Readiness Review](../../skills/release/production-readiness-review.md)
- See also: [Security Baseline](../../guidance/security/security-baseline.md)
```

Las relaciones importantes tambien deben estar en metadata para que los agentes puedan leerlas sin depender del texto visible:

```yaml
depends_on:
  - code-review-standards
related:
  - security-baseline
  - rollback-plan
supersedes:
  - legacy-release-checklist
```

Regla para agentes:

Cuando un agente use un skill o guidance, debe revisar sus relaciones `depends_on`, `related` y `supersedes` cuando sean relevantes para la tarea. Esto permite vincular conocimiento sin obligar a cargar todo el repositorio.

## Diferencia Entre Skill y Guidance

Skill:

- Es una receta accionable.
- Se usa para ejecutar una tarea concreta.
- Tiene disparadores claros.
- Puede tener pasos, checks, comandos, criterios de salida y ejemplos.
- Ejemplos: `debug-runtime-issue`, `production-readiness-review`, `api-design-review`, `cloudflare-deploy-preflight`.

Guidance o rule:

- Es una regla, politica, principio o criterio estable.
- No necesariamente ejecuta una tarea completa.
- Influye en como el agente debe trabajar siempre o dentro de un contexto.
- Ejemplos: `git-policy`, `code-review-standards`, `api-style`, `security-baseline`, `frontend-design-principles`.

Reference:

- Es conocimiento de apoyo.
- No es una receta ni una regla.
- Ejemplos: checklist, glossary, decision record, architecture note, external source inventory.

## Taxonomia Propuesta

```text
agent-engineering/
  README.md
  AGENTS.md
  CLAUDE.md

  catalog/
    skills.yml
    guidance.yml
    sources.yml

  skills/
    architecture/
    planning/
    implementation/
    code-review/
    testing/
    debugging/
    security/
    performance/
    observability/
    reliability/
    release/
    documentation/
    frontend/
    backend/
    data/
    cloud/
    ai-agents/

  guidance/
    global/
    lifecycle/
    architecture/
    api-design/
    code-quality/
    security/
    testing/
    git/
    release/
    operations/
    frontend/
    backend/
    data/
    cloud/

  references/
    source-inventory.md
    licensing-policy.md
    maturity-model.md
    contribution-guide.md

  adapters/
    codex/
      AGENTS.md
      skill-index.md
    claude/
      CLAUDE.md
      skill-index.md

  docs/
    getting-started.md
    authoring-skills.md
    authoring-guidance.md
    lifecycle.md
    governance.md
```

Esta estructura mantiene el conocimiento canonico en `skills/`, `guidance/` y `references/`. Los adaptadores en `adapters/` deben ser delgados: solo traducen, apuntan o empaquetan para Codex y Claude.

## Metadatos Recomendados

Cada skill deberia tener metadatos minimos:

```yaml
id: production-readiness-review
type: skill
version: 0.1.0
status: draft
area: release
lifecycle:
  - review
  - release
  - operate
stacks:
  - generic
  - cloudflare
agents:
  - codex
  - claude
scope: org
owner: platform-engineering
sources:
  - https://github.com/mercari/production-readiness-checklist
depends_on:
  - code-review-standards
  - security-baseline
related:
  - observability-readiness
  - rollback-plan
```

Cada guidance deberia tener metadatos similares:

```yaml
id: code-review-standards
type: guidance
version: 1.0.0
status: stable
area: code-quality
lifecycle:
  - review
agents:
  - codex
  - claude
scope: org
owner: engineering
applies_to:
  - pull-requests
  - agent-code-review
related:
  - testing-policy
  - security-baseline
```

## Areas Iniciales

Para arrancar sin sobreingenieria:

1. `planning`: convertir ideas en specs, planes y criterios de aceptacion.
2. `architecture`: decisiones, boundaries, tradeoffs, ADRs y system design.
3. `implementation`: cambios incrementales, refactors, migraciones y compatibilidad.
4. `code-review`: calidad, mantenibilidad, riesgos y regresiones.
5. `testing`: unit, integration, E2E, smoke, fixtures y flake policy.
6. `debugging`: reproduccion, logs, traces, runtime evidence y root cause.
7. `security`: auth, secrets, input validation, OWASP, supply chain y threat modeling.
8. `release`: readiness, deploy preflight, rollback, versioning y change management.
9. `observability`: logs, metrics, traces, alerts y runbooks.
10. `documentation`: README, AGENTS.md, CLAUDE.md, ADRs, runbooks y handoff.
11. `frontend`: UX, accessibility, design systems, visual QA y browser verification.
12. `backend-data`: APIs, data modeling, migrations, queues, consistency y reliability.
13. `cloud-platform`: Cloudflare, GitHub Actions, CI/CD, infra y environments.
14. `ai-agents`: authoring de skills, prompts, memory, agent safety y evals.

## Mapa Brainsforce: Scripts Cross-Project

Fuente revisada: `/Users/angelloor/Documents/SWE/LEMN/code/brainsforce/scripts`.

Decision:

- No copiar estos scripts tal cual.
- Extraer primero los patrones como skills/guidance.
- Convertir a paquetes o templates solo las piezas que puedan parametrizarse por manifiesto.
- Mantener los scripts especificos de `brainsforce` como referencia, no como canon.

El hallazgo principal es que `brainsforce` ya tiene un patron fuerte para proyectos agent-ready: un control plane de readiness, manifiestos como fuente de verdad, comandos root estables, validadores deterministas y docs de agente que explican como operar el proyecto.

### Candidatos Fuertes

| Origen | Encaje en agent-engineering | Tipo recomendado | Por que tiene sentido cross-project |
| --- | --- | --- | --- |
| `scripts/readiness/validate.sh` | `skills/release/project-readiness-validation.md` + `guidance/lifecycle/validation-levels.md` | Skill + guidance | Orquesta gates por niveles, fail-fast y modos `quick/build/full/ci`; es el nucleo de "project ready for agents". |
| `scripts/readiness/checks/validate-workspace-contracts.mjs` | `skills/architecture/workspace-contract-validation.md` | Template script | Valida que cada package/app exponga scripts minimos. Muy reusable en monorepos. |
| `scripts/readiness/checks/validate-code-boundaries.mjs` | `skills/architecture/code-boundary-validation.md` | Template script | Codifica restricciones de import/rutas. Reusable si se parametrizan boundaries. |
| `scripts/readiness/dependency-cruiser.cjs` | `guidance/architecture/dependency-boundaries.md` | Reference + template | Buen patron para reglas de dependencias, ciclos y layers. Requiere config por repo. |
| `scripts/readiness/checks/validate-service-boundaries.mjs` | `skills/cloud/service-boundary-validation.md` | Template script | Valida ownership de servicios, bindings y grafo aciclico. Muy util para Cloudflare Workers/microservices. |
| `scripts/readiness/checks/validate-service-status.mjs` | `skills/observability/service-status-contract.md` | Template script | Fuerza coherencia entre config runtime, descriptor y README. Excelente para agentes porque vuelve operable cada servicio. |
| `scripts/readiness/checks/validate-local-ports.mjs` | `skills/cloud/local-runtime-surface.md` | Template script | Valida puertos canonicos y evita drift entre manifest, scripts y Wrangler/Vite. |
| `scripts/readiness/checks/validate-launch-sync.mjs` + `scripts/local/sync-launch.mjs` | `skills/cloud/manifest-driven-launch-surface.md` | Template script | Patron fuerte: un manifest genera scripts, Makefile targets y filters. Reduce drift y ayuda a agentes. |
| `scripts/local/services.manifest.json` + `scripts/local/local-ports.config.mjs` | `guidance/cloud/local-service-manifest.md` | Guidance + schema | Fuente unica para servicios, puertos, perfiles, deps y autostart. Muy escalable. |
| `scripts/local/dev.sh` | `skills/cloud/manifest-driven-local-dev.md` | Template script | Levanta servicios por perfil, topological order, health checks y cleanup. Muy reusable con manifest parametrizado. |
| `scripts/local/dev-status-panel.mjs` | `skills/observability/local-status-panel.md` | Template script | Da feedback operativo al agente/humano despues de levantar servicios. |
| `scripts/local/dev-vars.mjs` | `skills/security/encrypted-dev-vars.md` | Template script | Gestiona `.dev.vars` cifrados, check, preview y env wrapper. Muy valioso para proyectos Cloudflare. |
| `scripts/local/local-fresh.mjs` + `scripts/local/cloudflare-local-state.config.mjs` | `skills/cloud/local-state-reset.md` | Template script | Resetea estado local, migraciones y seeds desde una config. Muy util para debugging reproducible. |
| `scripts/flows/*` | `skills/testing/impact-based-e2e-selection.md` | Skill + template | Selecciona flows E2E por archivos cambiados y valida coverage de source. Muy util para agentes que deben probar lo justo. |
| `scripts/test-config/*` | `guidance/testing/shared-test-config.md` | Template package | Centraliza Vitest/Playwright defaults. Reusable si se eliminan aliases especificos. |
| `scripts/scaffolding/new-package.mjs` | `skills/implementation/workspace-package-scaffolding.md` | Template script | Crea packages conformes al contrato desde el dia uno. Bueno para mantener consistency. |

### Candidatos Medios

| Origen | Encaje en agent-engineering | Tipo recomendado | Por que requiere cuidado |
| --- | --- | --- | --- |
| `scripts/database/d1-baseline.mjs` | `skills/data/d1-migration-baseline.md` | Skill + template | Muy util para Cloudflare D1, pero especifico a Wrangler/D1 y convenciones de migrations. |
| `scripts/database/postgres-baseline.mjs` | `skills/data/postgres-migration-baseline.md` | Skill + template | Potente para generar/verificar baseline SQL, pero depende de estrategia de migrations y base temporal. |
| `scripts/database/pg-migrate.mjs` | `skills/data/postgres-migration-runner.md` | Template script | Reusable como runner simple, pero normalmente cada stack ya tiene migrator. |
| `scripts/cloudflare/tunnels.mjs` + `scripts/cloudflare/tunnels.config.mjs` | `skills/cloud/cloudflare-local-tunnels.md` | Skill + template | Util para local HTTPS/tunnels, pero depende de Cloudflare account, nombres e ids de tunnel. |
| `scripts/cloudflare/cli-env.sh` | `guidance/cloud/cloudflare-cli-env.md` | Guidance/snippet | Wrapper practico, pero suele ser demasiado dependiente del entorno local. |
| `scripts/preview/*` | `skills/release/ephemeral-preview-environments.md` | Skill + reference architecture | Muy valioso, pero complejo: Cloudflare, Neon, D1/R2/Hyperdrive, ledger, deploy, smoke tests y teardown. Conviene extraer primero como arquitectura/guidance, no como paquete. |
| `scripts/readiness/checks/validate-api-surface.mjs` + `api-surface-init.mjs` | `skills/architecture/public-api-surface.md` | Skill + template | Reusable en packages publicos TypeScript, pero depende de API Extractor y de una lista de packages guardados. |
| `scripts/readiness/checks/validate-coupling-metrics.mjs` + `coupling-baseline.json` | `skills/architecture/coupling-baseline.md` | Skill + template | Buen control de regresiones arquitectonicas, pero requiere baseline por repo. |

### Candidatos Solo Como Guidance

| Origen | Encaje en agent-engineering | Tipo recomendado | Razon |
| --- | --- | --- | --- |
| `scripts/readiness/checks/validate-large-files.mjs` | `guidance/code-quality/file-size-budget.md` | Guidance + small snippet | La idea es universal; el script es simple y puede reimplementarse por stack. |
| `scripts/readiness/checks/validate-complexity.mjs` | `guidance/code-quality/complexity-budget.md` | Guidance | Depende de Biome y su output. Mejor documentar el criterio y adaptar por toolchain. |
| `scripts/readiness/checks/validate-tech-debt.mjs` | `guidance/code-quality/tech-debt-budget.md` | Guidance | Budget de TODO/FIXME es util, pero la implementacion es trivial. |
| `scripts/readiness/checks/validate-brand-neutrality.mjs` | `guidance/architecture/core-neutrality.md` | Guidance | El principio es reusable para plataformas multi-producto; los terminos prohibidos son especificos. |
| `scripts/readiness/checks/validate-core-neutrality.mjs` | `guidance/architecture/core-neutrality.md` | Guidance | Mismo caso: muy buena regla, pero necesita vocabulario por org/producto. |
| `scripts/readiness/checks/validate-package-boundaries.mjs` | `guidance/architecture/package-boundaries.md` | Guidance + template | La regla de scopes/layers es valiosa, pero el mapa de dominios es especifico. |
| `scripts/readiness/checks/validate-rename-cleanup.mjs` + `rename-cleanup.config.json` | `guidance/maintenance/rename-cleanup.md` | Guidance + template | Muy buen patron para bloquear terminos legacy despues de migraciones; config especifica por cambio. |
| `scripts/readiness/checks/validate-local-explorer-coherence.mjs` | `guidance/cloud/local-explorer-coherence.md` | Guidance | Bueno para Cloudflare Local Explorer, pero no aplica fuera de ese stack. |

### No Extraer Como Cross-Project Por Ahora

| Origen | Motivo |
| --- | --- |
| `scripts/preview/.dev.vars` | Contiene configuracion sensible/cifrada del proyecto. No debe ser canon cross-project. |
| `scripts/preview/lib/cf.mjs`, `neon.mjs`, `provision.mjs`, `resolve.mjs`, `deploy.mjs`, `migrate.mjs`, `teardown.mjs`, `up.mjs`, `registry.mjs`, `ledger.mjs`, `config.mjs`, `naming.mjs`, `manifest.mjs`, `log.mjs` | Piezas internas del engine preview. El patron es reusable; el codigo debe quedarse como referencia hasta disenar una abstraccion limpia. |
| `scripts/readiness/lib/service-validation-utils.mjs` | Contiene inventario concreto de servicios, workers, D1 bindings y wrangler names. Debe convertirse en schema/config antes de ser reusable. |

### Readiness Como Capability Central

La parte de readiness debe convertirse en una capability principal de `agent-engineering`.

Ubicacion recomendada:

```text
skills/
  ai-agents/
    project-agent-readiness.md
  release/
    project-readiness-validation.md
  architecture/
    workspace-contract-validation.md
    dependency-boundary-validation.md
  cloud/
    manifest-driven-local-runtime.md
    service-boundary-validation.md
  testing/
    impact-based-e2e-selection.md

guidance/
  lifecycle/
    validation-levels.md
  ai-agents/
    agent-ready-project.md
  architecture/
    workspace-contracts.md
    service-ownership.md
  cloud/
    local-service-manifest.md
  code-quality/
    complexity-budget.md
    file-size-budget.md
    tech-debt-budget.md
```

Definicion propuesta:

`project-agent-readiness` es la guia/skill que prepara un proyecto para que agentes de AI puedan trabajar con baja friccion: comandos estables, source of truth de servicios, quality gates deterministas, docs de agente, validacion local/CI, secretos seguros, local runtime reproducible, ownership claro y pruebas seleccionables por impacto.

Esto encaja mejor como capability transversal en `ai-agents`, relacionada con `release`, `architecture`, `testing`, `cloud`, `security` y `observability`.

## Project Agent Readiness: Metodologia

Objetivo:

Que cualquier proyecto pueda ser entendido, modificado, validado, probado y operado por agentes de AI sin depender de conocimiento tribal.

Principio base:

```text
agent-readable, deterministic, manifest-driven, validated-by-default
```

Significado:

- `agent-readable`: el proyecto explica como trabajar con el.
- `deterministic`: los comandos producen resultados repetibles.
- `manifest-driven`: servicios, puertos, perfiles, ownership y topologia viven en fuentes de verdad.
- `validated-by-default`: todo cambio relevante pasa por gates claros.

La metodologia debe escalar cada vez que se encuentra una situacion donde el agente necesita guia humana. Esa situacion se clasifica y se convierte en conocimiento versionado.

### Mapa De Readiness

```text
Project Agent Readiness
  1. Agent Context
  2. Command Contract
  3. Workspace Topology
  4. Local Runtime
  5. Env & Secrets
  6. Validation Control Plane
  7. Architecture Boundaries
  8. Testing Strategy
  9. Observability & Debugging
  10. Release Readiness
  11. Knowledge Graph
  12. Feedback Loop
```

### Pilares

| Pilar | Que resuelve | Artifacts esperados |
| --- | --- | --- |
| `agent-context` | El agente entiende el proyecto sin conocimiento tribal. | `AGENTS.md`, `CLAUDE.md` como adapter, `docs/agent/*`, `README.md` |
| `command-contract` | El agente sabe que comandos usar y no adivina. | `make help`, `make setup`, `make dev`, `make validate`, `pnpm validate:*` |
| `workspace-topology` | El agente entiende apps, packages, services, owners y boundaries. | workspace contracts, service descriptors, `services.manifest.json` |
| `local-runtime` | El agente puede levantar y resetear el proyecto localmente. | `make dev`, `make dev-backends`, `local-fresh`, health checks |
| `env-secrets` | El agente no rompe ni filtra secretos. | `.dev.vars.example`, encrypted `.dev.vars`, `env:check`, redaction policy |
| `validation-control-plane` | El agente valida cambios con gates deterministas. | `validate:quick`, `validate:build`, `validate:full`, `validate:ci` |
| `architecture-boundaries` | El agente no viola capas, ownership ni runtime boundaries. | dependency-cruiser, code-boundary checks, service-boundary checks |
| `testing-strategy` | El agente prueba lo justo segun riesgo e impacto. | unit, integration, E2E, flow manifests, impact-based selection |
| `observability-debugging` | El agente diagnostica con evidencia. | logs, traces, status panel, health endpoints, runbooks |
| `release-readiness` | El agente sabe cuando algo esta listo para ship. | dry-run deploys, smoke tests, rollback docs, preview environments |
| `knowledge-graph` | El conocimiento queda conectado y navegable. | Markdown links, frontmatter, `depends_on`, `related`, `supersedes` |
| `feedback-loop` | Cada fallo repetido mejora el sistema. | new guidance, new skill, new validation gate, changelog |

### Niveles De Madurez

```text
L0 Unprepared
  Sin instrucciones ni comandos confiables.

L1 Documented
  El agente puede leer como trabajar.

L2 Runnable
  El agente puede instalar, levantar y ejecutar.

L3 Validated
  El agente puede validar con gates deterministas.

L4 Agent-Optimized
  El proyecto tiene manifests, flow selection, status panels y runbooks.

L5 Self-Improving
  El proyecto captura fallos del agente y mejora skills/guidance.
```

Nivel minimo recomendado para proyectos reales: `L3 Validated`.

Nivel recomendado para proyectos Codex-first maduros: `L4 Agent-Optimized`.

### Clasificacion De Situaciones

Cada vez que el agente falle, dude, necesite una explicacion humana o repita un error, la situacion debe clasificarse asi:

```text
Situacion repetida o riesgosa
  ├─ Es una regla permanente?        -> guidance
  ├─ Es una receta ejecutable?       -> skill
  ├─ Es codigo reusable?             -> template
  ├─ Es una comprobacion automatica? -> validation gate
  ├─ Es conocimiento de apoyo?       -> reference
  └─ Es especifico de Codex/Claude?  -> adapter
```

Ejemplo:

```text
"El agente cambia puertos a mano"
  -> guidance/cloud/local-service-manifest.md
  -> skill/cloud/manifest-driven-local-runtime.md
  -> validation gate: validate-local-ports
```

### Flujo De Aplicacion

1. `Assess`: leer el proyecto real, comandos, docs, AGENTS.md, CI y scripts.
2. `Baseline`: crear o actualizar AGENTS.md, docs/agent, readiness checklist y comandos minimos.
3. `Stabilize`: agregar gates deterministas y comandos estables.
4. `Manifest`: centralizar servicios, puertos, perfiles, deps y ownership.
5. `Automate`: convertir reglas en checks.
6. `Optimize`: agregar flow selection, status panels, runbooks, local-fresh y preview environments.
7. `Improve`: convertir fallos repetidos en guidance, skills, templates o validation gates.

## Arbol Topologico Del Ecosistema Agent Engineering

```text
agent-engineering/
  00-foundation/
    methodology/
      project-agent-readiness
      capability-first-metadata-driven
      semver-per-artifact
      markdown-knowledge-graph

  01-catalog/
    skills.yml
    guidance.yml
    sources.yml
    readiness-pillars.yml

  02-guidance/
    global/
      agent-operating-principles
      markdown-linking-policy
      semver-policy

    ai-agents/
      agent-ready-project
      codex-first-policy
      claude-compatibility-policy

    lifecycle/
      validation-levels
      readiness-maturity-model
      feedback-loop

    architecture/
      workspace-contracts
      service-ownership
      dependency-boundaries
      core-neutrality
      package-boundaries

    code-quality/
      code-review-standards
      complexity-budget
      file-size-budget
      tech-debt-budget

    cloud/
      local-service-manifest
      cloudflare-runtime-policy
      local-runtime-surface

    security/
      env-secrets-policy
      log-redaction
      secret-handling

    testing/
      testing-policy
      e2e-flow-policy
      impact-based-testing

    release/
      release-readiness
      preview-environment-policy
      rollback-policy

    observability/
      service-status-contract
      debugging-evidence-policy

  03-skills/
    ai-agents/
      project-agent-readiness
      skill-authoring
      guidance-authoring

    planning/
      spec-driven-planning
      task-breakdown

    architecture/
      workspace-contract-validation
      dependency-boundary-validation
      public-api-surface-review

    implementation/
      incremental-implementation
      workspace-package-scaffolding
      migration-cleanup

    code-review/
      risk-first-code-review
      production-code-review

    testing/
      impact-based-e2e-selection
      test-strategy-review

    debugging/
      runtime-debugging
      evidence-based-root-cause

    security/
      encrypted-dev-vars
      security-baseline-review

    cloud/
      manifest-driven-local-runtime
      service-boundary-validation
      local-state-reset
      cloudflare-local-tunnels

    data/
      d1-migration-baseline
      postgres-migration-baseline

    release/
      project-readiness-validation
      deploy-preflight
      ephemeral-preview-environments

    observability/
      service-status-validation
      local-status-panel

    documentation/
      agent-docs-bootstrap
      runbook-authoring

  04-templates/
    readiness/
      validate-runner
      workspace-contract-check
      service-manifest-schema
      local-runtime-template

    docs/
      AGENTS.md
      CLAUDE.md
      docs-agent-template

    cloudflare/
      worker-service-contract
      wrangler-validation

    testing/
      vitest-config
      playwright-config
      flow-manifest

  05-references/
    source-inventory
    licensing-policy
    maturity-model
    brainsforce-script-map
    external-repo-research

  06-adapters/
    codex/
      AGENTS.md
      skill-index
      install-guide

    claude/
      CLAUDE.md
      skill-index
      install-guide

  07-docs-site/
    astro-starlight/
      getting-started
      methodology
      skills
      guidance
      readiness
      contributing
```

Dependencia conceptual:

```text
foundation
  -> catalog
  -> guidance
  -> skills
  -> templates
  -> adapters
  -> docs-site
```

Topologia interna de readiness:

```text
agent-context
  -> command-contract
  -> workspace-topology
  -> local-runtime
  -> env-secrets
  -> validation-control-plane
  -> architecture-boundaries
  -> testing-strategy
  -> observability-debugging
  -> release-readiness
  -> knowledge-graph
  -> feedback-loop
```

## Metodo de Crecimiento

1. Inventariar fuentes: registrar repo, URL, licencia, area, calidad, utilidad y riesgos.
2. Clasificar: decidir si cada pieza es `skill`, `guidance`, `reference`, `template` o `adapter`.
3. Normalizar: reescribir con nuestra voz y formato, no copiar mecanicamente.
4. Etiquetar: aplicar metadatos por area, etapa, stack, agente y madurez.
5. Validar: probar cada skill en un caso real antes de marcarlo como estable.
6. Versionar: mantener SemVer por artifact, changelog y deprecaciones.
7. Medir: registrar donde el skill ayudo, donde fallo y que feedback debe incorporarse.
8. Publicar: exponer docs internas para descubrimiento y onboarding.

## Politica de Licencias

Regla practica:

- MIT, Apache-2.0, CC0 y Unlicense: buenos candidatos para reutilizacion con atribucion cuando aplique.
- CC-BY: se puede usar con atribucion clara.
- CC-BY-SA: usar con cuidado; puede imponer share-alike sobre derivados.
- GPL/AGPL: evitar copiar contenido a la base canonica si queremos distribucion interna limpia.
- Sin licencia o licencia desconocida: solo inspiracion, no copiar.

## Recomendacion Final

Empezar con una base pequena y fuerte:

- 8 a 12 skills core.
- 8 a 12 guidance docs.
- 1 catalogo de fuentes.
- 1 policy de licencias.
- 1 guia de authoring.
- Adaptadores simples para Codex y Claude.

La metodologia debe ser `capability-first, metadata-driven, adapter-thin`.

Eso permite que `agent-engineering` escale sin convertirse en una mezcla de carpetas por agente, por framework y por etapa.
