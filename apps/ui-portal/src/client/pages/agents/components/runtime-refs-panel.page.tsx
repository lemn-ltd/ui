import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { type RuntimeMetric, type RuntimeRef, RuntimeRefsPanel } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const REFS: readonly RuntimeRef[] = [
  { label: 'RuntimeSession', value: 'rsess_9f2a4c7e' },
  { label: 'RuntimeRun', value: 'rrun_71c4d8 · attempt 3 / 3' },
  { label: 'Source ref', value: 'app : code_run : cr_8412' },
];

const METRICS: readonly RuntimeMetric[] = [
  { label: 'Max turns', value: '8' },
  { label: 'Tokens', value: '12.4k / 50k' },
  { label: 'Safety', value: 'enforced' },
  { label: 'Knowledge', value: '3 sources' },
];

function RuntimeRefsPanelPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The runtime integration summary for an automation execution node: the runtime session/run refs and source context as aligned monospace lines, plus a policy/limits/safety/knowledge metric strip. Read-only — it consumes only public runtime refs and resolved summaries."
      title="Runtime refs panel"
    >
      <ExampleBlock
        code={`<RuntimeRefsPanel refs={refs} metrics={metrics} />`}
        render={() => (
          <div style={{ maxWidth: 560 }}>
            <RuntimeRefsPanel metrics={METRICS} refs={REFS} />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'minimal',
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <RuntimeRefsPanel
                  metrics={[
                    { label: 'Max turns', value: '4' },
                    { label: 'Safety', value: 'enforced' },
                  ]}
                  refs={[{ label: 'RuntimeRun', value: 'rrun_71c4d8' }]}
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'refs',
            type: 'RuntimeRef[]',
            description: 'label/value lines for runtime session/run refs and source context.',
          },
          {
            name: 'metrics',
            type: 'RuntimeMetric[]',
            description: 'label/value tiles for policy, limits, safety, and knowledge.',
          },
          {
            name: 'refsTitle / metricsTitle',
            type: 'string',
            description: 'Section heading overrides.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default RuntimeRefsPanelPage;
