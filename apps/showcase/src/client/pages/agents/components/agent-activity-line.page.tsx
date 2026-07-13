import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import {
  AGENT_ACTIVITY_LINE_STATES,
  AgentActivityLine,
  type AgentActivityLineState,
  type AgentActivityLineTone,
} from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

interface ActivityExample {
  readonly state: AgentActivityLineState;
  readonly statusText: string;
  readonly tone?: AgentActivityLineTone;
  readonly pulse?: boolean;
  readonly toolName?: string;
}

const ACTIVITY_ROWS: readonly ActivityExample[] = [
  { state: 'working', statusText: 'is thinking...', pulse: true },
  { state: 'working', statusText: 'is working on the auth middleware...', pulse: true },
  { state: 'working', statusText: 'is running pnpm test', pulse: true, toolName: 'shell' },
  { state: 'working', statusText: 'is streaming response...', pulse: true },
  { state: 'confirming', statusText: 'is waiting for your confirmation' },
  { state: 'working', statusText: 'is compacting context...', tone: 'info' },
  { state: 'reactivating', statusText: 'is waking the sandbox (attempt 2/3)', pulse: true },
  { state: 'working', statusText: 'is responding...', pulse: true },
];

function AgentActivityLinePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A compact agent activity row for chat drawers, activity rails, and live execution overlays. State stays explicit; the visible action phrase comes from the host."
      title="Agent activity line"
    >
      <ExampleBlock
        code={`<AgentActivityLine state="idle" />

<AgentActivityLine
  agentName="Researcher"
  pulse={isBusy}
  state="working"
  statusText="is running pnpm test"
  toolName="shell"
/>`}
        render={() => (
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-5)',
              width: 'min(760px, 100%)',
              padding: 'var(--space-6)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <AgentActivityLine state="idle" />
            <AgentActivityLine
              agentName="Researcher"
              pulse
              state="working"
              statusText="is running pnpm test"
              toolName="shell"
            />
            {ACTIVITY_ROWS.map((row) => (
              <AgentActivityLine
                agentName="Researcher"
                key={`${row.state}:${row.statusText}`}
                pulse={row.pulse}
                state={row.state}
                statusText={row.statusText}
                tone={row.tone}
                toolName={row.toolName}
              />
            ))}
          </div>
        )}
      />

      <VariantsGallery
        items={AGENT_ACTIVITY_LINE_STATES.map((state) => ({
          label: state,
          render: () => (
            <AgentActivityLine
              agentName="Orchestrator"
              pulse={state === 'working' || state === 'reactivating'}
              state={state}
            />
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'state',
            type: "'idle' | 'working' | 'confirming' | 'reactivating' | 'cancelling' | 'cancelled'",
            description:
              'Explicit activity state. The first four align to public agent.state events; cancelling and cancelled are local chat control states.',
          },
          {
            name: 'agentName',
            type: 'string | undefined',
            description: 'Optional visible agent name. Omit it for icon-only activity rows.',
          },
          {
            name: 'statusText',
            type: 'string',
            defaultValue: 'state default phrase',
            description:
              'Visible action phrase. Use this for thinking, running a tool, streaming, or compaction copy without adding new states.',
          },
          {
            name: 'tone',
            type: "'muted' | 'accent' | 'info' | 'warn' | 'danger' | 'success'",
            defaultValue: 'derived from state',
            description:
              'Optional visual tone for the action phrase. It does not change the state data hook.',
          },
          {
            name: 'pulse',
            type: 'boolean',
            defaultValue: 'false',
            description:
              'Animates the leading icon. In chat surfaces this should come from the same busy flag that shows the Stop control.',
          },
          {
            name: 'toolName',
            type: 'string',
            description:
              'Optional compact tool badge when the status is tied to a known tool call.',
          },
          {
            name: 'visual',
            type: 'ReactNode',
            description: 'Optional leading visual. Defaults to the shared agent glyph.',
          },
          {
            name: '...rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props forwarded to the row.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AgentActivityLinePage;
