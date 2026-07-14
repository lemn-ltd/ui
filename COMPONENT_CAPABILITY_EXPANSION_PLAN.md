# Plan integral de expansión de capacidades de Lemn UI

- Estado: aprobado para implementación
- Tipo: plan de ejecución, migración y auditoría post-implementación
- Paquete afectado: @lemn-ltd/ui
- Versión observada al redactar: 0.1.2
- Versión objetivo de la entrega: 0.2.0
- Fecha de la fotografía base: 2026-07-14

## 1. Propósito

Este documento define una implementación completa y revisable para:

1. elevar los componentes con capacidad parcial o componible hasta una capacidad directa o superior;
2. cubrir las capacidades realmente ausentes;
3. separar correctamente módulos y familias funcionales;
4. añadir una familia de visualizaciones escalable;
5. adoptar dos motores de gráficos complementarios de forma progresiva;
6. conservar el patrón de construcción de Lemn UI;
7. evitar dependencias, abstracciones y coste de bundle innecesarios;
8. actualizar catálogo, showcase, documentación y pruebas como una sola entrega coherente;
9. dejar un procedimiento independiente para auditar el resultado después de implementarlo.

Este plan es la fuente de alcance de la implementación. Si durante la ejecución aparece una decisión que cambia la API pública, el inventario, el motor, la taxonomía o los criterios de aceptación, el agente debe detener esa parte, registrar la propuesta y solicitar aprobación antes de ampliar el alcance.

## 2. Resumen ejecutivo de la decisión

- El catálogo actual contiene 112 componentes: 83 del módulo Core y 29 del módulo Agents.
- Se añadirán 18 componentes nuevos al módulo Core.
- El catálogo objetivo será de 130 componentes: 101 Core y 29 Agents.
- La entrega será una única versión 0.2.0, ejecutada internamente por fases pequeñas y verificables.
- Recharts será el motor primario de visualizaciones y se incorporará en esta implementación.
- Apache ECharts será el motor secundario especializado. Se documentará ahora, pero no se instalará hasta que exista un componente concreto que supere el umbral de adopción definido en este documento.
- Las visualizaciones simples se implementarán con HTML, CSS y SVG nativos cuando un motor no aporte valor.
- No existirá una prop pública para escoger motor.
- No se creará un adaptador genérico de motores.
- Ningún tipo público expondrá tipos de Recharts, ECharts o D3.
- Core y Agents son módulos. Las familias son una dimensión distinta dentro de cada módulo.
- El campo técnico del catálogo para el módulo será area y la familia seguirá representada por group.
- Foundations y Patterns pertenecen al showcase y no forman parte del catálogo de componentes distribuido.
- Cada página de componente tendrá un máximo de tres ejemplos reales e interactivos.
- No se copiarán código, textos, ejemplos, activos ni atribuciones de sitios de referencia externos.

## 3. Autoridades y patrones aplicables

Antes de implementar, el agente debe leer en este orden:

1. AGENTS.md
2. patterns/pattern-system.md
3. patterns/pattern-profile.md
4. las entradas relevantes de patterns/patterns.md
5. patterns/pattern-audit.md

Patrones materialmente aplicables:

| Patrón | Aplicación en esta entrega |
| --- | --- |
| PAT-ARCH-CHANGE-SCOPE-001 | Limitar cambios a catálogo, UI, showcase, docs, pruebas y tooling directamente necesario. |
| PAT-ARCH-ABSTRACTIONS-001 | Crear abstracciones solo después de demostrar repetición real. |
| PAT-CODE-FRAMEWORK-API-VALIDITY-001 | Verificar APIs reales de Radix, Recharts y React antes de usarlas. |
| PAT-CODE-DEPENDENCIES-001 | Justificar, fijar, auditar y aislar cada dependencia nueva. |
| PAT-UI-LEMN-001 | Mantener tokens, temas, prefijo CSS, estados y apariencia propios de Lemn UI. |
| PAT-UI-SYSTEM-001 | Integrar componentes como sistema, no como demos aisladas. |
| PAT-UI-STATES-001 | Cubrir loading, empty, error, permission cuando aplique y success. |
| PAT-TEST-* | Mantener aserciones significativas y evidencia de gates. |

Los tests existentes están colocados junto al código bajo packages/ui/src. Aunque PAT-TEST-PLACEMENT-001 pueda definir otra aspiración, esta entrega seguirá la convención local para no mezclar una migración completa de estructura de tests. La diferencia debe registrarse en patterns/pattern-audit.md, no ocultarse ni resolverse parcialmente.

## 4. Precondición de workspace

La fotografía usada para este plan muestra cambios previos sin confirmar en apps/showcase y packages/showcase-kit. No pertenecen a esta expansión.

Antes de comenzar la implementación:

1. ejecutar git status --short --branch;
2. confirmar el SHA base;
3. preservar el trabajo existente;
4. usar un checkout o worktree limpio dedicado a esta entrega;
5. no usar reset, checkout destructivo ni stash sin autorización;
6. no mezclar los cambios previos del showcase con los commits de esta implementación.

La implementación no debe empezar sobre un árbol sucio si no existe una atribución inequívoca de cada cambio.

## 5. Estado base verificado

Fotografía observada al redactar:

- Paquete: @lemn-ltd/ui.
- Versión: 0.1.2.
- Catálogo: 112 entradas.
- Core: 83 entradas.
- Agents: 29 entradas.
- TypeScript: pasa.
- Tests de UI: 122 archivos y 534 tests pasan en la fotografía base.
- El paquete no declara un motor de gráficos.
- Las dependencias D3 presentes en el lockfile son transitivas de React Flow y no constituyen un contrato consumible.
- El catálogo solo dispone de group y deduce el módulo Agents mediante group === 'Agents'.
- El script scripts/check-ui-boundaries.mjs depende de process.cwd().
- El comando del paquete para validate:boundaries resuelve por error packages/ui/packages/ui/src.
- El mismo script ejecutado desde el root sí encuentra packages/ui/src y pasa.
- packages/ui/src/foundations/tokens.css contiene la paleta dark nueva.
- packages/ui/src/tokens.ts todavía refleja valores dark anteriores para superficies y texto.
- Las pruebas de tokens validan forma y claves, pero no paridad exacta.
- Sparkline puede renderizar role="img" sin exigir un nombre accesible.
- docs/showcase-component-documentation-migration/SPEC.md contiene siete menciones de una marca externa de referencia que deben desaparecer sin trasladarse a documentos nuevos.

El agente debe volver a medir esta base al iniciar. Si cambió, registrará la nueva cifra y explicará cualquier desviación antes de continuar.

## 6. Terminología canónica

### 6.1 Módulo

El módulo expresa el dominio principal de distribución y navegación:

- Core
- Agents

En código se representa con:

    type ComponentArea = 'core' | 'agents';

El nombre area se conserva porque ya representa bien la dimensión técnica y evita sobrecargar module en TypeScript.

### 6.2 Familia

La familia agrupa componentes por capacidad funcional dentro de un módulo. En el catálogo se representa con group.

Familias de Core:

