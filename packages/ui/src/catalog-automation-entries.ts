import type { ComponentCatalogEntry } from './catalog-types.js';

/**
 * Catalog entries for the Automation v1 agent-system components. Kept in their
 * own module so the primary entries file stays focused and under the source-file
 * LOC budget; concatenated into `componentCatalog` alongside the primary and
 * secondary sets.
 */
export const automationComponentCatalogEntries: readonly ComponentCatalogEntry[] = [
  {
    slug: 'automation-status-badge',
    title: 'Automation status badge',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent:
      'A status pill for automation definition lifecycle and run state: draft, published, and archived plus queued, scheduled, running, waiting, completed, failed, and cancelled.',
  },
  {
    slug: 'trigger-tile',
    title: 'Trigger tile',
    area: 'agents',
    group: 'Automation',
    status: 'beta',
    intent:
      'A bordered tile for a trigger kind: a leading glyph, a label and optional description, and a trailing enabled/disabled/error status pill.',
  },
  {
    slug: 'schedule-editor',
    title: 'Schedule editor',
    area: 'agents',
    group: 'Automation',
    status: 'beta',
    intent:
      'A schedule configuration block: a cron/interval/fixed kind selector, the expression, an optional timezone, and a live next/last-run summary with a status pill.',
  },
  {
    slug: 'trigger-composer',
    title: 'Trigger composer',
    area: 'agents',
    group: 'Automation',
    status: 'beta',
    intent:
      'The trigger authoring surface: a list of configured triggers — each a deep preset-driven schedule builder (once/hourly/daily/weekdays/weekly/custom with a per-preset input and a live human summary) or a titled card — plus a collapsible add-another-trigger picker.',
  },
  {
    slug: 'automation-graph',
    title: 'Automation graph',
    area: 'agents',
    group: 'Automation',
    status: 'beta',
    intent:
      'A read-only automation graph: typed nodes on an absolute canvas connected by orthogonal edges, each node toned by execution state, with an inline state legend.',
  },
  {
    slug: 'node-inspector',
    title: 'Node inspector',
    area: 'agents',
    group: 'Automation',
    status: 'beta',
    intent:
      "A selected node's detail panel — a kind pill, a config/policy/knowledge tab strip, and label/value rows — beside the authoring node palette.",
  },
  {
    slug: 'run-timeline',
    title: 'Run timeline',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent:
      'The chronological evidence log for an automation run: a bordered column of tone-dotted, timestamped event rows.',
  },
  {
    slug: 'wait-retry-chip',
    title: 'Wait & retry chips',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent:
      "Compact pills for a node's wait timer and retry budget, toned by state, for graph, scheduler, and evidence rows.",
  },
  {
    slug: 'approval-panel',
    title: 'Approval panel',
    area: 'agents',
    group: 'Approvals',
    status: 'beta',
    intent:
      'The decision surface for an automation human-task node: automation/run context, graph-hash and stale-approval conflicts that block approval, a comment, and Approve/Reject actions.',
  },
  {
    slug: 'planner-status',
    title: 'Planner status',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent:
      'The planner runtime indicator for the planned-graph flow: a dotted status pill that pulses while the planner is planning or streaming.',
  },
  {
    slug: 'proposal-preview',
    title: 'Proposal preview',
    area: 'agents',
    group: 'Automation',
    status: 'beta',
    intent:
      'The review surface for a generated automation graph: a monospace node preview, a compile-result banner, and accept/reject actions gated on a clean compile.',
  },
  {
    slug: 'node-attempts-table',
    title: 'Node attempts table',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent:
      'The per-node attempt ledger for a run — node, type, attempt, state, duration, and error — composed over the canonical DataTable.',
  },
  {
    slug: 'runtime-refs-panel',
    title: 'Runtime refs panel',
    area: 'agents',
    group: 'Runtime & evidence',
    status: 'beta',
    intent:
      'The runtime integration summary for an execution node: runtime session/run refs and source context as aligned monospace lines, plus a policy/limits/safety/knowledge metric strip.',
  },
];
