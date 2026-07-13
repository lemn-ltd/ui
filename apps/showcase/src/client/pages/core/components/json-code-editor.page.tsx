import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { JsonCodeEditor } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { jsonSample } from '../../../fixtures';

const initialJson = JSON.stringify(jsonSample, null, 2);

function EditableJson(): ReactElement {
  const [value, setValue] = useState(initialJson);
  return (
    <div style={{ width: '56rem', maxWidth: '100%' }}>
      <JsonCodeEditor aria-label="JSON document" onChange={setValue} value={value} />
    </div>
  );
}

function JsonCodeEditorPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A controlled JSON text editor with a VS Code-like dark surface: line numbers, fold gutter, bracket matching, syntax tones, active line, and JSON parse diagnostics while preserving free-form text editing."
      title="JSON code editor"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState(JSON.stringify(record, null, 2));

<JsonCodeEditor
  aria-label="JSON document"
  value={value}
  onChange={setValue}
/>`}
        render={() => <EditableJson />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'invalid JSON',
            render: () => (
              <div style={{ width: '56rem', maxWidth: '100%' }}>
                <JsonCodeEditor
                  aria-label="Invalid JSON document"
                  invalid
                  onChange={() => {}}
                  value={'{ "type": "object"'}
                />
              </div>
            ),
          },
          {
            label: 'readOnly',
            render: () => (
              <div style={{ width: '56rem', maxWidth: '100%' }}>
                <JsonCodeEditor
                  aria-label="Read-only JSON document"
                  onChange={() => {}}
                  readOnly
                  value={initialJson}
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'string',
            description: 'Controlled JSON source text. It may be invalid while the user edits.',
          },
          {
            name: 'onChange',
            type: '(value: string) => void',
            description: 'Fires with the next JSON source text.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'Disables editing and marks the surface subdued.',
          },
          {
            name: 'readOnly',
            type: 'boolean',
            description: 'Preserves focus, scroll, selection, and folding while preventing edits.',
          },
          {
            name: 'invalid',
            type: 'boolean',
            description: 'Marks the editor frame invalid for field-level validation.',
          },
          {
            name: 'minHeight',
            type: 'number',
            defaultValue: '320',
            description: 'Minimum editor height in pixels.',
          },
          {
            name: 'maxHeight',
            type: 'number',
            description: 'Optional maximum editor height in pixels.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default JsonCodeEditorPage;
