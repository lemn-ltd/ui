import type { ComponentCatalogEntry } from './catalog-types.js';

/** Agent catalog metadata retained outside the active Core portal graph. */
export const primaryAgentComponentCatalogEntries: readonly ComponentCatalogEntry[] = [
  {
    slug: 'agent-activity-line',
    title: 'Agent activity line',
    area: 'agents',
    group: 'Conversation',
    status: 'beta',
    intent:
      'A compact agent activity row with optional agent name, action phrase, pulse animation, and explicit runtime/local activity states.',
  },
  {
    slug: 'agent-message-bubble',
    title: 'Agent message bubble',
    area: 'agents',
    group: 'Conversation',
    status: 'beta',
    intent:
      'A full-width transparent assistant response bubble for agent conversations, with copy and optional timestamp metadata.',
  },
  {
    slug: 'agent-reasoning-block',
    title: 'Agent reasoning block',
    area: 'agents',
    group: 'Conversation',
    status: 'beta',
    intent: 'A collapsible Thinking block for streaming and completed agent reasoning parts.',
  },
  {
    slug: 'agent-text-block',
    title: 'Agent text block',
    area: 'agents',
    group: 'Conversation',
    status: 'beta',
    intent:
      'A Markdown answer block for agent text parts that can stay hidden while reasoning streams.',
  },
  {
    slug: 'user-message-bubble',
    title: 'User message bubble',
    area: 'agents',
    group: 'Conversation',
    status: 'beta',
    intent:
      'A right-aligned operator message bubble for agent conversations, using the accent surface plus copy and optional timestamp metadata.',
  },
  {
    slug: 'agent-status-badge',
    title: 'Agent status badge',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent: 'A reusable status badge for agent lifecycle and execution state surfaces.',
  },
  {
    slug: 'capability-chip',
    title: 'Capability chip',
    area: 'agents',
    group: 'Governance',
    status: 'beta',
    intent:
      'A semantic chip for capability governance state: one component, three lenses (risk ceiling, surface drift, policy decision) mapped to consistent tones.',
  },
  {
    slug: 'capability-constraints-editor',
    title: 'Capability constraints editor',
    area: 'agents',
    group: 'Governance',
    status: 'beta',
    intent:
      'A controlled editor for capability narrowing: risk ceiling, approval gates, numeric limits, and allowlists.',
  },
  {
    slug: 'principal-picker',
    title: 'Principal picker',
    area: 'agents',
    group: 'Governance',
    status: 'beta',
    intent:
      'A controlled principal target picker for roles, teams, API clients, and team member selection.',
  },
  {
    slug: 'approval-card',
    title: 'Approval card',
    area: 'agents',
    group: 'Approvals',
    status: 'beta',
    intent:
      'A single pending HITL request as a decision surface: prompt, capability/integration context, risk chip, and mode-specific approve, reject, and choice actions.',
  },
  {
    slug: 'approvals-inbox',
    title: 'Approvals inbox',
    area: 'agents',
    group: 'Approvals',
    status: 'beta',
    intent:
      'A vertical queue of pending HITL requests rendered as approval cards with a count header, falling back to an empty state when the inbox is clear.',
  },
  {
    slug: 'capability-matrix',
    title: 'Capability matrix',
    area: 'agents',
    group: 'Governance',
    status: 'beta',
    intent:
      'A who-can-what grid of capability rows by target columns, each cell projecting a grant state, with reused risk and drift chips per capability.',
  },
  {
    slug: 'classification-matrix',
    title: 'Classification matrix',
    area: 'agents',
    group: 'Governance',
    status: 'beta',
    intent:
      'A controlled editor for a capability data policy: output classification, model-context policy, a per-field classification matrix, and allowed sink refs.',
  },
  {
    slug: 'effective-surface-viewer',
    title: 'Effective surface viewer',
    area: 'agents',
    group: 'Governance',
    status: 'beta',
    intent:
      'The consumption My Integrations view: a read-only surface of the effective capabilities available to the caller, grouped by integration, with risk, approval gate, quota, and drift block.',
  },
  {
    slug: 'agent-tool-call-list',
    title: 'Agent tool call list',
    area: 'agents',
    group: 'Conversation',
    status: 'beta',
    intent:
      'A collapsible group of agent tool calls; each row expands to show its input, output content blocks, and per-status evidence.',
  },
  {
    slug: 'execution-map',
    title: 'Execution map',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent:
      'A read-only lane canvas for agent execution evidence, synchronized graph selection, inspector, timeline, and relationship filters.',
  },
];
