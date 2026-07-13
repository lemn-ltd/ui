import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import {
  type AddableTrigger,
  type ComposerTrigger,
  type ScheduleTriggerValue,
  TriggerComposer,
} from '@lemn-ltd/ui';
import { type ReactElement, useRef, useState } from 'react';

const ADDABLE: readonly AddableTrigger[] = [
  {
    kind: 'schedule',
    icon: 'clock',
    label: 'Schedule',
    description: 'Run on a recurring or one-off schedule.',
  },
  {
    kind: 'api',
    icon: 'code',
    label: 'Call via API',
    description: 'Trigger a run from an authenticated HTTP request.',
  },
  {
    kind: 'repository-event',
    icon: 'radio',
    label: 'Repository event',
    description: 'Run when a repository webhook event fires.',
    disabled: true,
    disabledReason: 'Select a repository first',
  },
];

const PRESET_VARIANTS: readonly { readonly label: string; readonly value: ScheduleTriggerValue }[] =
  [
    { label: 'once', value: { preset: 'once', runAt: '2026-06-21T12:54' } },
    { label: 'hourly', value: { preset: 'hourly', atMinute: 0 } },
    { label: 'daily', value: { preset: 'daily', atTime: '09:00' } },
    { label: 'weekdays', value: { preset: 'weekdays', atTime: '09:00' } },
    { label: 'weekly', value: { preset: 'weekly', weekday: 'mon', atTime: '09:00' } },
    { label: 'custom', value: { preset: 'custom', cron: '0 5 * * 1' } },
  ];

function scheduleTrigger(value: ScheduleTriggerValue): ComposerTrigger {
  return { id: 'demo', kind: 'schedule', timezoneLabel: 'GMT+4', value };
}

function makeTrigger(kind: string, id: string): ComposerTrigger | null {
  switch (kind) {
    case 'schedule':
      return {
        id,
        kind: 'schedule',
        timezoneLabel: 'GMT+4',
        value: { preset: 'daily', atTime: '09:00' },
      };
    case 'api':
      return {
        id,
        kind: 'generic',
        icon: 'code',
        label: 'Call via API',
        description: 'Token will be generated when you save.',
      };
    default:
      return null;
  }
}

function TriggerComposerPage(): ReactElement {
  const nextId = useRef(2);
  const [triggers, setTriggers] = useState<ComposerTrigger[]>([
    {
      id: 't0',
      kind: 'schedule',
      timezoneLabel: 'GMT+4',
      value: { preset: 'custom', cron: '0 5 * * 1' },
    },
    {
      id: 't1',
      kind: 'generic',
      icon: 'code',
      label: 'Call via API',
      description: 'Token will be generated when you save.',
    },
  ]);

  const handleScheduleChange = (id: string, value: ScheduleTriggerValue): void => {
    setTriggers((current) =>
      current.map((trigger) =>
        trigger.id === id && trigger.kind === 'schedule' ? { ...trigger, value } : trigger,
      ),
    );
  };

  const handleRemove = (id: string): void => {
    setTriggers((current) => current.filter((trigger) => trigger.id !== id));
  };

  const handleAdd = (kind: string): void => {
    const id = `t${nextId.current}`;
    nextId.current += 1;
    const trigger = makeTrigger(kind, id);
    if (trigger) setTriggers((current) => [...current, trigger]);
  };

  return (
    <ComponentPage
      status="beta"
      summary="The trigger authoring surface: a list of configured triggers — each a deep preset-driven schedule builder or a titled card — plus a collapsible add-another-trigger picker. Controlled by the host."
      title="Trigger composer"
    >
      <ExampleBlock
        code={`const [triggers, setTriggers] = useState<ComposerTrigger[]>([
  { id: 't0', kind: 'schedule', timezoneLabel: 'GMT+4', value: { preset: 'custom', cron: '0 5 * * 1' } },
  { id: 't1', kind: 'generic', icon: 'code', label: 'Call via API',
    description: 'Token will be generated when you save.' },
]);

<TriggerComposer
  triggers={triggers}
  onScheduleChange={(id, value) => /* update the matching schedule trigger */}
  onRemoveTrigger={(id) => /* drop the trigger */}
  addableTriggers={ADDABLE}
  onAddTrigger={(kind) => /* append a new trigger of this kind */}
/>`}
        render={() => (
          <div style={{ maxWidth: 560 }}>
            <TriggerComposer
              addableTriggers={ADDABLE}
              onAddTrigger={handleAdd}
              onRemoveTrigger={handleRemove}
              onScheduleChange={handleScheduleChange}
              triggers={triggers}
            />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          ...PRESET_VARIANTS.map((variant) => ({
            label: `schedule · ${variant.label}`,
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <TriggerComposer triggers={[scheduleTrigger(variant.value)]} />
              </div>
            ),
          })),
          {
            label: 'picker open · option disabled',
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <TriggerComposer
                  addableTriggers={ADDABLE}
                  triggers={[
                    {
                      id: 'api',
                      kind: 'generic',
                      icon: 'code',
                      label: 'Call via API',
                      description: 'Token will be generated when you save.',
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <TriggerComposer
                  disabled
                  triggers={[scheduleTrigger({ preset: 'daily', atTime: '09:00' })]}
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'triggers',
            type: 'readonly ComposerTrigger[]',
            description:
              'The configured triggers, each a schedule (deep preset builder) or a generic titled card.',
          },
          {
            name: 'onScheduleChange',
            type: '(id, value: ScheduleTriggerValue) => void',
            description: 'Fires when a schedule trigger’s preset or input changes.',
          },
          {
            name: 'onRemoveTrigger',
            type: '(id: string) => void',
            description: 'Fires from a card’s remove control; omit to hide the control.',
          },
          {
            name: 'addableTriggers',
            type: 'readonly AddableTrigger[]',
            description:
              'Kinds offered in the add-another picker; each may be disabled with a reason.',
          },
          {
            name: 'onAddTrigger',
            type: '(kind: string) => void',
            description: 'Fires with the chosen kind when an enabled picker option is clicked.',
          },
          {
            name: 'label',
            type: 'string',
            defaultValue: "'Select a trigger'",
            description: 'Section label above the trigger list.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Dims the surface and disables every control.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TriggerComposerPage;