- Primitives
- Inputs
- Forms
- Visualizations
- Data display
- Feedback
- Overlays
- Navigation
- Layout

Familias de Agents:

- Conversation
- Governance
- Approvals
- Automation
- Runtime & evidence

### 6.3 Componente

El componente es la unidad pública identificada por slug, título, API, exports, documentación, showcase y pruebas.

### 6.4 Dimensiones que no deben mezclarse

- area identifica el módulo.
- group identifica la familia.
- slug identifica el componente.
- Foundations y Patterns son secciones editoriales del showcase.
- No se añadirá un campo category redundante.
- No se volverá a usar Agents como familia, porque es un módulo.

## 7. Modelo de catálogo objetivo

El tipo debe ser una unión discriminada que impida familias inválidas para cada módulo:

    export type ComponentArea = 'core' | 'agents';

    export type CoreComponentGroup =
      | 'Primitives'
      | 'Inputs'
      | 'Forms'
      | 'Visualizations'
      | 'Data display'
      | 'Feedback'
      | 'Overlays'
      | 'Navigation'
      | 'Layout';

    export type AgentComponentGroup =
      | 'Conversation'
      | 'Governance'
      | 'Approvals'
      | 'Automation'
      | 'Runtime & evidence';

    interface BaseCatalogEntry {
      readonly slug: string;
      readonly title: string;
      readonly status: 'stable' | 'beta';
      readonly intent: string;
    }

    export type ComponentCatalogEntry =
      | (BaseCatalogEntry & {
          readonly area: 'core';
          readonly group: CoreComponentGroup;
        })
      | (BaseCatalogEntry & {
          readonly area: 'agents';
          readonly group: AgentComponentGroup;
        });

Requisitos:

- Cada entrada debe declarar area explícitamente.
- apps/showcase/src/client/registry/component-entry.ts debe dejar de inferir el área a partir de group.
- Las rutas deben continuar usando /core/components/:slug y /agents/components/:slug.
- El orden de familias debe definirse por módulo, no en una lista global ambigua.
- Los tests deben impedir slugs duplicados, familias cruzadas, componentes sin docs y exports inexistentes.
- La API pública debe exportar ComponentArea, CoreComponentGroup, AgentComponentGroup y ComponentCatalogEntry.
- Si ComponentGroup se conserva temporalmente como alias de compatibilidad, debe marcarse deprecated y eliminarse en una versión posterior documentada. La opción preferida para 0.2.0 es reemplazarlo con una nota de migración explícita.

## 8. Inventario objetivo completo

### 8.1 Core: 101 componentes

| Familia | Cantidad | Componentes |
| --- | ---: | --- |
| Primitives | 9 | Button, Icon button, Scroll to bottom button, Badge, Tag, Avatar, Kbd, Filter pill, Scope pill |
| Inputs | 17 | Input, Textarea, Select, Search, Checkbox, Radio, Toggle, Calendar, Segmented control, Combobox, Selection list, Select native, Radio card group, Toggle group, Slider, Date picker, Date range picker |
| Forms | 9 | Field, Inline edit, Accordion, Composer, Key-value editor, JSON code editor, File dropzone, File bundle editor, Markdown editor |
| Visualizations | 13 | Area chart, Bar chart, Combo chart, Bar list, Category bar, Donut chart, Line chart, Progress bar, Progress circle, Spark chart, Sparkline, Tracker, Meter |
| Data display | 18 | Card, Settings row, Description list, Data table, Stat card, Stats strip, Code block, Syntax code block, JSON viewer, Markdown, Relative time, List shell, List filters bar, Filter, Filter chip, Empty state, Recent chips, Preset selector |
| Feedback | 6 | Toast, Toaster, Info banner, System bar, Skeleton, Spinner |
| Overlays | 10 | Dialog, Drawer, Markdown viewer, Confirm dialog, Form dialog, Menu, Popover, Tooltip, Hint icon, Command palette |
| Navigation | 10 | Sidebar, Top bar, Entity toolbar, Breadcrumb, Tabs, Stepper, Org switcher, Pagination, Dock panel, Tab navigation |
| Layout | 9 | Screen shell, Content layout, Page section, Section grid, Two column, Settings shell, Sign-in screen, Version tag, Separator |

Los 18 componentes nuevos son:

- Visualizations: AreaChart, BarChart, ComboChart, BarList, CategoryBar, DonutChart, LineChart, ProgressCircle, SparkChart y Tracker.
- Inputs: SelectNative, RadioCardGroup, ToggleGroup, Slider, DatePicker y DateRangePicker.
- Navigation: TabNavigation.
- Layout: Separator.

Componentes existentes que cambian de familia:

- Meter: Primitives a Visualizations.
- Sparkline: Data display a Visualizations.
- ProgressBar: Feedback a Visualizations.
- Input, Textarea, Select, Search, Checkbox, Radio y Toggle: Primitives a Inputs.
- Calendar, SegmentedControl, Combobox y SelectionList: Forms a Inputs.

La reclasificación del catálogo es obligatoria. Los movimientos físicos de archivos deben hacerse solo si no rompen imports internos o deep imports no documentados. Como el package.json solo publica entrypoints controlados, se recomienda alinear las rutas físicas en un commit mecánico separado, manteniendo intactos los imports públicos desde @lemn-ltd/ui. No se moverán helpers internos no catalogados de forma oportunista.

### 8.2 Agents: 29 componentes

| Familia | Cantidad | Componentes |
| --- | ---: | --- |
| Conversation | 6 | AgentActivityLine, AgentMessageBubble, AgentReasoningBlock, AgentTextBlock, UserMessageBubble, AgentToolCallList |
| Governance | 6 | CapabilityChip, CapabilityConstraintsEditor, PrincipalPicker, CapabilityMatrix, ClassificationMatrix, EffectiveSurfaceViewer |
| Approvals | 3 | ApprovalCard, ApprovalsInbox, ApprovalPanel |
| Automation | 6 | TriggerTile, ScheduleEditor, TriggerComposer, AutomationGraph, NodeInspector, ProposalPreview |
| Runtime & evidence | 8 | AgentStatusBadge, ExecutionMap, AutomationStatusBadge, RunTimeline, WaitRetryChip, PlannerStatus, NodeAttemptsTable, RuntimeRefsPanel |

Los componentes de Agents no se reescriben en esta entrega. Se reclasifican en catálogo, navegación y documentación, y se verifican sus rutas y exports.

## 9. Capacidades parciales, componibles y ausentes

