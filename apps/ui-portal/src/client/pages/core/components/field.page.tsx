import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { Checkbox, Field, Input, InputSelect, Toggle } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { formFields } from '../../../fixtures';

// A vertical stack keeps multiple field rows readable inside one preview cell.
const stack = { display: 'flex', flexDirection: 'column', gap: '1rem', width: '20rem' } as const;

function FieldPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The canonical form row. It owns the label, required asterisk, hint, and error line, and wires labeling plus validity into its control through a render contract — it never styles the control's border."
      title="Field"
    >
      <ExampleBlock
        code={`<Field label="Name" required hint="Shown to other members.">
  {(control) => <Input {...control} placeholder="Enter a name" />}
</Field>

<Field label="Email" required state="invalid" error="Enter a valid email address.">
  {(control) => <Input {...control} placeholder="name@example.com" />}
</Field>`}
        render={() => (
          <div style={stack}>
            <Field hint="Shown to other members." label="Name" required>
              {(control) => <Input {...control} placeholder="Enter a name" />}
            </Field>
            {/* The error line replaces the hint when state is invalid. */}
            <Field error="Enter a valid email address." label="Email" required state="invalid">
              {(control) => <Input {...control} placeholder="name@example.com" />}
            </Field>
          </div>
        )}
      />

      <ExampleBlock
        code={`<Field label="Role">
  {(control) => (
    <InputSelect
      {...control}
      defaultValue="viewer"
      options={[
        { value: 'viewer', label: 'Viewer' },
        { value: 'editor', label: 'Editor' },
        { value: 'admin', label: 'Admin' },
      ]}
    />
  )}
</Field>

<Field label="Accept the terms" required hint="Required before continuing.">
  {(control) => <Checkbox id={control.id} disabled={control.disabled} />}
</Field>

<Field label="Enable notifications" hint="Receive a message when activity occurs.">
  {(control) => <Toggle id={control.id} disabled={control.disabled} />}
</Field>`}
        render={() => (
          <div style={stack}>
            <Field label="Role">
              {(control) => (
                <InputSelect
                  {...control}
                  defaultValue="viewer"
                  options={[
                    { value: 'viewer', label: 'Viewer' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
              )}
            </Field>
            <Field hint="Required before continuing." label="Accept the terms" required>
              {(control) => <Checkbox disabled={control.disabled} id={control.id} />}
            </Field>
            <Field hint="Receive a message when activity occurs." label="Enable notifications">
              {(control) => <Toggle disabled={control.disabled} id={control.id} />}
            </Field>
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={formFields.map((descriptor) => ({
          label: `${descriptor.label} · ${descriptor.state}`,
          render: () => (
            <div style={{ width: '20rem' }}>
              <Field
                error={descriptor.error}
                hint={descriptor.hint}
                label={descriptor.label}
                required={descriptor.required}
                state={descriptor.state}
              >
                {(control) => {
                  if (descriptor.kind === 'select') {
                    return (
                      <InputSelect
                        aria-describedby={control['aria-describedby']}
                        aria-invalid={control['aria-invalid']}
                        disabled={control.disabled}
                        id={control.id}
                        options={descriptor.options ?? []}
                      />
                    );
                  }
                  if (descriptor.kind === 'checkbox') {
                    return <Checkbox disabled={control.disabled} id={control.id} />;
                  }
                  if (descriptor.kind === 'toggle') {
                    return <Toggle disabled={control.disabled} id={control.id} />;
                  }
                  return (
                    <Input
                      {...control}
                      placeholder={descriptor.placeholder}
                      type={descriptor.kind}
                    />
                  );
                }}
              </Field>
            </div>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'label',
            type: 'ReactNode',
            description:
              'Row label, rendered in the field’s own label element and tied to the control.',
          },
          {
            name: 'children',
            type: '(control: FieldControlProps) => ReactNode',
            description:
              'Render contract. Receives id, aria-invalid, aria-describedby, invalid, and disabled to spread onto the wrapped control.',
          },
          {
            name: 'state',
            type: "'default' | 'invalid' | 'disabled'",
            defaultValue: "'default'",
            description:
              'Validity/disabled state, written to data-state and propagated into the control flags.',
          },
          {
            name: 'required',
            type: 'boolean',
            description: 'Renders an aria-hidden required asterisk after the label.',
          },
          {
            name: 'hint',
            type: 'ReactNode',
            description:
              'Helper text below the control. Shown only while the field is not invalid.',
          },
          {
            name: 'error',
            type: 'ReactNode',
            description: 'Error text below the control. Replaces the hint when state is invalid.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class appended to the field root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default FieldPage;
