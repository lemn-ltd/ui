import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { Button, Drawer } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

function DrawerPage(): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <ComponentPage
      status="stable"
      summary="A floating, rounded right-side panel over a scrim. It has no close button — it dismisses on click-outside or Escape — and owns its focus trap and focus return, reflowing to a floating bottom sheet on mobile. Pass a trigger and content; open state can be left uncontrolled or driven externally."
      title="Drawer"
    >
      <ExampleBlock
        code={`<Drawer
  title="Agent session"
  description="A focused side surface that does not navigate away."
  trigger={<Button variant="secondary">Open drawer</Button>}
>
  <p>Drawer body content goes here.</p>
</Drawer>`}
        render={() => (
          <Drawer
            description="A focused side surface that does not navigate away."
            title="Agent session"
            trigger={<Button variant="secondary">Open drawer</Button>}
          >
            <p>Drawer body content goes here.</p>
          </Drawer>
        )}
      />

      <ExampleBlock
        code={`const [open, setOpen] = useState(false);

<Button variant="secondary" onClick={() => setOpen(true)}>
  Open controlled
</Button>
<Drawer
  open={open}
  onOpenChange={setOpen}
  title="Controlled drawer"
  description="Open state is owned by the parent."
>
  <p>Closing routes through onOpenChange.</p>
</Drawer>`}
        render={() => (
          <>
            <Button onClick={() => setOpen(true)} variant="secondary">
              Open controlled
            </Button>
            <Drawer
              description="Open state is owned by the parent."
              onOpenChange={setOpen}
              open={open}
              title="Controlled drawer"
            >
              <p>Closing routes through onOpenChange.</p>
            </Drawer>
          </>
        )}
      />

      <ExampleBlock
        code={`<Drawer
  width="lg"
  title="Wide drawer"
  description="A wider panel for richer side content."
  trigger={<Button variant="secondary">Open wide drawer</Button>}
>
  <p>Widths: sm 380 · md 460 (default) · lg 600.</p>
</Drawer>`}
        render={() => (
          <Drawer
            description="A wider panel for richer side content."
            title="Wide drawer"
            trigger={<Button variant="secondary">Open wide drawer</Button>}
            width="lg"
          >
            <p>Widths: sm 380 · md 460 (default) · lg 600.</p>
          </Drawer>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Heading shown in the drawer header.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description:
              'Body content rendered in the scrollable panel between the header and the optional footer.',
          },
          {
            name: 'trigger',
            type: 'ReactNode',
            description:
              'Element that opens the drawer. Rendered as the trigger child; omit for fully controlled use.',
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
            name: 'width',
            type: "'sm' | 'md' | 'lg'",
            description:
              'Panel width: sm 380, md 460 (default), lg 600. Mobile collapses to a full-width bottom sheet regardless of width.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class merged onto the panel, for per-surface skinning.',
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

export default DrawerPage;
