import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { Stepper, type StepStatus } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { steps } from '../../../fixtures';

const STATUSES: readonly StepStatus[] = ['completed', 'active', 'upcoming'];

function StepperPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A horizontal progress indicator. Completed steps show a check, the rest show their index; status drives the connector and dot styling."
      title="Stepper"
    >
      <ExampleBlock
        code={`<Stepper
  steps={[
    { label: 'Details', status: 'completed' },
    { label: 'Access', status: 'completed' },
    { label: 'Review', status: 'active' },
    { label: 'Confirm', status: 'upcoming' },
    { label: 'Done', status: 'upcoming' },
  ]}
/>`}
        render={() => (
          <div style={{ width: '100%' }}>
            <Stepper steps={steps} />
          </div>
        )}
      />

      <VariantsGallery
        items={STATUSES.map((status) => ({
          label: status,
          render: () => <Stepper steps={[{ label: 'Step', status }]} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'steps',
            type: 'readonly StepperStep[]',
            description: 'Ordered steps. Each has a label and a status.',
          },
          {
            name: 'StepperStep.status',
            type: "'completed' | 'active' | 'upcoming'",
            description:
              'Step state, written to data-status; completed steps render a check glyph.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default StepperPage;
