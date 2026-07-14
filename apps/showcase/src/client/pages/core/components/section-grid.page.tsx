import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Card, SectionGrid } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { sectionCards } from '../../../fixtures';

function SectionGridPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An auto-fitting card grid. It is a container query, not a viewport one: cells reflow 4 → 3 → 2 → 1 against the grid's own width, so it adapts inside any column."
      title="Section grid"
    >
      <ExampleBlock
        code={`<SectionGrid>
  {cards.map((card) => (
    <Card key={card.id} title={card.title} footer={card.footer}>
      {card.body}
    </Card>
  ))}
</SectionGrid>`}
        render={() => (
          <SectionGrid>
            {sectionCards.map((card) => (
              <Card footer={card.footer} key={card.id} title={card.title}>
                {card.body}
              </Card>
            ))}
          </SectionGrid>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'children',
            type: 'ReactNode',
            description:
              'Grid cells, typically Card instances. Each cell has a 280px minimum track.',
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

export default SectionGridPage;