| Situación actual | Decisión objetivo |
| --- | --- |
| No existe una familia de gráficos general | Crear Visualizations con 13 componentes y arquitectura común mínima. |
| ProgressBar, Sparkline y Meter existen en familias distintas | Reubicarlos conceptualmente en Visualizations, preservando API cuando sea posible. |
| Select cubre una selección enriquecida, pero no un select nativo | Añadir SelectNative para formularios simples, mobile y progressive enhancement. |
| Radio existe, pero no una opción visual en tarjetas | Añadir RadioCardGroup sobre la semántica de RadioGroup. |
| SegmentedControl es single-select | Conservarlo y añadir ToggleGroup para comandos single o multiple. |
| Toggle es un switch booleano | Conservarlo como switch; no usarlo como sustituto de ToggleGroup. |
| Calendar selecciona una fecha | Extenderlo con rango y multi-month opcional sin romper el caso simple. |
| No existen pickers compuestos | Añadir DatePicker y DateRangePicker componiendo Calendar, Popover, Button y Field. |
| Tabs representa paneles, pero debe completar la relación tab-panel | Extender Tabs para renderizar paneles reales y mantener modo controlado. |
| No existe navegación horizontal equivalente a pestañas de ruta | Añadir TabNavigation con enlaces semánticos; no reutilizar Tabs. |
| InfoBanner es demasiado básico para un callout completo | Añadir title, icon, estructura y acciones compatibles. |
| No existe separador explícito | Añadir Separator con orientación y semántica decorativa o estructural. |
| Field ya cubre etiqueta, descripción, error y control | No añadir Label; documentar Field como solución superior. |

## 10. Estrategia de motores de gráficos

### 10.1 Orden de adopción

1. Recharts, ahora, como motor principal.
2. Apache ECharts, más adelante, como motor especializado.

La palabra seleccionado describe una decisión, no un problema. La limitación real de Recharts es distinta: cubre muy bien dashboards React declarativos y composables, pero no es la mejor herramienta para todas las visualizaciones de alta densidad, canvas, geoespaciales o altamente especializadas.

### 10.2 Recharts

Rol:

- motor de las visualizaciones React comunes;
- API declarativa;
- SVG;
- composición natural;
- integración sencilla con React, TypeScript y CSS variables;
- base adecuada para line, area, bar, combo, donut y spark charts.

Dependencias:

- añadir Recharts como dependencia directa de packages/ui;
- añadir react-is en versión compatible con React 19.2.4 cuando la versión fijada de Recharts lo requiera;
- declarar ambas en el catálogo del workspace;
- fijar versiones exactas;
- actualizar pnpm-lock.yaml de forma coherente.

Versión de referencia evaluada:

- Recharts 3.9.2.

Antes de instalar, el agente debe confirmar la última versión estable compatible con React 19.2.4, revisar release notes, licencia y advisories, y fijar la versión exacta aprobada. No debe usar latest.

Limitaciones asumidas:

- no está pensado para todos los casos de decenas de miles de puntos;
- SVG puede degradarse con densidad extrema;
- ciertas visualizaciones avanzadas no existen como primitivas directas;
- su capa de accesibilidad debe complementarse con semántica propia.

### 10.3 Apache ECharts

Rol futuro:

- datasets densos;
- render canvas;
- heatmaps;
- mapas;
- sankey;
- redes complejas;
- zoom y brushing avanzados;
- visualizaciones que fallen empíricamente con el motor primario.

Versión de referencia evaluada:

- Apache ECharts 6.1.0.

No se añade a package.json ni al lockfile en esta implementación.

Umbral de adopción:

ECharts solo se incorpora cuando al menos un componente aprobado cumpla una de estas condiciones y exista evidencia:

1. requiere un tipo de visualización que Recharts no ofrece limpiamente;
2. no cumple el presupuesto de rendimiento medido con el volumen real esperado;
3. necesita canvas o una interacción especializada que no sea razonable construir sobre SVG;
4. una prueba comparativa documentada demuestra una ventaja material.

Cuando se adopte:

- integrar ECharts directamente mediante un wrapper interno pequeño de ciclo de vida;
- no añadir echarts-for-react;
- no exponer la instancia del motor salvo un caso aprobado;
- importar y registrar solo módulos necesarios;
- aislar el coste mediante code splitting o un entrypoint especializado si la evidencia de bundle lo exige;
- mantener la misma capa pública de tokens, estados y accesibilidad.

### 10.4 Decisiones negativas

- No usar D3 de forma directa ni tratar dependencias transitivas como contrato.
- No añadir Chart.js, Nivo, Victory, Highcharts u otro motor en esta entrega.
- No implementar un selector de motor.
- No crear ChartEngine, GenericChartAdapter o abstracciones equivalentes.
- No normalizar todas las capacidades de ambos motores por adelantado.
- No instalar ECharts “para dejarlo listo”.

## 11. Asignación de renderer por componente

| Componente | Renderer |
| --- | --- |
| AreaChart | Recharts |
| BarChart | Recharts |
| ComboChart | Recharts |
| DonutChart | Recharts |
| LineChart | Recharts |
| SparkChart | Recharts |
| BarList | HTML y CSS |
| CategoryBar | HTML y CSS |
| ProgressBar | HTML y CSS existente |
| ProgressCircle | SVG nativo |
| Tracker | HTML y CSS |
| Meter | HTML nativo y CSS existente |
| Sparkline | SVG nativo existente |

Regla: usar el renderer más simple que preserve semántica, interacción, accesibilidad, diseño y rendimiento. Compartir motor no obliga a compartir una API pública genérica.

## 12. Arquitectura de visualizaciones

### 12.1 Estructura objetivo

    packages/ui/src/visualizations/
      area-chart/
      bar-chart/
      combo-chart/
      bar-list/
      category-bar/
      donut-chart/
      line-chart/
      progress-bar/
      progress-circle/
      spark-chart/
      sparkline/
      tracker/
      meter/
      chart-frame/
      internal/
        chart-a11y.tsx
        chart-colors.ts
        chart-legend.tsx
        chart-tooltip.tsx
        chart-types.ts
      index.ts

Cada componente mantiene:

- archivo TSX;
- CSS local;
- tests colocados según la convención actual;
- export de familia;
- export raíz;
- entrada de catálogo;
- entrada de showcase;
- documentación.

### 12.2 ChartFrame

ChartFrame será público porque resuelve una necesidad de consumidor repetida:

- title;
- description;
- action;
- dimensión estable;
- loading;
- empty;
- error;
- retry;
- región accesible.

ChartFrame no debe:

- conocer Recharts;
- conocer ECharts;
- transformar datasets;
- crear un contexto global de charts;
- imponer una tarjeta si el consumidor no la solicita.

### 12.3 Elementos internos inicialmente

Mantener internos hasta demostrar uso público independiente:

- tooltip;
- legend;
- axis helpers;
- series color resolver;
- provider lifecycle;
- formatting adapters;
- responsive helpers.

No promoverlos por anticipación.

### 12.4 Tipos públicos propios

Ejemplo de dirección, no código para copiar sin validación:

    type ChartDatum = Readonly<Record<string, unknown>>;

    type ChartAccessibleName =
      | {
          readonly 'aria-label': string;
          readonly 'aria-labelledby'?: never;
        }
      | {
          readonly 'aria-label'?: never;
          readonly 'aria-labelledby': string;
        };

    interface ChartSeries<TDatum extends ChartDatum> {
      readonly dataKey: Extract<keyof TDatum, string>;
      readonly name: string;
      readonly color?: ChartColor;
      readonly valueFormatter?: (value: number) => string;
    }

    interface LineChartProps<TDatum extends ChartDatum>
      extends ChartAccessibleName {
      readonly data: readonly TDatum[];
      readonly index: Extract<keyof TDatum, string>;
      readonly series: readonly ChartSeries<TDatum>[];
      readonly height?: number;
      readonly showLegend?: boolean;
      readonly showGrid?: boolean;
      readonly animation?: 'auto' | 'none';
      readonly className?: string;
    }

