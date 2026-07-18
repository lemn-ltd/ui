import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { ExecutionMap, type ExecutionMapEntity, type ExecutionMapGraph } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const sessionId = 'session-demo-001';
const rootAgentId = 'agent-root-001';
const researchAgentId = 'agent-research-001';
const inputId = 'input-operator-001';
const runtimeRunId = 'work-map-001';
const attemptId = 'attempt-map-001';
const turnId = 'turn-map-001';
const inferenceId = 'inference-map-001';
const toolCallId = 'tool-search-001';
const toolExecutionId = 'tool-search-exec-001';
const usageId = 'usage-map-001';

const GRAPH: ExecutionMapGraph = {
  runtimeSessionId: sessionId,
  generatedAt: '2026-06-13T09:10:00.000Z',
  summary: {
    runtimeSessionId: sessionId,
    status: 'active',
    rootAgentInstanceId: rootAgentId,
    rootAgentDefinitionId: 'agent.orchestrator',
    rootAgentDefinitionVersionNumber: 1,
  },
  counters: {
    entityCount: 11,
    edgeCount: 10,
    eventCount: 4,
    anomalyCount: 0,
  },
  nodes: [
    entity('runtime_session', sessionId, null, 'active', null, null, { label: 'Runtime session' }),
    entity(
      'agent_instance',
      rootAgentId,
      ref('runtime_session', sessionId),
      'running',
      rootAgentId,
      null,
      {
        displayName: 'Orchestrator',
        agentDefinitionId: 'agent.orchestrator',
        depth: 0,
      },
    ),
    entity(
      'agent_instance',
      researchAgentId,
      ref('agent_instance', rootAgentId),
      'running',
      researchAgentId,
      null,
      {
        displayName: 'Research Agent',
        agentDefinitionId: 'agent.researcher',
        depth: 1,
      },
    ),
    entity(
      'runtime_input',
      inputId,
      ref('agent_instance', rootAgentId),
      'completed',
      rootAgentId,
      null,
      {
        channel: 'operator.message',
      },
    ),
    entity(
      'runtime_run',
      runtimeRunId,
      ref('runtime_input', inputId),
      'completed',
      rootAgentId,
      null,
      {
        label: 'Design execution map',
      },
    ),
    entity(
      'attempt',
      attemptId,
      ref('runtime_run', runtimeRunId),
      'completed',
      rootAgentId,
      attemptId,
      {
        startReason: 'initial',
      },
    ),
    entity('turn', turnId, ref('attempt', attemptId), 'completed', rootAgentId, attemptId, {
      label: 'Reasoning turn',
    }),
    entity('inference_run', inferenceId, ref('turn', turnId), 'completed', rootAgentId, attemptId, {
      model: 'workers-ai:reasoning-standard',
    }),
    entity(
      'tool_call',
      toolCallId,
      ref('inference_run', inferenceId),
      'completed',
      rootAgentId,
      attemptId,
      {
        toolName: 'search_files',
      },
    ),
    entity(
      'tool_call_execution',
      toolExecutionId,
      ref('tool_call', toolCallId),
      'completed',
      rootAgentId,
      attemptId,
      {
        toolName: 'search_files',
        result: 'success',
      },
    ),
    entity(
      'usage_summary',
      usageId,
      ref('inference_run', inferenceId),
      'completed',
      rootAgentId,
      attemptId,
      {
        tokensIn: 1860,
        tokensOut: 920,
      },
    ),
  ],
  edges: [
    edge(
      'edge-delegates',
      'delegates',
      ref('agent_instance', rootAgentId),
      ref('agent_instance', researchAgentId),
    ),
    edge(
      'edge-owns-input',
      'owns',
      ref('agent_instance', rootAgentId),
      ref('runtime_input', inputId),
    ),
    edge(
      'edge-input-work',
      'schedules',
      ref('runtime_input', inputId),
      ref('runtime_run', runtimeRunId),
    ),
    edge(
      'edge-work-attempt',
      'attempts',
      ref('runtime_run', runtimeRunId),
      ref('attempt', attemptId),
    ),
    edge('edge-attempt-turn', 'contains', ref('attempt', attemptId), ref('turn', turnId)),
    edge('edge-turn-inference', 'contains', ref('turn', turnId), ref('inference_run', inferenceId)),
    edge(
      'edge-inference-tool',
      'produces',
      ref('inference_run', inferenceId),
      ref('tool_call', toolCallId),
    ),
    edge(
      'edge-tool-execution',
      'executes',
      ref('tool_call', toolCallId),
      ref('tool_call_execution', toolExecutionId),
    ),
    edge(
      'edge-inference-usage',
      'summarizes',
      ref('inference_run', inferenceId),
      ref('usage_summary', usageId),
    ),
    edge(
      'edge-agent-tool',
      'requests',
      ref('agent_instance', rootAgentId),
      ref('tool_call', toolCallId),
    ),
  ],
  latestEvents: [
    event('event-001', 1, 'agent.instance.started', rootAgentId, null),
    event('event-002', 2, 'runtime.input.received', rootAgentId, null),
    event('event-003', 3, 'agent.attempt.started', rootAgentId, attemptId),
    event('event-004', 4, 'agent.tool.completed', rootAgentId, attemptId),
  ],
  anomalies: [],
};

