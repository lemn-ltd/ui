import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Card, ContentLayout } from '@appranks/ui';
import type { CSSProperties, ReactElement } from 'react';

// A bordered frame so the centered content reads as a preview rather than
// re-centering the whole page (every page already sits inside a ContentLayout).
const frame: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--surface)',
  overflow: 'hidden',
};

function ContentLayoutPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The reading-width column. It centers its children and caps them at var(--content-max) with page padding; bleed drops the cap and padding for full-width sections."
      title="Content layout"
    >
      <ExampleBlock
        code={`<ContentLayout>
  <Card title="Centered content">
    Capped at var(--content-max) with page padding on both sides.
  </Card>
</ContentLayout>`}
        render={() => (
          <div style={frame}>
            <ContentLayout>
              <Card title="Centered content">
                Capped at var(--content-max) with page padding on both sides.
              </Card>
            </ContentLayout>
          </div>
        )}
      />

      <ExampleBlock
        code={`<ContentLayout bleed>
  <Card title="Full-width content">
    bleed removes the max-width cap and the padding.
  </Card>
</ContentLayout>`}
        render={() => (
          <div style={frame}>
            <ContentLayout bleed>
              <Card title="Full-width content">
                bleed removes the max-width cap and the padding.
              </Card>
            </ContentLayout>
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'bleed',
            type: 'boolean',
            defaultValue: 'false',
            description:
              'Drops the max-width cap and the page padding (data-bleed="true") so the column spans the full available width.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props (className, id, …) spread onto the root element.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ContentLayoutPage;
