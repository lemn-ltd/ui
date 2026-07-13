# Spec: migración completa del catálogo al patrón de referencia interactiva

## Metadatos

- Estado: listo para implementación
- Fecha base: 2026-07-13
- Owner: LEMN UI
- Implementación de referencia: `/core/components/checkbox`
- Catálogo base: 112 componentes, 83 Core y 29 Agents
- Alcance pendiente: 111 componentes; Checkbox ya es el piloto
- Rama de implementación: `main`
- Producción: `https://showcase.ui.lemn.ai`
- Revisión browser obligatoria: `https://showcase-ui-6500.le-mn.com`

## Decisión

Todas las páginas de componentes restantes, tanto Core como Agents, se
migrarán al mismo contrato de documentación interactiva validado con Checkbox.
La página no usará capturas o miniaturas como contenido principal: mostrará el
componente real, ejecutable e interactivo. La estructura visual seguirá el
patrón de distribución de las páginas de Checkbox y Calendar de Tremor, pero el
contenido, código, contratos y textos se derivarán de este repositorio y de la
documentación oficial de las dependencias; no se copiará código o contenido de
Tremor.

La uniformidad no dependerá de revisión manual. El template, el límite de
ejemplos y los gates de catálogo harán que una página incompleta o divergente
falle antes del commit final.

## Objetivos

1. Convertir las 111 páginas restantes en referencias completas, consistentes
   e interactivas.
2. Hacer que cualquier componente nuevo herede el mismo patrón sin inventar una
   nueva distribución.
3. Mantener una única fuente de verdad entre componente, tipos TypeScript,
   catálogo, showcase, snippets públicos y endpoints para agentes.
4. Probar comportamiento, accesibilidad, responsive, Light y Dark antes de
   declarar una página migrada.
5. Entregar la migración completa desde `main`, hacer un commit final, push,
   deploy y verificación real en browser.

## No objetivos

- No migrar páginas `kind: foundation` ni `kind: pattern`; esta spec cubre las
  rutas `kind: component` de Core y Agents.
- No rediseñar la API pública de componentes salvo que una incompatibilidad
  real impida documentar o usar el componente.
- No crear un segundo sistema de UI, estilos copiados o componentes locales
  paralelos.
- No añadir dependencias para resolver presentación que el sistema actual ya
  cubre.
- No publicar datos de producto, clientes, credenciales ni fixtures de
  producción.
- No convertir la referencia de Tremor en una dependencia de runtime.

## Autoridades y patrones aplicables

La implementación debe cumplir `AGENTS.md` y las autoridades gestionadas bajo
`patterns/`. Los patrones materiales son:

- `PAT-ARCH-BEHAVIOR-PRESERVATION-001`: conservar comportamiento público al
  migrar presentación y documentación.
- `PAT-ARCH-DETERMINISTIC-NAMING-001`: mantener slug, título, grupo, ruta,
  export y nombre de componente alineados con el catálogo.
- `PAT-UI-LEMN-001`: todo snippet visible al consumidor usa `@lemn-ltd/ui` y
  `@lemn-ltd/ui/styles.css`.
- `PAT-UI-SYSTEM-001`: componentes compartidos accesibles, componibles,
  catalogados y documentados.
- `PAT-TEST-INTEGRITY-001`, `PAT-TEST-MEANINGFUL-001` y
  `PAT-TEST-EVIDENCE-001`: las pruebas son contratos y las capturas se revisan,
  no se actualizan a ciegas.
- `PAT-TEST-PLACEMENT-001`: los nuevos gates compartidos viven bajo los árboles
  `tests/` de su app o package owner.
- `PAT-CLOUDFLARE-WRANGLER-CONFIG-001`: el deploy se valida con dry-run y la
  configuración de producción vive en `wrangler.jsonc`.
- `PAT-SEC-SECRETS-001` y `PAT-SEC-RISK-001`: no exponer credenciales,
  referers innecesarios ni datos sensibles en ejemplos o artefactos.
- `PAT-DOCS-WIKI-001`: esta decisión y su evidencia permanecen en el repo.

Los imports internos del workspace pueden conservar temporalmente el nombre
actual del package local para compilar. Todo contenido público visible,
instalación, snippet, catálogo HTTP y guía para agentes debe usar
`@lemn-ltd/ui`. El rename físico del package interno no forma parte de esta
spec.

