import { lazy } from 'react';
import { componentEntry } from '../component-entry.js';
import type { ShowcaseEntry } from '../showcase-types.js';

const AgentActivityLinePage = lazy(
  () => import('../../pages/agents/components/agent-activity-line.page.js'),
);
const AgentMessageBubblePage = lazy(
  () => import('../../pages/agents/components/agent-message-bubble.page.js'),
);
const AgentReasoningBlockPage = lazy(
  () => import('../../pages/agents/components/agent-reasoning-block.page.js'),
);
const AgentStatusBadgePage = lazy(
  () => import('../../pages/agents/components/agent-status-badge.page.js'),
);
const AgentTextBlockPage = lazy(
  () => import('../../pages/agents/components/agent-text-block.page.js'),
);
const UserMessageBubblePage = lazy(
  () => import('../../pages/agents/components/user-message-bubble.page.js'),
);
const AgentToolCallListPage = lazy(
  () => import('../../pages/agents/components/agent-tool-call-list.page.js'),
);
const ExecutionMapPage = lazy(() => import('../../pages/agents/components/execution-map.page.js'));
const CapabilityChipPage = lazy(
  () => import('../../pages/agents/components/capability-chip.page.js'),
);
const CapabilityConstraintsEditorPage = lazy(
  () => import('../../pages/agents/components/capability-constraints-editor.page.js'),
);
const PrincipalPickerPage = lazy(
  () => import('../../pages/agents/components/principal-picker.page.js'),
);
const ApprovalCardPage = lazy(() => import('../../pages/agents/components/approval-card.page.js'));
const ApprovalsInboxPage = lazy(
  () => import('../../pages/agents/components/approvals-inbox.page.js'),
);
const CapabilityMatrixPage = lazy(
  () => import('../../pages/agents/components/capability-matrix.page.js'),
);
const ClassificationMatrixPage = lazy(
  () => import('../../pages/agents/components/classification-matrix.page.js'),
);
const EffectiveSurfaceViewerPage = lazy(
  () => import('../../pages/agents/components/effective-surface-viewer.page.js'),
);
const AutomationStatusBadgePage = lazy(
  () => import('../../pages/agents/components/automation-status-badge.page.js'),
);
const TriggerTilePage = lazy(() => import('../../pages/agents/components/trigger-tile.page.js'));
const ScheduleEditorPage = lazy(
  () => import('../../pages/agents/components/schedule-editor.page.js'),
);
const TriggerComposerPage = lazy(
  () => import('../../pages/agents/components/trigger-composer.page.js'),
);
const AutomationGraphPage = lazy(
  () => import('../../pages/agents/components/automation-graph.page.js'),
);
const NodeInspectorPage = lazy(
  () => import('../../pages/agents/components/node-inspector.page.js'),
);
const RunTimelinePage = lazy(() => import('../../pages/agents/components/run-timeline.page.js'));
const WaitRetryChipPage = lazy(
  () => import('../../pages/agents/components/wait-retry-chip.page.js'),
);
const ApprovalPanelPage = lazy(
  () => import('../../pages/agents/components/approval-panel.page.js'),
);
const PlannerStatusPage = lazy(
  () => import('../../pages/agents/components/planner-status.page.js'),
);
const ProposalPreviewPage = lazy(
  () => import('../../pages/agents/components/proposal-preview.page.js'),
);
const NodeAttemptsTablePage = lazy(
  () => import('../../pages/agents/components/node-attempts-table.page.js'),
);
const RuntimeRefsPanelPage = lazy(
  () => import('../../pages/agents/components/runtime-refs-panel.page.js'),
);

export const agentsEntries: ShowcaseEntry[] = [
  componentEntry('agent-activity-line', () => <AgentActivityLinePage />),
  componentEntry('agent-message-bubble', () => <AgentMessageBubblePage />),
  componentEntry('agent-reasoning-block', () => <AgentReasoningBlockPage />),
  componentEntry('agent-text-block', () => <AgentTextBlockPage />),
  componentEntry('user-message-bubble', () => <UserMessageBubblePage />),
  componentEntry('agent-status-badge', () => <AgentStatusBadgePage />),
  componentEntry('agent-tool-call-list', () => <AgentToolCallListPage />),
  componentEntry('execution-map', () => <ExecutionMapPage />),
  componentEntry('capability-chip', () => <CapabilityChipPage />),
  componentEntry('capability-constraints-editor', () => <CapabilityConstraintsEditorPage />),
  componentEntry('principal-picker', () => <PrincipalPickerPage />),
  componentEntry('approval-card', () => <ApprovalCardPage />),
  componentEntry('approvals-inbox', () => <ApprovalsInboxPage />),
  componentEntry('capability-matrix', () => <CapabilityMatrixPage />),
  componentEntry('classification-matrix', () => <ClassificationMatrixPage />),
  componentEntry('effective-surface-viewer', () => <EffectiveSurfaceViewerPage />),
  componentEntry('automation-status-badge', () => <AutomationStatusBadgePage />),
  componentEntry('trigger-tile', () => <TriggerTilePage />),
  componentEntry('schedule-editor', () => <ScheduleEditorPage />),
  componentEntry('trigger-composer', () => <TriggerComposerPage />),
  componentEntry('automation-graph', () => <AutomationGraphPage />),
  componentEntry('node-inspector', () => <NodeInspectorPage />),
  componentEntry('run-timeline', () => <RunTimelinePage />),
  componentEntry('wait-retry-chip', () => <WaitRetryChipPage />),
  componentEntry('approval-panel', () => <ApprovalPanelPage />),
  componentEntry('planner-status', () => <PlannerStatusPage />),
  componentEntry('proposal-preview', () => <ProposalPreviewPage />),
  componentEntry('node-attempts-table', () => <NodeAttemptsTablePage />),
  componentEntry('runtime-refs-panel', () => <RuntimeRefsPanelPage />),
];
