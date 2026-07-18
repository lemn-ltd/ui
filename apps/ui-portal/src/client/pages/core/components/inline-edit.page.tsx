import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { InlineEdit } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const noop = async (): Promise<void> => undefined;

function InlineEditPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="Edit-in-place control for a text, number, or single-selection value, with edit, save, and cancel affordances."
      title="Inline edit"
    >
      <ExampleBlock
        code={`<InlineEdit
  kind="number"
  value="30"
  displayValue="30 days"
  min={1}
  max={365}
  onSave={save}
/>`}
        render={() => (
          <InlineEdit
            displayValue="30 days"
            kind="number"
            max={365}
            min={1}
            onSave={noop}
            value="30"
          />
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'kind · text',
            render: () => (
              <InlineEdit
                displayValue="Example workspace"
                kind="text"
                onSave={noop}
                value="Example workspace"
              />
            ),
          },
          {
            label: 'kind · number',
            render: () => (
              <InlineEdit displayValue="12" kind="number" min={1} onSave={noop} value="12" />
            ),
          },
          {
            label: 'kind · select',
            render: () => (
              <InlineEdit
                displayValue="Permissive"
                kind="select"
                onSave={noop}
                options={[
                  { value: 'permissive', label: 'Permissive' },
                  { value: 'ask', label: 'Ask first' },
                  { value: 'block', label: 'Block mutations' },
                ]}
                value="permissive"
              />
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <InlineEdit disabled displayValue="Default" kind="number" onSave={noop} value="" />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'kind',
            type: "'text' | 'number' | 'select'",
            description:
              'Selects the edit control: a text input, a number input, or a single-selection list.',
          },
          {
            name: 'value',
            type: 'string',
            description: 'The current persisted value, serialized as a string.',
          },
          {
            name: 'displayValue',
            type: 'string',
            description: 'The value shown while not editing.',
          },
          {
            name: 'onSave',
            type: '(value: string) => Promise<void>',
            description: 'Commits the draft; the row reverts if it rejects.',
          },
          {
            name: 'options',
            type: '{ value; label }[]',
            description: 'select kind only — the single-selection choices.',
          },
          {
            name: 'min / max / step / inputMode',
            type: 'number | string',
            description: 'number kind only — input constraints.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'Hides the edit affordance.',
          },
          {
            name: 'testIds',
            type: 'InlineEditTestIds',
            description: 'Optional test ids for display / edit / input / save / cancel.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default InlineEditPage;
