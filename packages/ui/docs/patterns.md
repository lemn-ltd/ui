# Screen composition recipes

> How to assemble whole screens from `@appranks/ui` components. Each recipe
> mirrors a live pattern page in the showcase (`/core/patterns/<slug>`). Component
> names link to their selection guidance in [components.md](components.md).

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