function ExecutionMapPage(): ReactElement {
  return (
    <div className="execution-map-portal-page">
      <ComponentPage
        status="beta"
        summary="A read-only lane canvas for agent execution evidence, synchronized graph selection, inspector, timeline, and relationship filters."
        title="Execution map"
      >
        <ExampleBlock
          code={`<ExecutionMap graph={graph} events={events} />`}
          render={() => (
            <ExecutionMap
              events={GRAPH.latestEvents}
              graph={GRAPH}
              subtitle="Runtime session session-demo-001"
              title="Execution Map"
            />
          )}
        />

        <PropsTable
          rows={[
            {
              name: 'graph',
              type: 'ExecutionMapGraph | null',
              description:
                'Brand-neutral graph packet with nodes, edges, counters, latest events, and optional anomalies.',
            },
            {
              name: 'events',
              type: 'readonly ExecutionMapEvent[]',
              description:
                'Full-session timeline events. Falls back to graph.latestEvents when omitted.',
            },
            {
              name: 'entityEvents',
              type: 'Record<string, readonly ExecutionMapEvent[]>',
              description:
                'Optional node-scoped event pages keyed by entityKind:entityId for timeline drill-down.',
            },
            {
              name: 'onSelectEntity / onSelectEdge / onSelectEvent',
              type: 'callbacks',
              description:
                'Selection callbacks so a host can update URL state, fetch node-scoped events, or open product-owned detail routes.',
            },
          ]}
        />
      </ComponentPage>
    </div>
  );
}

function entity(
  entityKind: ExecutionMapEntity['entityKind'],
  entityId: string,
  parentEntityRef: ExecutionMapEntity['parentEntityRef'],
  status: ExecutionMapEntity['status'],
  agentInstanceId: string | null,
  attemptId: string | null,
  summary: Readonly<Record<string, unknown>>,
): ExecutionMapEntity {
  return {
    entityKind,
    entityId,
    runtimeSessionId: sessionId,
    agentInstanceId,
    attemptId,
    parentEntityRef,
    status,
    createdAt: '2026-06-13T09:00:00.000Z',
    updatedAt: '2026-06-13T09:10:00.000Z',
    occurredAt: '2026-06-13T09:10:00.000Z',
    redaction: { applied: true, strategy: 'recursive_sensitive_field_redaction' },
    summary,
    detail: null,
  };
}

function ref(entityKind: ExecutionMapEntity['entityKind'], entityId: string) {
  return { entityKind, entityId };
}

function edge(
  edgeId: string,
  edgeKind: ExecutionMapGraph['edges'][number]['edgeKind'],
  from: ExecutionMapGraph['edges'][number]['from'],
  to: ExecutionMapGraph['edges'][number]['to'],
) {
  return {
    edgeId,
    edgeKind,
    from,
    to,
    label: null,
    createdAt: '2026-06-13T09:10:00.000Z',
    metadata: {},
  };
}

function event(
  eventId: string,
  eventSeq: number,
  eventType: string,
  agentInstanceId: string,
  attemptId: string | null,
) {
  return {
    eventId,
    eventFamily: eventType.startsWith('runtime.') ? 'runtime.lifecycle' : 'agent.lifecycle',
    eventType,
    schemaVersion: 1,
    occurredAt: '2026-06-13T09:10:00.000Z',
    scope: { runtimeSessionId: sessionId, agentInstanceId, attemptId },
    persistence: { eventSeq },
    redaction: { applied: true, strategy: 'recursive_sensitive_field_redaction' },
    payload: { label: eventType },
  };
}

export default ExecutionMapPage;
