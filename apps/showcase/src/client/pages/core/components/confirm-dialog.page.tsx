import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Button, ConfirmDialog } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function ConfirmDialogPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An alert dialog for a single decision. The danger variant maps the confirm action to the danger button; everything else mirrors Dialog's modal behavior."
      title="Confirm dialog"
    >
      <ExampleBlock
        code={`<ConfirmDialog
  title="Discard changes?"
  description="Your unsaved edits will be lost."
  confirmLabel="Discard"
  trigger={<Button variant="secondary">Discard</Button>}
  onConfirm={() => {}}
/>`}
        render={() => (
          <ConfirmDialog
            confirmLabel="Discard"
            description="Your unsaved edits will be lost."
            title="Discard changes?"
            trigger={<Button variant="secondary">Discard</Button>}
          />
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'default',
            render: () => (
              <ConfirmDialog
                confirmLabel="Publish"
                description="This page will become visible to everyone."
                title="Publish page?"
                trigger={<Button variant="primary">Publish</Button>}
                variant="default"
              />
            ),
          },
          {
            label: 'danger',
            render: () => (
              <ConfirmDialog
                confirmLabel="Delete"
                description="This action cannot be undone."
                title="Delete project?"
                trigger={<Button variant="danger">Delete</Button>}
                variant="danger"
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Heading that states the decision.',
          },
          {
            name: 'trigger',
            type: 'ReactNode',
            description: 'Element that opens the dialog; omit for fully controlled use.',
          },
          {
            name: 'description',
            type: 'ReactNode',
            description: 'Optional supporting text under the title.',
          },
          {
            name: 'variant',
            type: "'default' | 'danger'",
            defaultValue: "'default'",
            description: 'Tone of the confirm action; danger renders the destructive button.',
          },
          {
            name: 'confirmLabel',
            type: 'string',
            defaultValue: "'Confirm'",
            description: 'Label of the confirm action.',
          },
          {
            name: 'cancelLabel',
            type: 'string',
            defaultValue: "'Cancel'",
            description: 'Label of the cancel action.',
          },
          {
            name: 'onConfirm',
            type: '() => void',
            description: 'Called when the confirm action is chosen.',
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

export default ConfirmDialogPage;