Requisitos:

- los tipos se nombran por intención de Lemn UI;
- no reexportar tipos de proveedores;
- no aceptar props opacas de proveedor;
- no usar any para facilitar compatibilidad;
- eventos públicos entregan datos de dominio propios, no eventos internos del motor;
- cada componente puede tener props específicas sin forzarlas dentro de un mega tipo común.

## 13. Contrato mínimo por visualización

### 13.1 AreaChart

- una o varias series;
- modo normal y stacked;
- relleno sólido o gradiente mediante tokens;
- tooltip, legend, grid y axes opcionales;
- valores nulos tratados explícitamente;
- resumen textual accesible.

### 13.2 BarChart

- orientación vertical y horizontal;
- grouped y stacked;
- una o varias series;
- labels opcionales con control de colisión;
- baseline y dominios correctos para valores negativos.

### 13.3 ComboChart

- combina barras y líneas;
- series tipadas por kind;
- eje secundario solo cuando se declara;
- legend y tooltip unificados;
- no aceptar un renderer arbitrario.

### 13.4 DonutChart

- segmentos con label y value;
- total o texto central opcional;
- legend accesible;
- estado de cero total explícito;
- no convertirlo en una API genérica de pie charts.

### 13.5 LineChart

- una o varias series;
- curvas configurables mediante opciones propias limitadas;
- dots opcionales;
- soporte correcto de gaps;
- tooltip accesible y navegación cuando aplique.

### 13.6 SparkChart

- línea, área o barras compactas;
- tooltip e interacción opcionales;
- mayor capacidad que Sparkline;
- altura compacta pero explícita;
- nombre accesible obligatorio si comunica información.

### 13.7 Sparkline

- glyph ultra compacto;
- sin axes ni legend;
- preferentemente no interactivo;
- puede ser decorativo o significativo;
- si es significativo exige aria-label o aria-labelledby;
- si es decorativo usa aria-hidden y no role="img".

### 13.8 BarList

- lista ordenada de categorías y valores;
- barras CSS relativas al máximo;
- links o actions opcionales con semántica real;
- no requiere motor.

### 13.9 CategoryBar

- distribución segmentada de un total;
- labels y legend opcionales;
- color nunca como único canal;
- estado total cero.

### 13.10 ProgressCircle

- SVG nativo;
- determinate e indeterminate;
- role y valores ARIA correctos;
- label central opcional;
- respeta reduced motion.

### 13.11 Tracker

- secuencia discreta de estados;
- status, label y tooltip opcionales;
- cada bloque conserva significado sin color;
- no se usa como timeline de contenido complejo.

## 14. Contrato de nuevos Inputs

### 14.1 SelectNative

- renderiza select nativo;
- controlled y uncontrolled;
- placeholder mediante option deshabilitada cuando aplique;
- grupos y options deshabilitadas;
- forwardRef;
- integra aria-describedby, invalid, name y form;
- no replica la API visual de Select si la plataforma ya lo resuelve.

### 14.2 RadioCardGroup

- basado en Radix RadioGroup ya disponible;
- selección única;
- tarjeta completa clicable;
- label, description, icon y disabled;
- navegación de teclado del primitive;
- no esconder el estado seleccionado solo en color.

### 14.3 ToggleGroup

- basado en Radix ToggleGroup;
- type single o multiple;
- controlado y no controlado;
- items con label accesible;
- distinto de SegmentedControl y Toggle.

### 14.4 Slider

- basado en Radix Slider;
- uno o dos thumbs;
- min, max, step;
- controlado y no controlado;
- labels accesibles por thumb;
- formatter visual sin cambiar el valor numérico;
- RTL si el primitive lo soporta.

### 14.5 DatePicker

- composición de Button, Popover, Calendar y Field;
- fecha única;
- controlled y uncontrolled;
- input manual solo si tiene parse y validación aprobados;
- locale, min, max y disabled dates;
- focus management y Escape heredados del overlay;
- no duplicar lógica del calendario.

### 14.6 DateRangePicker

- composición de Button, Popover y Calendar;
- start y end tipados;
- selección parcial explícita;
- hover preview;
- restricción de rango;
- uno o dos meses;
- controlado y no controlado;
- teclado completo.

## 15. Extensiones de componentes existentes

### 15.1 Calendar

Mantener el caso actual de fecha única y extender con:

- mode single o range;
- value/defaultValue/onChange discriminados por mode;
- numberOfMonths limitado y documentado;
- selección parcial de rango;
- locale y weekStartsOn;
- min, max y predicate de disabled;
- navegación de teclado entre meses;
- today inyectable para tests y showcases deterministas.

La lógica de fechas compartida debe extraerse a helpers puros internos. No se añadirá una dependencia de fechas salvo que una necesidad de timezone, calendario o locale no pueda resolverse de manera robusta con la plataforma y se justifique por escrito.

### 15.2 Tabs

- relación real entre trigger y panel;
- ids estables;
- aria-controls y aria-labelledby correctos;
- controlled y uncontrolled;
- lazy mounting solo como opción explícita;
- conservar estado cuando el contrato lo requiera;
- no usar Tabs para navegación entre URLs.

### 15.3 InfoBanner

- title opcional;
- icon opcional;
- body;
- actions;
- variants semánticas;
- dismissible cuando se declara;
- region o alert según urgencia real;
- no forzar iconos externos al sistema.

### 15.4 Separator

- horizontal y vertical;
- decorative por defecto cuando solo separa visualmente;
- semántico cuando representa una división real;
- usa Radix Separator o HTML nativo según el contrato final verificado;
- no introducir layout implícito.

### 15.5 TabNavigation

- nav semántico;
- enlaces reales;
- estado activo mediante aria-current;
- scroll horizontal responsive;
- badges/count opcionales;
- no renderizar paneles;
- no sustituir Tabs.

## 16. Patrón de construcción obligatorio

El patrón observado y aprobado para componentes nuevos es:

1. carpeta por componente dentro de la familia;
2. TSX tipado;
3. CSS local importado por el componente;
4. tests locales según la convención actual;
5. props explícitas y defaults visibles;
6. soporte controlled/uncontrolled cuando existe estado;
7. primitive nativo para comportamientos simples;
8. Radix para comportamiento interactivo complejo que ya resuelve foco, teclado y ARIA;
9. prefijo ui- en clases CSS;
10. data attributes para estados de styling;
11. tokens del sistema en vez de valores aislados;
12. export de carpeta, familia y root;
13. entrada de catálogo;
14. página de showcase real;
15. documentación y API table;
16. fixtures deterministas;
17. sin fetching, reglas de negocio ni dependencias de producto.

### 16.1 Cuándo usar Radix

Usar Radix cuando el componente requiere un modelo interactivo probado:

- checkbox;
- radio group;
- toggle group;
- slider;
- tabs;
- popover;
- dialog;
- menu;
- tooltip;
- focus management;
- roving focus.

