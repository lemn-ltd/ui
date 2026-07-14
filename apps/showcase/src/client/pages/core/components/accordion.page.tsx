import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { Accordion } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { accordionDefaultValue, accordionItems } from '../../../fixtures';

// A fixed width keeps the disclosure rows readable inside preview cells.
const wrap = { width: '28rem' } as const;

function AccordionPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="Stacked disclosure rows. Single keeps at most one section open; multiple allows many. The header chevron rotates and the body height animates on [data-state=open]."
      title="Accordion"
    >
      <ExampleBlock
        code={`<Accordion
  type="single"
  items={accordionItems}
  defaultValue="general"
/>`}
        render={() => (
          <div style={wrap}>
            <Accordion defaultValue={accordionDefaultValue} items={accordionItems} type="single" />
          </div>
        )}
      />

      <ExampleBlock
        code={`<Accordion
  type="multiple"
  items={accordionItems}
  defaultValue={['general', 'access']}
/>`}
        render={() => (
          <div style={wrap}>
            <Accordion
              defaultValue={['general', 'access']}
              items={accordionItems}
              type="multiple"
            />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'single · collapsible',
            render: () => (
              <div style={wrap}>
                <Accordion
                  collapsible
                  defaultValue={accordionDefaultValue}
                  items={accordionItems}
                  type="single"
                />
              </div>
            ),
          },
          {
            label: 'multiple',
            render: () => (
              <div style={wrap}>
                <Accordion
                  defaultValue={['general', 'access']}
                  items={accordionItems}
                  type="multiple"
                />
              </div>
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <div style={wrap}>
                <Accordion
                  defaultValue={accordionDefaultValue}
                  disabled
                  items={accordionItems}
                  type="single"
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'items',
            type: 'readonly AccordionItemData[]',
            description:
              'Disclosure rows. Each has value, label, optional caption, content, and optional disabled.',
          },
          {
            name: 'type',
            type: "'single' | 'multiple'",
            defaultValue: "'single'",
            description: 'Single keeps at most one section open; multiple allows many.',
          },
          {
            name: 'value',
            type: 'string (single) | readonly string[] (multiple)',
            description: 'Controlled open section(s).',
          },
          {
            name: 'defaultValue',
            type: 'string (single) | readonly string[] (multiple)',
            description: 'Uncontrolled initial open section(s).',
          },
          {
            name: 'collapsible',
            type: 'boolean',
            defaultValue: 'true',
            description: 'Single mode only. Allows closing the open section so none remain open.',
          },
          {
            name: 'onValueChange',
            type: '(value: string) => void (single) | (value: string[]) => void (multiple)',
            description: 'Fires when the open section(s) change.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'Disables every row.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class appended to the accordion root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AccordionPage;
