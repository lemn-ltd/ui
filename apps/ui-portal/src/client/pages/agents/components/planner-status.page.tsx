import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { type PlannerState, PlannerStatus } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const STATES: readonly PlannerState[] = ['idle', 'planning', 'streaming', 'compiled', 'failed'];

function PlannerStatusPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The planner runtime indicator for the planned-graph flow: a dotted pill toned by state, with the dot pulsing while the planner is actively planning or streaming."
      title="Planner status"
    >
      <ExampleBlock
        code={`<PlannerStatus state="planning" />
<PlannerStatus state="streaming" />
<PlannerStatus state="compiled" />`}
        render={() => (
          <>
            <PlannerStatus state="planning" />
            <PlannerStatus state="streaming" />
            <PlannerStatus state="compiled" />
          </>
        )}
      />

      <VariantsGallery
        items={STATES.map((state) => ({
          label: state,
          render: () => <PlannerStatus state={state} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'state',
            type: STATES.map((state) => `'${state}'`).join(' | '),
            description:
              'Planner runtime state, written to data-planner-state. The dot pulses while planning or streaming.',
          },
          {
            name: 'label',
            type: 'string',
            defaultValue: 'state label',
            description: 'Optional visible label override.',
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

export default PlannerStatusPage;
