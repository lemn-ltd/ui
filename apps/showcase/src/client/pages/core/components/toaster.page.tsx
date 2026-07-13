import {
  ComponentPage,
  ExampleBlock,
  PropsTable,
  useShowcaseRenderMode,
  VariantsGallery,
} from '@appranks/showcase-kit';
import { Button, dismissToasts, notify, Toast, Toaster, type ToasterPosition } from '@appranks/ui';
import type { ReactElement } from 'react';
import { toastStack, toasts } from '../../../fixtures';

const POSITIONS: readonly ToasterPosition[] = ['top-right', 'bottom-right', 'top-center'];

const ROW_STYLE = { display: 'flex', flexWrap: 'wrap', gap: 12 } as const;

function fireAll(): void {
  for (const toast of toasts) {
    notify(toast.tone, toast.title, toast.detail ? { detail: toast.detail } : undefined);
  }
}

function fireStack(): void {
  for (const toast of toastStack) {
    notify(toast.tone, toast.title, toast.detail ? { detail: toast.detail } : undefined);
  }
}

function ToasterDemo(): ReactElement {
  const mode = useShowcaseRenderMode();

  return (
    <>
      {mode === 'playground' ? <Toaster /> : null}
      <div style={ROW_STYLE}>
        <Button onClick={fireAll} variant="primary">
          Fire 8 toasts
        </Button>
        <Button onClick={fireStack} variant="secondary">
          Stack 3 tones
        </Button>
        <Button onClick={() => dismissToasts()} variant="ghost">
          Dismiss all
        </Button>
      </div>
    </>
  );
}

function ToasterPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The toast stack region. Mounted once at the app root, it owns the viewport, queue, auto-dismiss, and swipe; fired toasts render onto the canonical Toast tone surface. Fire through notify so sonner never leaks to callers."
      title="Toaster"
    >
      <Toaster />

      <ExampleBlock
        code={`// Mount once at the app root, then fire from anywhere.
<Toaster position="top-right" />

notify('success', 'Changes saved', { detail: 'Your edits are now live.' });`}
        render={() => <ToasterDemo />}
      />

      <ExampleBlock
        code={`notify('success', 'Saved');
notify('info', 'Sync started');
notify('warn', 'Approaching limit');
notify('danger', 'Upload failed');`}
        render={() => (
          <div style={ROW_STYLE}>
            <Button onClick={() => notify('success', 'Changes saved')} variant="secondary">
              success
            </Button>
            <Button onClick={() => notify('info', 'Sync started')} variant="secondary">
              info
            </Button>
            <Button onClick={() => notify('warn', 'Approaching limit')} variant="secondary">
              warn
            </Button>
            <Button onClick={() => notify('danger', 'Upload failed')} variant="secondary">
              danger
            </Button>
          </div>
        )}
      />

      <VariantsGallery
        columns={3}
        items={toastStack.map((toast) => ({
          label: toast.tone,
          render: () => <Toast detail={toast.detail} title={toast.title} tone={toast.tone} />,
        }))}
      />

      <VariantsGallery
        columns={3}
        items={POSITIONS.map((position) => ({
          label: position,
          render: () => <code>{position}</code>,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'position',
            type: "'top-right' | 'bottom-right' | 'top-center'",
            defaultValue: "'top-right'",
            description: 'Viewport corner the stack anchors to.',
          },
          {
            name: 'notify(tone, title, options?)',
            type: '(tone: ToastTone, title: string, options?: { detail?; duration? }) => string | number',
            description: 'Fires a toast onto the mounted Toaster; maps the package tone to sonner.',
          },
          {
            name: 'dismissToasts(id?)',
            type: '(id?: string | number) => void',
            description: 'Dismisses every visible toast, or a single one by id.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ToasterPage;
