import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Card, TwoColumn } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function TwoColumnPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A main-and-aside split. From the lg breakpoint up the aside sits beside the main column at a 2:1 ratio; below it, the two stack with the aside last."
      title="Two column"
    >
      <ExampleBlock
        code={`<TwoColumn
  main={<Card title="Main">Primary content.</Card>}
  aside={<Card title="Aside">Supporting content.</Card>}
/>`}
        render={() => (
          <TwoColumn
            aside={
              <Card title="Aside">
                Supporting content. Drops below the main column on narrow widths.
              </Card>
            }
            main={
              <Card title="Main">Primary content takes two of the three fractional columns.</Card>
            }
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'main',
            type: 'ReactNode',
            description: 'Primary column; spans two of the three fractional tracks at lg and up.',
          },
          {
            name: 'aside',
            type: 'ReactNode',
            description: 'Secondary column; sits beside main at lg and up, otherwise stacks last.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'children'>",
            description: 'Native div props (className, id, …) spread onto the root element.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TwoColumnPage;
