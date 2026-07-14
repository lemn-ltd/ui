import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { Button, SystemBar, type SystemBarTone } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const TONES: readonly SystemBarTone[] = ['info', 'warn', 'danger'];

const TONE_MESSAGES: Record<SystemBarTone, string> = {
  info: 'A new version is available. Reload to get the latest features.',
  warn: 'Scheduled maintenance starts in 30 minutes.',
  danger: 'Your connection to the service was lost.',
};

function SystemBarPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A full-width, page-level notice that sits above the top bar. Tone drives the icon and accent through data-tone; it can carry an action and a dismiss control."
      title="System bar"
    >
      <ExampleBlock
        code={`<SystemBar
  tone="info"
  action={<Button variant="ghost">Reload</Button>}
  onDismiss={() => {}}
>
  A new version is available. Reload to get the latest features.
</SystemBar>`}
        render={() => (
          <SystemBar
            action={<Button variant="ghost">Reload</Button>}
            onDismiss={() => {}}
            tone="info"
          >
            {TONE_MESSAGES.info}
          </SystemBar>
        )}
      />

      <VariantsGallery
        columns={1}
        items={TONES.map((tone) => ({
          label: tone,
          render: () => <SystemBar tone={tone}>{TONE_MESSAGES[tone]}</SystemBar>,
        }))}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'with action',
            render: () => (
              <SystemBar action={<Button variant="ghost">Reload</Button>} tone="info">
                {TONE_MESSAGES.info}
              </SystemBar>
            ),
          },
          {
            label: 'with dismiss',
            render: () => (
              <SystemBar onDismiss={() => {}} tone="warn">
                {TONE_MESSAGES.warn}
              </SystemBar>
            ),
          },
          {
            label: 'action and dismiss',
            render: () => (
              <SystemBar
                action={<Button variant="ghost">Retry</Button>}
                onDismiss={() => {}}
                tone="danger"
              >
                {TONE_MESSAGES.danger}
              </SystemBar>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'tone',
            type: "'info' | 'warn' | 'danger'",
            defaultValue: "'info'",
            description: 'Status treatment; written to data-tone and selects the leading icon.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The notice message.',
          },
          {
            name: 'action',
            type: 'ReactNode',
            description: 'Optional trailing action, normally a Button.',
          },
          {
            name: 'onDismiss',
            type: '() => void',
            description: 'When provided, renders a dismiss icon button.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props (className, id, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SystemBarPage;
