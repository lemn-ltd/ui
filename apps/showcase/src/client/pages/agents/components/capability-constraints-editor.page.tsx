import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { type CapabilityConstraints, CapabilityConstraintsEditor } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const INITIAL_CONSTRAINTS: CapabilityConstraints = {
  allowedHosts: ['api.example.com'],
  allowedSinks: ['queue.audit-events'],
  maxRows: 1000,
  timeoutMs: 30_000,
  riskCeiling: 'medium',
  requiresHitlForExternalSink: true,
  redactionRules: ['email'],
};

function CapabilityConstraintsEditorExample(): ReactElement {
  const [constraints, setConstraints] = useState<CapabilityConstraints>(INITIAL_CONSTRAINTS);
  return <CapabilityConstraintsEditor onChange={setConstraints} value={constraints} />;
}

function CapabilityConstraintsEditorPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A controlled editor for capability narrowing: risk ceiling, approval gates, numeric limits, and allowlists. Cleared fields are omitted from the constraints record."
      title="Capability constraints editor"
    >
      <ExampleBlock
        code={`const [constraints, setConstraints] = useState<CapabilityConstraints>({
  allowedHosts: ['api.example.com'],
  maxRows: 1000,
  riskCeiling: 'medium',
  requiresHitlForExternalSink: true,
});

<CapabilityConstraintsEditor
  onChange={setConstraints}
  value={constraints}
/>`}
        render={() => <CapabilityConstraintsEditorExample />}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'CapabilityConstraints',
            description:
              'Controlled constraints record. Optional fields are absent when unset, including empty lists and blank numbers.',
          },
          {
            name: 'onChange',
            type: '(next: CapabilityConstraints) => void',
            description: 'Emits the complete next constraints record after each edit.',
          },
          {
            name: 'riskCeiling',
            type: "'low' | 'medium' | 'high' | 'critical'",
            description: 'Optional maximum allowed risk level for the capability surface.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Disables all nested controls.',
          },
          {
            name: '...rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props forwarded to the editor container.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CapabilityConstraintsEditorPage;
