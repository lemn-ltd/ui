import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { MarkdownEditor } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const markdown = `# Skill

- Read the active requirement.
- Produce a minimal patch.

\`\`\`text
evidence required
\`\`\``;

function EditableMarkdown(): ReactElement {
  const [value, setValue] = useState(markdown);
  return (
    <div style={{ width: '44rem', maxWidth: '100%' }}>
      <MarkdownEditor aria-label="Skill Markdown" onChange={setValue} value={value} />
    </div>
  );
}

function MarkdownEditorPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A controlled Markdown textarea with a single accent toggle floating in the top-right corner: the eye swaps the panel to the canonical Markdown preview, the pencil returns to writing. Preview rendering is escaped React content, so host applications do not inherit raw HTML injection risk from the component."
      title="Markdown editor"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('# Skill');

<MarkdownEditor
  aria-label="Skill Markdown"
  value={value}
  onChange={setValue}
/>`}
        render={() => <EditableMarkdown />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'preview · pencil returns to write',
            render: () => (
              <div style={{ width: '44rem', maxWidth: '100%' }}>
                <MarkdownEditor
                  aria-label="Skill Markdown"
                  mode="preview"
                  onChange={() => {}}
                  value={markdown}
                />
              </div>
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <div style={{ width: '44rem', maxWidth: '100%' }}>
                <MarkdownEditor
                  aria-label="Skill Markdown"
                  disabled
                  onChange={() => {}}
                  value={markdown}
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
            description: 'Controlled Markdown source.',
          },
          {
            name: 'onChange',
            type: '(value: string) => void',
            description: 'Fires with the next Markdown source.',
          },
          {
            name: 'mode',
            type: "'write' | 'preview'",
            defaultValue: "'write'",
            description:
              'Controls which panel is visible; omit it and the corner toggle manages the mode internally.',
          },
          {
            name: 'onModeChange',
            type: '(mode: MarkdownEditorMode) => void',
            description: 'Fires when the corner toggle is pressed.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'Disables the textarea and the mode toggle.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default MarkdownEditorPage;
