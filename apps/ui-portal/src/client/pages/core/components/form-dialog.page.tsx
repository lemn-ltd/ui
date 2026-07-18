import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import {
  Button,
  Field,
  FileDropzone,
  FormDialog,
  Input,
  InputSelect,
  Textarea,
  Toggle,
} from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

function FormDialogExample(): ReactElement {
  const [open, setOpen] = useState(false);
  // 'states' opens the same form in edit mode with the submitting + error-summary states on.
  const [mode, setMode] = useState<'create' | 'states'>('create');
  const isStates = mode === 'states';

  const openIn = (next: 'create' | 'states'): void => {
    setMode(next);
    setOpen(true);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button onClick={() => openIn('create')} variant="primary">
        New item
      </Button>
      <Button onClick={() => openIn('states')} variant="secondary">
        Edit (submitting + error)
      </Button>

      <FormDialog
        error={isStates ? 'Name is required.' : undefined}
        onCancel={() => setOpen(false)}
        onOpenChange={setOpen}
        onSubmit={() => setOpen(false)}
        open={open}
        submitLabel={isStates ? 'Save' : 'Create'}
        submitting={isStates}
        title={isStates ? 'Edit item' : 'New item'}
      >
        <Field
          error="Name is required."
          hint="Shown wherever this item appears."
          label="Name"
          required
          state={isStates ? 'invalid' : 'default'}
        >
          {(control) => (
            <Input
              {...control}
              defaultValue={isStates ? 'Quarterly report' : undefined}
              placeholder="e.g. Quarterly report"
            />
          )}
        </Field>

        <Field hint="Optional. Up to 500 characters." label="Description">
          {(control) => <Textarea {...control} placeholder="Add an optional description…" />}
        </Field>

        <Field label="Status">
          {(control) => <InputSelect {...control} defaultValue="active" options={STATUS_OPTIONS} />}
        </Field>

        <Field hint="Members can use this item right away." label="Active">
          {(control) => <Toggle disabled={control.disabled} id={control.id} />}
        </Field>

        <Field hint="PNG, PDF or DOCX up to 10 MB." label="Attachments">
          {() => (
            <FileDropzone
              aria-label="Upload attachments"
              files={[]}
              multiple
              onFilesAccepted={() => {}}
            />
          )}
        </Field>
      </FormDialog>
    </div>
  );
}

function FormDialogPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The create/edit modal. It composes Dialog (focus trap, Escape-close, sizing, mobile bottom-sheet) and adds form semantics: a scrollable form body, a pinned Cancel/Submit footer, a submitting state, and an optional error-summary banner. The same form serves create and edit; the caller owns validation and open state."
      title="Form dialog"
    >
      <ExampleBlock
        code={`const [open, setOpen] = useState(false);

<Button variant="primary" onClick={() => setOpen(true)}>New item</Button>
<FormDialog
  open={open}
  onOpenChange={setOpen}
  title="New item"
  submitLabel="Create"
  onSubmit={() => save().then(() => setOpen(false))}
  onCancel={() => setOpen(false)}
>
  <Field label="Name" required hint="Shown wherever this item appears.">
    {(control) => <Input {...control} placeholder="e.g. Quarterly report" />}
  </Field>
  <Field label="Attachments" hint="PNG, PDF or DOCX up to 10 MB.">
    {() => <FileDropzone aria-label="Upload attachments" multiple files={files} onFilesAccepted={accept} />}
  </Field>
</FormDialog>`}
        render={() => <FormDialogExample />}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Dialog heading; switch it between e.g. "New item" and "Edit item".',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The form body — Field rows and a FileDropzone, supplied by the caller.',
          },
          {
            name: 'onSubmit',
            type: '() => void',
            description:
              'Fired by the footer Submit button and by Enter inside the form (preventDefault is handled).',
          },
          {
            name: 'onCancel',
            type: '() => void',
            description: 'Fired by the footer Cancel button; wire it to close the dialog.',
          },
          {
            name: 'submitting',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Shows a spinner in the Submit button and disables it.',
          },
          {
            name: 'submitDisabled',
            type: 'boolean',
            description: 'Disables the Submit button (e.g. while the form is invalid or pristine).',
          },
          {
            name: 'error',
            type: 'ReactNode',
            description:
              'Error-summary banner (InfoBanner danger) at the end of the form body; scrolls with the fields.',
          },
          {
            name: 'submitLabel / cancelLabel',
            type: 'ReactNode',
            defaultValue: "'Save' / 'Cancel'",
            description: 'Footer button labels.',
          },
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg' | 'xl'",
            defaultValue: "'lg'",
            description: 'Panel width, forwarded to Dialog.',
          },
          {
            name: 'open / defaultOpen / onOpenChange',
            type: 'boolean',
            description: 'Open state, forwarded to Dialog (controlled or uncontrolled).',
          },
          {
            name: 'trigger',
            type: 'ReactNode',
            description: 'Optional element that opens the dialog; omit for fully controlled use.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default FormDialogPage;
