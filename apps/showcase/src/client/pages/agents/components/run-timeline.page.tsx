import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { EventRow, type EventTone, RunTimeline, type RunTimelineEvent } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const EVENTS: readonly RunTimelineEvent[] = [
  {
    id: '1',
    time: '14:00:00',
    tone: 'info',
    message: 'triggered · schedule fired, payload accepted',
  },
  { id: '2', time: '14:00:01', tone: 'success', message: 'node.completed · fetch (0.8s)' },
  {
    id: '3',
    time: '14:00:02',
    tone: 'success',
    message: 'node.completed · classify → urgent = true',
  },
  { id: '4', time: '14:00:05', tone: 'warn', message: 'wait.scheduled · delay 30s before deploy' },
  { id: '5', time: '14:00:35', tone: 'warn', message: 'retry.fired · transform attempt 2 / 5' },
  {
    id: '6',
    time: '14:01:10',
    tone: 'info',
    message: 'humantask.created · approve_deploy assigned',
  },
  {
    id: '7',
    time: '14:03:50',
    tone: 'danger',
    message: 'node.failed · deploy timed out after 2.4s',
  },
  {
    id: '8',
    time: '14:04:12',
    tone: 'danger',
    message: 'run.failed · terminal · 2 nodes incomplete',
  },
];

const TONES: readonly EventTone[] = ['neutral', 'info', 'success', 'warn', 'danger', 'dim'];

function RunTimelinePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The chronological evidence log for an automation run: a bordered column of tone-dotted, timestamped EventRows. Presentational and ordered by the caller; an empty run renders a first-run empty state."
      title="Run timeline"
    >
      <ExampleBlock
        code={`<RunTimeline events={events} />`}
        render={() => (
          <div style={{ maxWidth: 560 }}>
            <RunTimeline events={EVENTS} />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'empty',
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <RunTimeline events={[]} />
              </div>
            ),
          },
        ]}
      />

      <VariantsGallery
        columns={1}
        items={TONES.map((tone) => ({
          label: `EventRow · ${tone}`,
          render: () => (
            <div style={{ width: 420 }}>
              <EventRow message={`${tone} event`} time="14:00:00" tone={tone} />
            </div>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'RunTimeline.events',
            type: 'RunTimelineEvent[]',
            description: 'Ordered events: id, time, message, and optional tone.',
          },
          {
            name: 'RunTimeline.emptyHint',
            type: 'string',
            description: 'Empty-state description when there are no events.',
          },
          {
            name: 'EventRow.time',
            type: 'string',
            description: 'A preformatted timestamp, e.g. "14:00:02".',
          },
          {
            name: 'EventRow.tone',
            type: "'neutral' | 'info' | 'success' | 'warn' | 'danger' | 'dim'",
            defaultValue: "'neutral'",
            description: 'Drives the leading dot color; the host maps event family to tone.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default RunTimelinePage;