## Fuentes de verdad

La migración no mantendrá una lista duplicada de componentes:

1. `componentCatalog` define slug, título, grupo, estado e intención.
2. `SHOWCASE_REGISTRY` define la ruta y carga la página real.
3. El tipo público exportado del componente define su tabla API.
4. La primera instancia directa de `ExampleBlock` define el hero, la tarjeta de
   overview y el playground interactivo.
5. `DocumentationPage` y sus subcomponentes definen el chrome común.

El inventario del apéndice es una fotografía de planificación. Los gates deben
iterar el catálogo en runtime para incluir automáticamente componentes nuevos.

## Resultado de experiencia

### Navegación general

- La primera visita usa Light, incluso cuando el sistema operativo está en
  Dark. Una preferencia explícita guardada por el usuario se conserva.
- Existe un solo control global de tema.
- Ningún ejemplo tiene su propio toggle Light/Dark.
- El sidebar no muestra iconos decorativos.
- Cada grupo es un primer nivel tipográfico y cada componente es un segundo
  nivel indentado.
- El activo usa una superficie neutra y una barra de selección discreta.

### Paleta Dark

El modo Dark usa la familia medida en la referencia de Tremor:

| Rol | Valor |
|---|---|
| Fondo y superficie principal | `oklch(0.13 0.028 261.692)` |
| Superficie elevada/activa | `oklch(0.21 0.034 264.665)` |
| Canvas de preview | `#090e1a` |
| Borde | `oklch(0.278 0.033 256.848)` |
| Texto principal | `oklch(0.985 0.002 247.839)` |
| Texto secundario | `oklch(0.707 0.022 261.325)` |
| Texto tenue | `oklch(0.551 0.027 264.364)` |

El acento de marca existente no se reemplaza por el azul de Tremor.

## Contrato obligatorio de cada página

El orden es fijo. Una página solo puede desviarse cuando el componente no
posea una capacidad determinada y la ausencia quede explicada en su código y
prueba.

### 1. Header

- Categoría tomada del catálogo.
- `h1` con el título canónico.
- Resumen breve basado en la intención del catálogo.
- Entre cero y tres links oficiales: documentación del primitive/dependencia,
  API upstream y repositorio LEMN.
- Links externos con `target="_blank"`, `rel="noreferrer noopener"`,
  `referrerPolicy="no-referrer"` y nombre accesible que indique nueva pestaña.

### 2. Hero interactivo

- Es el primer `ExampleBlock` directo.
- Usa `presentation="documentation"`.
- Tiene tabs Preview y Code.
- Preview renderiza el componente real; no una imagen, SVG de captura o mock
  estático.
- Code muestra un ejemplo de consumo con import desde `@lemn-ltd/ui`.
- Copy code funciona y confirma estado `Copied`.
- Es determinista, autocontenido y no depende de auth o APIs de producto.
- En overlays, el trigger y su portal companion pertenecen al mismo fragmento.

### 3. Installation

Usa `DocumentationSection` y `DocumentationSteps` con dos pasos:

1. Instalar: `pnpm add @lemn-ltd/ui`.
2. Cargar: importar `@lemn-ltd/ui/styles.css` una sola vez en el root e importar
   el componente desde el entrypoint público.

No se muestra `@latest`, una versión inventada, un deep import ni el nombre
interno del workspace.

### 4. Ejemplos adicionales

- Máximo absoluto: tres `ExampleBlock` por página contando el hero.
- Por lo tanto, solo puede haber cero, uno o dos bloques adicionales.
- Cada ejemplo debe probar una capacidad material distinta.
- Estados visualmente cercanos pueden agruparse dentro de un mismo bloque, como
  `unchecked`, `defaultChecked` y `disabled` en Checkbox.
- No se crean ejemplos para llenar espacio.
- Componentes con estado controlado deben incluir al menos una interacción real
  que cambie el estado.
- Componentes con loading, empty, error, disabled, permission o pending muestran
  los estados aplicables sin superar el límite.
- `DocumentationPage` mantiene `MAX_DOCUMENTATION_EXAMPLES = 3` y lanza un error
  si una página intenta excederlo.

Prioridad para seleccionar solo tres ejemplos:

1. Uso principal interactivo.
2. Variantes/estados más usados o con mayor riesgo de accesibilidad.
3. Comportamiento avanzado, controlado o de error más distintivo.

