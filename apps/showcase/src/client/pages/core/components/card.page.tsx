import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Button, Card } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { sectionCards } from '../../../fixtures';

function CardPage(): ReactElement {
  const sample = sectionCards[0];

  return (
    <ComponentPage
      status="stable"
      summary="A surface container with optional title, body, and footer slots. Each slot collapses when its prop is absent; data-elevated toggles the raised treatment."
      title="Card"
    >
      <ExampleBlock
        code={`<Card title="Getting started" footer="Updated 2 days ago">
  A short walkthrough of the core surfaces and how they fit together.
</Card>`}
        render={() => (
          <Card footer={sample?.footer} title={sample?.title}>
            {sample?.body}
          </Card>
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'title + body + footer',
            render: () => (
              <Card footer="Reviewed weekly" title="Access policy">
                Rules that govern who can view and edit each resource.
              </Card>
            ),
          },
          {
            label: 'body only',
            render: () => <Card>People with access to this workspace and their roles.</Card>,
          },
          {
            label: 'title + body',
            render: () => (
              <Card title="Usage">Track consumption against the configured limits.</Card>
            ),
          },
          {
            label: 'with action footer',
            render: () => (
              <Card footer={<Button variant="secondary">Open</Button>} title="Support">
                Reach the team or browse the documentation.
              </Card>
            ),
          },
          {
            label: 'elevated',
            render: () => (
              <Card elevated title="Notifications">
                Control which events reach you and through which channel.
              </Card>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Optional heading slot; the title row is omitted when absent.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'Body content; the body row is omitted when absent.',
          },
          {
            name: 'footer',
            type: 'ReactNode',
            description: 'Optional footer slot; the footer row is omitted when absent.',
          },
          {
            name: 'elevated',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Raised treatment, written to data-elevated.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'title'>",
            description: 'Native div props spread onto the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CardPage;
