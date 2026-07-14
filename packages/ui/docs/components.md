# Component selection guide

> When to reach for each `@lemn-ltd/ui` component. This is the agent-facing
> companion to the live showcase (`apps/showcase`): the showcase renders every
> component, its variants, and its full props; this guide says **when to use
> which**, what to use **instead**, and what each pairs with. One section per
> component. The structured source is `src/catalog.ts`; screen recipes are in
> [patterns.md](patterns.md).

## By intent (job to be done)

Start here: find the job, reach for the listed components, then read each one's
section below for the precise call.

| You need to…               | Reach for                                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame a screen             | `screen-shell` with `sidebar` + `top-bar`, content in `content-layout`                                                                                                                                |
| Sign a user in             | `sign-in-screen` wrapping app identity + `field`/`input` + `info-banner` + `button`                                                                                                                   |
| Show a list or table       | `list-shell` + `list-filters-bar` + `data-table` + `pagination` + `empty-state`                                                                                                                       |
| Show a card grid           | `list-shell` + `section-grid` + `card`                                                                                                                                                                |
| Show a master/detail split | `two-column` (or a list rail) + `card`                                                                                                                                                                |
| Show an entity detail      | `entity-toolbar` + `stats-strip` + `card` + `tabs`                                                                                                                                                    |
| Show a dashboard           | `stats-strip` + `section-grid` + `card` + `sparkline`                                                                                                                                                 |
| Collect form input         | `field` wrapping `input` / `textarea` / `select` / `combobox` / `checkbox` / `radio` / `toggle`; submit with `button`                                                                                 |
| Edit structured config     | `key-value-editor` for string pairs · `json-code-editor` for JSON source · `markdown-editor` for Markdown · `file-dropzone` for local file selection · `file-bundle-editor` for editable file bundles |
| Filter a collection        | `list-filters-bar` + `filter` + `filter-chip` (+ `search`)                                                                                                                                            |
| Pick one inline option     | `segmented-control` (compact) · `radio` (visible set) · `select` (long list)                                                                                                                          |
| Show status inline         | `badge` (status) · `tag` (metadata) · `scope-pill` (scope)                                                                                                                                            |
| Surface a message          | `info-banner` (in content) · `system-bar` (page-wide) · `toast` + `toaster` (transient)                                                                                                               |
| Convey loading             | `skeleton` (known shape) · `spinner` (indeterminate) · `progress-bar` (determinate)                                                                                                                   |
| Show a metric              | `stat-card` + `stats-strip`, with `sparkline` for a trend                                                                                                                                             |
| Show agent state           | `agent-activity-line` for live activity rows · `agent-status-badge` for lifecycle labels · `agent-reasoning-block` + `agent-text-block` inside `agent-message-bubble` for assistant turns             |
| Ask for a decision         | `confirm-dialog` (single yes/no) · `dialog` (form / multi-action)                                                                                                                                     |
| Offer actions              | `button` / `icon-button` · `menu` (dropdown) · `command-palette` (⌘K)                                                                                                                                 |
| Navigate                   | `tabs` (peer views) · `breadcrumb` (location) · `stepper` (ordered flow) · `pagination` (pages)                                                                                                       |
| Show data                  | `data-table` (rows) · `json-viewer` (tree) · `code-block` (one value) · `relative-time` (timestamp)                                                                                                   |
| Render Markdown            | `markdown` (inline document) · `markdown-viewer` (floating reading window) · `markdown-editor` (authoring)                                                                                            |

## Primitives

### Button

`/core/components/button` · stable

A clickable action with six variants mapped to data-variant.

**Use when**

- A text-labeled action the user clicks (Save, Cancel, Submit).
- You need semantic emphasis: primary, secondary, ghost, outline, danger, ghost-danger.
- Standard native button behavior (onClick, disabled, type, form submit).

**Avoid**