### 5. API Reference

`DocumentationFooter` incluye `API Reference: <Component>` y una tabla semántica
con columnas exactas:

| Prop | Type | Default | Description |
|---|---|---|---|

Reglas:

- Las filas se derivan del tipo público exportado, no de memoria ni de la
  referencia visual.
- Se documentan primero las props propias del componente; las props DOM
  heredadas se enlazan o resumen en vez de duplicarlas todas.
- `Default` usa el valor real; si no existe, muestra `—`.
- Tipos union, callbacks y estados especiales se muestran completos.
- La descripción explica el contrato observable, no la implementación interna.
- Si el wrapper extiende una API upstream, la introducción enlaza esa API.
- La tabla permite scroll horizontal en mobile sin causar overflow de la página.

### 6. Cierre común

- Link `Found a bug?` al issue tracker de `lemn-ltd/ui`.
- Separador.
- `© 2026 LEMN. All rights reserved.`
- No se atribuye copyright propio a Tremor ni Radix.

## Privacidad, licencias y referencias externas

- Los links a Radix u otra documentación oficial son links estáticos. No se
  embeben scripts, iframes, pixels ni contenido remoto.
- La navegación externa ocurre solo al hacer click y no envía referrer desde el
  showcase.
- El destino aún recibe metadatos normales de red como IP y user agent; esto no
  debe describirse como navegación anónima.
- Enlazar documentación no exige copiar su contenido.
- Si se distribuye código derivado de una dependencia MIT, sus avisos de licencia
  se preservan en el mecanismo legal del package. Ese control es independiente
  de los links de documentación.
- No se copia texto, código o fixtures de Tremor. Se replica únicamente la
  jerarquía de información y el comportamiento visual general.

## Componentes Core y Agents

### Core

- Rutas: `/core/components/<slug>`.
- Grupos incluidos: Primitives, Forms, Overlays, Navigation, Data display,
  Feedback y Layout.
- Fixtures sintéticos, deterministas y brand-neutral.
- No se añade lógica de producto al package compartido.

### Agents

- Rutas: `/agents/components/<slug>`.
- Se usa exactamente el mismo template, sin una variante visual paralela.
- Fixtures de runs, approvals, tools y capabilities son sintéticos y no pueden
  contener payloads, prompts, organizaciones o credenciales reales.
- Los ejemplos de mutación muestran estados pending/success/error cuando sean
  parte real del contrato del componente.

## Algoritmo de migración por componente

Para cada entrada pendiente:

1. Abrir catálogo, página actual, componente fuente, export público, estilos y
   pruebas existentes.
2. Identificar el primitive/dependencia upstream real y su documentación oficial.
3. Enumerar props propias, defaults, estados y keyboard interactions.
4. Elegir hasta tres ejemplos con la prioridad definida arriba.
5. Mantener el primer ejemplo como canonical live preview.
6. Migrar la página a `DocumentationPage` usando únicamente el template común.
7. Añadir API rows derivadas del tipo público.
8. Ejercitar manualmente todos los controles visibles.
9. Verificar 375, 768 y 1280 px en Light y Dark.
10. Añadir o actualizar pruebas de comportamiento y capturas revisadas.
11. Marcar el componente completado en la evidencia generada desde el catálogo.

No se escribe una página nueva basándose solo en el screenshot de un tercero.
La captura ayuda con composición; el repo define el comportamiento real.

## Guardrails que impiden divergencia

La implementación debe añadir un gate de contrato que itere todas las entradas
`kind: component` del registry. El gate falla si alguna ruta:

- no renderiza `.showcase-docs-page`;
- no tiene exactamente un `h1` con el título del catálogo;
- tiene menos de uno o más de tres `.showcase-example`;
- no tiene Preview y Code en el hero;
- no expone código de import público `@lemn-ltd/ui`;
- muestra `@appranks/ui`, `@latest` o deep imports en contenido visible;
- no tiene `Installation` o `API Reference: <Component>`;
- no tiene tabla con Prop, Type, Default y Description;
- contiene un toggle de tema dentro de un ejemplo;
- usa una imagen como sustituto del componente real;
- produce overflow horizontal en 375, 768 o 1280 px;
- rompe el canonical preview en card o playground;
- deja un link externo sin los atributos de privacidad y seguridad definidos.

