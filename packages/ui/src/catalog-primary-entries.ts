import type { ComponentCatalogEntry } from './catalog-types.js';

export const primaryComponentCatalogEntries: readonly ComponentCatalogEntry[] = [
  // Primitives
  {
    slug: 'button',
    title: 'Button',
    group: 'Primitives',
    status: 'stable',
    intent: 'A clickable action with six variants mapped to data-variant.',
  },
  {
    slug: 'icon-button',
    title: 'Icon button',
    group: 'Primitives',
    status: 'stable',
    intent: 'A square, icon-only action requiring an aria-label; four variants.',
  },
  {
    slug: 'scroll-to-bottom-button',
    title: 'Scroll to bottom button',
    group: 'Primitives',
    status: 'stable',
    intent:
      'A compact floating chevron action that appears when a scrollport moves away from its newest content and restores the bottom-pinned view.',
  },
  {
    slug: 'input',
    title: 'Input',
    group: 'Primitives',
    status: 'stable',
    intent: 'A single-line text field with an invalid state for inline errors.',
  },
  {
    slug: 'textarea',
    title: 'Textarea',
    group: 'Primitives',
    status: 'stable',
    intent: 'A multi-line text field with an invalid state and a default row count.',
  },
  {
    slug: 'select',
    title: 'Select',
    group: 'Primitives',
    status: 'stable',
    intent: 'A styled wrapper over the native select with a trailing chevron.',
  },
  {
    slug: 'search',
    title: 'Search',
    group: 'Primitives',
    status: 'stable',
    intent: 'An expand-on-focus search field that collapses back to its icon.',
  },
  {
    slug: 'checkbox',
    title: 'Checkbox',
    group: 'Primitives',
    status: 'stable',
    intent: 'A checkbox with checked, unchecked, and indeterminate states.',
  },
  {
    slug: 'radio',
    title: 'Radio',
    group: 'Primitives',
    status: 'stable',
    intent: 'A single-choice radio group built from RadioGroup and RadioGroupItem.',
  },
  {
    slug: 'toggle',
    title: 'Toggle',
    group: 'Primitives',
    status: 'stable',
    intent: 'A switch with a sliding thumb for an immediate on/off setting.',
  },
  {
    slug: 'badge',
    title: 'Badge',
    group: 'Primitives',
    status: 'stable',
    intent: 'A small status label with eight tones and an optional leading dot.',
  },
  {
    slug: 'tag',
    title: 'Tag',
    group: 'Primitives',
    status: 'stable',
    intent: 'An inline metadata label with three variants.',
  },
  {
    slug: 'avatar',
    title: 'Avatar',
    group: 'Primitives',
    status: 'stable',
    intent: 'A circular identity badge, with a group that collapses overflow into +N.',
  },
  {
    slug: 'kbd',
    title: 'Kbd',
    group: 'Primitives',
    status: 'stable',
    intent: 'A keyboard key hint that composes into shortcut chords.',
  },
  {
    slug: 'meter',
    title: 'Meter',
    group: 'Primitives',
    status: 'beta',
    intent:
      'A linear ratio bar for a single value against a max (quota, budget, progress); tone signals headroom.',
  },
  {
    slug: 'filter-pill',
    title: 'Filter pill',
    group: 'Primitives',
    status: 'stable',
    intent: 'A toggleable filter trigger with active and open states.',
  },
  {
    slug: 'scope-pill',
    title: 'Scope pill',
    group: 'Primitives',
    status: 'stable',
    intent: 'A read-only pill labelling the scope something applies to.',
  },

  // Forms
  {
    slug: 'field',
    title: 'Field',
    group: 'Forms',
    status: 'stable',
    intent:
      'The canonical form row: label, required asterisk, hint, and error, wired to any control via a render contract.',
  },
  {
    slug: 'inline-edit',
    title: 'Inline edit',
    group: 'Forms',
    status: 'stable',
    intent:
      'Edit-in-place control for a text, number, or single-selection value, with edit, save, and cancel affordances.',
  },
  {
    slug: 'segmented-control',
    title: 'Segmented control',
    group: 'Forms',
    status: 'stable',
    intent:
      'Single-select control on a recessed track; the pressed segment rises to a raised pill.',
  },
  {
    slug: 'combobox',
    title: 'Combobox',
    group: 'Forms',
    status: 'stable',
    intent:
      'Searchable select with single and multi modes, built on the canonical Popover and a cmdk filter.',
  },
  {
    slug: 'accordion',
    title: 'Accordion',
    group: 'Forms',
    status: 'stable',
    intent:
      'Stacked disclosure rows in single (one-open) or multiple modes, with an animated body height.',
  },
  {
    slug: 'selection-list',
    title: 'SelectionList',
    group: 'Forms',
    status: 'stable',
    intent:
      'Searchable grouped multi-select: category pills with counts, group select-all with indeterminate state, and indented item rows with optional badges.',
  },
  {
    slug: 'composer',
    title: 'Composer',
    group: 'Forms',
    status: 'beta',
    intent:
      'Chat/agent message input: a compact auto-grow composer with a lower anchored Send action that swaps to Stop while streaming.',
  },
  {
    slug: 'key-value-editor',
    title: 'Key-value editor',
    group: 'Forms',
    status: 'stable',
    intent: 'A compact editable table for string key/value pairs with add and remove actions.',
  },
  {
    slug: 'json-code-editor',
    title: 'JSON code editor',
    group: 'Forms',
    status: 'beta',
    intent:
      'A controlled JSON text editor with line numbers, folding, syntax tones, and parse diagnostics.',
  },
  {
    slug: 'file-dropzone',
    title: 'File dropzone',
    group: 'Forms',
    status: 'stable',
    intent:
      'A drag-and-select file input with a per-file list showing progress, preview, and error/retry.',
  },
  {
    slug: 'file-bundle-editor',
    title: 'File bundle editor',
    group: 'Forms',
    status: 'stable',
    intent:
      'A controlled file-bundle workspace with upload actions, a file list, and one active text editor or read-only binary view.',
  },
  {
    slug: 'markdown-editor',
    title: 'Markdown editor',
    group: 'Forms',
    status: 'stable',
    intent:
      'A controlled Markdown textarea with a corner accent toggle that swaps between writing and the canonical Markdown preview.',
  },

  // Agents
  {
    slug: 'agent-activity-line',
    title: 'Agent activity line',
    group: 'Agents',
    status: 'beta',
    intent:
      'A compact agent activity row with optional agent name, action phrase, pulse animation, and explicit runtime/local activity states.',
  },
  {
    slug: 'agent-message-bubble',
    title: 'Agent message bubble',
    group: 'Agents',
    status: 'beta',
    intent:
      'A full-width transparent assistant response bubble for agent conversations, with copy and optional timestamp metadata.',
  },
  {
    slug: 'agent-reasoning-block',
    title: 'Agent reasoning block',
    group: 'Agents',
    status: 'beta',
    intent: 'A collapsible Thinking block for streaming and completed agent reasoning parts.',
  },
  {
    slug: 'agent-text-block',
    title: 'Agent text block',
    group: 'Agents',
    status: 'beta',
    intent:
      'A Markdown answer block for agent text parts that can stay hidden while reasoning streams.',
  },
  {
    slug: 'user-message-bubble',
    title: 'User message bubble',
    group: 'Agents',
    status: 'beta',
    intent:
      'A right-aligned operator message bubble for agent conversations, using the accent surface plus copy and optional timestamp metadata.',
  },
  {
    slug: 'agent-status-badge',
    title: 'Agent status badge',
    group: 'Agents',
    status: 'beta',
    intent: 'A reusable status badge for agent lifecycle and execution state surfaces.',
  },
  {
    slug: 'capability-chip',
    title: 'Capability chip',
    group: 'Agents',
    status: 'beta',
    intent:
      'A semantic chip for capability governance state: one component, three lenses (risk ceiling, surface drift, policy decision) mapped to consistent tones.',
  },
  {
    slug: 'capability-constraints-editor',
    title: 'Capability constraints editor',
    group: 'Agents',
    status: 'beta',
    intent:
      'A controlled editor for capability narrowing: risk ceiling, approval gates, numeric limits, and allowlists.',
  },
  {
    slug: 'principal-picker',
    title: 'Principal picker',
    group: 'Agents',
    status: 'beta',
    intent:
      'A controlled principal target picker for roles, teams, API clients, and team member selection.',
  },
  {
    slug: 'approval-card',
    title: 'Approval card',
    group: 'Agents',
    status: 'beta',
    intent:
      'A single pending HITL request as a decision surface: prompt, capability/integration context, risk chip, and mode-specific approve, reject, and choice actions.',
  },
  {
    slug: 'approvals-inbox',
    title: 'Approvals inbox',
    group: 'Agents',
    status: 'beta',
    intent:
      'A vertical queue of pending HITL requests rendered as approval cards with a count header, falling back to an empty state when the inbox is clear.',
  },
  {
    slug: 'capability-matrix',
    title: 'Capability matrix',
    group: 'Agents',
    status: 'beta',
    intent:
      'A who-can-what grid of capability rows by target columns, each cell projecting a grant state, with reused risk and drift chips per capability.',
  },
  {
    slug: 'classification-matrix',
    title: 'Classification matrix',
    group: 'Agents',
    status: 'beta',
    intent:
      'A controlled editor for a capability data policy: output classification, model-context policy, a per-field classification matrix, and allowed sink refs.',
  },
  {
    slug: 'effective-surface-viewer',
    title: 'Effective surface viewer',
    group: 'Agents',
    status: 'beta',
    intent:
      'The consumption My Integrations view: a read-only surface of the effective capabilities available to the caller, grouped by integration, with risk, approval gate, quota, and drift block.',
  },
  {
    slug: 'agent-tool-call-list',
    title: 'Agent tool call list',
    group: 'Agents',
    status: 'beta',
    intent:
      'A collapsible group of agent tool calls; each row expands to show its input, output content blocks, and per-status evidence.',
  },
  {
    slug: 'execution-map',
    title: 'Execution map',
    group: 'Agents',
    status: 'beta',
    intent:
      'A read-only lane canvas for agent execution evidence, synchronized graph selection, inspector, timeline, and relationship filters.',
  },

  // Overlays
  {
    slug: 'dialog',
    title: 'Dialog',
    group: 'Overlays',
    status: 'stable',
    intent: 'A modal surface with a built-in focus trap, Escape-to-close, and focus return.',
  },
  {
    slug: 'drawer',
    title: 'Drawer',
    group: 'Overlays',
    status: 'stable',
    intent:
      'A floating, rounded right-side panel over a scrim with no close button; dismisses on click-outside or Escape and reflows to a floating bottom sheet on mobile.',
  },
  {
    slug: 'markdown-viewer',
    title: 'Markdown viewer',
    group: 'Overlays',
    status: 'beta',
    intent:
      'A floating non-modal reading window that renders Markdown above a page that stays interactive — no scrim.',
  },
  {
    slug: 'confirm-dialog',
    title: 'Confirm dialog',
    group: 'Overlays',
    status: 'stable',
    intent: 'An alert dialog for a single decision, with default and danger variants.',
  },
  {
    slug: 'form-dialog',
    title: 'Form dialog',
    group: 'Overlays',
    status: 'beta',
    intent:
      'The create/edit modal: a scrollable form body, pinned Cancel/Submit footer, submitting state, and error summary.',
  },
  {
    slug: 'menu',
    title: 'Menu',
    group: 'Overlays',
    status: 'stable',
    intent: 'The canonical dropdown menu: sections, dividers, checks, shortcuts, and danger items.',
  },
  {
    slug: 'popover',
    title: 'Popover',
    group: 'Overlays',
    status: 'stable',
    intent: 'A non-modal floating panel anchored to a trigger on any of four sides.',
  },
  {
    slug: 'tooltip',
    title: 'Tooltip',
    group: 'Overlays',
    status: 'stable',
    intent: 'A hover and focus label that points back at its trigger from any of four sides.',
  },
  {
    slug: 'hint-icon',
    title: 'Hint icon',
    group: 'Overlays',
    status: 'stable',
    intent: 'An inline glyph that reveals a toned tooltip to flag and explain a constraint.',
  },
  {
    slug: 'command-palette',
    title: 'Command palette',
    group: 'Overlays',
    status: 'stable',
    intent: 'A ⌘K search dialog over grouped commands, with live filtering and an empty state.',
  },
];