- Action is icon-only with no visible text label. → use [`icon-button`](#icon-button)
- Navigating between in-page views rather than performing an action. → use [`tabs`](#tabs)
- Confirming a destructive action that needs an explicit yes/no step. → use [`confirm-dialog`](#confirm-dialog)

**Pairs with** [`icon-button`](#icon-button), [`field`](#field), [`dialog`](#dialog), [`confirm-dialog`](#confirm-dialog), [`toast`](#toast)

**In patterns** Auth, List + table, List + grid, Detail, Settings form, States, Responsive

### Icon button

`/core/components/icon-button` · stable

A square, icon-only action requiring an aria-label; four variants.

**Use when**

- A compact, square action represented by a single Icon with no visible text.
- Toolbar/row actions where space is tight (edit, delete, settings).
- You can supply a required aria-label for the accessible name.

**Avoid**

- The action benefits from a visible text label. → use [`button`](#button)
- Clicking opens a list of actions; use a trigger that owns a menu. → use [`menu`](#menu)

**Pairs with** [`entity-toolbar`](#entity-toolbar), [`top-bar`](#top-bar), [`tooltip`](#tooltip), [`menu`](#menu), [`data-table`](#data-table)

### Scroll to bottom button

`/core/components/scroll-to-bottom-button` · stable

A compact floating chevron action that appears when a scrollport moves away from its newest content and restores the bottom-pinned view.

**Use when**

- A transcript, log, or activity feed should stay pinned to the newest content while updates stream in.
- The user can scroll away from the newest content and needs a small return control near the composer or footer.
- The host can pass a `scrollRef` for the scrollable container that owns the content.

**Avoid**

- Ordinary page navigation or long-form document reading. → use native scrolling and page landmarks.
- A toolbar action that is always visible. → use [`icon-button`](#icon-button)

**Pairs with** [`composer`](#composer), [`agent-message-bubble`](#agent-message-bubble), [`user-message-bubble`](#user-message-bubble), [`icon-button`](#icon-button)

### Input

`/core/components/input` · stable

A single-line text field with an invalid state for inline errors.

**Use when**

- A single-line free-text or typed value field (name, email, URL, number).
- You need error styling via the invalid prop (aria-invalid / data-invalid).
- Controlled or uncontrolled native input with placeholder, value, onChange.

**Avoid**

- The value is multi-line prose or notes. → use [`textarea`](#textarea)
- The field is a query that filters a list as you type. → use [`search`](#search)
- Choosing one value from a fixed option set. → use [`select`](#select)
- Needs a label, hint, and error wired together. → use [`field`](#field)

**Pairs with** [`field`](#field), [`button`](#button), [`select`](#select), [`textarea`](#textarea), [`checkbox`](#checkbox)

**In patterns** Auth, Settings form

### Textarea

`/core/components/textarea` · stable

A multi-line text field with an invalid state and a default row count.

**Use when**

- A multi-line text value (description, notes, comments, prompt body).
- You want a sensible initial height via rows (defaults to 3).
- You need invalid-state styling on a multi-line field.

**Avoid**

- The value is a short single-line string. → use [`input`](#input)
- Rendering read-only formatted source or output, not editing. → use [`code-block`](#code-block)

**Pairs with** [`field`](#field), [`button`](#button), [`input`](#input)

### Select

`/core/components/select` · stable

A styled wrapper over the native select with a trailing chevron.

**Use when**

- Pick exactly one value from a known, fixed option list.
- You want the open popup themed by the design system, not the native control palette.
- Options are short and don't need typeahead filtering.

**Avoid**

- The option list is long and needs type-to-filter search. → use [`combobox`](#combobox)
- Items are actions/commands rather than a selectable value. → use [`menu`](#menu)
- A small set of mutually exclusive options shown inline. → use [`segmented-control`](#segmented-control)
- Single choice rendered as visible radio options in a form. → use [`radio`](#radio)

**Pairs with** [`field`](#field), [`input`](#input), [`combobox`](#combobox), [`segmented-control`](#segmented-control)

**In patterns** Settings form

### Search

`/core/components/search` · stable

An expand-on-focus search field that collapses back to its icon.

**Use when**

- A query field that filters or searches content as the user types.
- You want the expand-on-focus pattern that collapses back to an icon (Escape / clear).
- Controlled query string where clearing emits an empty value.

**Avoid**

- A plain single-line text value that is not a query. → use [`input`](#input)
- Global keyboard-driven navigation and command search. → use [`command-palette`](#command-palette)
- Picking a value from a filtered option list with selection. → use [`combobox`](#combobox)

**Pairs with** [`top-bar`](#top-bar), [`list-filters-bar`](#list-filters-bar), [`entity-toolbar`](#entity-toolbar), [`command-palette`](#command-palette)

### Checkbox

`/core/components/checkbox` · stable

A checkbox with checked, unchecked, and indeterminate states.

**Use when**

- An independent on/off choice that may sit among other checkboxes.
- Multi-select within a set where each option toggles independently.
- You need an indeterminate (partial) state, e.g. a select-all header.

**Avoid**

- An immediate-effect device/setting switch. → use [`toggle`](#toggle)
- Choosing exactly one option from a mutually exclusive set. → use [`radio`](#radio)

**Pairs with** [`field`](#field), [`data-table`](#data-table), [`list-filters-bar`](#list-filters-bar), [`button`](#button)

### Radio

`/core/components/radio` · stable

A single-choice radio group built from RadioGroup and RadioGroupItem.

**Use when**

- Choose exactly one option from a small, mutually exclusive set shown inline.
- You want the group to own the selected value (RadioGroup) with one RadioGroupItem per choice.
- All options should stay visible rather than collapsing into a popup.

**Avoid**

- Each option toggles independently / multiple can be on. → use [`checkbox`](#checkbox)
- The option set is long or better hidden behind a trigger. → use [`select`](#select)
- A compact inline one-of-N control. → use [`segmented-control`](#segmented-control)

**Pairs with** [`field`](#field), [`button`](#button)

### Toggle

`/core/components/toggle` · stable

A switch with a sliding thumb for an immediate on/off setting.

**Use when**

- An on/off setting that takes effect immediately when flipped.
- Binary feature/preference switches in settings panels.
- Controlled boolean with onCheckedChange.

**Avoid**

- The choice is part of a form submitted later, not applied instantly. → use [`checkbox`](#checkbox)
- Selecting one of several mutually exclusive options. → use [`radio`](#radio)

**Pairs with** [`field`](#field), [`card`](#card), [`page-section`](#page-section)

**In patterns** Settings form

### Badge

`/core/components/badge` · stable

A small status label with eight tones and an optional leading dot.

**Use when**

- A small status/state label with semantic meaning (Active, Degraded, Syncing).
- You need one of eight semantic tones, optionally a leading status dot (showDot).
- Subtle label vs soft tonal fill emphasis via the variant prop.

**Avoid**

- Free-form, non-semantic metadata like keywords or categories. → use [`tag`](#tag)
- Labeling the scope/context something applies to. → use [`scope-pill`](#scope-pill)
- A persistent banner conveying page- or system-level state. → use [`info-banner`](#info-banner)

**Pairs with** [`data-table`](#data-table), [`card`](#card), [`stat-card`](#stat-card), [`list-shell`](#list-shell), [`relative-time`](#relative-time)

**In patterns** List + grid, List + split, Detail, Responsive

### Tag

`/core/components/tag` · stable

An inline metadata label with three variants.

**Use when**

- An inline label for free-form metadata: keywords, labels, categories.
- Several tags listed together to describe an item's attributes.
- You want a neutral default, accent, or muted treatment without semantic status meaning.

**Avoid**

- The label conveys semantic status/state with a color meaning. → use [`badge`](#badge)
- A removable/interactive filter selection. → use [`filter-chip`](#filter-chip)
- Labeling the scope or context something applies to. → use [`scope-pill`](#scope-pill)

**Pairs with** [`card`](#card), [`data-table`](#data-table), [`list-shell`](#list-shell), [`badge`](#badge)

### Avatar

`/core/components/avatar` · stable

A circular identity badge, with a group that collapses overflow into +N.

**Use when**

- A circular identity badge showing a person's initials with a color hue.
- Stacking multiple people with AvatarGroup, overflow collapsing into +N (max).
- Two sizes (24 or 32) for inline rows vs headers.

**Avoid**

- Labeling a non-person entity or status. → use [`badge`](#badge)
- Switching the active organization/account context. → use [`org-switcher`](#org-switcher)

**Pairs with** [`data-table`](#data-table), [`card`](#card), [`top-bar`](#top-bar), [`list-shell`](#list-shell), [`tooltip`](#tooltip)

**In patterns** List + split

### Meter

`/core/components/meter` · beta

A linear ratio bar for a single value against a max — quota used, budget spent, progress; tone signals headroom.

**Use when**

- Showing a single value against a known maximum (quota, budget, progress).
- A surface needs an at-a-glance sense of headroom with tone (accent → warn → danger).

**Avoid**

- Plotting a trend or series. → use [`sparkline`](#sparkline)
- Showing a discrete status rather than a ratio. → use [`badge`](#badge)

**Pairs with** [`card`](#card), [`stat-card`](#statcard), [`badge`](#badge)

### Kbd

`/core/components/kbd` · stable

A keyboard key hint that composes into shortcut chords.

**Use when**

- Display a keyboard key or shortcut chord (compose several for ⌘⇧P).
- Showing the hotkey for an action in menus, tooltips, or hints.
- Inline reference to a single key token (Esc, ⇧).

**Avoid**

- Rendering runnable or copyable code rather than a key hint. → use [`code-block`](#code-block)

**Pairs with** [`menu`](#menu), [`command-palette`](#command-palette), [`tooltip`](#tooltip), [`button`](#button)

### Filter pill

`/core/components/filter-pill` · stable

A toggleable filter trigger with active and open states.

**Use when**

- A toggleable filter trigger with a trailing chevron in a filter bar.
- You need data-active (a value is applied) and data-open (menu visible) styling.
- The pill opens an attached menu/popover to choose the filter value.

**Avoid**

- Representing a selected filter value that can be removed. → use [`filter-chip`](#filter-chip)
- Standalone dropdown trigger that owns its menu surface. → use [`filter`](#filter)
- A compact one-of-N inline switch. → use [`segmented-control`](#segmented-control)

**Pairs with** [`filter`](#filter), [`filter-chip`](#filter-chip), [`list-filters-bar`](#list-filters-bar), [`popover`](#popover), [`menu`](#menu)

### Scope pill

`/core/components/scope-pill` · stable

A read-only pill labelling the scope something applies to.

**Use when**

- A read-only label for the scope or context something applies to (Workspace, Private).
- You want a static styled span, optionally with a leading icon.
- Communicating where/whom a setting, item, or action is bound to.

**Avoid**

- The pill should be interactive or toggle a filter. → use [`filter-pill`](#filter-pill)
- Conveying semantic status/state. → use [`badge`](#badge)
- Free-form keyword or category metadata. → use [`tag`](#tag)

**Pairs with** [`badge`](#badge), [`top-bar`](#top-bar), [`breadcrumb`](#breadcrumb), [`card`](#card)

## Forms

### Field

`/core/components/field` · stable

The canonical form row: label, required asterisk, hint, and error, wired to any control via a render contract.

`Field` is the design-system solution for control labels. Do not add or consume
a standalone `Label` component: the label must stay coupled to hint, error,
disabled, required, and `aria-describedby` wiring.

**Use when**

- Wrapping any form control to attach a label, required asterisk, hint line, and error line as one canonical row.
- Wiring labeling and validity (id, aria-invalid, aria-describedby, disabled) into a control via its render-prop contract instead of hand-managing aria.
- Showing validation state: pass state="invalid" + error and the error line replaces the hint automatically.

**Avoid**

- Don't use it to style a control's border or visuals — Field owns label/hint/error only and never styles the control; reach for the control itself. → use [`input`](#input)
- Don't wrap section toggles that aren't a labeled form value; collapsible content belongs in an accordion. → use [`accordion`](#accordion)

**Pairs with** [`input`](#input), [`textarea`](#textarea), [`select`](#select), [`checkbox`](#checkbox), [`toggle`](#toggle), [`combobox`](#combobox)

**In patterns** Settings form

### Calendar

`/core/components/calendar` · beta

A one- or two-month date grid with discriminated single/range state, partial
range preview, selected/today markers, quick-year navigation, locale-aware
labels, and shared disabled-date rules.

**Use when**

- Picking a single date from a visible month grid, with today marked and the selection filled in the accent.
- Enforcing a selectable range: pass minDate/maxDate, disableFuture, disablePast, or shouldDisableDate and out-of-range days render disabled and unselectable.
- You want controlled or uncontrolled selection plus controlled or uncontrolled visible-month navigation.
- A date range needs an explicit partial start, hover preview, and one or two adjacent months without duplicating date logic.

**Avoid**

- Don't use for free-typed or masked date entry in a row; wrap a text control in a field instead. → use [`field`](#field)
- Don't use to pick a time of day; the calendar only owns dates. → use [`field`](#field)

**Pairs with** [`field`](#field), [`input`](#input), [`button`](#button), [`icon-button`](#icon-button)

### Inline edit

`/core/components/inline-edit` · stable

Edit-in-place control for a text, number, or single-selection value, with edit, save, and cancel affordances.

**Use when**

- Letting a user edit one settings value inline: a number (with min/max/step) or a single-selection list, committed through onSave.
- Building editable settings rows where a full form would be heavy — pair an InlineEdit inside a SettingsRow.

**Avoid**

- Don't use for a full multi-field form; compose Fields and a submit button instead. → use [`field`](#field)
- Don't use for a standalone, always-open select; reach for the canonical select control. → use [`select`](#select)

**Pairs with** [`settings-row`](#settings-row), [`card`](#card), [`input`](#input), [`icon-button`](#icon-button)

### Segmented control

`/core/components/segmented-control` · stable

Single-select control on a recessed track; the pressed segment rises to a raised pill.

**Use when**

- Single-select among 2-4 short, mutually-exclusive options shown inline on a recessed track (view modes, ranges, layouts).
- All choices should stay visible at once so the user can see and switch between them without opening anything.
- Optionally pairing a small icon with each segment label for compact view/layout switches.

**Avoid**

- Don't use for many options or long labels that won't fit inline; a dropdown select scales better. → use [`select`](#select)
- Don't use it to navigate between page views/panels; that's a tabs job. → use [`tabs`](#tabs)
- Don't use for an on/off binary state; reach for a toggle. → use [`toggle`](#toggle)

**Pairs with** [`field`](#field), [`entity-toolbar`](#entity-toolbar), [`top-bar`](#top-bar)

### Combobox

`/core/components/combobox` · stable

Searchable select with single and multi modes, built on the canonical Popover and a cmdk filter.

**Use when**

- Selecting from a long option list that needs in-popover search/filtering (timezones, repos, users) rather than a plain scroll.
- Single mode: pick one value, close on select, show the chosen label in the trigger.
- Multi mode: toggle several values as chips while the popover stays open.
- Marking validity inline via the invalid prop, or wiring it through Field's spread props.

**Avoid**

- Don't use for a short, fixed option list that doesn't need search; a native-style select is simpler. → use [`select`](#select)
- Don't use it to run commands or navigate the app; that's the command palette's role. → use [`command-palette`](#command-palette)

**Pairs with** [`field`](#field), [`popover`](#popover), [`tag`](#tag), [`badge`](#badge)

### Accordion

`/core/components/accordion` · stable

Stacked disclosure rows in single (one-open) or multiple modes, with an animated body height.

**Use when**

- Stacking disclosure rows where each section's body expands/collapses with an animated chevron.
- type="single" (optionally collapsible) to keep at most one section open at a time, e.g. an FAQ or settings group.
- type="multiple" to let several sections stay open simultaneously.

**Avoid**

- Don't use to switch between mutually-exclusive page views; use tabs for flat view switching. → use [`tabs`](#tabs)
- Don't use for a single show/hide block of transient content anchored to a trigger; a popover fits better. → use [`popover`](#popover)

**Pairs with** [`field`](#field), [`card`](#card), [`page-section`](#page-section)

### SelectionList

`/core/components/selection-list` · stable

Searchable grouped multi-select: category pills with counts, group select-all with indeterminate state, and indented item rows with optional badges.

**Use when**

- Selecting many items from a one-level categorized catalog (tools, permissions, capabilities) where the user browses and toggles in place.
- The catalog is large enough to need a search query plus per-category narrowing, with live selected counts per group and overall.
- Group-level select-all matters: the header checkbox checks, unchecks, or shows the indeterminate state for its visible items.
- Item rows carry secondary metadata: a monospace description (an id) and a trailing tone badge (e.g. risk).

**Avoid**

- Don't use for picking a handful of known values where browsing isn't needed; a multi combobox is lighter. → use [`combobox`](#combobox)
- Don't use for flat, ungrouped lists; pass-through grouping with a single group defeats the hierarchy. → use [`combobox`](#combobox) or a checkbox list in a [`field`](#field)
- Don't use it to run commands or navigate. → use [`command-palette`](#command-palette)

**Pairs with** [`field`](#field), [`badge`](#badge), [`checkbox`](#checkbox), [`page-section`](#page-section)

### Select native

`/core/components/select-native` · beta

Use `SelectNative` for short form choices where browser-native mobile UI,
autofill, form submission, and progressive enhancement are more valuable than
a custom popup. It supports options, optgroups, disabled values, refs, and
controlled or uncontrolled native values. Use [`select`](#select) when the
popup itself must follow the design-system surface.

### Radio card group

`/core/components/radio-card-group` · beta

Use `RadioCardGroup` for a small mutually exclusive choice where every option
needs a label, description, or icon and the full card should be clickable. It
keeps Radix radio keyboard semantics and a visible selection marker. Use plain
[`radio`](#radio) when the card treatment would add unnecessary weight.

### Toggle group

`/core/components/toggle-group` · beta

Use `ToggleGroup` for compact single- or multi-select commands such as editor
formatting. It is not an on/off setting; use [`toggle`](#toggle) for a switch.
It is also not peer-view navigation; use [`segmented-control`](#segmented-control)
for a single compact view choice and [`tabs`](#tabs) for panels.

### Slider

`/core/components/slider` · beta

Use `Slider` for a bounded numeric value or range when direct manipulation is
more useful than typing. Supply exactly one accessible label per thumb and use
`valueFormatter` only for display; the emitted values stay numeric. Prefer an
[`input`](#input) when users need exact or unbounded entry.

### Date picker

`/core/components/date-picker` · beta

Use `DatePicker` for one labelled date field. It composes `Field`, `Button`,
`Popover`, and the shared single-mode [`calendar`](#calendar), supports
controlled or uncontrolled state, and can submit a stable local date through a
hidden form input. Manual text entry is intentionally not implemented.

### Date range picker

`/core/components/date-range-picker` · beta

Use `DateRangePicker` for an explicit start/end field. A partial range remains
visible and keeps the popover open until the end is selected; one or two months
reuse the same range-mode [`calendar`](#calendar) logic. Use two separate date
pickers only when start and end are independent values.

### Composer

`/core/components/composer` · beta

Chat/agent message input: a compact auto-grow composer with a lower anchored Send action that swaps to Stop while streaming.

**Use when**

- Capturing a chat or agent message: a compact surface with an auto-grow textarea and lower anchored action, used for the session composer or the home prompt box.
- Driving a streaming turn — status="streaming" swaps Send for Stop, keeps the textarea editable, and disables Enter-to-submit.
- Wiring keyboard send: Enter submits a non-empty draft, Shift+Enter inserts a newline, and IME composition Enter is ignored.
- Keeping a chat composer stable inside expandable surfaces: `width="content"` centers it and caps it to the conversation reading width; the default `width="fill"` spans the parent.
- Extending the row without forking: leadingSlot before the textarea, footerSlot as a hint beside the action.

**Avoid**

- Don't use for a single-line value with no streaming or send action; a plain field is simpler. → use [`field`](#field)
- Don't use it to run commands or navigate the app; that's the command palette's role. → use [`command-palette`](#command-palette)

**Pairs with** [`icon-button`](#icon-button), [`textarea`](#textarea), [`kbd`](#kbd)

### Key-value editor

`/core/components/key-value-editor` · stable

A compact editable table for string key/value pairs with add and remove actions.

**Use when**

- Editing a small ordered set of string pairs: headers, environment variables, metadata, or labels.
- The host owns validation, persistence, and normalization, and the component should only emit the next row array.
- You need stable row identity while users add, edit, and remove entries.

**Avoid**

- The values have distinct schemas or rich controls. Build a form with individual Fields instead. → use [`field`](#field)
- You need row sorting, pagination, or bulk actions. This is not a table surface. → use [`data-table`](#data-table)

**Pairs with** [`field`](#field), [`input`](#input), [`icon-button`](#icon-button), [`card`](#card)

### JSON code editor

`/core/components/json-code-editor` · beta

Controlled JSON text editor with line numbers, folding, syntax tones, and parse diagnostics.

**Use when**

- Editing JSON source where invalid intermediate text must be allowed while the user types.
- You need a VS Code-like editing surface for schemas, request bodies, config blobs, or structured metadata.
- The host owns semantic validation and persistence; the component only emits text and highlights parse errors.

**Avoid**

- Don't use to inspect already-parsed JSON without editing. → use [`json-viewer`](#json-viewer)
- Don't use for a small set of flat key/value strings. → use [`key-value-editor`](#key-value-editor)

**Pairs with** [`field`](#field), [`card`](#card), [`info-banner`](#info-banner), [`tabs`](#tabs)

### File dropzone

`/core/components/file-dropzone` · stable

A drag-and-select file input with a per-file metadata list that renders upload progress, preview thumbnails, and error/retry affordances.

**Use when**

- Users select one or more local files and the host application owns upload, fingerprinting, and storage.
- You need a consistent drag target plus the native file picker path.
- Accepted files should render with name, size, or fingerprint metadata — optionally a thumbnail, a determinate progress bar, or an error with a retry control.

**Avoid**

- The value is a remote file URL or path typed by hand. → use [`input`](#input)
- You want the component to run the upload itself; it stays presentational — the host drives `status`/`progress` per file and handles `onRetry`/`onRemove`.

**Pairs with** [`field`](#field), [`progress-bar`](#progress-bar), [`info-banner`](#info-banner)

### File bundle editor

`/core/components/file-bundle-editor` · stable

A controlled file-bundle workspace with upload actions, a file list, and one active text editor or read-only binary view.

**Use when**

- Users need to load one file or a folder and then switch between files inside that local bundle.
- The host application owns file reading, validation, persistence, and path normalization, while the component owns the workspace layout.
- Exactly one file should be visible for editing at a time, with binary files listed as included but read-only.

**Avoid**

- You only need file selection metadata or upload progress. → use [`file-dropzone`](#file-dropzone)
- The value is one Markdown document with no bundled files. → use [`markdown-editor`](#markdown-editor)
- The host needs a source-code IDE with syntax services, diagnostics, or multi-pane editing.

**Pairs with** [`markdown-editor`](#markdown-editor), [`textarea`](#textarea), [`button`](#button), [`badge`](#badge)

### Markdown editor

`/core/components/markdown-editor` · stable

A controlled Markdown textarea with a corner accent toggle that swaps between writing and the canonical Markdown preview.

**Use when**

- Editing Markdown source where users benefit from flipping between source and a safe preview: the floating top-right icon (eye ↔ pencil) swaps the whole panel between the textarea and [`markdown`](#markdown).
- The host owns persistence and server-side Markdown processing; the component provides editing plus the preview.
- Skill, prompt, runbook, or changelog text needs multi-line authoring.

**Avoid**

- Plain notes that do not need Markdown affordances. → use [`textarea`](#textarea)
- Rendering trusted, finalized Markdown from storage. → use [`markdown`](#markdown)

**Pairs with** [`field`](#field), [`textarea`](#textarea), [`markdown`](#markdown)

## Agents

### Agent activity line

`/agents/components/agent-activity-line` · beta

A compact agent activity row with optional agent name, action phrase, pulse animation, and explicit runtime/local activity states.

**Use when**

- A chat drawer, activity rail, or execution overlay needs one live agent status row like `Researcher is working...` or icon-only `is idle`.
- The state is one of the supported runtime/local states: idle, working, confirming, reactivating, cancelling, or cancelled.
- The host has a visible action phrase (`statusText`) such as `is thinking...`, `is running pnpm test`, or `is waiting for your confirmation`.
- The leading icon should pulse from a host-owned busy flag, such as the same flag that shows a chat Stop button.

**Avoid**

- Treating activity phrases as new states. `thinking`, `running a tool`, `streaming`, and `compacting context` are status text over an explicit state.
- Driving `pulse` from unrelated state if the surface has a Stop/Cancel control. Keep both derived from one busy source.
- Showing terminal lifecycle summaries in tables. → use [`agent-status-badge`](#agent-status-badge)
- Rendering message body content. → use [`agent-message-bubble`](#agent-message-bubble), [`agent-reasoning-block`](#agent-reasoning-block), and [`agent-tool-call-list`](#agent-tool-call-list)

**Pairs with** [`composer`](#composer), [`agent-message-bubble`](#agent-message-bubble), [`agent-tool-call-list`](#agent-tool-call-list), [`scroll-to-bottom-button`](#scroll-to-bottom-button)

### Agent message bubble

`/agents/components/agent-message-bubble` · beta

A full-width transparent assistant response bubble for agent conversations, with copy and optional timestamp metadata.

**Use when**

- Rendering an agent or assistant response in a conversational surface.
- The response should occupy the full transcript width and stay visually transparent.
- The message needs Markdown rendering, copy, and optional relative-time metadata.

**Avoid**

- Rendering the operator's own submitted message. → use [`user-message-bubble`](#user-message-bubble)
- The content is not conversational agent output. → use [`card`](#card), [`markdown`](#markdown), or a product-owned surface

**Pairs with** [`agent-reasoning-block`](#agent-reasoning-block), [`agent-text-block`](#agent-text-block), [`relative-time`](#relative-time), [`icon-button`](#icon-button), [`card`](#card)

### Agent reasoning block

`/agents/components/agent-reasoning-block` · beta

A collapsible Thinking block for streaming and completed agent reasoning parts.

**Use when**

- Rendering `UIMessage.parts[]` entries whose `type` is `reasoning`.
- Reasoning should be visible while it streams, then remain available as a compact disclosure.
- The host can pass stable part ids and the part `state` (`streaming` or `done`) from the chat contract.
- The host has a persisted or host-projected reasoning duration and can pass `durationMs`; completed blocks then label as `Thought for 8s` or `Thought for 1m 25s`.

**Avoid**

- Rendering the final user-visible answer. → use [`agent-text-block`](#agent-text-block)
- Rendering tool execution evidence. → use [`agent-tool-call-list`](#agent-tool-call-list)
- Showing a fabricated duration for persisted reasoning without timing data.

**Pairs with** [`agent-message-bubble`](#agent-message-bubble), [`agent-text-block`](#agent-text-block), [`accordion`](#accordion), [`markdown`](#markdown)

### Agent text block

`/agents/components/agent-text-block` · beta

A Markdown answer block for agent text parts that can stay hidden while reasoning streams.

**Use when**

- Rendering `UIMessage.parts[]` entries whose `type` is `text`.
- The final answer should appear only after active reasoning parts finish streaming.
- Multiple text parts need one consistent Markdown treatment inside an assistant turn.

**Avoid**

- Rendering hidden reasoning or chain-of-thought-like progress. → use [`agent-reasoning-block`](#agent-reasoning-block)
- Rendering the operator's own submitted message. → use [`user-message-bubble`](#user-message-bubble)

**Pairs with** [`agent-message-bubble`](#agent-message-bubble), [`agent-reasoning-block`](#agent-reasoning-block), [`markdown`](#markdown)

### User message bubble

`/agents/components/user-message-bubble` · beta

A right-aligned operator message bubble for agent conversations, using the accent surface plus copy and optional timestamp metadata.

**Use when**

- Rendering a user/operator turn in an agent conversation transcript.
- The message should sit on the right and read as the submitted prompt.
- The message needs copy and optional relative-time metadata.

**Avoid**

- Rendering an agent response, tool output, or reasoning. → use [`agent-message-bubble`](#agent-message-bubble)
- The content needs rich Markdown or structured child slots.

**Pairs with** [`agent-message-bubble`](#agent-message-bubble), [`composer`](#composer), [`relative-time`](#relative-time)

### Agent status badge

`/agents/components/agent-status-badge` · beta

A reusable status badge for agent lifecycle and execution state surfaces.

**Use when**

- A shared surface needs to label an agent or agent execution state.
- The state is lifecycle-like: idle, queued, running, waiting, completed, failed, or cancelled.
- You need a stable `data-agent-status` hook for tests or styling.

**Avoid**

- The value is ordinary product status unrelated to agents. → use [`badge`](#badge)
- The state needs a full timeline, details, or actions. → compose a product surface from [`card`](#card), [`data-table`](#data-table), and [`agent-status-badge`](#agent-status-badge)

**Pairs with** [`badge`](#badge), [`card`](#card), [`data-table`](#data-table), [`relative-time`](#relative-time)

### Capability chip

`/agents/components/capability-chip` · beta

A semantic chip for capability governance state: risk ceiling, surface drift, or policy decision.

**Use when**

- A capability or integration surface needs a compact, consistent state label.
- The value belongs to one of the supported governance lenses: risk, drift, or decision.
- The host wants the same tone mapping across admin, review, and consumption surfaces.

**Avoid**

- Showing generic lifecycle state. → use [`badge`](#badge) or [`agent-status-badge`](#agent-status-badge)
- Rendering editable constraints. → use [`capability-constraints-editor`](#capability-constraints-editor)
- Using product-specific color logic outside the shared tone map.

**Pairs with** [`badge`](#badge), [`data-table`](#data-table), [`entity-toolbar`](#entity-toolbar), [`capability-constraints-editor`](#capability-constraints-editor)

### Capability constraints editor

`/agents/components/capability-constraints-editor` · beta

A controlled editor for capability narrowing: risk ceiling, approval gates, numeric limits, and allowlists.

**Use when**

- Editing the public constraints attached to a capability surface.
- Empty fields should be omitted from the constraints record rather than stored as zero, empty string, or empty list.
- The host owns persistence and passes a controlled `CapabilityConstraints` value.

**Avoid**

- Displaying a read-only summary. → use [`capability-chip`](#capability-chip), [`description-list`](#description-list), or [`json-viewer`](#json-viewer)
- Editing unrelated key/value metadata. → use [`key-value-editor`](#key-value-editor)
- Modeling product-owned policy that does not map to capability constraints.

**Pairs with** [`field`](#field), [`input`](#input), [`select`](#select), [`toggle`](#toggle), [`capability-chip`](#capability-chip)

### Principal picker

`/agents/components/principal-picker` · beta

A controlled principal target picker for role, team, API client, and team-member assignment surfaces.

**Use when**

- Assigning a capability, policy, or permission to a role, team, or API client.
- The host has canonical team and API client option lists and owns the selected union.
- A team detail surface needs checkbox selection for members via `TeamMemberPicker`.

**Avoid**

- Selecting ordinary free-form users or labels. → use [`combobox`](#combobox) or [`selection-list`](#selectionlist)
- Choosing one option from a static, non-principal set. → use [`radio`](#radio), [`select`](#select), or [`segmented-control`](#segmented-control)
- Persisting display names as identifiers; the component emits ids and roles only.

**Pairs with** [`segmented-control`](#segmented-control), [`select`](#select), [`checkbox`](#checkbox), [`field`](#field), [`capability-chip`](#capability-chip)

### Approval card

`/agents/components/approval-card` · beta

A single pending HITL request as a decision surface: prompt, capability/integration context, risk chip, and mode-specific approve, reject, and choice actions.

**Use when**

- Surfacing one human-in-the-loop request that needs an approve/reject (or choice) decision.
- The request carries capability/integration context and an optional risk level to show inline.

**Avoid**

- Listing several pending requests. → use [`approvals-inbox`](#approvals-inbox)

**Pairs with** [`card`](#card), [`button`](#button), [`capability-chip`](#capability-chip), [`relative-time`](#relative-time)

### Approvals inbox

`/agents/components/approvals-inbox` · beta

A vertical queue of pending HITL requests rendered as approval cards with a count header, falling back to an empty state when the inbox is clear.

**Use when**

- Showing all pending approvals a reviewer must act on, capability and inference alike.

**Avoid**

- Rendering a single request. → use [`approval-card`](#approval-card)

**Pairs with** [`approval-card`](#approval-card), [`empty-state`](#emptystate)

### Capability matrix

`/agents/components/capability-matrix` · beta

A who-can-what grid of capability rows by target columns, each cell projecting a grant state, with reused risk and drift chips per capability.

**Use when**

- Reviewing grants and assignments across capabilities and targets (role, team, api_client).
- A governance surface needs an at-a-glance projection of who can use what.

**Avoid**

- Editing a single capability's constraints. → use [`capability-constraints-editor`](#capability-constraints-editor)

**Pairs with** [`capability-chip`](#capability-chip), [`data-table`](#data-table), [`icon`](#icon)

### Classification matrix

`/agents/components/classification-matrix` · beta

A controlled editor for a capability data policy: output classification, model-context policy, a per-field classification matrix, and allowed sink refs.

**Use when**

- Editing how a capability's output and fields are classified and where data may flow.

**Avoid**

- Editing capability narrowing constraints. → use [`capability-constraints-editor`](#capability-constraints-editor)

**Pairs with** [`select`](#select), [`badge`](#badge), [`data-table`](#data-table)

### Effective surface viewer

`/agents/components/effective-surface-viewer` · beta

The consumption My Integrations view: a read-only surface of the effective capabilities available to the caller, grouped by integration, with risk, approval gate, quota, and drift block.

**Use when**

- Showing a user only the capabilities they can actually use, resolved for their principal.

**Avoid**

- Administering grants, assignments, or policy. → use [`capability-matrix`](#capability-matrix) and the admin surfaces.

**Pairs with** [`card`](#card), [`capability-chip`](#capability-chip), [`meter`](#meter), [`empty-state`](#emptystate)

### Agent tool call list

`/agents/components/agent-tool-call-list` · beta

A collapsible group of agent tool calls; each row expands to show its input, output content blocks, and per-status evidence.

**Use when**

- Rendering the tool parts of an assistant turn (`UIMessage.parts[]` entries whose `type` starts with `tool-`, or public `conversation.part.tool_preview` events).
- The transcript needs a compact group header with a per-row disclosure, like a run of executed tools.
- Tool output arrives as the canonical envelope `content[]` of `text`, `json`, and `image` blocks — built-in tools and external integration (MCP) tools alike.

**Avoid**

- Rendering a single reasoning or text part. → use [`agent-reasoning-block`](#agent-reasoning-block) or [`agent-text-block`](#agent-text-block)
- Building a product-specific tool inspector with bespoke per-tool layouts. → compose a product surface from this list plus [`json-viewer`](#json-viewer), [`code-block`](#code-block), and [`card`](#card)

**Pairs with** [`agent-message-bubble`](#agent-message-bubble), [`badge`](#badge), [`json-viewer`](#json-viewer), [`info-banner`](#info-banner), [`spinner`](#spinner)

### Execution map

`/agents/components/execution-map` · beta

A read-only lane canvas for agent execution evidence, synchronized graph selection, inspector, timeline, and relationship filters.

**Use when**

- A product already has canonical execution graph, entity, edge, and event records and needs an operational observability surface.
- Users need to move between lanes, relationships, timeline events, and contract payloads without switching tabs.
- The host owns data fetching and maps backend contracts into the brand-neutral `ExecutionMapGraph` contract.

**Avoid**

- Editing workflows or automation graph authoring. This component is observability-only; manual layout persistence and mutation controls belong elsewhere.
- Passing runtime-specific DTOs directly into `@lemn-ltd/ui`. Use a product-owned adapter to keep the shared component contract-light.
- Replacing domain dashboards that do not expose node/edge/event evidence.

**Pairs with** [`button`](#button), [`input`](#input), [`segmented-control`](#segmented-control), [`badge`](#badge)

## Automation

### Automation status badge

`/agents/components/automation-status-badge` · beta

A status pill for automation definition lifecycle and run state: draft, published, and archived plus queued, scheduled, running, waiting, completed, failed, and cancelled.

**Use when**

- Labeling an automation definition or run in an inventory, header, or detail surface.
- The state is automation-level lifecycle or run status, not a single node's execution state.

**Avoid**

- Labeling a single graph node's execution state. → use [`automation-graph`](#automation-graph) (`NodeStateChip`)
- Labeling agent execution. → use [`agent-status-badge`](#agent-status-badge)

**Pairs with** [`badge`](#badge), [`data-table`](#data-table), [`run-timeline`](#run-timeline)

### Trigger tile

`/agents/components/trigger-tile` · beta

A trigger kind as a bordered tile: a leading glyph, a label and optional description, and a trailing enabled/disabled/error status pill.

**Use when**

- Listing the trigger kinds an automation supports (manual, API, webhook, schedule, repository event).
- Each kind needs a delivery status and an optional selected state.

**Avoid**

- Editing the schedule itself. → use [`schedule-editor`](#schedule-editor)

**Pairs with** [`badge`](#badge), [`icon`](#icon), [`schedule-editor`](#schedule-editor)

### Schedule editor

`/agents/components/schedule-editor` · beta

A schedule configuration block: a cron/interval/fixed kind selector, the expression, an optional timezone, and a live next/last-run summary with a status pill.

**Use when**

- Authoring or summarizing a scheduled trigger's cron, interval, or fixed instant.
- The host owns the controlled `kind`/`expression` and reacts to the change callbacks.

**Avoid**

- Choosing the trigger kind itself. → use [`trigger-tile`](#trigger-tile)

**Pairs with** [`field`](#field), [`segmented-control`](#segmented-control), [`badge`](#badge)

### Trigger composer

`/agents/components/trigger-composer` · beta

The trigger authoring surface: a list of configured triggers — each a deep preset-driven schedule builder (once/hourly/daily/weekdays/weekly/custom with a per-preset input and a live human summary) or a titled card — plus a collapsible add-another-trigger picker.

**Use when**

- Authoring the set of triggers that start an automation, where a schedule trigger needs friendly presets rather than a raw cron, and other kinds (API call, repository event) are simple cards.
- The host owns the controlled `triggers` list and reacts to the schedule/add/remove callbacks.

**Avoid**

- Editing a single raw cron/interval/fixed expression. → use [`schedule-editor`](#schedule-editor)
- Listing one trigger kind as a selectable tile. → use [`trigger-tile`](#trigger-tile)

**Pairs with** [`segmented-control`](#segmented-control), [`field`](#field), [`input`](#input), [`select`](#select)

### Automation graph

`/agents/components/automation-graph` · beta

A read-only automation graph: typed nodes (`GraphNode`) on an absolute canvas (`GraphCanvas`) connected by orthogonal edges and toned by execution state, with an inline state legend (`NodeStateChip`).

**Use when**

- Visualizing an authored automation graph and per-node run state.
- Node selection is delegated to the host; the canvas reflects the selection.

**Avoid**

- Agent runtime execution evidence with lanes, timeline, and payloads. → use [`execution-map`](#execution-map)

**Pairs with** [`node-inspector`](#node-inspector), [`run-timeline`](#run-timeline), [`badge`](#badge)

### Node inspector

`/agents/components/node-inspector` · beta

A selected node's detail panel — a kind pill, a config/policy/knowledge tab strip, and label/value rows — beside the authoring node palette (`NodePalette`).

**Use when**

- Inspecting or configuring a selected graph node, with a node palette to add kinds.
- Tab state is controlled by the host.

**Avoid**

- Rendering the graph itself. → use [`automation-graph`](#automation-graph)

**Pairs with** [`automation-graph`](#automation-graph), [`segmented-control`](#segmented-control), [`field`](#field)

### Run timeline

`/agents/components/run-timeline` · beta

The chronological evidence log for an automation run: a bordered column of tone-dotted, timestamped event rows (`EventRow`).

**Use when**

- Showing the ordered event stream of a run (triggered, node completed, wait, retry, failed).
- The host maps an event family to a tone.

**Avoid**

- A per-node attempt ledger with durations and errors. → use [`node-attempts-table`](#node-attempts-table)

**Pairs with** [`node-attempts-table`](#node-attempts-table), [`automation-status-badge`](#automation-status-badge)

### Wait & retry chips

`/agents/components/wait-retry-chip` · beta

Compact pills for a node's wait timer (`WaitChip`) and retry budget (`RetryChip`), toned by state, for graph, scheduler, and evidence rows.

**Use when**

- Showing a wait countdown/duration or an attempt `n / m` retry count with state.

**Avoid**

- A node's overall execution state. → use [`automation-graph`](#automation-graph) (`NodeStateChip`)

**Pairs with** [`badge`](#badge), [`icon`](#icon), [`run-timeline`](#run-timeline)

### Approval panel

`/agents/components/approval-panel` · beta

The decision surface for an automation human-task node: automation/run context, graph-hash and stale-approval conflicts that block approval, a comment, and Approve/Reject actions.

**Use when**

- Resolving an automation human-task approval, including graph-hash conflict and stale-approval cases.
- All decisions are emitted through the callbacks.

**Avoid**

- An agent tool-call HITL request. → use [`approval-card`](#approval-card)

**Pairs with** [`description-list`](#description-list), [`info-banner`](#info-banner), [`button`](#button)

### Planner status

`/agents/components/planner-status` · beta

The planner runtime indicator for the planned-graph flow: a dotted status pill that pulses while the planner is planning or streaming.

**Use when**

- Showing the planner runtime state (idle, planning, streaming, compiled, failed) during proposal generation.

**Avoid**

- A compile result or proposal review. → use [`proposal-preview`](#proposal-preview)

**Pairs with** [`badge`](#badge), [`proposal-preview`](#proposal-preview)

### Proposal preview

`/agents/components/proposal-preview` · beta

The review surface for a generated automation graph: a monospace node preview, a compile-result banner, and accept/reject actions gated on a clean compile.

**Use when**

- Reviewing a generated graph proposal before accepting or rejecting it.
- Accept must be blocked until the proposal compiles cleanly.

**Avoid**

- The planner's live runtime state. → use [`planner-status`](#planner-status)

**Pairs with** [`planner-status`](#planner-status), [`info-banner`](#info-banner), [`button`](#button)

### Node attempts table

`/agents/components/node-attempts-table` · beta

The per-node attempt ledger for a run — node, type, attempt, state, duration, and error — composed over the canonical DataTable.

**Use when**

- Showing every node attempt with execution state, duration, and error in run evidence.

**Avoid**

- The chronological event stream. → use [`run-timeline`](#run-timeline)

**Pairs with** [`data-table`](#data-table), [`automation-graph`](#automation-graph), [`run-timeline`](#run-timeline)

### Runtime refs panel

`/agents/components/runtime-refs-panel` · beta

The runtime integration summary for an execution node: runtime session/run refs and source context as aligned monospace lines, plus a policy/limits/safety/knowledge metric strip.

**Use when**

- Surfacing the runtime session/run refs, source context, and resolved policy/limits/safety/knowledge for an execution node.
- The data is read-only public runtime refs and summaries.

**Avoid**

- A capability surface grouped by integration. → use [`effective-surface-viewer`](#effective-surface-viewer)

**Pairs with** [`description-list`](#description-list), [`stats-strip`](#stats-strip), [`code-block`](#code-block)

## Overlays

### Dialog

`/core/components/dialog` · stable

A modal surface with a built-in focus trap, Escape-to-close, and focus return. `size` scales the panel width (sm 440 · md 560 · lg 720 · xl 960); mobile collapses to a full-width bottom sheet.

**Master→detail pattern.** For a modal that browses a list and drills into a selected item (a catalog → item detail), keep one `Dialog` and pass `onBack` only while the detail sub-view is open: the header then shows a Back control in place of the title (the title is preserved off-screen for assistive tech, so pass the detail's name as `title`). The consumer owns the list↔detail state; the Dialog owns the header swap. Do not put a Back button inside the body.

**Use when**

- You need a modal surface that traps focus, closes on Escape, and returns focus on close (e.g. an edit form, multi-field settings).
- The interaction has more than one action or arbitrary body content (form fields, footer with Cancel/Save).
- You want either uncontrolled open (via trigger) or externally driven open (open/onOpenChange).

**Avoid**

- It's a single yes/no decision (especially destructive). Use the purpose-built alert dialog. → use [`confirm-dialog`](#confirm-dialog)
- Content should anchor to a trigger and not block the page. Use a non-modal floating panel. → use [`popover`](#popover)
- You only need transient status feedback, not a blocking surface. Use a transient notification. → use [`toast`](#toast)

**Pairs with** [`button`](#button), [`field`](#field), [`input`](#input), [`confirm-dialog`](#confirm-dialog)

### Drawer

`/core/components/drawer` · stable

A floating, rounded right-side panel layered over a scrim. It has no close button — it dismisses on click-outside or Escape — with a built-in focus trap and focus return. `width` scales the panel (sm 380 · md 460 · lg 600); mobile reflows to a floating bottom sheet. A `className` seam lets a surface skin the panel.

**Use when**

- A focused secondary surface should open beside the current view without a full page change (a live agent session, a detail inspector, a long side flow).
- The body is tall or streaming and benefits from a side panel rather than a centered panel.
- You want uncontrolled open (via trigger) or externally driven open (open/onOpenChange).

**Avoid**

- A short, self-contained interaction that reads better centered on the page. Use the modal surface. → use [`dialog`](#dialog)
- A single yes/no decision (especially destructive). → use [`confirm-dialog`](#confirm-dialog)
- Content that should anchor to a trigger and not block the page. → use [`popover`](#popover)
- Read-only Markdown reference that should float above an interactive page. → use [`markdown-viewer`](#markdown-viewer)

**Pairs with** [`button`](#button), [`dialog`](#dialog)

### Markdown viewer

`/core/components/markdown-viewer` · beta

A floating non-modal reading window that renders Markdown on the window layer without a scrim: the page behind stays fully interactive. The header carries a built-in find-in-document search (Enter / Shift+Enter cycle through highlighted matches) and an expand toggle that grows the window to the full viewport; every consumer inherits both. Escape clears the search first, then closes the window; pointer interaction outside does not. `width` scales the panel (sm 380 · md 460 · lg 600); mobile collapses to a bottom sheet.

**Use when**

- Reference content should stay open beside the working surface — run evidence, skill instructions, docs — while the user keeps interacting with the page.
- The host owns the open state (open/onOpenChange) and opens the window from a row action, a help affordance, or a chat message.
- Long documents benefit from the built-in search and full-screen reading mode without any host wiring.

**Avoid**

- The surface must capture focus or block the page until dismissed. → use [`dialog`](#dialog) or [`drawer`](#drawer)
- Arbitrary non-Markdown body content in a side surface. → use [`drawer`](#drawer)
- Markdown inline in the page flow. → use [`markdown`](#markdown)

**Pairs with** [`markdown`](#markdown), [`button`](#button), [`icon-button`](#icon-button)

### Confirm dialog

`/core/components/confirm-dialog` · stable

An alert dialog for a single decision, with default and danger variants.

**Use when**

- A single decision needs explicit confirmation before proceeding (discard, publish, delete).
- The action is destructive — variant="danger" maps the confirm button to the danger tone.
- You want a focused alert dialog with confirm/cancel labels and an onConfirm callback rather than building footer logic yourself.

**Avoid**

- The surface carries a form or multiple distinct actions. Use the general modal. → use [`dialog`](#dialog)
- It's a lightweight per-row destructive action better placed in a dropdown. Use a menu item with tone="danger". → use [`menu`](#menu)

**Pairs with** [`button`](#button), [`dialog`](#dialog), [`toast`](#toast)

### Form dialog

`/core/components/form-dialog` · beta

The create/edit modal. It composes [`dialog`](#dialog) (focus trap, Escape-close, sizing, mobile bottom-sheet) and adds form semantics: a scrollable `<form>` body, a pinned Cancel/Submit footer, a `submitting` state, and an optional error-summary banner. The submit button sits in the footer and associates with the body form via the `form` attribute, so Enter and the button drive the same `onSubmit`.

**Use when**

- One surface both creates and edits a record — pass the title, initial values, and submitLabel; the same form serves both modes.
- The form has multiple fields, needs a submitting state, inline validation, or file upload (compose [`field`](#field) rows and a [`file-dropzone`](#file-dropzone) as children).
- You want a wider modal than the default — it defaults to `size="lg"`.

**Avoid**

- It's a single yes/no decision, not a form. → use [`confirm-dialog`](#confirm-dialog)
- The surface carries no form and just needs arbitrary modal content. → use [`dialog`](#dialog)

**Pairs with** [`dialog`](#dialog), [`field`](#field), [`file-dropzone`](#file-dropzone), [`info-banner`](#info-banner), [`button`](#button)

### Menu

`/core/components/menu` · stable

The canonical dropdown menu: sections, dividers, checks, shortcuts, and danger items.

**Use when**

- You need a dropdown of actions or options anchored to a trigger (row actions, overflow menu, account menu).
- Items need leading icons, trailing shortcuts/checks, danger tone, disabled state, or section labels and separators.
- You're building a checkable options list or a filter/user menu — those are instances of this primitive.

**Avoid**

- You need global, searchable command navigation. Use the ⌘K palette. → use [`command-palette`](#command-palette)
- The content is non-menu free-form panel content. Use an anchored floating panel. → use [`popover`](#popover)
- You're choosing one value inside a form. Use the form select control. → use [`select`](#select)

**Pairs with** [`button`](#button), [`icon-button`](#icon-button), [`kbd`](#kbd), [`entity-toolbar`](#entity-toolbar)

### Popover

`/core/components/popover` · stable

A non-modal floating panel anchored to a trigger on any of four sides.

**Use when**

- You need a non-modal floating panel anchored to a trigger that doesn't block the rest of the page.
- Content is arbitrary (rich help, a mini form, controls) and should dismiss on outside click.
- You want directional placement (top/bottom/left/right) with an optional arrow pointing back at the trigger.

**Avoid**

- The panel is a list of actions/options. Use the dropdown menu primitive. → use [`menu`](#menu)
- It's just a short text label on hover/focus. Use a tooltip. → use [`tooltip`](#tooltip)
- The interaction must block the page and trap focus. Use the modal. → use [`dialog`](#dialog)

**Pairs with** [`button`](#button), [`icon-button`](#icon-button), [`field`](#field), [`filter`](#filter)

### Tooltip

`/core/components/tooltip` · stable

A hover and focus label that points back at its trigger from any of four sides.

**Use when**

- You need a short text label revealed on hover or focus of a single child trigger.
- Clarifying an icon-only control or truncated/ambiguous label without taking a click.
- The label is non-interactive and brief; an arrow always points back at the trigger.

**Avoid**

- Content is interactive or longer than a label. Use an anchored panel. → use [`popover`](#popover)
- You're showing a keyboard shortcut hint inside a menu item or button. Use the Kbd glyph. → use [`kbd`](#kbd)

**Pairs with** [`icon-button`](#icon-button), [`button`](#button), [`badge`](#badge), [`kbd`](#kbd)

### Hint icon

`/core/components/hint-icon` · stable

An inline glyph that reveals a toned tooltip to flag and explain a constraint.

**Use when**

- You want a small icon beside a label or heading that explains a state on hover or focus.
- Flagging a constraint and its reason in one element — read-only, locked, deprecated.
- The `warn` tone should tint both the glyph and the tooltip to draw the eye.

**Avoid**

- The trigger is the primary action, not an explanation. Use a real control. → use [`icon-button`](#icon-button)
- The message is page-level or always visible. Use a banner. → use [`info-banner`](#info-banner)

**Pairs with** [`tooltip`](#tooltip), [`icon-button`](#icon-button), [`badge`](#badge)

### Command palette

`/core/components/command-palette` · stable

A ⌘K search dialog over grouped commands, with live filtering and an empty state.

**Use when**

- You want global ⌘K/Ctrl+K search over grouped commands and navigation targets.
- Users should fuzzy-filter across many actions (with icons, shortcuts, keywords) and pick by typing.
- Open state is controlled and the palette closes after a selection; needs a 'No matches' empty state.

**Avoid**

- It's a small, fixed action list anchored to one trigger. Use a dropdown menu. → use [`menu`](#menu)
- You're filtering and selecting a single field value in a form. Use the combobox. → use [`combobox`](#combobox)

**Pairs with** [`kbd`](#kbd), [`top-bar`](#top-bar), [`menu`](#menu), [`search`](#search)

## Navigation

### Sidebar

`/core/components/sidebar` · stable

The application rail in expanded, rail, and hidden collapse modes plus a drill-in variant, composing org, nav, user, and version slots. Nav items accept `children` for accessible multi-level nesting.

**Use when**

- You need the app's primary navigation rail composing org switcher, nav groups, user row, and version tag.
- Navigation must support a rail (64px icons-only), expanded (264px labeled), and hidden state from one component. The enclosing `ScreenShell` owns the collapse: its `collapseBehavior` (`expand-hide` | `expand-rail` | `cycle`) decides what the toggle and Cmd/Ctrl+B walk through, and the brand, search, org switcher, and user row inherit the rail form automatically.
- Navigation has hierarchy: give an item a `children` array and it renders an expandable tree (WAI-ARIA tree view) with roving-tabindex keyboard support; the active item's ancestors auto-expand and, in rail mode, children open in a Popover flyout.
- A settings/section drill-in needs the `drill-in` variant with a back affordance, title, and hint. It follows the same shell collapse (toggle and Cmd/Ctrl+B) as the primary rail.

**Avoid**

- Don't use it for the horizontal screen header; that's the top bar. → use [`top-bar`](#top-bar)
- Don't use it to switch between peer views within a screen; use tabs. → use [`tabs`](#tabs)
- Don't nest items more than ~2 levels deep inline; route deeper sections to the `drill-in` variant so the rail stays readable. → use the `drill-in` variant
- For just the org picker without the whole rail, use the org switcher directly. → use [`org-switcher`](#org-switcher)

**Pairs with** [`org-switcher`](#org-switcher), [`menu`](#menu), [`version-tag`](#version-tag), [`screen-shell`](#screen-shell), [`top-bar`](#top-bar)

**In patterns** List + table, List + grid, Settings form, Dashboard, Responsive

### Top bar

`/core/components/top-bar` · stable

The screen header: sidebar toggle and breadcrumb, optional center tabs, and actions.

**Use when**

- You need the screen header band with a left breadcrumb and right-aligned actions.
- The header must own the sidebar collapse toggle (renders only when onToggleSidebar is set).
- Every header slot is optional and you want one consistent header across screens.

**Avoid**

- Don't put per-entity identity and actions here; use the entity toolbar below the header. → use [`entity-toolbar`](#entity-toolbar)
- Don't use it for the vertical app rail; that's the sidebar. → use [`sidebar`](#sidebar)
- For global system/connection notices, use the system bar, not header actions. → use [`system-bar`](#system-bar)

**Pairs with** [`breadcrumb`](#breadcrumb), [`button`](#button), [`icon-button`](#icon-button), [`search`](#search), [`screen-shell`](#screen-shell)

**In patterns** List + table, List + grid, Dashboard, Responsive

### Entity toolbar

`/core/components/entity-toolbar` · stable

A per-entity header with tabs, identity, and actions that collapses when all slots are empty.

**Use when**

- You need a per-entity header band with an identity slot (e.g. a status badge) and an actions slot.
- The band should disappear entirely when both slots are empty (returns null), leaving no residual chrome.
- Entity-scoped actions (Edit, etc.) belong directly above the entity's content, distinct from the screen header.

**Avoid**

- Don't use it for the screen-level header with breadcrumb and global actions; use the top bar. → use [`top-bar`](#top-bar)
- Don't use it as a list/filter bar above tables; use list-filters-bar. → use [`list-filters-bar`](#list-filters-bar)

**Pairs with** [`badge`](#badge), [`button`](#button), [`breadcrumb`](#breadcrumb), [`tabs`](#tabs), [`card`](#card)

**In patterns** Detail

### Breadcrumb

`/core/components/breadcrumb` · stable

A slash-separated navigation trail with link, button, and current-page segments.

**Use when**

- You need a hierarchical location trail; the last item is auto-marked aria-current="page".
- Segments mix links (href) and button handlers (onClick) with slash separators.
- It sits in the top bar's left slot to show where the user is in the app hierarchy.

**Avoid**

- Don't use it to switch between peer views; that's lateral navigation, use tabs. → use [`tabs`](#tabs)
- Don't use it for ordered task progress through a flow; use the stepper. → use [`stepper`](#stepper)

**Pairs with** [`top-bar`](#top-bar), [`entity-toolbar`](#entity-toolbar)

### Tabs

`/core/components/tabs` · stable

Accessible tab triggers and real associated panels with optional count badges.
They support controlled or uncontrolled state, stable trigger/panel IDs, and
preserve inactive panel state unless lazy mounting is requested explicitly.

**Use when**

- You need peer panels in the same document with complete tab/tabpanel relationships.
- State may be controlled or initialized with `defaultValue`.
- A trigger benefits from a trailing count badge (e.g. "Open 12").
- Many tabs may overflow the rail and you want the built-in horizontal scroll behavior.
- You want a vertical sidebar rail (`orientation="vertical"`) for section navigation, with a left accent bar on the active item.

**Avoid**

- Don't use it for a small set of mutually exclusive options inside a form; use a segmented control. → use [`segmented-control`](#segmented-control)
- Don't use it for hierarchical location; that's the breadcrumb. → use [`breadcrumb`](#breadcrumb)
- Don't use it for sequential wizard progress; use the stepper. → use [`stepper`](#stepper)
- Don't use it for URL navigation. → use [`tab-navigation`](#tab-navigation)

**Pairs with** [`badge`](#badge), [`entity-toolbar`](#entity-toolbar), [`content-layout`](#content-layout), [`page-section`](#page-section)

**In patterns** Detail

### Tab navigation

`/core/components/tab-navigation` · beta

Use `TabNavigation` when each peer destination has a real URL. It renders a
semantic `nav` of links, marks the current page with `aria-current`, and scrolls
horizontally on narrow screens. It never renders panels and must not replace
[`tabs`](#tabs), whose triggers control content in the current document.

### Stepper

`/core/components/stepper` · stable

A horizontal progress indicator with completed, active, and upcoming steps.

**Use when**

- You need a horizontal progress indicator for an ordered multi-step flow (wizard/onboarding).
- Each step carries a status (completed/active/upcoming) that drives connector and dot styling; completed steps show a check.
- Users need to see how far they are through a fixed sequence.

**Avoid**

- Don't use it to switch freely between peer views; use tabs. → use [`tabs`](#tabs)
- Don't use it for indeterminate or single-value loading progress; use the progress bar. → use [`progress-bar`](#progress-bar)

**Pairs with** [`dialog`](#dialog), [`button`](#button), [`field`](#field), [`page-section`](#page-section)

### Org switcher

`/core/components/org-switcher` · stable

A menu-backed organization picker in expanded and rail variants.

**Use when**

- You need a menu-backed picker to switch the active organization (orgs list + currentOrgId + onSelectOrg).
- It lives in the sidebar top slot: expanded shows org name and chevron, rail shows only the mark.
- You want a footer slot (e.g. "Manage organizations") below the org list.

**Avoid**

- Don't use it as a generic dropdown for arbitrary form values; use a select. → use [`select`](#select)
- Don't use it for general action/overflow menus; use a menu. → use [`menu`](#menu)

**Pairs with** [`sidebar`](#sidebar), [`menu`](#menu), [`avatar`](#avatar), [`badge`](#badge)

### Pagination

`/core/components/pagination` · stable

Page navigation in numbered-pages and load-more variants.

**Use when**

- You need page navigation over a known total: numbered pages with ellipses, a range readout, and a page-size select.
- Use the load-more variant when an infinite/append stream needs a single "Load more" button instead of page numbers.
- The page-size select should appear only when onPageSizeChange is provided.

**Avoid**

- Don't use it to switch between peer views; that's tabs. → use [`tabs`](#tabs)
- Don't use it for ordered flow progress; use the stepper. → use [`stepper`](#stepper)

**Pairs with** [`data-table`](#data-table), [`select`](#select), [`button`](#button), [`list-shell`](#list-shell)

### Dock panel

`/core/components/dock-panel` · stable

The right-docked workspace panel — a tabbed header with maximize/hide controls over the active tab's body. It fills a `ScreenShell`'s `rightPanel`, and its mode, active tab, and split width live in that shell, so the panel and the content area resize as one app shell.

**Use when**

- You need a right-docked workspace region beside the main content (a preview / code / files inspector, an output pane) that resizes with the page as one app shell.
- The panel's tabs, maximize/hide, and split should be driven by an enclosing [`screen-shell`](#screen-shell) through its `rightPanel` and `defaultDockMode`.

**Avoid**

- You only need to switch between peer views inside the content, with no docked shell region. → use [`tabs`](#tabs)
- There is no enclosing `ScreenShell`; the panel reads its state from the shell context and is inert standalone. → use [`screen-shell`](#screen-shell)

**Pairs with** [`screen-shell`](#screen-shell), [`tabs`](#tabs), [`icon-button`](#icon-button)

## Visualizations

### Area chart

`/core/components/area-chart` · beta

Use an `AreaChart` to show one or more time series when the filled area helps
communicate magnitude. Choose normal or stacked layout explicitly; use a
[`line-chart`](#line-chart) when overlap makes the filled regions ambiguous.

### Bar chart

`/core/components/bar-chart` · beta

Use a `BarChart` to compare discrete categories, with grouped or stacked bars
and an explicit vertical or horizontal orientation. Use a
[`bar-list`](#bar-list) for a compact ranked list with readable values.

### Combo chart

`/core/components/combo-chart` · beta

Use a `ComboChart` only when bars and lines share a meaningful index and their
different encodings clarify the comparison. Declare each series and its axis;
avoid combining unrelated metrics merely to save space.

### Bar list

`/core/components/bar-list` · beta

Use a `BarList` for ranked category values that must remain easy to scan and
read. Rows may be static, links, or actions. Use a [`bar-chart`](#bar-chart)
when axes, grouped series, or stacking carry important meaning.

### Category bar

`/core/components/category-bar` · beta

Use a `CategoryBar` for one part-to-whole distribution in a compact surface.
Its labels and segment patterns preserve meaning beyond color. Use a
[`donut-chart`](#donut-chart) when the distribution needs a focal total.

### Donut chart

`/core/components/donut-chart` · beta

Use a `DonutChart` for a small labelled part-to-whole dataset and optional
center value. Avoid it for many similar slices; use a
[`bar-chart`](#bar-chart) when precise comparison matters more than the total.

### Line chart

`/core/components/line-chart` · beta

Use a `LineChart` for one or more ordered trends. Give it an accessible name,
declare every series, and provide stable deterministic data. Use a
[`spark-chart`](#spark-chart) when the chart must fit a dense metric card.

### Progress circle

`/core/components/progress-circle` · beta

Use a `ProgressCircle` for compact determinate or indeterminate task progress.
Always supply an accessible name. Use [`progress-bar`](#progress-bar) when a
linear indicator makes the remaining distance easier to understand.

### Spark chart

`/core/components/spark-chart` · beta

Use a `SparkChart` for a compact interactive line, area, or bar trend with an
optional tooltip. Use [`sparkline`](#sparkline) for a lighter non-interactive
trend where the surrounding text already communicates the value.

### Tracker

`/core/components/tracker` · beta

Use a `Tracker` for an ordered sequence of complete, active, pending, or error
states. Each item keeps visible or assistive text so status never depends on
color alone. Use a [`stepper`](#stepper) for user-controlled navigation.

## Data display

### Card

`/core/components/card` · stable

Surface container with optional title, body, and footer slots that collapse when absent.

**Use when**

- You need a bordered surface to group related content with optional title, body, and footer slots that each collapse when absent.
- You want a footer for one or two actions or a metadata line (e.g. 'Updated 2 days ago').
- You need a raised treatment to lift a surface off the page (set elevated).

**Avoid**

- Don't use for a single metric with label/value/delta. → use [`stat-card`](#stat-card)
- Don't use as the outer padding/rhythm wrapper for a whole list or grid. → use [`list-shell`](#list-shell)
- Don't use to demarcate a titled region of a page layout. → use [`page-section`](#page-section)

**Pairs with** [`button`](#button), [`badge`](#badge), [`list-shell`](#list-shell), [`section-grid`](#section-grid), [`stat-card`](#stat-card)

**In patterns** List + grid, Detail, Dashboard, Responsive

### Settings row

`/core/components/settings-row` · stable

A labelled settings row: title and optional description on the left, a value or control on the right. Stack inside a Card.

**Use when**

- Listing account or preferences entries as a label (+ optional description) on the left and a value or control on the right (Avatar, VersionTag, Badge, or an InlineEdit).
- Composing a settings or About panel: stack several inside a Card, grouped under a PageSection.

**Avoid**

- Don't use for a labeled, validated form control; that is the canonical form row. → use [`field`](#field)
- Don't use for dense headline metrics. → use [`stat-card`](#stat-card)

**Pairs with** [`card`](#card), [`page-section`](#page-section), [`inline-edit`](#inline-edit), [`avatar`](#avatar)

### Description list

`/core/components/description-list` · stable

Label/value detail rows with first-line baseline alignment that inline controls cannot break. For detail panels and dialogs.

**Use when**

- Presenting the read-only facts of one entity (URL, auth mode, scopes, dates) as label/value rows inside a detail dialog, drawer, or panel.
- A value mixes text with trailing inline elements (a copy IconButton, badges, a link) and the label must stay on the value's first text line.

**Avoid**

- Don't use for editable settings entries with a trailing control. → use [`settings-row`](#settings-row)
- Don't use for a labeled, validated form control. → use [`field`](#field)
- Don't use for many records of the same shape. → use [`data-table`](#data-table)

**Pairs with** [`dialog`](#dialog), [`drawer`](#drawer), [`badge`](#badge), [`icon-button`](#icon-button), [`relative-time`](#relative-time)

### Data table

`/core/components/data-table` · stable

Prop-driven table owning tri-state sort, selection, bulk + per-row actions, row click, column visibility, density, loading, and numbered pagination. Sort, selection, pagination, column visibility and density each default to internal state and switch to controlled when the matching prop is supplied — so the same table serves an in-memory list or a server-paged/sorted dataset.

**Use when**

- You have a homogeneous row dataset and need built-in tri-state column sort, pagination, and stable row keys.
- You need row selection with bulk actions (set selectable + bulkActions) and/or per-row actions (rowActions kebab) and clickable rows (onRowClick — the select/actions cells are excluded).
- The data is large or server-owned: drive sort/page with sort/onSortChange and page/onPageChange/totalCount, and clear selection via selectedKeys/onSelectionChange after a bulk action.
- You want column visibility (mark columns hideable), a density toggle, a loading skeleton, and the filtered-empty surface (no-results EmptyState via onClearFilters) handled for you.

**Avoid**

- Don't use for non-tabular or heterogeneous cards/items; wrap your own list in a layout shell. → use [`list-shell`](#list-shell)
- Don't use to render a tree of structured JSON. → use [`json-viewer`](#json-viewer)

**Pairs with** [`list-filters-bar`](#list-filters-bar), [`filter-chip`](#filter-chip), [`pagination`](#pagination), [`empty-state`](#empty-state), [`button`](#button)

**In patterns** List + table, Responsive

### Stat card

`/core/components/stat-card` · stable

A single metric tile: muted label, display-sized value, and an optional signed delta.

**Use when**

- You need a single metric tile: muted label, display-sized value, and an optional signed delta.
- You want the up/down/flat delta direction reflected automatically (it writes data-direction).

**Avoid**

- Don't hand-place several side by side; the strip handles the divided row and reflow. → use [`stats-strip`](#stats-strip)
- Don't use to show a trend over a series; a metric tile holds one value. → use [`sparkline`](#sparkline)

**Pairs with** [`stats-strip`](#stats-strip), [`sparkline`](#sparkline), [`card`](#card), [`badge`](#badge)

### Stats strip

`/core/components/stats-strip` · stable

Edge-to-edge horizontal row of stat cards separated by thin border dividers.

**Use when**

- You want an edge-to-edge row of several StatCards separated by thin dividers, reflowing as the row narrows.
- You have a fixed ordered set of headline metrics to show together (pass stats as StatCardProps[]).

**Avoid**

- Don't use for one metric; render the single tile directly. → use [`stat-card`](#stat-card)
- Don't use for a responsive grid of arbitrary cards. → use [`section-grid`](#section-grid)

**Pairs with** [`stat-card`](#stat-card), [`sparkline`](#sparkline), [`page-section`](#page-section), [`content-layout`](#content-layout)

**In patterns** Detail, Dashboard

### Code block

`/core/components/code-block` · stable

Monospace value with a copy control; command, token, and inline variants write data-variant.

**Use when**

- You need to show one monospace value (a command or token) with a built-in copy-to-clipboard control that swaps copy→check.
- You want the command vs token visual treatment (writes data-variant) with an optional caption label.
- You want a chrome-less copy affordance for an id in a definition-list or table row that keeps its natural height (inline variant).

**Avoid**

- Don't use for structured/nested data you want to fold and inspect. → use [`json-viewer`](#json-viewer)
- Don't use for multi-line source code that needs syntax highlighting. → use [`syntax-code-block`](#syntax-code-block)
  **Pairs with** [`card`](#card), [`field`](#field), [`tooltip`](#tooltip), [`info-banner`](#info-banner)

### Syntax code block

`/core/components/syntax-code-block` · beta

Copyable multi-line code snippet with lazy dual-theme syntax highlighting and optional wrapping.

**Use when**

- You need to show a multi-line command, source file excerpt, config, SQL, JSON, or Markdown sample with language-aware colors.
- You want the copy control built into the top-right corner without wiring clipboard behavior in the host.
- You need long lines to wrap in constrained surfaces such as dialogs (`wrap`).

**Avoid**

- A single command, token, or ID where the value should read like a compact field. → use [`code-block`](#code-block)
- Arbitrary structured JSON that should collapse by node. → use [`json-viewer`](#json-viewer)
- Full Markdown documents with prose and fenced code. → use [`markdown`](#markdown)

**Pairs with** [`markdown`](#markdown), [`dialog`](#dialog), [`drawer`](#drawer), [`card`](#card)

### JSON viewer

`/core/components/json-viewer` · stable

Monospace JSON tree with per-node collapse and key/string/number/punctuation tones.

**Use when**

- You need to render an arbitrary value as a collapsible monospace tree with per-node carets.
- You want keys, strings, numbers, and punctuation in distinct tones for readability.
- You want to control the initial open/closed state of every node (defaultExpanded).

**Avoid**

- Don't use for a single flat command or token string with copy. → use [`code-block`](#code-block)
- Don't use for a flat row dataset that needs sort/paginate/select. → use [`data-table`](#data-table)
- Don't use for editing JSON source text. → use [`json-code-editor`](#json-code-editor)

**Pairs with** [`card`](#card), [`code-block`](#code-block), [`tabs`](#tabs), [`dialog`](#dialog)

### Markdown

`/core/components/markdown` · beta

Read-only GitHub Flavored Markdown renderer: headings, paragraphs, lists, links, tables, inline code, and fenced code with a language chip, a copy control, and dual-theme syntax highlighting (lazy-loaded per language). Raw HTML in the source is never rendered.

**Use when**

- Rendering trusted, finalized Markdown from storage — agent output, skill instructions, runbooks, release notes.
- Fenced code blocks should be highlighted and copyable without the host wiring anything.

**Avoid**

- Editing Markdown source. → use [`markdown-editor`](#markdown-editor)
- A single flat command or token string with copy. → use [`code-block`](#code-block)
- A standalone code snippet outside Markdown prose. → use [`syntax-code-block`](#syntax-code-block)
- A floating reading window above an interactive page. → use [`markdown-viewer`](#markdown-viewer)

**Pairs with** [`syntax-code-block`](#syntax-code-block), [`markdown-viewer`](#markdown-viewer), [`markdown-editor`](#markdown-editor), [`card`](#card), [`drawer`](#drawer)

### Sparkline

`/core/components/sparkline` · stable

Compact inline bar chart: thin accent bars scaled to the series maximum.

**Use when**

- You need a compact inline bar chart of a numeric series scaled to its maximum, with a baseline tick so zero still reads.
- You want a tiny trend glyph beside a metric or inside a dense row (role defaults to 'img').

**Avoid**

- Don't use to show a single current value; show the number itself. → use [`stat-card`](#stat-card)
- Don't use for determinate loading/usage progress against a fixed total. → use [`progress-bar`](#progress-bar)

**Pairs with** [`stat-card`](#stat-card), [`stats-strip`](#stats-strip), [`card`](#card), [`data-table`](#data-table)

**In patterns** Dashboard

### Relative time

`/core/components/relative-time` · stable

Renders an absolute timestamp as a muted relative label, anchored by the now prop.

**Use when**

- You need to render an absolute timestamp as a muted relative label like '2h ago'.
- You want deterministic output for tests or SSR by anchoring the comparison with the now prop (dateTime is set automatically on the time element).

**Avoid**

- Don't use for a fixed status word or count badge; it is a formatted timestamp, not a label. → use [`badge`](#badge)

**Pairs with** [`data-table`](#data-table), [`card`](#card), [`list-shell`](#list-shell), [`avatar`](#avatar)

**In patterns** List + grid, List + split

### List shell

`/core/components/list-shell` · stable

Outer content section giving every list or grid the same padding and vertical rhythm.

**Use when**

- You need the outer content section that gives every list or grid the same padding and vertical rhythm.
- You are composing a list/grid page and want a thin layout wrapper around the rows or cards.

**Avoid**

- Don't use as a top-level page/screen scaffold with header regions. → use [`screen-shell`](#screen-shell)
- Don't use for a titled, labeled region; that is a page section. → use [`page-section`](#page-section)
- Don't use as the responsive grid itself; it only wraps. → use [`section-grid`](#section-grid)

**Pairs with** [`list-filters-bar`](#list-filters-bar), [`card`](#card), [`data-table`](#data-table), [`empty-state`](#empty-state), [`pagination`](#pagination)

**In patterns** List + table, List + grid, Dashboard, Responsive

### List filters bar

`/core/components/list-filters-bar` · stable

Layout-only filter row: a pills slot, a per-view search input, and a trailing slot.

**Use when**

- You need a filter row that lays out a leading pills slot, a controlled per-view search input, and an optional trailing slot (e.g. a New button).
- You own the search and filter state yourself and just want the layout (the bar owns no filter state).

**Avoid**

- Don't use a layout-only bar for a standalone search box; use the search field directly. → use [`search`](#search)
- Don't render the applied-filter pills here; that is the active-filters row. → use [`filter-chip`](#filter-chip)

**Pairs with** [`filter`](#filter), [`search`](#search), [`filter-chip`](#filter-chip), [`button`](#button), [`list-shell`](#list-shell)

**In patterns** List + table, List + grid, Responsive

### Filter

`/core/components/filter` · stable

One type-driven column filter sharing a FilterPill trigger, active when a value is applied. `type` (default `enum`) selects the body: `enum` is a checkable Menu (single/multi); `text`, `number-range`, `date-range` and `boolean` open a Popover with the matching inputs.

**Use when**

- You filter a collection by one column and want the trigger + applied-value summary handled for you.
- The value is an enum (single/multi), a text contains, a numeric or date range, or a boolean — pick the matching `type`.
- You drive the value externally; every variant is controlled via its `value`/`onChange` (or `selected`/`onSelect` for enum).

**Avoid**

- Don't use for a single bare value picker in a form; use the select field. → use [`select`](#select)
- Don't use as the bare trigger pill outside filter semantics. → use [`filter-pill`](#filter-pill)
- Don't use for a large searchable option set. → use [`combobox`](#combobox)

**Pairs with** [`list-filters-bar`](#list-filters-bar), [`filter-pill`](#filter-pill), [`filter-chip`](#filter-chip), [`menu`](#menu), [`button`](#button)

**In patterns** List + table, List + grid, Responsive

### Filter chip

`/core/components/filter-chip` · stable

Applied-filter pill with a remove control; ActiveFiltersRow wraps a set with Clear all.

**Use when**

- You need an applied-filter pill in accent-soft tone with a trailing remove control (onRemove).
- You need to show all currently applied filters together with a 'Clear all' affordance — use ActiveFiltersRow with onClearAll.

**Avoid**

- Don't use for a non-removable display label or count. → use [`badge`](#badge)
- Don't use for free-form categorization tags. → use [`tag`](#tag)
- Don't use as the dropdown trigger that opens the filter menu. → use [`filter`](#filter)

**Pairs with** [`filter`](#filter), [`list-filters-bar`](#list-filters-bar), [`data-table`](#data-table), [`button`](#button)

### Empty state

`/core/components/empty-state` · stable

Centered placeholder; first-run invites a first action, no-results is the filtered surface.

**Use when**

- You need a centered placeholder inviting a first action when a collection is empty (intent='first-run' with a custom action).
- You need the shared filtered-empty surface (intent='no-results'); the action is opt-in — pass onClearFilters for the default Clear filters button.
- You want to override the default glyph or copy (icon, title, description).
- You want a boxed empty state: wrap it in [`card`](#card) — EmptyState itself stays chrome-less so embedding never nests a border.

**Avoid**

- Don't use for a transient dismissible status message. → use [`info-banner`](#info-banner)
- Don't hand-roll the table no-results state; DataTable already renders this surface. → use [`data-table`](#data-table)

**Pairs with** [`button`](#button), [`list-shell`](#list-shell), [`data-table`](#data-table), [`card`](#card)

**In patterns** States

### Recent chips

`/core/components/recent-chips` · stable

A leading label followed by a row of muted Tag chips for recent items.

**Use when**

- You need a leading label followed by a row of muted Tag chips for recent items.
- You want the chips to be clickable and report the picked id (set onSelect); omit it for a read-only recents row.

**Avoid**

- Don't use for applied filters with remove controls. → use [`filter-chip`](#filter-chip)
- Don't use for picking among saved view presets. → use [`preset-selector`](#preset-selector)
- Don't use as a searchable global jump-to surface. → use [`command-palette`](#command-palette)

**Pairs with** [`tag`](#tag), [`search`](#search), [`list-filters-bar`](#list-filters-bar), [`empty-state`](#empty-state)

### Preset selector

`/core/components/preset-selector` · stable

Compact segmented control for picking a saved preset, plus an optional manage affordance.

**Use when**

- You need a compact segmented control to pick among saved presets / saved views (controlled via value + onSelect; active segment writes data-active).
- You want an optional trailing manage affordance for editing presets (set onManage).

**Avoid**

- Don't use for a generic two-or-three-way mode toggle unrelated to saved presets. → use [`segmented-control`](#segmented-control)
- Don't use for multi-select filtering by value. → use [`filter`](#filter)
- Don't use for a row of clickable recent items. → use [`recent-chips`](#recent-chips)

**Pairs with** [`list-filters-bar`](#list-filters-bar), [`segmented-control`](#segmented-control), [`filter`](#filter), [`button`](#button)

## Feedback

### Toast

`/core/components/toast` · stable

Presentational status row; tone drives the icon and accent.

**Use when**

- Render a single presentational status row (tone + title + optional detail) — success/info/warn/danger.
- You need the canonical toast surface to compose a custom notification layout, not the live ephemeral stack.
- Show an optional dismiss icon by passing onDismiss; show only a title for the minimal form.

**Avoid**

- Don't use Toast directly to fire transient app notifications; it owns no queue, auto-dismiss, or viewport — mount toaster once and fire via notify(). → use [`toaster`](#toaster)
- Don't use a floating toast for a persistent in-content tone message that should stay until the condition clears; use info-banner. → use [`info-banner`](#info-banner)

**Pairs with** [`toaster`](#toaster), [`icon-button`](#icon-button)

### Toaster

`/core/components/toaster` · stable

The mounted toast stack region that owns the viewport, queue, and auto-dismiss.

**Use when**

- Mount once at the app root to own the toast viewport, queue, auto-dismiss, and swipe-to-dismiss.
- Fire ephemeral notifications from anywhere via notify(tone, title, { detail, duration }); dismiss via dismissToasts(id?).
- Anchor the stack to a corner with position: top-right, bottom-right, or top-center.

**Avoid**

- Don't render Toaster per-screen or multiple times; it's a single app-root region. For a standalone status row, use toast. → use [`toast`](#toast)
- Don't use transient toasts for a page-wide system condition (outage, new version) that needs a persistent action; use system-bar. → use [`system-bar`](#system-bar)

**Pairs with** [`toast`](#toast), [`button`](#button)

### Info banner

`/core/components/info-banner` · stable

An in-content callout with optional title, system or custom icon, body, actions,
dismissal, and urgency semantics independent of its visual tone.

**Use when**

- Place a persistent tinted notice inside content flow with a tone left border (info/warn/danger/success).
- Explain context or surface a non-blocking condition that stays visible until resolved (quota near limit, last upload failed).
- Annotate a section, form, or panel with inline status next to the content it describes.
- Use `density="compact"` for short row-level status details such as tool-call errors.
- Keep a service/load error visible while the page scrolls: render it as the last content element with `floating`, which sticks it to the bottom edge of the scrolling region.
- Add a title and actions for a complete callout, declare `dismissible` only when the notice may be removed, and choose urgency from behavior rather than color.

**Avoid**

- Don't use info-banner for a full-width page-level notice above the top bar with an action/dismiss; use system-bar. → use [`system-bar`](#system-bar)
- Don't use a persistent banner for a transient confirmation that should auto-dismiss; fire a toast via toaster. → use [`toaster`](#toaster)
- Don't use info-banner for an empty/error state that replaces the whole content region; use empty-state. → use [`empty-state`](#empty-state)

**Pairs with** [`button`](#button), [`page-section`](#page-section)

**In patterns** States

### System bar

`/core/components/system-bar` · stable

Full-width page-level notice above the top bar, with optional action and dismiss.

**Use when**

- Show a full-width, page-level notice that sits above the top bar (new version available, scheduled maintenance, connection lost).
- Carry a trailing action (normally a Button) and/or a dismiss control alongside the message.
- Communicate app-wide status with info, warn, or danger tone.

**Avoid**

- Don't use system-bar for an inline tone message scoped to one section; use info-banner. → use [`info-banner`](#info-banner)
- Don't use system-bar for transient, auto-dismissing notifications; fire toasts via toaster. → use [`toaster`](#toaster)

**Pairs with** [`button`](#button), [`top-bar`](#top-bar)

### Skeleton

`/core/components/skeleton` · stable

Loading placeholders — base shapes, text, card, and table rows — static under reduced motion.

**Use when**

- Show shape-accurate loading placeholders that preserve layout (line/circle/rect) while data loads.
- Use the composed forms for common regions: SkeletonText (lines), SkeletonCard, SkeletonTableRows.
- Block first paint of a known content shape where the final size is predictable; shimmer goes static under reduced motion.

**Avoid**

- Don't use skeleton for indeterminate spot loading inside a button or small control; use spinner. → use [`spinner`](#spinner)
- Don't use skeleton to convey measurable progress of a task; use progress-bar. → use [`progress-bar`](#progress-bar)

**Pairs with** [`card`](#card), [`data-table`](#data-table), [`list-shell`](#list-shell), [`stat-card`](#stat-card)

**In patterns** States

### Spinner

`/core/components/spinner` · stable

Indeterminate circular spinner in three sizes; static under reduced motion.

**Use when**

- Indicate indeterminate, short loading with no known duration (button busy state, inline fetch, small region).
- Pick sm/md/lg to match the surrounding control or container size.
- Need an accessible role=status indicator with an aria-label (defaults to 'Loading').

**Avoid**

- Don't use a spinner for a known content shape that should hold its layout; use skeleton. → use [`skeleton`](#skeleton)
- Don't use a spinner when you can show a percentage or determinate fill; use progress-bar. → use [`progress-bar`](#progress-bar)

**Pairs with** [`button`](#button), [`icon-button`](#icon-button), [`empty-state`](#empty-state)

### Progress bar

`/core/components/progress-bar` · stable

Linear progress with determinate, indeterminate, and route loops.

**Use when**

- Show linear progress of a task: determinate with value (0–100) and optional showLabel percent.
- Use the indeterminate variant for ongoing work without a known percentage.
- Use the route variant for top-of-page navigation/route-change loading.

**Avoid**

- Don't use progress-bar for a small inline indeterminate busy state; use spinner. → use [`spinner`](#spinner)
- Don't use progress-bar to placeholder unloaded content layout; use skeleton. → use [`skeleton`](#skeleton)

**Pairs with** [`card`](#card), [`stat-card`](#stat-card), [`top-bar`](#top-bar)

## Layout

### Screen shell

`/core/components/screen-shell` · stable

The app frame: a fixed sidebar beside a main column with an optional top bar over scrolling content.

**Use when**

- Building the top-level app frame: fixed-width sidebar rail beside a main column that fills 100vh.
- You need an optional top bar pinned above a content region where only the content scrolls.
- Establishing the outermost layout wrapper of a product screen, one per screen.

**Avoid**

- Don't use for the navigation rail itself — ScreenShell only hosts it in the sidebar slot. → use [`sidebar`](#sidebar)
- Don't use for the bar pinned above content — pass that into the topBar slot. → use [`top-bar`](#top-bar)
- Don't use to cap reading width inside the content region; ScreenShell only frames the viewport. → use [`content-layout`](#content-layout)

**Pairs with** [`sidebar`](#sidebar), [`top-bar`](#top-bar), [`content-layout`](#content-layout), [`version-tag`](#version-tag)

### Content layout

`/core/components/content-layout` · stable

The reading-width column, capped at var(--content-max) with page padding; bleed spans full width.

**Use when**

- Capping a page's reading width at var(--content-max) and centering it with page padding.
- Wrapping the scrolling content region of a screen so children sit in a consistent column.
- You need an occasional full-width band: set bleed to drop the cap and padding for that section.

**Avoid**

- Don't use to frame the whole viewport with sidebar and top bar; that's the outer shell. → use [`screen-shell`](#screen-shell)
- Don't use to add a section title/header around a block; it only controls width and padding. → use [`page-section`](#page-section)
- Don't use for an in-page main/aside split. → use [`two-column`](#two-column)

**Pairs with** [`screen-shell`](#screen-shell), [`page-section`](#page-section), [`two-column`](#two-column), [`section-grid`](#section-grid)

### Page section

`/core/components/page-section` · stable

A titled region with an optional title, caption, and actions header above its body.

**Use when**

- Grouping a region of a page under a title with optional caption and trailing actions.
- You need a header that pairs a heading with end-aligned controls (e.g. an Invite button).
- Stacking several titled blocks down a page; the header collapses entirely when no title/caption/actions are set.

**Avoid**

- Don't use for the boxed content surface itself; PageSection wraps a body, it isn't a card. → use [`card`](#card)
- Don't use just to constrain reading width with no header. → use [`content-layout`](#content-layout)
- Don't use for a list/table region with its own toolbar and filters. → use [`list-shell`](#list-shell)

**Pairs with** [`card`](#card), [`section-grid`](#section-grid), [`two-column`](#two-column), [`button`](#button), [`content-layout`](#content-layout)

### Section grid

`/core/components/section-grid` · stable

An auto-fitting card grid that reflows 4 → 3 → 2 → 1 against its own container width.

**Use when**

- Laying out a set of cards (or similar cells) that should auto-fit and reflow 4 → 3 → 2 → 1.
- You want reflow driven by the grid's own width (container query), so it adapts inside any column or aside.
- Rendering a uniform collection of Card cells with a 280px minimum track each.

**Avoid**

- Don't use for a fixed main/aside 2:1 split; this is an equal-track auto-fit grid. → use [`two-column`](#two-column)
- Don't use for a row of KPI numbers; use the dedicated stats strip. → use [`stats-strip`](#stats-strip)
- Don't use for tabular rows and columns of data. → use [`data-table`](#data-table)

**Pairs with** [`card`](#card), [`stat-card`](#stat-card), [`page-section`](#page-section), [`content-layout`](#content-layout)

**In patterns** List + grid, Dashboard, Responsive

### Two column

`/core/components/two-column` · stable

A main-and-aside split that sits side by side at lg and up, then stacks below.

**Use when**

- Splitting a page into a primary main column and a secondary aside at a fixed 2:1 ratio.
- You want the aside beside main from the lg breakpoint up and stacked last below it.
- Detail screens with supporting context (metadata, related items) in the aside slot.

**Avoid**

- Don't use for a uniform auto-fitting card collection with equal tracks. → use [`section-grid`](#section-grid)
- Don't use to wrap the whole screen with rail and top bar. → use [`screen-shell`](#screen-shell)
- Don't use just to cap and center a single content column. → use [`content-layout`](#content-layout)

**Pairs with** [`card`](#card), [`page-section`](#page-section), [`content-layout`](#content-layout), [`section-grid`](#section-grid)

### Settings shell

`/core/components/settings-shell` · stable

A master-detail surface for settings and configuration: a grouped, searchable section nav beside an independently scrolling detail pane. Section selection, search, and optional full nav collapse are controllable, the nav is a keyboard-navigable vertical tab list, and the whole surface presents inline or as a focus-trapped modal. The caller owns the detail body, so a section can host any mix of controls.

**Use when**

- Configuring a complex entity with many sub-sections grouped under headers (preferences, account, workspace, integrations).
- You need an independently scrolling rail and detail pane, with optional sticky detail header/footer for entity identity and Cancel/Save.
- The section list is long enough to warrant search-to-filter, and you want one consistent shell whether it renders in a page or a modal.
- You want an opt-in full navigation collapse for dense modal or split-pane settings surfaces; enable `collapsibleNav` and optionally control it with `navCollapsed`.

**Avoid**

- Don't use for a single flat form with no sub-sections. → use [`field`](#field) inside a [`page-section`](#page-section)
- Don't use to frame a whole authenticated app with rail and top bar. → use [`screen-shell`](#screen-shell)
- Don't render the row controls from inside it; compose them as the detail body. → use [`settings-row`](#settings-row)

**Pairs with** [`settings-row`](#settings-row), [`toggle`](#toggle), [`field`](#field), [`page-section`](#page-section), [`dialog`](#dialog), [`button`](#button)

### Sign-in screen

`/core/components/sign-in-screen` · stable

The centered single-card auth screen: a full-viewport surface holding one elevated card with an optional app mark/name identity, a title/subtitle header, and a full-width form the caller fills.

**Use when**

- Building a sign-in, sign-up, or single-action auth page centered on the viewport.
- You want one elevated card with an app mark/name identity, a Welcome-style header, and a stacked form.
- The submit action should span the card's full width and the caller owns the fields and submit handler.

**Avoid**

- Don't use for an authenticated app page with sidebar and top bar. → use [`screen-shell`](#screen-shell)
- Don't use just to cap and center an in-page reading column. → use [`content-layout`](#content-layout)
- Don't put the field wiring inside it; pass `field`/`input`/`info-banner`/`button` as children. → use [`field`](#field)

**Pairs with** [`card`](#card), [`field`](#field), [`input`](#input), [`info-banner`](#info-banner), [`button`](#button)

### Separator

`/core/components/separator` · beta

Use `Separator` to draw an explicit horizontal or vertical division without
adding layout. It is decorative by default; set `decorative={false}` only when
the division carries document structure and should expose `role="separator"`.

### Version tag

`/core/components/version-tag` · stable

The sidebar footer build marker: a version string with an optional env badge, or a collapsed dot.

**Use when**

- Marking the build in the sidebar footer with a version string and optional environment badge.
- You need a rail-collapsed form: set collapsed to reduce it to a single status dot.
- Surfacing the current env (local/staging/...) as a dim badge beside the version.

**Avoid**

- Don't use as a general-purpose status or count label; it is a build marker for the rail footer. → use [`badge`](#badge)
- Don't use for a removable, keyword-style chip. → use [`tag`](#tag)
- Don't use for an app-wide environment/status banner across the top. → use [`system-bar`](#system-bar)

**Pairs with** [`sidebar`](#sidebar), [`screen-shell`](#screen-shell), [`badge`](#badge)

**In patterns** Settings form