Controles adicionales:

- Test unitario del límite `MAX_DOCUMENTATION_EXAMPLES`.
- Test del catálogo HTTP que exige package `@lemn-ltd/ui`, source LEMN y snippets
  públicos LEMN.
- Playwright genera la lista de rutas desde el registry, no desde una allowlist.
- Axe se ejecuta sobre todas las páginas en Light y Dark.
- Las capturas se actualizan solo con `--update-snapshots` durante revisión
  intencional; después se repite la suite sin esa opción.
- El gate final compara cantidad de rutas migradas con cantidad de componentes
  del catálogo. En la base actual ambos deben ser 112.

## Estrategia de implementación

### Fase 0: infraestructura común

Estado: completada por el piloto Checkbox.

- `DocumentationPage`, `DocumentationSection`, `DocumentationSteps` y
  `DocumentationFooter` reutilizables.
- `ExampleBlock` con presentación documentation.
- Máximo de tres ejemplos.
- Tabla API responsive.
- Sidebar limpio, Light por defecto, un solo toggle global y paleta Dark.

Antes de migrar el resto se estabiliza el gate de contrato para impedir que una
página parcial pueda considerarse terminada.

### Fase 1: Core básico

- Primitives restantes.
- Forms.
- Prioridad a controles con keyboard/focus y estados controlados.

### Fase 2: Core compuesto

- Overlays.
- Navigation.
- Data display.
- Feedback.
- Layout.

### Fase 3: Agents

- Los 29 componentes Agents.
- Prioridad a approval, execution, automation y runtime surfaces por su mayor
  densidad de estado.

### Fase 4: cierre integral

- Ejecutar el gate de todas las rutas.
- Revisar visuales Light/Dark y mobile/tablet/desktop.
- Ejecutar accessibility, unit, e2e, build, validators y Cloudflare dry-run.
- Revisar diff y snapshots de forma semántica.
- No hacer commit ni push parcial de la migración.

## Flujo obligatorio de branch, commit, push y deploy

La implementación se realiza directamente en `main`, según decisión explícita
del owner.

### Preflight

1. Confirmar `git branch --show-current` devuelve `main`.
2. Ejecutar `git status --short --branch` y preservar cambios fuera del alcance
   identificado. “Commit de todo” significa todos los archivos que pertenecen a
   esta migración y sus requisitos previos; no autoriza incorporar secretos,
   artefactos temporales ni cambios ajenos.
3. Confirmar que el servidor local escucha realmente en 6500.
4. Resolver el tunnel con `lemn-dev-tunnel url showcase-ui 6500`.
5. Verificar credenciales Cloudflare mediante AgentOps según `AGENTS.md`, sin
   imprimir el secret, y confirmar el account esperado antes de mutar recursos.

### Gates antes del commit

Como mínimo:

```bash
pnpm check
pnpm validate
pnpm --filter @appranks/ui test
pnpm --filter @appranks/showcase-kit test
pnpm --filter @appranks/ui-showcase test
pnpm --filter @appranks/ui-showcase exec playwright test
pnpm build
pnpm --filter @appranks/ui-showcase run cf:dry-run
```

Los nombres internos en los comandos reflejan los packages actuales del
workspace. No se muestran como instrucción de instalación pública.

### Entrega

Solo cuando los 112 componentes pasan el contrato:

1. Revisar `git diff --check` y el diff completo.
2. Añadir todos los archivos de la migración al index.
3. Crear un único commit final sugerido:
   `feat(showcase): migrate all component reference pages`.
4. Ejecutar `git push origin main`.
5. Confirmar que el SHA remoto coincide con el commit local.
6. Ejecutar el deploy de producción del showcase desde ese mismo SHA.
7. No declarar éxito si push o deploy falla.

### Verificación posterior

Después del deploy:

1. Verificar producción:
   - `https://showcase.ui.lemn.ai/health`
   - `https://showcase.ui.lemn.ai/catalog.json`
   - `https://showcase.ui.lemn.ai/llms.txt`
   - `https://showcase.ui.lemn.ai/llms-full.txt`
   - muestras Core y Agents, más un route sweep automatizado.
2. Verificar en browser el build local de ese mismo SHA mediante
   `https://showcase-ui-6500.le-mn.com`.