No usar Radix cuando HTML ofrece la semántica completa con menos coste:

- button simple;
- select nativo;
- progress;
- meter;
- links;
- headings;
- listas;
- separators horizontales semánticos.

No existe un primitive Radix que sustituya a un motor de gráficos. Radix y Recharts resuelven problemas distintos y se complementan.

### 16.2 Estado React

- Controlled si se entrega value.
- Uncontrolled si se entrega defaultValue.
- Nunca sincronizar ambos con effects ambiguos.
- Emitir callbacks en cada cambio aceptado.
- No copiar props a state salvo necesidad demostrada.
- Mantener hover y focus locales.
- No crear un contexto global que rerenderice todos los charts.

### 16.3 Composición

- preferir children o slots limitados cuando la composición es real;
- preferir datos tipados cuando el componente representa una colección;
- evitar render props genéricas si una prop específica cubre el caso;
- no envolver todas las APIs externas en una abstracción universal;
- no añadir variantes sin un caso de uso documentado.

## 17. Tokens de visualización

Añadir a packages/ui/src/foundations/tokens.css y al espejo tipado:

- chart series 1 a 8;
- chart grid;
- chart axis;
- chart cursor;
- chart hover;
- chart selection;
- chart tooltip surface;
- chart tooltip border;
- chart positive y negative solo cuando sean semánticos.

Requisitos:

- valores light y dark;
- paleta distinguible y apta para deficiencias comunes de visión de color;
- las series no reutilizan colores de status por defecto;
- color no es el único canal;
- Recharts consume CSS variables;
- SVG gradients y clip paths usan useId para evitar colisiones;
- no hardcodear colores en componentes.

Antes de añadir tokens de chart:

1. corregir la divergencia entre tokens.css y tokens.ts;
2. declarar tokens.css como autoridad runtime;
3. añadir una prueba que parsea las variables canónicas y compara el espejo tipado;
4. no crear un tercer generador de tokens en esta entrega.

## 18. Accesibilidad

Cada visualización informativa debe ofrecer:

- aria-label o aria-labelledby mediante una unión que obligue uno de los dos;
- descripción o resumen textual cuando el gráfico no sea autoexplicativo;
- accesibilidad propia del motor activada donde exista;
- tooltip como ayuda, nunca como único acceso al dato;
- legend con botones semánticos si permite ocultar series;
- estados visibles de focus;
- navegación de teclado cuando hay interacción;
- patrones o labels además de color;
- reduced motion;
- loading, empty y error anunciables sin ruido;
- tabla o resumen alternativo para datasets donde sea necesario.

Para Recharts:

- activar y verificar accessibilityLayer;
- no asumir que esa opción resuelve todo;
- probar con axe y teclado;
- inspeccionar el DOM y el árbol accesible real.

Para Sparkline:

- corregir el contrato actual;
- significativo implica nombre accesible;
- decorativo implica aria-hidden y ausencia de role informativo.

## 19. Rendimiento y bundle

### 19.1 Reglas

- usar la estrategia responsive de Recharts; no crear otro ResizeObserver sin evidencia;
- cada chart debe tener altura o aspect ratio estable;
- evitar layouts que rendericen con ancho o alto cero;
- no ordenar ni clonar datasets grandes en cada render;
- recibir datos preparados o memoizar solo transformaciones medidas;
- no aplicar memo a todo por defecto;
- evitar callbacks inestables cuando causen trabajo medible;
- respetar prefers-reduced-motion;
- animation acepta auto o none;
- no animar datasets densos por defecto;
- dividir por ruta o feature las páginas del showcase.

### 19.2 Pruebas de bundle obligatorias

Crear fixtures de producción que demuestren:

1. importar Button no incorpora Recharts ni ECharts;
2. importar LineChart incorpora Recharts y no ECharts;
3. el catálogo no arrastra React ni motores cuando se importa solo como datos;
4. los exports raíz siguen siendo tree-shakeable.

No se fija un límite arbitrario de KB antes de medir. El agente debe:

- registrar baseline;
- registrar resultado;
- comparar gzip y módulo graph;
- explicar cualquier regresión;
- bloquear si un componente no relacionado arrastra el motor.

### 19.3 Benchmark funcional

Medir una página de producción con múltiples charts en:

- desktop;
- mobile;
- tema light;
- tema dark;
- reduced motion;
- datasets pequeños y representativos;
- dataset de estrés documentado.

Registrar tiempo de render, interacción y estabilidad visual. ECharts solo se habilita en una entrega futura si estas mediciones o una capacidad requerida justifican el cambio.

## 20. Dependencias, licencias y seguridad

Antes de añadir Recharts:

1. comprobar versión estable y compatibilidad con React 19.2.4;
2. revisar licencia;
3. revisar advisories;
4. verificar dependencias transitivas;
5. verificar ejecución browser-only y build del paquete;
6. verificar que no introduce APIs Node en runtime;
7. verificar el comportamiento en la toolchain del monorepo;
8. actualizar notices si la política del repositorio lo requiere.

Modificar:

- pnpm-workspace.yaml para versiones catalogadas;
- packages/ui/package.json para dependencias directas;
- pnpm-lock.yaml;
- scripts/check-ui-boundaries.mjs para permitir Recharts solo después de declararlo.

ECharts debe permanecer ausente de:

- package.json;
- pnpm-workspace.yaml;
- pnpm-lock.yaml;
- bundles;
- exports;
- tipos.

## 21. Correcciones de preflight obligatorias

### 21.1 Boundary checker

Problema:

- scripts/check-ui-boundaries.mjs usa process.cwd();
- desde packages/ui busca una ruta duplicada.

Solución:

- resolver el root a partir de import.meta.url y fileURLToPath;
- hacer que el script funcione igual desde root y desde el paquete;
- añadir una prueba o ejecución CI para ambas ubicaciones;
- añadir Recharts a la allowlist solamente cuando sea dependencia directa;
- no permitir ECharts todavía.

### 21.2 Paridad de tokens

Problema:

- CSS y TypeScript no representan la misma paleta dark.

Solución:

- corregir el espejo tipado;
- añadir comparación exacta;
- cubrir nuevos tokens de chart;
- bloquear drift futuro.

### 21.3 Sparkline

Problema:

- puede exponer una imagen sin nombre accesible.

Solución:

- introducir contrato significativo/decorativo;
- actualizar tests, showcase y docs;
- preservar compatibilidad cuando no degrade accesibilidad.

## 22. Showcase y documentación

### 22.1 Página por componente

Cada página debe incluir:

- familia;
- título;
- descripción breve;
- enlaces propios del proyecto cuando existan;
- Preview y Code;
- máximo tres ejemplos;
- ejemplos con componentes reales, no imágenes;
- interacción funcional;
- Installation;
- Usage;
- API Reference;
- tabla Prop, Type, Default, Description;
- accesibilidad;
- notas de comportamiento;
- referencias de versión cuando aplique.

No debe incluir:

- toggle de tema dentro de cada ejemplo;
- más de tres ejemplos;
- contenido copiado;
- nombres o atribuciones de la marca externa usada durante el benchmark;
- imports incorrectos;
- comandos de instalación de otro scope;
- demos que dependan de red o datos no deterministas.

El import canónico es:

    import { LineChart } from '@lemn-ltd/ui';

### 22.2 Navegación

El sidebar debe:

- mostrar primero el módulo;
- después las familias del módulo;
- después los componentes;
- usar la jerarquía area > group > component;
- dejar de representar Agents como group;
- mantener Foundations y Patterns como secciones editoriales separadas;
- ser navegable por teclado y responsive.

### 22.3 Documentación canónica a crear o actualizar

- docs/component-capability-expansion/README.md
- docs/visualization-system/README.md
- docs/README.md
- packages/ui/docs/README.md
- packages/ui/docs/components.md
- README del paquete
- CHANGELOG del paquete
- changeset de 0.2.0
- patterns/pattern-audit.md
- documentación pública en inglés y español

docs/visualization-system/README.md debe documentar:

- Recharts primario;
- ECharts secundario futuro;
- umbral de adopción;
- renderer por componente;
- tokens;
- accesibilidad;
- performance;
- cómo añadir otro chart;
- prohibición de filtrar tipos de motor.

### 22.4 Neutralidad

- eliminar las siete menciones existentes de la marca externa de benchmark;
- no introducir nuevas menciones;
- no copiar ejemplos, textos, código ni activos;
- ejecutar la validación de neutralidad existente;
- realizar además una búsqueda de repositorio por el término prohibido conocido en la spec anterior;
- el resultado final debe ser cero.

## 23. Secuencia por componente

Para cada componente nuevo o extendido:

1. escribir un brief de capacidad y no-objetivos;
2. decidir native, Radix, Recharts o composición existente;
3. definir API pública y ejemplos de uso;
4. revisar accesibilidad antes de codificar;
5. implementar TSX y CSS;
6. añadir exports;
7. añadir catálogo;
8. integrar un preview real en showcase;
9. añadir máximo tres ejemplos;
10. documentar props;
11. escribir tests unitarios;
12. escribir tests de interacción;
13. añadir E2E y visual si el riesgo lo exige;
14. ejecutar checks focalizados;
15. inspeccionar bundle si usa motor;
16. registrar evidencia.

No avanzar al siguiente lote si el lote actual deja errores, snapshots sin revisar o documentación incompleta.

## 24. Plan de implementación por fases

### Fase 0. Aislamiento y readback

Objetivo: empezar desde un estado atribuible.

Acciones:

- preparar checkout limpio;
- leer autoridades;
- registrar SHA, branch y status;
- confirmar inventario actual;
- confirmar versions reales;
- volver a ejecutar baseline;
- crear el directorio de evidencia acordado si existe un patrón local.

Salida:

- baseline reproducible;
- cero cambios ajenos mezclados.

### Fase 1. Hardening previo

Objetivo: corregir gates que producirían falsos resultados.

Acciones:

- arreglar check-ui-boundaries;
- añadir verificación desde root y package;
- sincronizar tokens CSS/TS;
- añadir test de paridad;
- corregir a11y de Sparkline;
- registrar cualquier gap en pattern-audit.

Gate:

- check, tests y boundary checker verdes.

### Fase 2. Taxonomía y catálogo

Objetivo: separar módulo y familia antes de añadir capacidad.

Acciones:

- introducir tipos discriminados;
- añadir area a 112 entradas;
- reclasificar grupos;
- dividir Agents en cinco familias;
- actualizar orden por módulo;
- eliminar inferencia group === 'Agents';
- actualizar tests de catálogo;
- actualizar sidebar y rutas sin cambiar URLs públicas;
- actualizar recuentos de docs.

Gate:

- 112 entradas, 83 Core, 29 Agents;
- ninguna entrada con group Agents;
- ninguna familia válida en el módulo equivocado;
- navegación completa.

### Fase 3. Dependencia y fundamentos de charts

Objetivo: introducir Recharts de forma aislada.

Acciones:

- revalidar versión y licencia;
- fijar Recharts y react-is;
- actualizar lockfile;
- permitir dependencia en boundary checker;
- crear tokens de chart;
- crear tipos mínimos;
- crear ChartFrame;
- crear legend, tooltip y a11y internos;
- añadir fixtures de bundle.

Gate:

- Button-only sin motor;
- ChartFrame sin motor;
- dependencia exacta;
- ECharts ausente.

### Fase 4. Visualizaciones base Recharts

Orden:

1. LineChart
2. AreaChart
3. BarChart
4. ComboChart
5. DonutChart
6. SparkChart

Razón:

- Line, area y bar validan axes, series, tooltip, legend, colors y responsive.
- Combo prueba composición sin introducir un adaptador.
- Donut valida geometría y legend.
- SparkChart valida el modo compacto e interactivo.

Gate por lote:

- API propia;
- light/dark;
- responsive;
- a11y;
- bundle;
- máximo tres ejemplos;
- tests focalizados verdes.

### Fase 5. Visualizaciones nativas y reclasificación

Orden:

1. BarList
2. CategoryBar
3. ProgressCircle
4. Tracker
5. mover conceptualmente ProgressBar
6. mover conceptualmente Meter
7. mover conceptualmente Sparkline

Acciones:

- preservar APIs existentes;
- alinear exports y docs;
- evitar importar Recharts desde visualizaciones nativas;
- aplicar tokens comunes.

Gate:

- 13 visualizaciones catalogadas;
- imports nativos no arrastran Recharts;
- Sparkline accesible.

### Fase 6. Inputs

Orden:

1. SelectNative
2. RadioCardGroup
3. ToggleGroup
4. Slider
5. extensión de Calendar
6. DatePicker
7. DateRangePicker

Acciones:

- usar HTML o Radix según la decisión;
- extraer helpers puros de fechas;
- cubrir controlled/uncontrolled;
- probar teclado, focus y forms.

Gate:

- 17 Inputs catalogados;
- no solapamiento ambiguo entre Toggle, ToggleGroup y SegmentedControl;
- date pickers sin lógica duplicada.

### Fase 7. Navigation, Layout y extensiones

Acciones:

- añadir TabNavigation;
- añadir Separator;
- completar Tabs;
- completar InfoBanner;
- documentar por qué Field sustituye a Label.

Gate:

- conteos por familia coinciden;
- Tabs y TabNavigation tienen semánticas distintas;
- InfoBanner cubre callout sin componente duplicado.

### Fase 8. Showcase y documentación

Acciones:

- crear páginas de los 18 nuevos;
- actualizar páginas de componentes extendidos;
- actualizar sidebar;
- actualizar catálogo completo;
- documentar motores;
- actualizar componentes en inglés y español;
- máximo tres ejemplos;
- eliminar referencias externas;
- actualizar pattern audit y changeset.

Gate:

- todas las rutas resuelven;
- no hay imports o comandos de instalación incorrectos;
- neutralidad en cero;
- catálogo, docs y showcase sin drift.

### Fase 9. Validación integral y preparación de 0.2.0

Acciones:

