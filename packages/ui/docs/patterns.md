# Screen composition recipes

> How to assemble whole screens from `@lemn-ltd/ui` components. Each recipe
> mirrors a live pattern page in the showcase (`/<module>/patterns/<slug>`).
> Component names link to their selection guidance in [components.md](components.md).

## Module routes

- Core patterns live under `/core/patterns/*`.
- Agent workflow patterns live under `/agents/patterns/*`.

## List + table

`/core/patterns/list-table`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`button`](components.md#button), [`filter`](components.md#filter), [`list-filters-bar`](components.md#list-filters-bar), [`data-table`](components.md#data-table)

Frame the screen with Sidebar (mode="expanded") on the left and a main column whose top is TopBar. Inside the scroll region, wrap everything in ListShell: a PageHeader (host primitive) carrying a primary Button action, then a ListFiltersBar whose `pills` are Filter components and whose search is wired via `search`/`onSearchChange`, and finally a DataTable fed `columns`/`rows`/`rowKey`.

## List + grid

`/core/patterns/list-grid`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`button`](components.md#button), [`filter`](components.md#filter), [`list-filters-bar`](components.md#list-filters-bar), [`section-grid`](components.md#section-grid), [`card`](components.md#card), [`badge`](components.md#badge), [`relative-time`](components.md#relative-time)

Use the same Sidebar + TopBar + ListShell shell as List + table, with a PageHeader (primary Button action) and a ListFiltersBar of Filter pills plus search. Swap the table for a SectionGrid that maps summary Cards; give each Card a `footer` slot holding a neutral Badge plus a RelativeTime stamp. SectionGrid handles the responsive reflow of the cards.

## List + split

`/core/patterns/list-split`

**Composes** [`avatar`](components.md#avatar), [`badge`](components.md#badge), [`relative-time`](components.md#relative-time)

Build a two-column master-detail grid (a scrollable list rail beside a detail panel) from plain markup. In each list row render an Avatar plus name/email; mark the active row with an accent left bar and soft fill. The detail panel echoes the selection with an Avatar, title, a status Badge, and a label/value field grid where Status uses a Badge and Last seen uses RelativeTime.

## Detail

`/core/patterns/detail`

**Composes** [`entity-toolbar`](components.md#entity-toolbar), [`button`](components.md#button), [`badge`](components.md#badge), [`stats-strip`](components.md#stats-strip), [`card`](components.md#card), [`tabs`](components.md#tabs)

Lead with an EntityToolbar: pass an `identity` slot (title plus a status Badge) and an `actions` slot holding secondary and primary Buttons. Below it in a scroll region place a StatsStrip of headline metrics, then two summary Cards in a 2-up grid (each a label/value field list, some values rendered as Badges). Close with a Tabs strip whose `value`/`onValueChange` swaps the placeholder content region.

## Settings form

`/core/patterns/settings-form`

**Composes** [`sidebar`](components.md#sidebar), [`field`](components.md#field), [`input`](components.md#input), [`select`](components.md#select), [`toggle`](components.md#toggle), [`button`](components.md#button), [`version-tag`](components.md#version-tag)

Put a secondary drill-in Sidebar (mode="secondary" with `back`/`title`/`hint`) beside a scrollable content column. Open the column with a PageHeader, then group form sections: wrap each input in a Field (render-prop spreads `control`) holding an Input or an InputSelect (the select), and add toggle rows pairing label text with a Toggle. Finish with a right-aligned footer of secondary Cancel and primary Save Buttons, then a VersionTag.

## Dashboard

`/core/patterns/dashboard`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`stats-strip`](components.md#stats-strip), [`section-grid`](components.md#section-grid), [`card`](components.md#card), [`sparkline`](components.md#sparkline)

Reuse the Sidebar + TopBar + ListShell overview shell with a PageHeader at the top. Inside ListShell put a StatsStrip of headline metrics, then a SectionGrid of trend Cards; in each Card body pair a large value with a Sparkline fed `points`. No filter bar or table — just stats then the sparkline card grid.

## States

`/core/patterns/states`

**Composes** [`skeleton`](components.md#skeleton), [`empty-state`](components.md#empty-state), [`info-banner`](components.md#info-banner), [`button`](components.md#button)

Lay three labeled frames side by side to compare data-surface states. Loading stacks several Skeleton rows (shape="rect"); Empty centers an EmptyState (intent="first-run" with title/description); Error shows an InfoBanner (variant="danger") above a secondary Retry Button. Each state is one component plus its frame label.

## Responsive

`/core/patterns/responsive`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`button`](components.md#button), [`filter`](components.md#filter), [`list-filters-bar`](components.md#list-filters-bar), [`section-grid`](components.md#section-grid), [`card`](components.md#card), [`badge`](components.md#badge), [`data-table`](components.md#data-table)

Compose the full list shell — Sidebar + TopBar + ListShell — with a PageHeader (primary Button), a ListFiltersBar of all Filter pills plus search, then both a SectionGrid of Cards (each with a neutral Badge footer) and a DataTable below it. Add no breakpoint logic: SectionGrid, ListFiltersBar, and DataTable reflow from the package CSS as the frame width shrinks (3-up to 2-up to single column / stacked cards).

## Resource manager

`/core/patterns/resource-manager`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`page-header`](components.md#page-header), [`list-filters-bar`](components.md#list-filters-bar), [`filter`](components.md#filter), [`filter-chip`](components.md#filter-chip), [`data-table`](components.md#data-table), [`form-dialog`](components.md#form-dialog), [`confirm-dialog`](components.md#confirm-dialog), [`menu`](components.md#menu), [`toaster`](components.md#toaster)

The end-to-end CRUD screen. Frame with Sidebar + TopBar + ListShell; a PageHeader carries a primary "New item" Button that opens the FormDialog in create mode. A ListFiltersBar of Filter pills plus search sits above an ActiveFiltersRow of applied chips. The destructive bulk delete routes through a `variant="danger"` ConfirmDialog; a mounted Toaster reports create/update/delete via `notify`. The same FormDialog serves create and edit — only the title, submit label, and initial values differ.

**Default composition (non-invasive).** DataTable affordances are opt-in, so the recipe only turns on what a CRUD screen needs and leaves the rest off:

- **Row actions, not row click.** A `rowActions` kebab Menu owns Edit and a single-row Delete-danger; `onRowClick` is intentionally **not** set, so opening the editor is an explicit Edit. (Pass `onRowClick` only when a whole-row open is the primary gesture.)
- **Selection for bulk delete only.** `selectable` + `selectedKeys`/`onSelectionChange` enable a single danger Delete in `bulkActions`. Export and other batch actions stay **off** by default — add another Button to `bulkActions` when needed.
- **Search first, two filters max.** Search is always present and matches one field (name). At most the two most relevant column `Filter` pills sit beside it; their applied values appear as `ActiveFiltersRow` chips. Add more filters only when search plus two is not enough.
- **No table toolbar.** No column is `hideable` and `onDensityChange` is unset, so the density toggle and column-visibility menu (the header toolbar) stay hidden. Enable them on dense or very wide tables.
- **Always-on, zero-cost affordances:** column sort, numbered pagination (only past one page), the no-results EmptyState, and the Toaster — none add idle chrome.

## Agent session

`/agents/patterns/agent-session`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`page-header`](components.md#page-header), [`agent-activity-line`](components.md#agent-activity-line), [`user-message-bubble`](components.md#user-message-bubble), [`agent-message-bubble`](components.md#agent-message-bubble), [`agent-reasoning-block`](components.md#agent-reasoning-block), [`agent-tool-call-list`](components.md#agent-tool-call-list), [`composer`](components.md#composer), [`card`](components.md#card), [`badge`](components.md#badge)

Frame the session with Sidebar + TopBar + ListShell. The main column owns the message thread: an AgentActivityLine for current runtime status, UserMessageBubble and AgentMessageBubble rows for the transcript, AgentReasoningBlock for inspectable thought summaries, and AgentToolCallList for execution evidence. Keep a compact context column beside the thread with Cards and Badges for run ids, graph hashes, and policy state. Pin Composer at the bottom of the thread area; the host owns message submission and streaming state.

## Automation builder

`/agents/patterns/automation-builder`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`page-header`](components.md#page-header), [`trigger-composer`](components.md#trigger-composer), [`automation-graph`](components.md#automation-graph), [`node-inspector`](components.md#node-inspector), NodePalette, [`planner-status`](components.md#planner-status), [`proposal-preview`](components.md#proposal-preview)

Use TriggerComposer as the controlled entry-point editor, then place the graph canvas beside it so the operator sees the planned topology immediately. Below the canvas, combine NodePalette, NodeInspector, and ProposalPreview: the palette offers node kinds, the inspector shows the selected node's config/policy/knowledge fields, and the proposal preview gates acceptance on a clean compile. PageHeader carries PlannerStatus so planning/streaming state is visible without adding another status panel.

## Run monitor

`/agents/patterns/run-monitor`

**Composes** [`sidebar`](components.md#sidebar), [`top-bar`](components.md#top-bar), [`list-shell`](components.md#list-shell), [`page-header`](components.md#page-header), [`automation-status-badge`](components.md#automation-status-badge), [`stats-strip`](components.md#stats-strip), [`card`](components.md#card), [`run-timeline`](components.md#run-timeline), [`node-attempts-table`](components.md#node-attempts-table), [`runtime-refs-panel`](components.md#runtime-refs-panel), [`approval-panel`](components.md#approval-panel)

Open with a PageHeader plus AutomationStatusBadge and a StatsStrip for duration, attempts, approvals, and cost. The primary column holds Timeline evidence and Node attempts inside Cards; the side column holds RuntimeRefsPanel plus ApprovalPanel. This keeps run evidence, execution refs, and human approval context on the same screen without turning the lower-level components into product-specific composites.
