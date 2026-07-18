import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { Button, Dialog } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

function DialogPage(): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <ComponentPage
      status="stable"
      summary="A modal surface that owns its own focus trap, Escape-to-close, and focus return. Pass a trigger and content; open state can be left uncontrolled or driven externally."
      title="Dialog"
    >
      <ExampleBlock
        code={`<Dialog
  title="Rename project"
  description="Choose a new name for this project."
  trigger={<Button variant="secondary">Open dialog</Button>}
  footer={
    <>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </>
  }
>
  <p>Dialog body content goes here.</p>
</Dialog>`}
        render={() => (
          <Dialog
            description="Choose a new name for this project."
            footer={
              <>
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Save</Button>
              </>
            }
            title="Rename project"
            trigger={<Button variant="secondary">Open dialog</Button>}
          >
            <p>Dialog body content goes here.</p>
          </Dialog>
        )}
      />

      <ExampleBlock
        code={`const [open, setOpen] = useState(false);

<Button variant="secondary" onClick={() => setOpen(true)}>
  Open controlled
</Button>
<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Controlled dialog"
  description="Open state is owned by the parent."
>
  <p>Closing routes through onOpenChange.</p>
</Dialog>`}
        render={() => (
          <>
            <Button onClick={() => setOpen(true)} variant="secondary">
              Open controlled
            </Button>
            <Dialog
              description="Open state is owned by the parent."
              onOpenChange={setOpen}
              open={open}
              title="Controlled dialog"
            >
              <p>Closing routes through onOpenChange.</p>
            </Dialog>
          </>
        )}
      />

      <ExampleBlock
        code={`<Dialog
  size="lg"
  title="Edit item"
  description="A wider panel for multi-field forms and file uploads."
  trigger={<Button variant="secondary">Open large dialog</Button>}
>
  <p>Sizes: sm 440 · md 560 · lg 720 · xl 960.</p>
</Dialog>`}
        render={() => (
          <Dialog
            description="A wider panel for multi-field forms and file uploads."
            size="lg"
            title="Edit item"
            trigger={<Button variant="secondary">Open large dialog</Button>}
          >
            <p>Sizes: sm 440 · md 560 · lg 720 · xl 960.</p>
          </Dialog>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Heading shown in the dialog header next to the close button.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'Body content rendered between the header and the optional footer.',
          },
          {
            name: 'trigger',
            type: 'ReactNode',
            description:
              'Element that opens the dialog. Rendered as the trigger child; omit for fully controlled use.',
          },
          {
            name: 'description',
            type: 'ReactNode',
            description:
              'Optional supporting text under the title; wires aria-describedby when present.',
          },
          {
            name: 'footer',
            type: 'ReactNode',
            description: 'Optional footer region, shown below a divider.',
          },
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg' | 'xl'",
            description:
              'Panel width: sm 440 (default), md 560, lg 720, xl 960. Mobile collapses to a full-width bottom sheet regardless of size.',
          },
          {
            name: 'open',
            type: 'boolean',
            description: 'Controlled open state.',
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            description: 'Initial open state for uncontrolled use.',
          },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            description: 'Called when the open state changes.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default DialogPage;