3. En el tunnel comprobar sidebar, Light inicial, toggle global, Dark, tres
   viewports, interacción real, API table, links y ausencia de overflow.
4. Guardar evidencia del SHA, comandos, target y resultados. Un tunnel sano no
   sustituye el smoke de producción, y producción sana no sustituye la revisión
   visual del tunnel.

## Criterios de aceptación globales

La migración se considera terminada únicamente cuando:

- Las 112 entradas actuales del catálogo renderizan el template común.
- Checkbox y las otras 111 rutas cumplen el mismo contrato.
- Cada página tiene entre uno y tres ejemplos, contando el hero.
- Todos los ejemplos principales son componentes reales e interactivos.
- Todas las API tables reflejan tipos públicos reales y defaults correctos.
- Ningún contenido público recomienda `@appranks/ui`, `@latest` o deep imports.
- Core y Agents usan el mismo lenguaje visual y la misma jerarquía.
- Solo existe un toggle global de tema y la primera visita abre en Light.
- Dark usa los tokens definidos en esta spec.
- No existe overflow en 375, 768 y 1280 px.
- Keyboard, focus, Escape, disabled y controlled behavior pasan donde aplican.
- Axe no reporta violaciones nuevas.
- La suite visual pasa sin regenerar snapshots en la corrida final.
- Check, validate, unit, e2e, build y Cloudflare dry-run pasan en el estado exacto
  que se commitea.
- El commit final está en `origin/main`.
- El deploy corresponde al mismo SHA.
- Producción y el tunnel 6500 pasan los smokes definidos.

## Riesgos y mitigaciones

| Riesgo | Mitigación obligatoria |
|---|---|
| 111 páginas divergen por copy/paste | Template común y route-sweep generado desde registry |
| Ejemplos excesivos vuelven ilegible la página | Límite runtime y test de máximo tres |
| Tabla API queda obsoleta | Derivar filas del tipo/export real y revisar en cada cambio público |
| Overlays no funcionan en card/playground | Primer ExampleBlock conserva trigger y portal companion |
| Snapshots ocultan regresiones | Revisar diff visual y repetir suite sin update |
| Fixtures Agents filtran datos | Solo datos sintéticos, deterministas y brand-neutral |
| Se confunde package interno con público | Gate visible prohíbe `@appranks/ui`; snippets usan LEMN |
| Deploy usa cuenta o dominio incorrectos | Whoami contra metadata AgentOps antes de mutar Cloudflare |
| Tunnel se interpreta como producción | Smoke separado y obligatorio en ambos destinos |
| Nuevos componentes nacen con formato viejo | Gate itera catálogo completo y falla al crecer sin docs |

## Inventario base

La casilla marcada corresponde al piloto. Las demás forman el alcance pendiente.

### Primitives (17)

- [ ] `button` — Button
- [ ] `icon-button` — Icon button
- [ ] `scroll-to-bottom-button` — Scroll to bottom button
- [ ] `input` — Input
- [ ] `textarea` — Textarea
- [ ] `select` — Select
- [ ] `search` — Search
- [x] `checkbox` — Checkbox
- [ ] `radio` — Radio
- [ ] `toggle` — Toggle
- [ ] `badge` — Badge
- [ ] `tag` — Tag
- [ ] `avatar` — Avatar
- [ ] `kbd` — Kbd
- [ ] `meter` — Meter
- [ ] `filter-pill` — Filter pill
- [ ] `scope-pill` — Scope pill

### Forms (13)

- [ ] `field` — Field
- [ ] `calendar` — Calendar
- [ ] `inline-edit` — Inline edit
- [ ] `segmented-control` — Segmented control
- [ ] `combobox` — Combobox
- [ ] `accordion` — Accordion
- [ ] `selection-list` — SelectionList
- [ ] `composer` — Composer
- [ ] `key-value-editor` — Key-value editor
- [ ] `json-code-editor` — JSON code editor
- [ ] `file-dropzone` — File dropzone
- [ ] `file-bundle-editor` — File bundle editor
- [ ] `markdown-editor` — Markdown editor

### Overlays (10)

- [ ] `dialog` — Dialog
- [ ] `drawer` — Drawer
- [ ] `markdown-viewer` — Markdown viewer
- [ ] `confirm-dialog` — Confirm dialog
- [ ] `form-dialog` — Form dialog
- [ ] `menu` — Menu
- [ ] `popover` — Popover
- [ ] `tooltip` — Tooltip
- [ ] `hint-icon` — Hint icon
- [ ] `command-palette` — Command palette

