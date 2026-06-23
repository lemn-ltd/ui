import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Tabs } from '@appranks/ui';
import { type ReactElement, useState } from 'react';
import {
  defaultTabValue,
  overflowDefaultTabValue,
  overflowTabs,
  tabs as tabItems,
} from '../../../fixtures';

function TabsPage(): ReactElement {
  const [value, setValue] = useState(defaultTabValue);
  const [overflowValue, setOverflowValue] = useState(overflowDefaultTabValue);
  const [railValue, setRailValue] = useState(defaultTabValue);

  return (
    <ComponentPage
      status="stable"
      summary="A controlled set of triggers. Horizontal by default (an underline row); set orientation='vertical' for a sidebar rail with a left accent bar. Each item carries a value, a label, and an optional count badge."
      title="Tabs"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('overview');

<Tabs items={tabs} value={value} onValueChange={setValue} />`}
        render={() => (
          <div style={{ width: '100%' }}>
            <Tabs items={tabItems} onValueChange={setValue} value={value} />
          </div>
        )}
      />

      <ExampleBlock
        code={`// orientation="vertical" renders a sidebar rail with a left accent bar.
<Tabs orientation="vertical" items={tabs} value={value} onValueChange={setValue} />`}
        render={() => (
          <div style={{ width: 240 }}>
            <Tabs
              items={tabItems}
              onValueChange={setRailValue}
              orientation="vertical"
              value={railValue}
            />
          </div>
        )}
      />

      <ExampleBlock
        code={`// 11 tabs overflow the rail.
<Tabs items={overflowTabs} value={value} onValueChange={setValue} />`}
        render={() => (
          <div style={{ width: '100%' }}>
            <Tabs items={overflowTabs} onValueChange={setOverflowValue} value={overflowValue} />
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'items',
            type: 'readonly TabItem[]',
            description: 'Triggers. Each has a value, a label, and an optional count badge.',
          },
          {
            name: 'value',
            type: 'string',
            description: 'The active tab value (controlled).',
          },
          {
            name: 'onValueChange',
            type: '(value: string) => void',
            description: 'Fires with the next value when a trigger is selected.',
          },
          {
            name: 'orientation',
            type: "'horizontal' | 'vertical'",
            description:
              "Layout. 'horizontal' (default) is an underline tab row; 'vertical' is a sidebar rail with a left accent bar.",
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TabsPage;
