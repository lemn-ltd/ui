import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { KeyValueEditor, type KeyValueEditorEntry } from '@appranks/ui';
import { type ReactElement, useState } from 'react';

const initialHeaders: KeyValueEditorEntry[] = [
  { id: 'entry-1', key: 'Authorization', value: 'Bearer {{token}}' },
  { id: 'entry-2', key: 'Accept', value: 'application/json' },
];

const disabledHeaders: KeyValueEditorEntry[] = [
  { id: 'entry-1', key: 'Authorization', value: 'Bearer {{token}}', disabled: true },
  { id: 'entry-2', key: 'Accept', value: 'application/json' },
];

function EditableExample(): ReactElement {
  const [entries, setEntries] = useState<KeyValueEditorEntry[]>(initialHeaders);
  return (
    <div style={{ width: '36rem', maxWidth: '100%' }}>
      <KeyValueEditor aria-label="Request headers" entries={entries} onEntriesChange={setEntries} />
    </div>
  );
}

function KeyValueEditorPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A compact editable table for string key/value pairs. It keeps row identity stable, emits the full next array on each edit, and uses icon-only remove controls for dense configuration forms."
      title="Key-value editor"
    >
      <ExampleBlock
        code={`const [entries, setEntries] = useState([
  { id: 'entry-1', key: 'Authorization', value: 'Bearer {{token}}' },
]);

<KeyValueEditor
  aria-label="Request headers"
  entries={entries}
  onEntriesChange={setEntries}
/>`}
        render={() => <EditableExample />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'empty',
            render: () => (
              <div style={{ width: '36rem', maxWidth: '100%' }}>
                <KeyValueEditor
                  aria-label="Environment variables"
                  entries={[]}
                  onEntriesChange={() => {}}
                />
              </div>
            ),
          },
          {
            label: 'disabled row',
            render: () => (
              <div style={{ width: '36rem', maxWidth: '100%' }}>
                <KeyValueEditor
                  aria-label="Resolved headers"
                  entries={disabledHeaders}
                  onEntriesChange={() => {}}
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'entries',
            type: 'KeyValueEditorEntry[]',
            description: 'Controlled rows. Each row carries id, key, value, and optional disabled.',
          },
          {
            name: 'onEntriesChange',
            type: '(entries: KeyValueEditorEntry[]) => void',
            description: 'Receives the full next row array after edits, additions, and removals.',
          },
          {
            name: 'aria-label',
            type: 'string',
            description: 'Accessible name for the editor group.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default KeyValueEditorPage;