### Navigation (9)

- [ ] `sidebar` — Sidebar
- [ ] `top-bar` — Top bar
- [ ] `entity-toolbar` — Entity toolbar
- [ ] `breadcrumb` — Breadcrumb
- [ ] `tabs` — Tabs
- [ ] `stepper` — Stepper
- [ ] `org-switcher` — Org switcher
- [ ] `pagination` — Pagination
- [ ] `dock-panel` — Dock panel

### Data display (19)

- [ ] `card` — Card
- [ ] `settings-row` — Settings row
- [ ] `description-list` — Description list
- [ ] `data-table` — Data table
- [ ] `stat-card` — Stat card
- [ ] `stats-strip` — Stats strip
- [ ] `code-block` — Code block
- [ ] `syntax-code-block` — Syntax code block
- [ ] `json-viewer` — JSON viewer
- [ ] `markdown` — Markdown
- [ ] `sparkline` — Sparkline
- [ ] `relative-time` — Relative time
- [ ] `list-shell` — List shell
- [ ] `list-filters-bar` — List filters bar
- [ ] `filter` — Filter
- [ ] `filter-chip` — Filter chip
- [ ] `empty-state` — Empty state
- [ ] `recent-chips` — Recent chips
- [ ] `preset-selector` — Preset selector

### Feedback (7)

- [ ] `toast` — Toast
- [ ] `toaster` — Toaster
- [ ] `info-banner` — Info banner
- [ ] `system-bar` — System bar
- [ ] `skeleton` — Skeleton
- [ ] `spinner` — Spinner
- [ ] `progress-bar` — Progress bar

### Layout (8)

- [ ] `screen-shell` — Screen shell
- [ ] `content-layout` — Content layout
- [ ] `page-section` — Page section
- [ ] `section-grid` — Section grid
- [ ] `two-column` — Two column
- [ ] `settings-shell` — Settings shell
- [ ] `sign-in-screen` — Sign-in screen
- [ ] `version-tag` — Version tag

### Agents (29)

- [ ] `agent-activity-line` — Agent activity line
- [ ] `agent-message-bubble` — Agent message bubble
- [ ] `agent-reasoning-block` — Agent reasoning block
- [ ] `agent-text-block` — Agent text block
- [ ] `user-message-bubble` — User message bubble
- [ ] `agent-status-badge` — Agent status badge
- [ ] `capability-chip` — Capability chip
- [ ] `capability-constraints-editor` — Capability constraints editor
- [ ] `principal-picker` — Principal picker
- [ ] `approval-card` — Approval card
- [ ] `approvals-inbox` — Approvals inbox
- [ ] `capability-matrix` — Capability matrix
- [ ] `classification-matrix` — Classification matrix
- [ ] `effective-surface-viewer` — Effective surface viewer
- [ ] `agent-tool-call-list` — Agent tool call list
- [ ] `execution-map` — Execution map
- [ ] `automation-status-badge` — Automation status badge
- [ ] `trigger-tile` — Trigger tile
- [ ] `schedule-editor` — Schedule editor
- [ ] `trigger-composer` — Trigger composer
- [ ] `automation-graph` — Automation graph
- [ ] `node-inspector` — Node inspector
- [ ] `run-timeline` — Run timeline
- [ ] `wait-retry-chip` — Wait & retry chips
- [ ] `approval-panel` — Approval panel
- [ ] `planner-status` — Planner status
- [ ] `proposal-preview` — Proposal preview
- [ ] `node-attempts-table` — Node attempts table
- [ ] `runtime-refs-panel` — Runtime refs panel

## Evidencia final esperada

El handoff final debe incluir:

- SHA local y remoto.
- Cantidad de componentes del catálogo y cantidad de rutas conformes.
- Resultado de cada gate con comando exacto.
- Resumen de snapshots cambiados y confirmación de la segunda corrida sin update.
- URLs de producción y tunnel verificadas.
- Resultado de `/health`, `/catalog.json`, `/llms.txt` y `/llms-full.txt`.
- Muestras verificadas de cada grupo Core y del grupo Agents.
- Bloqueadores reales, si existe alguno, sin declarar deploy completo cuando no
  lo está.
