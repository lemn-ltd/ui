import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Toast, type ToastTone } from '@appranks/ui';
import type { ReactElement } from 'react';
import { type ToastDescriptor, toastStack, toasts } from '../../../fixtures';

// First toast per tone from the shared fixture, so the gallery keys stay unique.
const tonesSeen = new Map<ToastTone, ToastDescriptor>();
for (const toast of toasts) {
  if (!tonesSeen.has(toast.tone)) {
    tonesSeen.set(toast.tone, toast);
  }
}
const toneSamples: readonly ToastDescriptor[] = [...tonesSeen.values()];

function ToastPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A presentational status row. Tone drives the icon and accent through data-tone; stacking and auto-dismiss are owned by Toaster."
      title="Toast"
    >
      <ExampleBlock
        code={`<Toast
  tone="success"
  title="Changes saved"
  detail="Your edits are now live."
  onDismiss={() => {}}
/>`}
        render={() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
            {toastStack.map((toast) => (
              <Toast
                detail={toast.detail}
                key={toast.id}
                onDismiss={() => {}}
                title={toast.title}
                tone={toast.tone}
              />
            ))}
          </div>
        )}
      />

      <VariantsGallery
        columns={2}
        items={toneSamples.map((toast) => ({
          label: toast.tone,
          render: () => <Toast detail={toast.detail} title={toast.title} tone={toast.tone} />,
        }))}
      />

      <VariantsGallery
        columns={2}
        items={[
          {
            label: 'title only',
            render: () => <Toast title="Invitation sent" tone="success" />,
          },
          {
            label: 'with dismiss',
            render: () => (
              <Toast
                detail="Retrying in a few seconds."
                onDismiss={() => {}}
                title="Connection lost"
                tone="danger"
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'tone',
            type: "'success' | 'info' | 'warn' | 'danger'",
            defaultValue: "'info'",
            description: 'Status treatment; written to data-tone and selects the leading icon.',
          },
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Required primary line of the toast.',
          },
          {
            name: 'detail',
            type: 'ReactNode',
            description: 'Optional secondary line under the title.',
          },
          {
            name: 'onDismiss',
            type: '() => void',
            description: 'When provided, renders a dismiss icon button.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'title'>",
            description: 'Native div props (className, id, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ToastPage;
