import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { type EffectiveCapability, EffectiveSurfaceViewer } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const CAPABILITIES: readonly EffectiveCapability[] = [
  {
    capabilityRef: 'mcp.files.list',
    name: 'List files',
    description: 'List and read files and folders in the connected workspace.',
    integrationId: 'files',
    integrationName: 'Files',
    risk: 'low',
    requiresHitl: false,
  },
  {
    capabilityRef: 'api.directory.update_member',
    name: 'Update member',
    description: "Change a directory member's role or status.",
    integrationId: 'directory',
    integrationName: 'Directory',
    risk: 'high',
    requiresHitl: true,
    quotaPerWindow: 20,
    quotaRemaining: 6,
  },
  {
    capabilityRef: 'api.files.delete_folder',
    name: 'Delete folder',
    description: 'Permanently delete a folder and its contents.',
    integrationId: 'files',
    integrationName: 'Files',
    risk: 'critical',
    requiresHitl: true,
    driftBlocked: true,
  },
  {
    capabilityRef: 'db.analytics.read_metrics',
    name: 'Read metrics',
    description: 'Query aggregated usage metrics for reporting.',
    integrationId: 'analytics',
    integrationName: 'Analytics',
    risk: 'medium',
    requiresHitl: false,
    quotaPerWindow: 100,
    quotaRemaining: 100,
  },
  {
    capabilityRef: 'webhook.directory.member_created',
    name: 'Member created event',
    description: 'Emit an outbound event when a directory member is created.',
    integrationId: 'directory',
    integrationName: 'Directory',
    risk: 'high',
    requiresHitl: true,
    quotaPerWindow: 5,
    quotaRemaining: 1,
  },
];

const EXAMPLE_CODE = `<EffectiveSurfaceViewer
  capabilities={capabilities}
  onSelect={(ref) => open(ref)}
/>`;

const EMPTY_CODE = `<EffectiveSurfaceViewer
  capabilities={[]}
  emptyHint="Connect an integration to unlock capabilities."
/>`;

function EffectiveSurfaceViewerPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The consumption “My Integrations” view: a read-only surface that shows only the caller's effective capabilities, grouped by integration. Each row states its risk ceiling, approval gate, remaining quota, and drift block — composed from CapabilityChip, Meter, Card, and EmptyState."
      title="Effective surface viewer"
    >
      <ExampleBlock
        code={EXAMPLE_CODE}
        render={() => (
          <EffectiveSurfaceViewer capabilities={CAPABILITIES} onSelect={() => undefined} />
        )}
      />

      <ExampleBlock
        code={EMPTY_CODE}
        render={() => (
          <EffectiveSurfaceViewer
            capabilities={[]}
            emptyHint="Connect an integration to unlock capabilities."
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'capabilities',
            type: 'readonly EffectiveCapability[]',
            description:
              "The caller's resolved effective capabilities. Grouped by integration in first-seen order; an empty array renders the empty state.",
          },
          {
            name: 'onSelect',
            type: '(capabilityRef: string) => void',
            description:
              'Optional read-only selection callback. When set, each capability card becomes interactive; the viewer never mutates the surface.',
          },
          {
            name: 'emptyHint',
            type: 'string',
            defaultValue: "'No integrations are available to you yet.'",
            description:
              'Description shown in the empty state when there are no effective capabilities.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default EffectiveSurfaceViewerPage;
