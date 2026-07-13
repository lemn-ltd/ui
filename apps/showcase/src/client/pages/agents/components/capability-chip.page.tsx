import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import {
  CapabilityChip,
  type CapabilityDecisionEffect,
  type CapabilityDriftState,
  type CapabilityRiskLevel,
} from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const RISKS: readonly CapabilityRiskLevel[] = ['low', 'medium', 'high', 'critical'];
const DECISIONS: readonly CapabilityDecisionEffect[] = ['allow', 'ask', 'deny', 'fail'];
const DRIFTS: readonly CapabilityDriftState[] = [
  'approved',
  'blocked',
  'added',
  'removed',
  'surface_changed',
  'credential_revoked',
];

function CapabilityChipPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A semantic chip for capability governance state. One component, three lenses (risk ceiling, surface drift, policy decision), each mapped to a consistent neutral tone."
      title="Capability chip"
    >
      <ExampleBlock
        code={`<CapabilityChip kind="risk" value="high" />
<CapabilityChip kind="decision" value="ask" />
<CapabilityChip kind="drift" value="blocked" />`}
        render={() => (
          <>
            <CapabilityChip kind="risk" value="high" />
            <CapabilityChip kind="decision" value="ask" />
            <CapabilityChip kind="drift" value="blocked" />
          </>
        )}
      />

      <VariantsGallery
        items={RISKS.map((value) => ({
          label: `risk: ${value}`,
          render: () => <CapabilityChip kind="risk" value={value} />,
        }))}
      />

      <VariantsGallery
        items={DECISIONS.map((value) => ({
          label: `decision: ${value}`,
          render: () => <CapabilityChip kind="decision" value={value} />,
        }))}
      />

      <VariantsGallery
        items={DRIFTS.map((value) => ({
          label: `drift: ${value}`,
          render: () => <CapabilityChip kind="drift" value={value} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'kind',
            type: "'risk' | 'drift' | 'decision'",
            description:
              'Which governance lens the chip renders; selects the value union and tone map.',
          },
          {
            name: 'value',
            type: 'CapabilityRiskLevel | CapabilityDriftState | CapabilityDecisionEffect',
            description:
              'The state to display, typed against the chosen kind. Mirrors the backend enums.',
          },
          {
            name: 'label',
            type: 'string',
            defaultValue: 'humanized value',
            description: 'Optional label override when a surface needs product-specific wording.',
          },
          {
            name: 'variant',
            type: "'subtle' | 'soft'",
            defaultValue: "'soft'",
            description: 'Badge emphasis passed through to the underlying Badge.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CapabilityChipPage;
