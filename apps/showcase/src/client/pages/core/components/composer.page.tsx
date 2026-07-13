import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Composer, Kbd } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

// A fixed width keeps the composer card aligned inside preview cells.
const wrap = { width: '28rem' } as const;

function IdleComposer(): ReactElement {
  const [value, setValue] = useState('');
  return (
    <div style={wrap}>
      <Composer
        aria-label="Message"
        onChange={setValue}
        onSubmit={() => setValue('')}
        value={value}
      />
    </div>
  );
}

function StreamingComposer(): ReactElement {
  const [value, setValue] = useState('Add a dark mode toggle to settings.');
  return (
    <div style={wrap}>
      <Composer
        aria-label="Message"
        onChange={setValue}
        onStop={() => {}}
        onSubmit={() => {}}
        status="streaming"
        value={value}
      />
    </div>
  );
}

function FooterHintComposer(): ReactElement {
  const [value, setValue] = useState('');
  return (
    <div style={wrap}>
      <Composer
        aria-label="Message"
        footerSlot={
          <span>
            <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd>
            <Kbd>Enter</Kbd> for a new line
          </span>
        }
        onChange={setValue}
        onSubmit={() => setValue('')}
        value={value}
      />
    </div>
  );
}

function ComposerPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The chat/agent message input: a compact auto-grow composer with a lower anchored action. Send is enabled once the draft is non-empty and submits on Enter; while streaming it swaps to Stop and the textarea stays editable. Layout-neutral — the parent places it as the session composer or the home prompt box."
      title="Composer"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('');

<Composer
  aria-label="Message"
  value={value}
  onChange={setValue}
  onSubmit={() => setValue('')}
/>`}
        render={() => <IdleComposer />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'streaming · shows Stop',
            render: () => <StreamingComposer />,
          },
          {
            label: 'disabled',
            render: () => (
              <div style={wrap}>
                <Composer
                  aria-label="Message"
                  onChange={() => {}}
                  onSubmit={() => {}}
                  status="disabled"
                  value="Composer is unavailable right now."
                />
              </div>
            ),
          },
          {
            label: 'with a footer hint',
            render: () => <FooterHintComposer />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'string',
            description: 'Controlled draft text shown in the message area.',
          },
          {
            name: 'onChange',
            type: '(next: string) => void',
            description: 'Fires on every edit with the next draft text.',
          },
          {
            name: 'onSubmit',
            type: '(value: string) => void',
            description:
              'Fires on Send click or Enter when the draft is non-empty and not streaming.',
          },
          {
            name: 'onStop',
            type: '() => void',
            description: 'Fires when Stop is pressed; meaningful while status is streaming.',
          },
          {
            name: 'status',
            type: "'idle' | 'streaming' | 'disabled'",
            defaultValue: "'idle'",
            description:
              'idle enables Send when non-empty; streaming swaps to Stop and blocks Enter; disabled dims everything.',
          },
          {
            name: 'placeholder',
            type: 'string',
            description: 'Placeholder shown in the empty message area.',
          },
          {
            name: 'maxRows',
            type: 'number',
            defaultValue: '8',
            description: 'Row cap for auto-grow; beyond it the textarea scrolls internally.',
          },
          {
            name: 'autoFocus',
            type: 'boolean',
            description: 'Focuses the message area on mount.',
          },
          {
            name: 'width',
            type: "'fill' | 'content'",
            defaultValue: "'fill'",
            description:
              'fill spans the parent; content centers the composer and caps it to the conversation reading width for expandable chat surfaces.',
          },
          {
            name: 'leadingSlot',
            type: 'React.ReactNode',
            description: 'Content rendered above the message area, e.g. an attachment row.',
          },
          {
            name: 'footerSlot',
            type: 'React.ReactNode',
            description:
              'Content rendered in the actions row beside the Send/Stop control, e.g. a hint.',
          },
          {
            name: 'aria-label',
            type: 'string',
            description:
              'Accessible name for the message area; there is no separate visible label.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ComposerPage;