- ejecutar todos los gates;
- revisar snapshots, no actualizarlos a ciegas;
- medir bundle;
- ejecutar browser matrix;
- crear notas de migración;
- registrar evidencia;
- ejecutar auditoría independiente de la sección 30.

Salida:

- release candidate 0.2.0.

La creación de commits, push, publicación y deploy se realiza únicamente si la tarea de ejecución lo autoriza explícitamente. Este documento autoriza el alcance técnico, no operaciones externas por sí solo.

## 25. Archivos y áreas previsibles

### Paquete

- packages/ui/package.json
- packages/ui/src/index.ts
- packages/ui/src/catalog.ts
- packages/ui/src/catalog-types.ts
- packages/ui/src/catalog-*-entries.ts
- packages/ui/src/visualizations/**
- packages/ui/src/inputs/**
- componentes existentes reclasificados o extendidos
- packages/ui/src/foundations/tokens.css
- packages/ui/src/tokens.ts
- packages/ui/src/tests/**
- packages/ui/docs/**
- packages/ui/README.md
- packages/ui/CHANGELOG.md

### Workspace y tooling

- pnpm-workspace.yaml
- pnpm-lock.yaml
- scripts/check-ui-boundaries.mjs
- fixtures o scripts de bundle
- configuración de tests solo si es indispensable

### Showcase

- apps/showcase/src/client/registry/**
- apps/showcase/src/client/shell/**
- páginas y ejemplos de componentes
- estilos estrictamente relacionados
- tests unitarios y E2E
- snapshots revisados

### Documentación y gobernanza

- docs/README.md
- docs/component-capability-expansion/README.md
- docs/visualization-system/README.md
- docs/showcase-component-documentation-migration/SPEC.md
- patterns/pattern-audit.md
- changeset correspondiente

No se deben modificar módulos de producto, runtime Cloudflare, secretos, despliegues o dominios para completar esta expansión.

## 26. Estrategia de pruebas

### 26.1 Unitarias

Cubrir:

- defaults;
- controlled/uncontrolled;
- callbacks;
- disabled;
- empty data;
- invalid data definido por contrato;
- series nulas;
- valores negativos;
- total cero;
- estados de ChartFrame;
- classes y data attributes relevantes;
- IDs únicos;
- accesibilidad;
- form integration;
- reduced motion donde pueda probarse.

### 26.2 Integración

Cubrir:

- DatePicker con Popover y Calendar;
- DateRangePicker con selección parcial;
- Tabs con panels;
- legend ocultando series;
- tooltip y focus;
- navegación de catálogo;
- exports y docs.

### 26.3 E2E

Cubrir:

- teclado;
- focus return;
- resize;
- light/dark;
- mobile;
- scroll horizontal de TabNavigation;
- rango de fechas;
- interacción de legend;
- rutas Core y Agents;
- no errores de consola.

### 26.4 Visual

Breakpoints mínimos:

- 1280 x 900;
- 768 x 1024;
- 375 x 812.

Temas:

- light;
- dark.

Estados:

- default;
- hover/focus cuando sea estable;
- empty;
- loading;
- error;
- dense representativo.

Cada snapshot cambiado debe revisarse visual y semánticamente. No aceptar actualizaciones masivas solo porque el runner las generó.

## 27. Comandos de validación

Ejecutar desde el root, adaptando únicamente si los scripts reales cambian de nombre:

    pnpm validate
    pnpm --filter @lemn-ltd/ui run check
    pnpm --filter @lemn-ltd/ui run test
    pnpm --filter @lemn-ltd/ui run validate:boundaries
    pnpm --filter @lemn-ltd/ui run validate:brand-neutrality
    pnpm --filter @lemn-ltd/ui-showcase run test
    pnpm --filter @lemn-ltd/ui-showcase run test:e2e
    pnpm --filter @lemn-ltd/ui-docs run check
    pnpm run check
    pnpm run test
    pnpm run build

Además:

- ejecutar el boundary checker desde root y package;
- ejecutar fixtures de bundle;
- buscar imports directos de Recharts fuera de visualizations;
- comprobar que ECharts no está instalado;
- buscar tipos públicos de proveedores en dist;
- comprobar catálogo y recuentos;
- comprobar cero referencias a la marca externa de benchmark;
- inspeccionar el sitio en la matriz visual.

Si un script no existe, no se simula. Se registra y se crea el gate mínimo justificable o se ejecuta el comando equivalente documentado.

## 28. Estrategia de commits de implementación

Secuencia recomendada:

1. fix tooling and token parity;
2. refactor catalog area and families;
3. add chart dependency and foundations;
4. add Recharts visualizations;
5. add native visualizations;
6. add inputs and date composition;
7. extend tabs, banner and add navigation/layout components;
8. update showcase and docs;
9. add release notes, evidence and final gates.

Reglas:

- cada commit debe ser revisable;
- no mezclar snapshots con lógica sin explicación;
- no mezclar cambios previos del workspace;
- no incluir secretos ni .env;
- no usar commits de “cleanup” para ocultar trabajo no relacionado;
- la entrega final puede ser una sola versión aunque tenga varios commits.

## 29. Criterios de aceptación globales

La implementación se considera completa solo si:

1. el catálogo contiene exactamente 130 entradas;
2. Core contiene exactamente 101;
3. Agents contiene exactamente 29;
4. las cantidades por familia coinciden con este documento;
5. no existe group Agents;
6. cada entrada tiene area explícita;
7. existen los 18 componentes nuevos;
8. las extensiones de Calendar, Tabs e InfoBanner están completas;
9. Field está documentado como sustituto de Label;
10. Recharts es dependencia directa exacta;
11. ECharts no está instalado;
12. ningún tipo público expone un proveedor;
13. Button-only no arrastra motores;
14. una visualización estándar arrastra Recharts y no ECharts;
15. todas las visualizaciones tienen estados y accesibilidad;
16. light y dark usan tokens coherentes;
17. CSS y espejo TypeScript tienen paridad exacta;
18. Sparkline resuelve significativo/decorativo;
19. cada página tiene máximo tres ejemplos reales;
20. catálogo, exports, showcase y docs están sincronizados;
21. no existen menciones de la marca externa de benchmark;
22. no existe código o contenido copiado;
23. check, tests, build, E2E, a11y, bundle y visual pasan;
24. no hay cambios no relacionados;
25. pattern-audit y migration notes contienen evidencia concreta;
26. la auditoría independiente termina en PASS.

## 30. Auditoría post-implementación independiente

La auditoría debe realizarla un agente o revisor distinto, sin confiar en el resumen del implementador.

### 30.1 Preflight del revisor

Registrar:

- branch;
- SHA;
- status;
- diff base...HEAD;
- versión de Node y pnpm;
- fecha;
- plataforma.

Confirmar:

- checkout limpio;
- ausencia de secretos;
- alcance atribuible;
- changeset presente.

### 30.2 Revisión de inventario

Verificar por script, no a mano:

- total 130;
- Core 101;
- Agents 29;
- conteos de las 14 familias;
- cero slugs duplicados;
- cero familias cruzadas;
- cero entradas sin export;
- cero entradas sin docs;
- cero rutas rotas.

### 30.3 Revisión de arquitectura

Verificar:

- consumidores importan desde @lemn-ltd/ui;
- imports de Recharts están confinados a visualizations;
- no hay imports D3;
- ECharts está ausente;
- no existe engine prop;
- no existe adaptador genérico;
- ChartFrame no depende de motores;
- tipos dist no contienen tipos de proveedor;
- componentes nativos no arrastran Recharts.

### 30.4 Revisión funcional

Probar manualmente:

- las 18 páginas nuevas;
- tres ejemplos o menos;
- interacción real;
- forms;
- selección de rango;
- panels de Tabs;
- TabNavigation con URL;
- legend y tooltip;
- estados loading, empty y error;
- mobile y desktop;
- light y dark.

### 30.5 Revisión de accesibilidad

Verificar:

- axe sin violaciones nuevas;
- teclado completo;
- focus visible;
- nombres accesibles;
- roles correctos;
- color no exclusivo;
- reduced motion;
- Sparkline decorativo/significativo;
- tooltip no exclusivo;
- tabla o resumen alternativo cuando aplique.

### 30.6 Revisión de rendimiento

Verificar:

- fixtures de bundle;
- bundle Button-only;
- bundle LineChart;
- ausencia de ECharts;
- no ResizeObserver duplicado;
- no context global;
- no transformaciones caras por render;
- layout estable;
- benchmark documentado.

### 30.7 Revisión documental y legal

Verificar:

- docs en inglés y español;
- APIs coinciden con tipos;
- comandos e imports correctos;
- decisiones de motor documentadas;
- cero menciones de la marca externa;
- notices/licencias correctos;
- nada copiado.

### 30.8 Revisión de pruebas

Ejecutar nuevamente todos los comandos de la sección 27.

No aceptar:

- tests skipped;
- snapshots actualizados sin inspección;
- suppressions;
- TODOs;
- mocks que oculten comportamiento;
- logs o resultados fabricados.

### 30.9 Formato del recibo

    # Post-implementation review receipt

    Base SHA:
    Reviewed SHA:
    Reviewer:
    Date:

    Inventory: PASS | FAIL
    Architecture: PASS | FAIL
    Functionality: PASS | FAIL
    Accessibility: PASS | FAIL
    Performance and bundle: PASS | FAIL
    Documentation and neutrality: PASS | FAIL
    Tests and build: PASS | FAIL
    Scope and secrets: PASS | FAIL

    Evidence:
    - command:
      result:
    - browser route:
      viewport:
      result:

    Findings:
    - severity:
      file:
      issue:
      required fix:

    Final decision: PASS | FAIL

Un FAIL bloquea la entrega. El revisor no debe convertir un finding real en “follow-up” para aprobar la misma versión.

## 31. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Alcance grande | Fases pequeñas, gates por lote y una sola versión al final. |
| Taxonomía rompe consumidores del catálogo | Unión discriminada, tests y guía de migración 0.2.0. |
| Recharts aumenta bundle | Tree shaking, fixtures y aislamiento por imports. |
| SVG pierde rendimiento con densidad | Benchmark y gate futuro para ECharts. |
| Dos motores divergen visualmente | APIs y tokens propios, sin engine prop. |
| API de charts se vuelve genérica | Props específicas por componente y abstracción mínima. |
| Calendar range introduce errores | Helpers puros, tests de límites, teclado y fechas deterministas. |
| Solapamiento entre controles | Documentar intención de Toggle, ToggleGroup, SegmentedControl, Tabs y TabNavigation. |
| A11y de gráficos insuficiente | Capa propia, resumen, teclado, axe y revisión manual. |
| Drift de tokens | Prueba de paridad CSS/TypeScript. |
| Snapshots ocultan regresiones | Revisión visual obligatoria. |
| Trabajo previo se mezcla | Worktree limpio y commits atribuibles. |
| Contenido externo genera riesgo legal | Neutralidad, cero atribuciones y creación original. |

## 32. No objetivos

- No implementar ECharts ahora.
- No implementar mapas, sankey, heatmaps o redes en esta versión.
- No crear un sistema de dashboards o data fetching.
- No añadir business logic.
- No exponer un motor.
- No usar D3 directo.
- No crear un adaptador universal.
- No rediseñar componentes no relacionados.
- No migrar toda la ubicación de tests del repositorio.
- No introducir Label.
- No duplicar Tabs con TabNavigation.
- No copiar implementación o contenido de terceros.
- No publicar ni desplegar sin autorización operativa explícita.

## 33. Preguntas resueltas

### ¿Por qué Recharts?

Porque ofrece el mejor punto de entrada para el caso dominante: charts declarativos, React-native, composables y SVG dentro de dashboards. Su limitación en densidad extrema se cubre con la estrategia futura, no con complejidad anticipada.

### ¿Por qué ECharts como segundo?

Porque complementa al primero en canvas, densidad y visualizaciones avanzadas. Se adopta solo cuando exista evidencia, evitando pagar bundle y mantenimiento antes de necesitarlo.

### ¿Por qué no una sola librería?

Ninguna optimiza simultáneamente composición React sencilla, SVG accesible, gran densidad y todo el rango de visualizaciones avanzadas. El orden progresivo cubre más casos sin hacer compleja la API pública.

### ¿Por qué no permitir elegir motor?

Porque trasladaría una decisión interna a todos los consumidores, filtraría detalles de proveedor y multiplicaría pruebas. Lemn UI debe poseer el contrato y escoger internamente el renderer correcto.

### ¿Los componentes nuevos siguen el patrón actual?

Sí: TSX tipado, CSS local, tokens, estado controlado/no controlado, native o Radix según complejidad, exports, catálogo, showcase, docs y tests. Charts añade Recharts solo dentro de su familia.

### ¿El patrón es usado por otros sistemas?

Sí en sus principios: primitives headless para interacción compleja, composición React, contratos controlados/no controlados, estilos por tokens y motores especializados detrás de componentes propios. La implementación aquí no copia otro sistema: aplica esos principios a la arquitectura existente.

## 34. Definition of Done

Done significa:

- código completo;
- catálogo completo;
- showcase completo;
- docs completas;
- tests completos;
- a11y verificada;
- bundle medido;
- dark/light verificados;
- neutralidad verificada;
- changeset y migration notes;
- pattern audit con evidencia;
- árbol limpio;
- auditoría independiente en PASS.

No significa:

- “compila”;
- “se ve bien en mi pantalla”;
- “los tests pasaron” sin revisar alcance;
- “se puede terminar después”;
- snapshots aceptados automáticamente;
- docs pendientes.

## 35. Instrucción final al agente implementador

Implementa este plan por fases, conserva las APIs existentes cuando no exista una razón aprobada para romperlas y usa @lemn-ltd/ui como único contrato público. Revalida cada supuesto contra el código real, no amplíes dependencias ni abstracciones por anticipación y registra evidencia al cerrar cada gate. Cuando termines, entrega el checkout limpio y el recibo del implementador al revisor independiente. La entrega solo queda aprobada cuando el revisor reproduce los resultados y emite PASS según la sección 30.
