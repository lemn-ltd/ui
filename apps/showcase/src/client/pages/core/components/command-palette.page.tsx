import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Button, CommandPalette } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { commandGroups } from '../../../fixtures';

function CommandPalettePage(): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <ComponentPage
      status="stable"
      summary="A ⌘K search dialog over grouped commands. Open state is controlled; the input filters every group as you type and falls back to a 'No matches' state. ⌘K also toggles it from anywhere."
      title="Command palette"
    >
      <ExampleBlock
        code={`const [open, setOpen] = useState(false);

<Button variant="secondary" onClick={() => setOpen(true)}>
  Open command palette
</Button>
<CommandPalette
  open={open}
  onOpenChange={setOpen}
  groups={commandGroups}
/>`}
        render={() => (
          <>
            <Button onClick={() => setOpen(true)} variant="secondary">
              Open command palette
            </Button>
            <CommandPalette groups={commandGroups} onOpenChange={setOpen} open={open} />
          </>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'open',
            type: 'boolean',
            description: 'Controlled open state. ⌘K / Ctrl+K toggles it globally.',
          },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            description: 'Called when the palette opens or closes, including after a selection.',
          },
          {
            name: 'groups',
            type: 'readonly CommandPaletteGroup[]',
            description:
              'Grouped commands; each item has an id, label, optional icon, shortcut, and keywords.',
          },
          {
            name: 'placeholder',
            type: 'string',
            defaultValue: "'Search pages, actions…'",
            description: 'Placeholder shown in the search input.',
          },
          {
            name: 'emptyMessage',
            type: 'string',
            defaultValue: "'No matches'",
            description: 'Message shown when no command matches the query.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CommandPalettePage;
